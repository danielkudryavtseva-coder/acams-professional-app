import Link from "next/link";

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-paper p-8 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-crimson">ACAMS Platform</p>
        <h1 className="mt-2 text-pretty text-3xl font-semibold tracking-tight text-ink md:text-4xl">Crimson member hub preview</h1>
        <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-ink/75">
          This Next.js companion site handles authentication and executive verification workflows. Existing marketing routes remain placeholders while the richer
          tooling lives inside the sibling Vite `professional-app` bundle.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/portfolio", title: "Portfolio", note: "Public portfolio snapshot parity with the SPA." },
          { href: "/leadership", title: "Leadership", note: "Exec roster + programming overview." },
          { href: "/news", title: "News", note: "Newsroom stubs linked from the SPA." },
          { href: "/member", title: "Member hub", note: "Pending verification placeholders when needed." },
          { href: "/exec/verifications", title: "Exec tools", note: "Executive guard + onboarding queue." },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-crimson/25 bg-paper p-6 shadow-[0_12px_32px_-10px_rgb(158_27_50/0.18)]"
          >
            <p className="text-sm font-semibold text-crimson group-hover:underline">{c.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{c.note}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
