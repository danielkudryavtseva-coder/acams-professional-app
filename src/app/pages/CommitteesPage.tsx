import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { User, Image, Star } from "lucide-react";
import { APPLY_URL } from "../components/PublicShell";

interface CommitteeInfo {
  name: "TMT" | "Contrarian" | "Financials" | "Consumer" | "Healthcare" | "Industrials & Energy";
  tagline: string;
  description: string;
  activities: string[];
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
  },
];

function CommitteeHeadPlaceholder() {
  return (
    <div className="flex w-full shrink-0 flex-col items-center gap-3 sm:w-40">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-border bg-crimson/10 text-muted-foreground ring-[6px] ring-crimson ring-offset-[3px] ring-offset-background sm:h-32 sm:w-32">
        <User className="h-10 w-10 opacity-40" />
      </div>
      <p className="text-center text-sm font-semibold text-foreground">Name coming soon</p>
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

/** Small deterministic vertical offsets per slot so the logos read as "floating" rather than a rigid grid. */
const FLOAT_OFFSETS = ["translate-y-0", "-translate-y-2", "translate-y-3", "-translate-y-3", "translate-y-1"];

function CommitteeLogos({ committee }: { committee: string }) {
  const holdings = COMMITTEE_HOLDINGS[committee]?.slice(0, 5) ?? [];
  if (holdings.length === 0) {
    return (
      <div className="flex flex-1 flex-wrap items-center justify-center gap-5 sm:justify-start">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground sm:h-24 sm:w-24 ${FLOAT_OFFSETS[i]}`}
          >
            <Image className="h-6 w-6 opacity-40" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-wrap items-center justify-center gap-5 sm:justify-start">
      {holdings.map((h, i) => (
        <div
          key={h.ticker}
          className={`relative flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-white p-3 shadow-soft transition-transform duration-base ease-smooth hover:-translate-y-1 dark:bg-card sm:h-24 sm:w-24 ${FLOAT_OFFSETS[i]}`}
          title={h.name}
        >
          {i === 0 && (
            <div
              title="Highest market cap"
              className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-crimson text-white shadow-soft"
            >
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
          )}
          <img
            src={`https://www.google.com/s2/favicons?domain=${h.domain}&sz=128`}
            alt={h.name}
            className="h-full w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}

export default function CommitteesPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#7d2c45] to-[#c63f60] px-6 py-10 text-center text-white">
        <h1 className="text-3xl font-bold tracking-tight">Our Committees</h1>
        <p className="mx-auto mt-2 max-w-xl text-base text-white/80">
          Sector coverage teams that research, pitch, and manage the CAMS portfolio.
        </p>
      </section>

      {/* Committee cards */}
      <section className="max-w-5xl mx-auto w-full py-14 px-6 space-y-6">
        {COMMITTEES.map((c) => (
          <Card key={c.name} className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{c.name} Committee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                <CommitteeHeadPlaceholder />
                <CommitteeLogos committee={c.name} />
              </div>
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
