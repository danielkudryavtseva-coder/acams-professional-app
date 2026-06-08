import type { Metadata } from "next";

import { SignInForm } from "@/components/SignInForm";

export const metadata: Metadata = {
  title: "Sign in • ACAMS",
};

export default function SignInPage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div>
        <h1 className="text-pretty text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          Credentials for daily use, nodemailer for passwordless bursts. Tokens never appear in telemetry — only audited hashes do.
        </p>
      </div>
      <SignInForm />
    </div>
  );
}
