import { prisma } from "@/lib/db";
import { Status } from "@prisma/client";

import { InviteUserButton } from "@/components/InviteUserButton";
import { VerificationRow, type VerificationListRow } from "@/components/VerificationRow";

const ttlHours = Number(process.env.INVITE_TTL_HOURS ?? "24");

export default async function ExecVerificationsPage() {
  const users = await prisma.user.findMany({
    where: { status: Status.UNVERIFIED },
    orderBy: { createdAt: "asc" },
  });

  const ids = users.map((u) => u.id);
  const redeemedInvites =
    ids.length === 0
      ? []
      : await prisma.invite.findMany({
          where: { redeemedUserId: { in: ids } },
          include: { createdBy: { select: { email: true } } },
        });

  const inviterByUserId = new Map<string, string>();
  for (const inv of redeemedInvites) {
    if (!inv.redeemedUserId) continue;
    if (inv.createdBy.email) inviterByUserId.set(inv.redeemedUserId, inv.createdBy.email);
  }

  const rows: VerificationListRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    source: u.source,
    createdAtIso: u.createdAt.toISOString(),
    inviterEmail: inviterByUserId.get(u.id) ?? null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Verification queue</h1>
          <p className="leading-relaxed text-ink/70">
            Every cohort member signing up with Crimson mail lands here until a verified exec approves — audit rows capture approvals, rejects, invitations, revocations.
          </p>
        </div>
        <InviteUserButton ttlHours={ttlHours} />
      </div>

      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-ink/25 bg-paper p-14 text-center text-sm leading-relaxed text-ink/70">
          <p className="text-base font-semibold text-ink">No pending verifications</p>
          <p className="mt-3">Invited guests bypass this queue entirely — invites mint verified identities on acceptance.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper shadow-md">
          <table className="min-w-[940px] w-full border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Signup time</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Inviter</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <VerificationRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
