"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma, Role, Source, Status, type User } from "@prisma/client";
import {
  signupFormSchema,
  inviteUserFormSchema,
  acceptInviteFormSchema,
} from "@/lib/schemas";
import { isEmailAllowedForSignup, SIGNUP_BLOCKED_MESSAGE } from "@/lib/domain";
import { consumeAuthRate } from "@/lib/rate-limit";
import { createInviteTokenRaw, hashInviteToken } from "@/lib/invite-token";
import { sendMail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { headers } from "next/headers";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "127.0.0.1";
}

async function appOrigin(): Promise<string> {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

async function currentUserDb(): Promise<User | null> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

async function requireVerifiedExec(): Promise<{ ok: false; error: string } | { ok: true; user: User }> {
  const user = await currentUserDb();
  if (!user) return { ok: false, error: "Unauthorized" };
  if (user.role !== Role.EXEC || user.status !== Status.VERIFIED)
    return { ok: false, error: "Unauthorized" };
  return { ok: true, user };
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  params: {
    actorUserId: string | null;
    targetUserId: string | null;
    action: string;
    metadata?: Record<string, unknown>;
  },
) {
  await tx.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      targetUserId: params.targetUserId,
      action: params.action,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

async function notifyExecSignup(name: string, email: string) {
  const list =
    process.env.EXEC_NOTIFY_EMAILS?.split(/[,]/).map((s) => s.trim()).filter(Boolean) ?? [];
  for (const to of list) {
    await sendMail({
      to,
      subject: "New signup pending verification",
      text: `${name} (${email}) created an account and is awaiting executive verification.`,
    });
  }
}

export async function checkSignInAllowed(): Promise<ActionResult> {
  try {
    const ip = await clientIp();
    if (!(await consumeAuthRate(ip, "signin"))) {
      return { ok: false, error: "Too many attempts. Try again later." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to validate sign-in." };
  }
}

export async function signup(input: unknown): Promise<ActionResult> {
  try {
    const ip = await clientIp();
    if (!(await consumeAuthRate(ip, "signup"))) return { ok: false, error: "Too many attempts. Try again later." };

    const parsed = signupFormSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors.email?.[0] ?? parsed.error.issues[0]?.message ?? "Invalid";
      return { ok: false, error: first };
    }

    const email = parsed.data.email.trim().toLowerCase();
    if (!isEmailAllowedForSignup(parsed.data.email)) {
      return { ok: false, error: SIGNUP_BLOCKED_MESSAGE };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "An account already exists for this email." };

    const hashedPassword = await hashPassword(parsed.data.password);

    await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name: parsed.data.name.trim(),
          hashedPassword,
          role: Role.MEMBER,
          status: Status.UNVERIFIED,
          source: Source.SIGNUP,
        },
      });
      await writeAudit(tx, {
        actorUserId: created.id,
        targetUserId: created.id,
        action: "SIGNUP",
        metadata: { email: created.email, source: Source.SIGNUP },
      });
    });

    await notifyExecSignup(parsed.data.name.trim(), email);
    revalidatePath("/exec/verifications");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Unable to complete signup." };
  }
}

export async function verifyApprove(targetUserId: unknown): Promise<ActionResult> {
  const gate = await requireVerifiedExec();
  if (!gate.ok || !gate.user) return gate;

  if (typeof targetUserId !== "string" || !targetUserId) return { ok: false, error: "Invalid member" };

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!target || target.status !== Status.UNVERIFIED) {
        throw new Error("INVALID");
      }
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: Status.VERIFIED,
          verifiedAt: new Date(),
          verifiedByUserId: gate.user.id,
        },
      });
      await writeAudit(tx, {
        actorUserId: gate.user.id,
        targetUserId: targetUserId,
        action: "VERIFY_APPROVE",
        metadata: { email: target.email },
      });
    });

    revalidatePath("/exec/verifications");
    revalidatePath("/exec/members");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to approve this member." };
  }
}

export async function verifyReject(targetUserId: unknown): Promise<ActionResult> {
  const gate = await requireVerifiedExec();
  if (!gate.ok || !gate.user) return gate;

  if (typeof targetUserId !== "string" || !targetUserId) return { ok: false, error: "Invalid member" };

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: targetUserId } });
      if (!target || target.status !== Status.UNVERIFIED) {
        throw new Error("INVALID");
      }
      await tx.user.update({
        where: { id: targetUserId },
        data: { status: Status.REJECTED },
      });
      await writeAudit(tx, {
        actorUserId: gate.user.id,
        targetUserId,
        action: "VERIFY_REJECT",
        metadata: { email: target.email },
      });
    });

    revalidatePath("/exec/verifications");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to reject this member." };
  }
}

export async function createInvite(input: unknown): Promise<ActionResult> {
  const gate = await requireVerifiedExec();
  if (!gate.ok || !gate.user) return gate;

  const parsed = inviteUserFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid input" };

  try {
    const email = parsed.data.email.trim().toLowerCase();
    const raw = createInviteTokenRaw();
    const tokenHash = hashInviteToken(raw);
    const hours = Number(process.env.INVITE_TTL_HOURS ?? "24");

    await prisma.$transaction(async (tx) => {
      await tx.invite.create({
        data: {
          tokenHash,
          email,
          fullName: parsed.data.fullName.trim(),
          role: parsed.data.role,
          note: parsed.data.note?.trim() || undefined,
          expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
          createdById: gate.user.id,
        },
      });
      await writeAudit(tx, {
        actorUserId: gate.user.id,
        targetUserId: null,
        action: "INVITE_CREATED",
        metadata: { email, role: parsed.data.role },
      });
    });

    const origin = await appOrigin();
    const link = `${origin}/invite/accept?token=${encodeURIComponent(raw)}`;

    await sendMail({
      to: email,
      subject: "You're invited to join ACAMS",
      text:
        `${parsed.data.fullName.trim()}, you're invited.\n\n` +
        `Open this secure link within ${hours} hours to activate your membership:\n\n${link}\n\n` +
        (parsed.data.note ? `Note from your host: ${parsed.data.note}\n` : ""),
      html: `
        <p>${parsed.data.fullName.trim()}, you're invited to join ACAMS.</p>
        <p>Open this secure link within <strong>${hours} hours</strong> to activate your membership:</p>
        <p><a href="${link}">${link}</a></p>
        ${parsed.data.note ? `<p>Note from your host:</p><blockquote>${parsed.data.note}</blockquote>` : ""}
      `,
    });

    revalidatePath("/exec/invites");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to create invite." };
  }
}

export async function acceptInvite(input: unknown): Promise<ActionResult> {
  const ip = await clientIp();
  if (!(await consumeAuthRate(ip, "invite_accept"))) return { ok: false, error: "Too many attempts. Try again later." };

  const parsed = acceptInviteFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid invitation or password." };

  const hash = hashInviteToken(parsed.data.token.trim());

  const invite = await prisma.invite.findUnique({ where: { tokenHash: hash } });
  const now = new Date();
  const invalid =
    !invite ||
    invite.revokedAt ||
    invite.usedAt ||
    invite.expiresAt <= now ||
    invite.redeemedUserId != null;

  if (invalid) {
    return { ok: false, error: "This invite link is invalid or has expired." };
  }

  const email = invite.email.trim().toLowerCase();
  const dup = await prisma.user.findUnique({ where: { email } });
  if (dup) return { ok: false, error: "An account already exists for this email." };

  try {
    const hashedPassword = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (tx) => {
      const locked = await tx.invite.findUnique({ where: { tokenHash: hash } });
      if (!locked || locked.revokedAt || locked.usedAt || locked.expiresAt <= now || locked.redeemedUserId) {
        throw new Error("INVALID");
      }
      const created = await tx.user.create({
        data: {
          email,
          name: locked.fullName,
          hashedPassword,
          role: locked.role,
          status: Status.VERIFIED,
          source: Source.INVITE,
        },
      });
      await tx.invite.update({
        where: { id: locked.id },
        data: {
          usedAt: new Date(),
          redeemedUserId: created.id,
        },
      });
      await writeAudit(tx, {
        actorUserId: locked.createdById,
        targetUserId: created.id,
        action: "INVITE_ACCEPTED",
        metadata: { email },
      });
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "This invite link is invalid or has expired." };
  }
}

export async function revokeInvite(inviteId: unknown): Promise<ActionResult> {
  const gate = await requireVerifiedExec();
  if (!gate.ok || !gate.user) return gate;

  if (typeof inviteId !== "string" || !inviteId) return { ok: false, error: "Invalid invite" };

  try {
    await prisma.$transaction(async (tx) => {
      const inv = await tx.invite.findUnique({ where: { id: inviteId } });
      if (!inv || inv.revokedAt || inv.usedAt) throw new Error("INVALID");

      await tx.invite.update({
        where: { id: inviteId },
        data: { revokedAt: new Date() },
      });

      await writeAudit(tx, {
        actorUserId: gate.user.id,
        targetUserId: null,
        action: "INVITE_REVOKED",
        metadata: { inviteId, email: inv.email },
      });
    });

    revalidatePath("/exec/invites");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to revoke invite." };
  }
}
