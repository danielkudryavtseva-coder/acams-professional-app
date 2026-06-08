"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";

import type { SignInFormValues } from "@/lib/schemas";
import { signInFormSchema } from "@/lib/schemas";

import { signIn } from "next-auth/react";
import { checkSignInAllowed } from "@/app/_actions/auth-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MagicLinkMiniForm } from "@/components/MagicLinkMiniForm";

export function SignInForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4"
      onSubmit={form.handleSubmit((values) => {
        setServerError(null);
        start(async () => {
          const gate = await checkSignInAllowed();
          if (!gate.ok) {
            setServerError(gate.error);
            return;
          }
          const res = await signIn("credentials", {
            email: values.email.trim().toLowerCase(),
            password: values.password,
            redirect: false,
          });
          if (!res?.ok || res?.error) {
            setServerError("Invalid email or password, or account access is denied.");
            return;
          }

          router.push("/member");
          router.refresh();
        });
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input id="signin-email" type="email" {...form.register("email")} autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input id="signin-password" type="password" {...form.register("password")} autoComplete="current-password" />
      </div>

      {serverError ? <div className="rounded-lg border border-crimson/35 bg-paper p-3 text-sm text-crimson">{serverError}</div> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <MagicLinkMiniForm />

      <p className="text-xs text-ink/60">
        New here?{" "}
        <Link className="font-semibold text-crimson underline underline-offset-4" href="/signup">
          Sign up with your @crimson.ua.edu address
        </Link>
      </p>
    </form>
  );
}
