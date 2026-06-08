"use client";

import * as React from "react";

import Link from "next/link";
import { signIn } from "next-auth/react";

import { checkSignInAllowed } from "@/app/_actions/auth-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MagicLinkMiniForm() {
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form
      className="rounded-lg border border-ink/10 bg-paper p-4 text-sm text-ink/80 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = String(form.get("email_magic") ?? "")
          .trim()
          .toLowerCase();

        setError(null);

        start(async () => {
          const gate = await checkSignInAllowed();
          if (!gate.ok) {
            setError(gate.error);
            return;
          }

          if (!email.includes("@")) {
            setError("Enter a valid email.");
            return;
          }

          const res = await signIn("nodemailer", {
            email,
            redirect: false,
          });

          if (res?.error) {
            setError("Unable to send a magic link.");
            return;
          }

          alert("Check your email for your sign-in link.");
        });
      }}
    >
      <div>
        <p className="font-semibold text-ink">Passwordless sign-in (Email)</p>
        <p className="mt-2 leading-relaxed text-ink/70">
          We&apos;ll send a verification link using the configured SMTP transport (logged in console when SMTP is missing).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email_magic">Email</Label>
        <Input id="email_magic" name="email_magic" type="email" autoComplete="email" />
      </div>
      {error ? <div className="rounded-md border border-crimson/35 bg-paper p-3 text-xs text-crimson">{error}</div> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Sending…" : "Email me a magic link"}
        </Button>
        <Link href="/auth/forgot" className="text-xs font-semibold text-crimson underline underline-offset-4">
          Forgot password (stub)
        </Link>
      </div>
    </form>
  );
}
