import { prisma } from "@/lib/db";
import { Status } from "@prisma/client";

import { InviteUserButton } from "@/components/InviteUserButton";

const ttlHours = Number(process.env.INVITE_TTL_HOURS ?? "24");

export default async function ExecMembersPage() {
  const members = await prisma.user.findMany({
    where: { status: Status.VERIFIED },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Membership roster</h1>
          <p className="leading-relaxed text-ink/70">
            Showing every verified persona (execs included) so onboarding teams can reconcile audit trails with Crimson&apos;s spreadsheets.
          </p>
        </div>
        <InviteUserButton ttlHours={ttlHours} variant="secondary" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper shadow-md">
        {!members.length ? (
          <div className="p-12 text-center text-sm text-ink/70">Nobody verified yet — approve the queue.</div>
        ) : (
          <table className="min-w-[860px] w-full border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-ink/10 hover:bg-paper">
                  <td className="px-4 py-3">{m.email}</td>
                  <td className="px-4 py-3">{m.name ?? "—"}</td>
                  <td className="px-4 py-3">{m.role}</td>
                  <td className="px-4 py-3">{m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
