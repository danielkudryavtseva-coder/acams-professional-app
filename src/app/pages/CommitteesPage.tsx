import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { User, Image } from "lucide-react";

interface CommitteeInfo {
  name: "Investment" | "Recruiting" | "Operations" | "Marketing";
  tagline: string;
  description: string;
  activities: string[];
  color: string;
  border: string;
}

const COMMITTEES: CommitteeInfo[] = [
  {
    name: "Investment",
    tagline: "Managing CAMS's real-money portfolio",
    description:
      "The Investment Committee is the analytical core of CAMS. Members conduct deep-dive equity research, build financial models, and pitch long or short ideas to the full committee. Every pitch that passes a committee vote enters the live portfolio.",
    activities: [
      "Weekly equity research and sector coverage",
      "Quarterly investment pitch presentations",
      "Real-money portfolio management",
      "Valuation modeling (DCF, comps, LBO)",
      "Investment thesis write-ups and post-mortems",
    ],
    color: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    name: "Recruiting",
    tagline: "Connecting members to top financial institutions",
    description:
      "The Recruiting Committee manages CAMS's relationships with Wall Street firms and coordinates every recruiting event, info session, and interview prep initiative. If you want to be a banker, PE associate, or trader, this committee gets you there.",
    activities: [
      "Firm info sessions and on-campus events",
      "Mock interview coordination (behavioral + technical)",
      "Resume and cover letter review",
      "Alumni outreach and referral coordination",
      "Superday and internship offer tracking",
    ],
    color: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
  },
  {
    name: "Operations",
    tagline: "Keeping the organization running",
    description:
      "Operations manages the infrastructure behind CAMS — from treasury and budget to meeting logistics, member records, and org governance. Without Operations, nothing else works. This committee is ideal for members who want to build leadership skills and org management experience.",
    activities: [
      "Budget and treasury management",
      "Meeting coordination and attendance tracking",
      "Member onboarding and records",
      "Constitution and bylaws governance",
      "Inter-org coordination with Culverhouse",
    ],
    color: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  {
    name: "Marketing",
    tagline: "Building the CAMS brand",
    description:
      "Marketing manages CAMS's public presence — social media, content creation, the website, and event promotion. This is the committee for members who want to blend finance with creative strategy and digital marketing.",
    activities: [
      "Social media content and posting calendar",
      "Event promotion and graphic design",
      "Website updates and member portal",
      "CAMS brand standards and assets",
      "Photography and event documentation",
    ],
    color: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
  },
];

function CommitteeHeadPlaceholder() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/40 text-muted-foreground">
        <User className="h-5 w-5 opacity-40" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Committee Head
        </p>
        <p className="text-sm text-muted-foreground">Name coming soon</p>
      </div>
    </div>
  );
}

function HoldingsLogosPlaceholder() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Companies in Holdings
      </p>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/40 text-muted-foreground"
          >
            <Image className="h-4 w-4 opacity-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommitteesPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b bg-card py-14 px-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Our Committees</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Every CAMS member joins one of four committees. Each committee has its own focus, skill
          set, and recruiting track alignment.
        </p>
      </section>

      {/* Committee cards */}
      <section className="max-w-5xl mx-auto w-full py-14 px-6 space-y-8">
        {COMMITTEES.map((c) => (
          <Card key={c.name} className={`${c.color} ${c.border} border`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-xl">{c.name} Committee</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.tagline}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CommitteeHeadPlaceholder />
              <p className="text-sm leading-relaxed">{c.description}</p>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Key Activities
                </p>
                <ul className="space-y-1">
                  {c.activities.map((a) => (
                    <li key={a} className="text-sm flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#c63f60] shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <HoldingsLogosPlaceholder />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-14 px-6 text-center">
        <h2 className="text-xl font-semibold">Ready to join?</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Applications open each semester. Indicate your committee preference during the application.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/apply">Apply to CAMS</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/membership">Learn More</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
