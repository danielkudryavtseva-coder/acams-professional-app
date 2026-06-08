import { prisma } from "@/lib/db";

import { InviteUserButton } from "@/components/InviteUserButton";
import { InviteTable, type SerializableInvite } from "@/components/InviteTable";

const ttlHours = Number(process.env.INVITE_TTL_HOURS ?? "24");

export default async function ExecInvitesPage() {
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { email: true } } },
  });

  const serialized: SerializableInvite[] = invites.map((inv) => ({
    id: inv.id,
    email: inv.email,
    fullName: inv.fullName,
    role: inv.role,
    createdAtIso: inv.createdAt.toISOString(),
    expiresAtIso: inv.expiresAt.toISOString(),
    usedAtIso: inv.usedAt?.toISOString() ?? null,
    revokedAtIso: inv.revokedAt?.toISOString() ?? null,
    redeemedUserId: inv.redeemedUserId,
    createdByEmail: inv.createdBy.email,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Invitation ledger</h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink/70">
            Single-use salted hashes live in SQLite for dev (`DATABASE_URL=file:./dev.db`) — swap Postgres in prod using the same Prisma schema. Raw tokens ship only inside
            SMTP payloads.
          </p>
        </div>
        <InviteUserButton ttlHours={ttlHours} />
      </div>

      <InviteTable invites={serialized} />
    </div>
  );
}
