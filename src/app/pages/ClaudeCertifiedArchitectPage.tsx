import { ExternalLink, Linkedin, Lock, Youtube } from "lucide-react";
import { Button } from "../components/ui/button";

const ANTHROPIC_CORAL = "#cc785c";
const TEAM_MEMBERS_REQUIRED = 10;
const TEAM_MEMBERS_COMPLETED = 0;

const LINKS = {
  anthropicAcademy: "https://www.anthropic.com/learn",
  cpnLearningPath: "https://www.anthropic.com/learn",
  confirmCompletion: "https://www.anthropic.com/learn",
  ccafInstructions: "https://www.anthropic.com/learn",
  twitter: "https://twitter.com/anthropicai",
  linkedin: "https://www.linkedin.com/company/anthropicresearch",
  youtube: "https://www.youtube.com/@anthropic-ai",
};

function CoralLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 transition-opacity hover:opacity-80"
      style={{ color: ANTHROPIC_CORAL }}
    >
      {children}
    </a>
  );
}

function ClaudeLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={ANTHROPIC_CORAL}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M12 2 14 9l7 1-5.5 4.5L17 22l-5-3.5L7 22l1.5-7.5L3 10l7-1z" />
      </svg>
      <span className="text-sm font-medium tracking-tight" style={{ color: ANTHROPIC_CORAL }}>
        Claude
      </span>
    </div>
  );
}

export default function ClaudeCertifiedArchitectPage() {
  return (
    <div className="min-h-full bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Claude Certified Architect
          </h1>
          <span className="inline-flex items-baseline text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-crimson border border-crimson/30 bg-crimson/10 rounded-full px-2 py-0.5">
            CAMS Exclusive
          </span>
        </header>
        <div
          className="overflow-hidden rounded-lg shadow-xl"
          style={{ backgroundColor: "#2f3032", color: "#e8e3da" }}
        >
          <header className="border-b border-white/5 px-8 pt-8 pb-5">
            <ClaudeLogo />
          </header>

          <article className="space-y-5 px-8 py-7 text-[15px] leading-relaxed">
            <p>Hi Daniel,</p>

            <p>
              Thank you for your patience while we worked through a high volume of
              applications in the last few weeks. Your application to the Claude Partner
              Network has cleared initial review and you&rsquo;re approved to move forward on
              the path to partnership.
            </p>

            <p>
              We&rsquo;re finalizing a new partner portal in the coming weeks where
              you&rsquo;ll formally accept Network terms and track your status &mdash;
              we&rsquo;ll send instructions on access as soon as it&rsquo;s live, and no
              action is needed from you on that until you hear from us.
            </p>

            <p>
              In the meantime, there&rsquo;s one thing to start now &mdash;{" "}
              <span className="font-semibold" style={{ color: "#f5efe4" }}>
                getting your team trained and certified.
              </span>
            </p>

            <p>
              Enroll ten of your team members to{" "}
              <CoralLink href={LINKS.anthropicAcademy}>Anthropic Academy</CoralLink> and have
              them complete the{" "}
              <CoralLink href={LINKS.cpnLearningPath}>CPN learning path</CoralLink>. Pick the
              people who will anchor your Claude practice &mdash; delivery leads,
              architects, the people you&rsquo;d put on a customer engagement.
            </p>

            <p>
              Once all ten have finished,{" "}
              <CoralLink href={LINKS.confirmCompletion}>confirm completion here</CoralLink>.
              We&rsquo;ll validate and open up the Claude Certified Architect Foundations
              (CCAF) technical certification for your organization, with guidance on that
              step to follow.{" "}
              <CoralLink href={LINKS.ccafInstructions}>Click here</CoralLink> for detailed
              instructions on Academy access and steps to unlocking CCAF.
            </p>

            <p>
              Certification is the first milestone toward partner status &mdash; not the
              finish line. Full program criteria, tiering, and what each level unlocks will
              be shared alongside the portal launch, and we&rsquo;ll walk you through
              exactly where you stand and what&rsquo;s left. Until then, we ask that you
              hold off on any public announcement of partnership; we&rsquo;ll let you know
              when that moment arrives and make sure you have what you need to do it well.
            </p>

            <p>
              This is your action plan for now &mdash; portal access and full program
              details will follow in the coming weeks. We&rsquo;re glad to have you on the
              path with us, and we appreciate you sticking with the process!
            </p>

            <p className="pt-2">Thank you,</p>
            <p>Claude Partner Network Team</p>
          </article>

          <section className="border-t border-white/5 px-8 py-6">
            <div className="mb-5">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "rgba(232,227,218,0.55)" }}
                >
                  CCAF unlock progress
                </p>
                <p className="text-xs" style={{ color: "rgba(232,227,218,0.55)" }}>
                  <span
                    className="text-base font-semibold"
                    style={{ color: "#f5efe4" }}
                  >
                    {TEAM_MEMBERS_COMPLETED}
                  </span>{" "}
                  / {TEAM_MEMBERS_REQUIRED} team members
                </p>
              </div>
              <div
                className="relative h-2 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(232,227,218,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(TEAM_MEMBERS_COMPLETED / TEAM_MEMBERS_REQUIRED) * 100}%`,
                    backgroundColor: ANTHROPIC_CORAL,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Lock
                  className="h-3 w-3"
                  style={{ color: "rgba(232,227,218,0.55)" }}
                />
                <p className="text-xs" style={{ color: "rgba(232,227,218,0.55)" }}>
                  <span className="font-medium" style={{ color: "#f5efe4" }}>
                    {TEAM_MEMBERS_REQUIRED - TEAM_MEMBERS_COMPLETED} more needed
                  </span>{" "}
                  to unlock the Claude Certified Architect Foundations (CCAF)
                </p>
              </div>
            </div>

            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "rgba(232,227,218,0.55)" }}
            >
              Action items
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                className="border-0 text-white hover:opacity-90"
                style={{ backgroundColor: ANTHROPIC_CORAL }}
              >
                <a href={LINKS.cpnLearningPath} target="_blank" rel="noreferrer">
                  Start CPN Learning Path
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-transparent text-[#e8e3da] hover:bg-white/5 hover:text-white"
              >
                <a href={LINKS.anthropicAcademy} target="_blank" rel="noreferrer">
                  Open Anthropic Academy
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-transparent text-[#e8e3da] hover:bg-white/5 hover:text-white"
              >
                <a href={LINKS.confirmCompletion} target="_blank" rel="noreferrer">
                  Confirm Completion
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-transparent text-[#e8e3da] hover:bg-white/5 hover:text-white"
              >
                <a href={LINKS.ccafInstructions} target="_blank" rel="noreferrer">
                  CCAF Instructions
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </section>

          <footer
            className="border-t border-white/5 px-8 pt-7 pb-8 text-center"
            style={{ color: "rgba(232,227,218,0.55)" }}
          >
            <p
              className="mb-4 text-sm font-semibold tracking-[0.32em]"
              style={{ color: "#e8e3da" }}
            >
              ANTHROP\C
            </p>
            <div className="mb-5 flex items-center justify-center gap-4">
              <a
                href={LINKS.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="transition-opacity hover:opacity-80"
                style={{ color: "#e8e3da" }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2H21l-6.523 7.46L22 22h-6.789l-4.74-6.18L4.95 22H2.193l6.987-7.99L2 2h6.91l4.282 5.66zm-1.19 18h1.838L7.04 4H5.07z" />
                </svg>
              </a>
              <a
                href={LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="transition-opacity hover:opacity-80"
                style={{ color: "#e8e3da" }}
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href={LINKS.youtube}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="transition-opacity hover:opacity-80"
                style={{ color: "#e8e3da" }}
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
            <p className="text-xs">
              Anthropic PBC, 548 Market St, PMB 90375, San Francisco, CA, 94104
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
