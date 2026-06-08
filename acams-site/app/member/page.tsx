export default async function MemberHomePage() {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-md">
      <h2 className="text-xl font-semibold text-ink">Today</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/75">
        <li>Deep links into the SPA remain available inside the OneDrive-hosted bundle.</li>
        <li>Need executive tooling? Navigate to Exec Tools via the authenticated header shortcut.</li>
        <li>Password resets + TOTP are intentionally stubbed pending security review.</li>
      </ul>
    </section>
  );
}
