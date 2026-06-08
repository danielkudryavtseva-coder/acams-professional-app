"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";

import { z } from "zod";

import { acceptInvite } from "@/app/_actions/auth-actions";

import { acceptInviteFormSchema } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordField = acceptInviteFormSchema.shape.password;

const activateSchema = z
  .object({
    password: passwordField,
    confirm: passwordField,
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords must match",
        path: ["confirm"],
      });
    }
  });

type ActivateValues = z.infer<typeof activateSchema>;

export function AcceptInviteForm({ token }: { token: string }) {
  const [pending, setPending] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<ActivateValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function submit(values: ActivateValues) {
    setServerError(null);
    setPending(true);
    try {
      const res = await acceptInvite({ token, password: values.password });
      if (!res.ok) {
        setServerError(res.error);
        return;
      }

      window.location.assign(`/signin?acceptedInvite=1`);
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-crimson/35 bg-paper p-6 text-sm text-crimson">
        <p>This invite link is invalid or has expired.</p>
        <p className="mt-3 text-xs text-ink/70">
          Invite links expire; tokens are hashed and never echoed from the server once opened.
        </p>
      </div>
    );
  }

  return (
    <form className="mx-auto w-full max-w-md space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="rounded-lg border border-ink/10 bg-paper p-4 text-sm text-ink/80">
        <p className="font-semibold text-ink">Set your password</p>
        <p className="mt-2 leading-relaxed">
          Activate your invitation as a verified member — your email + role ship with the invitation; you&apos;ll unlock member routes immediately
          after sign-in.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register("password")} autoComplete="new-password" />
        {form.formState.errors.password?.message ? (
          <p className="text-sm text-crimson">{String(form.formState.errors.password.message)}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" type="password" {...form.register("confirm")} autoComplete="new-password" />
        {form.formState.errors.confirm?.message ? (
          <p className="text-sm text-crimson">{String(form.formState.errors.confirm.message)}</p>
        ) : null}
      </div>

      {serverError ? (
        <div className="rounded-lg border border-crimson/35 bg-paper p-4 text-sm text-crimson">
          <p>{serverError}</p>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Activating…" : "Activate invite"}
      </Button>

      <p className="text-xs text-ink/60">
        Returning user?{" "}
        <Link className="font-semibold text-crimson underline underline-offset-4" href="/signin">
          Sign in
        </Link>
      </p>
    </form>
  );
}
