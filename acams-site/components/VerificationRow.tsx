"use client";

import type { Source } from "@prisma/client";

import { verifyApprove, verifyReject } from "@/app/_actions/auth-actions";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import * as React from "react";

export type VerificationListRow = {
  id: string;
  email: string;
  name: string | null;
  source: Source;
  createdAtIso: string;
  inviterEmail: string | null;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function VerificationRow({ row }: { row: VerificationListRow }) {
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [openApprove, setOpenApprove] = React.useState(false);
  const [openReject, setOpenReject] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [approveError, setApproveError] = React.useState<string | null>(null);
  const [rejectError, setRejectError] = React.useState<string | null>(null);

  async function runApprove() {
    setBusy(true);
    setApproveError(null);
    const res = await verifyApprove(row.id);
    setBusy(false);
    if (!res.ok) setApproveError(res.error);
    else window.location.reload();
  }

  async function runReject() {
    setBusy(true);
    setRejectError(null);
    const res = await verifyReject(row.id);
    setBusy(false);
    if (!res.ok) setRejectError(res.error);
    else window.location.reload();
  }

  return (
    <>
      <tr className="border-t border-ink/10 hover:bg-paper">
        <td className="px-4 py-3 align-top text-sm">{row.email}</td>
        <td className="px-4 py-3 align-top text-sm">{formatWhen(row.createdAtIso)}</td>
        <td className="px-4 py-3 align-top text-sm capitalize">{String(row.source).toLowerCase()}</td>
        <td className="px-4 py-3 align-top text-sm">{row.inviterEmail ?? "—"}</td>
        <td className="px-4 py-3 align-top text-right">
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenApprove(true)}>
              Approve
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenReject(true)}>
              Reject
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-crimson" onClick={() => setOpenDrawer(true)}>
              View
            </Button>
          </div>
        </td>
      </tr>

      <VerificationDrawer open={openDrawer} onOpenChange={setOpenDrawer} row={row} />

      <AlertDialog open={openApprove} onOpenChange={setOpenApprove}>
        <AlertDialogContent>
          <AlertDialogTitle>Approve member access?</AlertDialogTitle>
          <AlertDialogDescription>
            This verifies <span className="font-semibold text-ink">{row.email}</span> and unlocks verified member routes. Everything is logged in the audit
            trail.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runApprove} disabled={busy}>
              {busy ? "Saving…" : "Approve"}
            </AlertDialogAction>
          </div>
          {approveError ? (
            <div className="rounded-md border border-crimson/35 bg-paper p-3 text-xs text-crimson">{approveError}</div>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openReject} onOpenChange={setOpenReject}>
        <AlertDialogContent>
          <AlertDialogTitle>Reject this applicant?</AlertDialogTitle>
          <AlertDialogDescription>
            This blocks credentials login for <span className="font-semibold text-ink">{row.email}</span>. Public pages remain readable; recovery requires a fresh
            executive decision. The rejection is audited.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={busy} onClick={runReject}>
              {busy ? "Saving…" : "Reject"}
            </Button>
          </div>
          {rejectError ? (
            <div className="rounded-md border border-crimson/35 bg-paper p-3 text-xs text-crimson">{rejectError}</div>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function VerificationDrawer(props: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  row: VerificationListRow;
}) {
  const { open, onOpenChange, row } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="pr-12">
          <DialogTitle>{row.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-ink/80">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Signup time</p>
            <p className="mt-1">{formatWhen(row.createdAtIso)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Source</p>
            <p className="mt-1 capitalize">{String(row.source).toLowerCase()}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Executive inviter</p>
            <p className="mt-1">{row.inviterEmail ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Profile name</p>
            <p className="mt-1">{row.name ?? "—"}</p>
          </div>

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
