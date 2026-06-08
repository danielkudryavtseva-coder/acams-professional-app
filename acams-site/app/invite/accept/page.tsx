import type { Metadata } from "next";

import { AcceptInviteForm } from "@/components/AcceptInviteForm";

export const metadata: Metadata = {
  title: "Accept invite • ACAMS",
};

export default async function AcceptInvitePage(props: { searchParams: Promise<{ token?: string }> }) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div>
        <h1 className="text-pretty text-3xl font-semibold tracking-tight text-ink">Accept your invitation</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          Invited guests skip the executive queue — setting a password here marks you verified immediately.
        </p>
      </div>
      <AcceptInviteForm token={token} />
    </div>
  );
}
