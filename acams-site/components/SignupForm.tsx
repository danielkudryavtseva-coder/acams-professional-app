"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";

import { signup } from "@/app/_actions/auth-actions";
import { signupFormSchema } from "@/lib/schemas";

import type { SignupFormValues } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const [pending, start] = useTransition();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4"
      onSubmit={form.handleSubmit((values) => {
        setServerError(null);
        start(async () => {
          const res = await signup(values);
          if (!res.ok) {
            setServerError(res.error);
            return;
          }
          window.location.assign("/signin?created=1");
        });
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" {...form.register("name")} autoComplete="name" />
        {form.formState.errors.name ? (
          <p className="text-sm text-crimson">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">University email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          autoComplete="email"
          onBlur={(e) => {
            form.trigger("email");
            form.setValue("email", e.target.value, { shouldValidate: true });
          }}
        />
        {form.formState.errors.email ? (
          <div className="space-y-2 text-sm leading-relaxed text-crimson">
            <p>{form.formState.errors.email.message}</p>
            <p>
              Alumni and guests should{" "}
              <Link href="/invite/request" className="underline underline-offset-4">
                contact an executive
              </Link>{" "}
              instead.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register("password")} autoComplete="new-password" />
        {form.formState.errors.password ? (
          <p className="text-sm text-crimson">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <div className="rounded-lg border border-crimson/35 bg-paper p-4 text-sm text-crimson">
          <p>{serverError}</p>
          {serverError.includes("alumnus") ? (
            <p className="mt-3">
              <Link href="/invite/request" className="font-semibold underline underline-offset-4">
                Invite request page (email an executive)
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
