const APPLICATION_FORM_URL =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jnIAKtDwtECk6M5DPz-8p-dm6BAHXZ5FpC2yR0M_VpJUNktCRjRJRDRFVk9ZVkFNT0tUSjdPN1FTUC4u&embed=true";

export default function ApplyPage() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-content px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-crimson">
          Membership
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
          Apply to CAMS
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Fill out the form below to apply for membership in the Capstone
          Asset Management Society.
        </p>

        <div className="mt-10 overflow-hidden rounded-lg border border-border bg-paper shadow-sm">
          <iframe
            title="CAMS Application Form"
            src={APPLICATION_FORM_URL}
            className="h-[1400px] w-full"
            frameBorder={0}
            marginWidth={0}
            marginHeight={0}
            allowFullScreen
          >
            Loading…
          </iframe>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Form not loading?{" "}
          <a
            href={APPLICATION_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-crimson hover:underline"
          >
            Open it in a new tab
          </a>{" "}
          instead.
        </p>
      </div>
    </section>
  );
}
