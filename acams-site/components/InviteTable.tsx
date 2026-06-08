"use client";

import * as React from "react";

import type { Role } from "@prisma/client";

import { revokeInvite } from "@/app/_actions/auth-actions";

import { Button } from "@/components/ui/button";

export type SerializableInvite = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAtIso: string;
  expiresAtIso: string;
  usedAtIso: string | null;
  revokedAtIso: string | null;
  redeemedUserId: string | null;
  createdByEmail: string;
};

export function InviteTable({ invites }: { invites: SerializableInvite[] }) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onRevoke(id: string) {
    setError(null);
    setPendingId(id);
    try {
      const res = await revokeInvite(id);
      if (!res.ok) setError(res.error);
      else window.location.reload();
    } finally {
      setPendingId(null);
    }
  }

  if (!invites.length) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 bg-paper p-12 text-center text-sm text-ink/65">
        No invites yet — spin one up via the Invite User shortcut.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-md border border-crimson/35 bg-paper p-4 text-sm text-crimson">{error}</div> : null}
      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper shadow-md">
        <table className="min-w-[880px] w-full border-collapse text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3">Guest email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created by</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => {
              const consumed = Boolean(inv.usedAtIso || inv.redeemedUserId);
              const revoked = Boolean(inv.revokedAtIso);
              const expired = Date.parse(inv.expiresAtIso) < Date.now();
              let status = "Pending";
              if (revoked) status = "Revoked";
              else if (consumed) status = "Redeemed";
              else if (expired) status = "Expired";

              const canRevoke = !consumed && !revoked && !expired;

              return (
                <tr key={inv.id} className="border-t border-ink/10 hover:bg-paper">
                  <td className="px-4 py-3">{inv.email}</td>
                  <td className="px-4 py-3">{inv.fullName}</td>
                  <td className="px-4 py-3">{inv.role}</td>
                  <td className="px-4 py-3">{inv.createdByEmail}</td>
                  <td className="px-4 py-3">{inv.createdAtIso.slice(0, 16).replace("T", " ")}</td>
                  <td className="px-4 py-3">{inv.expiresAtIso.slice(0, 16).replace("T", " ")}</td>
                  <td className="px-4 py-3">{status}</td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="outline" size="sm" disabled={!canRevoke || pendingId === inv.id} onClick={() => onRevoke(inv.id)}>
                      {pendingId === inv.id ? "Revoking…" : "Revoke"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
