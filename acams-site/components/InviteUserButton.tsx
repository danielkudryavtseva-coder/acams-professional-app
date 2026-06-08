"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";

import type { InviteUserFormValues } from "@/lib/schemas";
import { inviteUserFormSchema } from "@/lib/schemas";
import { createInvite } from "@/app/_actions/auth-actions";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InviteUserButton({
  ttlHours,
  variant = "default",
}: {
  ttlHours: number;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
      role: Role.MEMBER,
      note: "",
    },
  });

  const values = form.watch();

  function resetState() {
    form.reset({
      email: "",
      fullName: "",
      role: Role.MEMBER,
      note: "",
    });
    setError(null);
    setSuccess(null);
  }

  const preview = React.useMemo(() => {
    const email = values.email.trim() || "(email)";
    const name = values.fullName.trim() || "(full name)";
    const note = values.note?.trim();

    return [
      `To: ${email}`,
      "",
      `${name}, you're invited to join ACAMS.`,
      "",
      `Open your secure invitation link within ${ttlHours} hours.`,
      `(Link is omitted here — generated server-side)`,
      "",
      note ? `Note from executive:\n${note}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [values.email, values.fullName, values.note, ttlHours]);

  async function onSubmit(vals: InviteUserFormValues) {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await createInvite(vals);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess("Invitation queued for delivery.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant}>Invite User</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member, alumnus, or guest</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" type="email" {...form.register("email")} placeholder="guest@firm.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full name</Label>
              <Input id="invite-name" {...form.register("fullName")} />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={values.role}
                onValueChange={(v) => form.setValue("role", v as InviteUserFormValues["role"], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.MEMBER}>Member</SelectItem>
                  <SelectItem value={Role.ALUMNUS}>Alumnus</SelectItem>
                  <SelectItem value={Role.GUEST}>Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-note">Executive note (optional)</Label>
              <Input id="invite-note" {...form.register("note")} placeholder="Context useful for onboarding" />
            </div>

            {error ? <div className="rounded-md border border-crimson/35 bg-paper p-3 text-xs text-crimson">{error}</div> : null}
            {success ? <div className="rounded-md border border-ink/15 bg-paper p-3 text-xs text-ink">{success}</div> : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending invite…" : "Send invitation email"}
            </Button>

            <p className="text-xs leading-relaxed text-ink/60">
              Tokens store only SHA-256 hashes of 32-byte secrets; plaintext links exist solely inside SMTP payloads.
            </p>
          </form>

          <div className="space-y-2">
            <Label>Email preview</Label>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-ink/15 bg-paper p-4 text-xs text-ink/80">
              {preview}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
