import { Link } from "react-router-dom";

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
          Applications for the Capstone Asset Management Society are coming
          soon. We&apos;re finalizing the form and will publish it here shortly.
        </p>

        <div className="mt-10 rounded-lg border border-border bg-paper p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-crimson">
            Coming Soon
          </p>
          <p className="mt-3 text-base text-muted-foreground">
            This application form is in development. Please check back shortly,
            or email{" "}
            <a
              href="mailto:contact@cams.ua.edu"
              className="font-medium text-crimson hover:underline"
            >
              contact@cams.ua.edu
            </a>{" "}
            in the meantime.
          </p>
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center rounded-md bg-crimson px-5 py-3 text-sm font-semibold text-white hover:bg-crimson-dark"
          >
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
