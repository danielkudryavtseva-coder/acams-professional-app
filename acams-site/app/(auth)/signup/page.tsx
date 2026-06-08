import type { Metadata } from "next";

import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign up • ACAMS",
};

export default function SignUpPage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div>
        <h1 className="text-pretty text-3xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          Self signup is intentionally limited to active University of Alabama students on the Crimson domain — alumni rely on invitations or executive sponsors.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
