import Link from "next/link";

function mailtoRecipients(): string {
  const list = process.env.EXEC_NOTIFY_EMAILS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  const cleaned = list.length ? list : ["exec.demo@crimson.ua.edu"];
  return cleaned.join(",");
}

export default function InviteRequestPage() {
  const subject = encodeURIComponent("Executive invite request — ACAMS");
  const body = encodeURIComponent(
    [
      "Hi ACAMS Exec team,",
      "",
      "I'm an alumnus / industry partner / teammate who needs sponsor access.",
      "",
      "- Full name:",
      "- Preferred role (member/alumnus/guest):",
      "- Why I'd like access:",
      "",
      "Thank you!",
    ].join("\n"),
  );

  const href = `mailto:${mailtoRecipients()}?subject=${subject}&body=${body}`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Request an executive invite</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/75">
          Self signup remains limited to Crimson mailboxes — if your note didn&apos;t pass that gate, sponsors can mint single-use hashed invites spanning any inbox
          provider.
        </p>
      </div>

      <div className="rounded-2xl border border-crimson/25 bg-paper p-6">
        <p className="text-sm leading-relaxed text-ink/80">
          This page pre-fills a mail client request to contacts listed in{" "}
          <span className="font-mono text-xs text-crimson">EXEC_NOTIFY_EMAILS</span> ({mailtoRecipients()}).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="inline-flex items-center rounded-md bg-crimson px-5 py-2 text-sm font-semibold text-paper hover:bg-[var(--crimson-dark)]"
            href={href}
          >
            Email the executive team
          </a>
          <Link href="/signin" className="rounded-md border border-ink/20 px-5 py-2 text-sm font-semibold text-ink hover:bg-crimson/10">
            Back to sign-in
          </Link>
        </div>
      </div>
    </div>
  );
}
