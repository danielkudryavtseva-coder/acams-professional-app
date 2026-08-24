import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { User, Image } from "lucide-react";
import { APPLY_URL } from "../components/PublicShell";

interface CommitteeInfo {
  name: "TMT" | "Contrarian" | "Financials" | "Consumer" | "Healthcare" | "Industrials & Energy";
  tagline: string;
  description: string;
  activities: string[];
  color: string;
  border: string;
}

const COMMITTEES: CommitteeInfo[] = [
  {
    name: "TMT",
    tagline: "Sector coverage for Technology, Media & Telecom",
    description:
      "The TMT Committee owns sector coverage for technology, media, and telecommunications names. Members track the coverage universe, monitor earnings and competitive dynamics, and build sector-specific theses that feed directly into the full committee's pitch process.",
    activities: [
      "TMT coverage universe and comp tracking",
      "Earnings call reviews for covered names",
      "Sector-specific investment pitches",
      "Industry trend and competitive landscape research",
      "Valuation modeling (DCF, comps, LBO)",
    ],
    color: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  {
    name: "Contrarian",
    tagline: "Stress-testing the portfolio's consensus bets",
    description:
      "The Contrarian Committee builds the dissenting case on every pitch under consideration — short theses, bear cases, and second-order risks the coverage teams may be missing. Every position that survives Contrarian scrutiny enters the portfolio stronger.",
    activities: [
      "Bear-case and short-thesis write-ups",
      "Red-teaming coverage-team pitches before committee votes",
      "Downside and risk-scenario modeling",
      "Post-mortems on positions that underperformed",
      "Macro and market-sentiment tracking",
    ],
    color: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
  },
  {
    name: "Financials",
    tagline: "Sector coverage for banks, insurers & fintech",
    description:
      "The Financials Committee covers banks, insurers, asset managers, and fintech names — sectors with their own valuation frameworks and regulatory dynamics. Members build coverage on rate sensitivity, credit cycles, and capital markets exposure.",
    activities: [
      "Financials coverage universe and comp tracking",
      "Bank and insurer earnings reviews",
      "Rate-sensitivity and credit-cycle analysis",
      "Sector-specific investment pitches",
      "Regulatory and capital markets tracking",
    ],
    color: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  {
    name: "Consumer",
    tagline: "Sector coverage for retail & consumer brands",
    description:
      "The Consumer Committee covers retail, consumer packaged goods, and brand-driven businesses. Members track same-store sales, brand strength, and shifting consumer behavior to build coverage on names the whole society interacts with daily.",
    activities: [
      "Consumer coverage universe and comp tracking",
      "Retail earnings and same-store-sales reviews",
      "Brand strength and consumer-trend research",
      "Sector-specific investment pitches",
      "Channel checks and product research",
    ],
    color: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  {
    name: "Healthcare",
    tagline: "Sector coverage for pharma, biotech & providers",
    description:
      "The Healthcare Committee covers pharmaceuticals, biotech, medtech, and healthcare providers — a sector defined by regulatory catalysts, pipeline risk, and long development cycles. Members build coverage that stands up to that complexity.",
    activities: [
      "Healthcare coverage universe and comp tracking",
      "Pipeline, trial-readout, and FDA catalyst tracking",
      "Sector-specific investment pitches",
      "Reimbursement and regulatory research",
      "Valuation modeling (DCF, comps, LBO)",
    ],
    color: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
  },
  {
    name: "Industrials & Energy",
    tagline: "Sector coverage for industrials, materials & energy",
    description:
      "The Industrials & Energy Committee covers manufacturers, materials producers, and energy companies — sectors shaped by commodity cycles, capex spending, and global supply chains. Members build coverage across the full value chain.",
    activities: [
      "Industrials & Energy coverage universe and comp tracking",
      "Commodity-cycle and capex-spending analysis",
      "Sector-specific investment pitches",
      "Supply chain and capacity utilization research",
      "Valuation modeling (DCF, comps, LBO)",
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

/** Top 5 coverage/holdings companies per committee (from portfolio decisions). */
const COMMITTEE_HOLDINGS: Record<string, { ticker: string; name: string; domain: string }[]> = {
  TMT: [
    { ticker: "AAPL", name: "Apple Inc.", domain: "apple.com" },
    { ticker: "MSFT", name: "Microsoft Corporation", domain: "microsoft.com" },
    { ticker: "GOOGL", name: "Alphabet Inc.", domain: "abc.xyz" },
    { ticker: "META", name: "Meta Platforms, Inc.", domain: "meta.com" },
    { ticker: "NFLX", name: "Netflix, Inc.", domain: "netflix.com" },
  ],
  Contrarian: [
    { ticker: "TSLA", name: "Tesla, Inc.", domain: "tesla.com" },
    { ticker: "NVDA", name: "NVIDIA Corporation", domain: "nvidia.com" },
    { ticker: "COIN", name: "Coinbase Global, Inc.", domain: "coinbase.com" },
    { ticker: "CVNA", name: "Carvana Co.", domain: "carvana.com" },
    { ticker: "PLTR", name: "Palantir Technologies Inc.", domain: "palantir.com" },
  ],
  Financials: [
    { ticker: "JPM", name: "JPMorgan Chase & Co.", domain: "jpmorganchase.com" },
    { ticker: "BAC", name: "Bank of America Corporation", domain: "bankofamerica.com" },
    { ticker: "GS", name: "The Goldman Sachs Group, Inc.", domain: "goldmansachs.com" },
    { ticker: "MS", name: "Morgan Stanley", domain: "morganstanley.com" },
    { ticker: "BRK.B", name: "Berkshire Hathaway Inc.", domain: "berkshirehathaway.com" },
  ],
  Consumer: [
    { ticker: "AMZN", name: "Amazon.com, Inc.", domain: "amazon.com" },
    { ticker: "WMT", name: "Walmart Inc.", domain: "walmart.com" },
    { ticker: "NKE", name: "Nike, Inc.", domain: "nike.com" },
    { ticker: "SBUX", name: "Starbucks Corporation", domain: "starbucks.com" },
    { ticker: "MCD", name: "McDonald's Corporation", domain: "mcdonalds.com" },
  ],
  Healthcare: [
    { ticker: "VRTX", name: "Vertex Pharmaceuticals", domain: "vrtx.com" },
    { ticker: "UNH", name: "UnitedHealth Group Incorporated", domain: "unitedhealthgroup.com" },
    { ticker: "JNJ", name: "Johnson & Johnson", domain: "jnj.com" },
    { ticker: "PFE", name: "Pfizer Inc.", domain: "pfizer.com" },
    { ticker: "LLY", name: "Eli Lilly and Company", domain: "lilly.com" },
  ],
  "Industrials & Energy": [
    { ticker: "XOM", name: "Exxon Mobil Corporation", domain: "exxonmobil.com" },
    { ticker: "CAT", name: "Caterpillar Inc.", domain: "caterpillar.com" },
    { ticker: "BA", name: "The Boeing Company", domain: "boeing.com" },
    { ticker: "HON", name: "Honeywell International Inc.", domain: "honeywell.com" },
    { ticker: "CVX", name: "Chevron Corporation", domain: "chevron.com" },
  ],
};

function CommitteeLogos({ committee }: { committee: string }) {
  const holdings = COMMITTEE_HOLDINGS[committee]?.slice(0, 5) ?? [];
  if (holdings.length === 0) {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground sm:h-20 sm:w-20"
          >
            <Image className="h-6 w-6 opacity-40" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div>
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Companies We Cover
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {holdings.map((h) => (
          <div key={h.ticker} className="flex flex-col items-center gap-1.5">
            <div
              title={h.name}
              className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-white p-2.5 shadow-soft dark:bg-card sm:h-20 sm:w-20"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${h.domain}&sz=128`}
                alt={h.name}
                className="h-full w-full object-contain"
              />
            </div>
            <p className="text-xs font-semibold text-foreground">{h.ticker}</p>
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
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">Our Committees</h1>
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
              <CommitteeLogos committee={c.name} />
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
            <a href={APPLY_URL} target="_blank" rel="noopener noreferrer">
              Apply to CAMS
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/membership">Learn More</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
