import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { User, Image, Star } from "lucide-react";
import mattRochford from "../../assets/execs/matt-rochford.png";
import matthewWorthington from "../../assets/execs/matthew-worthington.png";
import phillipGorokhovich from "../../assets/execs/phillip-gorokhovich.jpg";
import brianWilk from "../../assets/execs/brian-wilk.png";
import hartwellForstman from "../../assets/execs/hartwell-forstman.png";
import zachBlincoe from "../../assets/execs/zach-blincoe.jpg";
import ultaBeautyLogo from "../../assets/logos/ulta-beauty.png";
import chipotleLogo from "../../assets/logos/chipotle.png";
import greenThumbLogo from "../../assets/logos/green-thumb.png";
import lvmhLogo from "../../assets/logos/lvmh.jpg";
import accentureLogo from "../../assets/logos/accenture.png";
import goldmanSachsLogo from "../../assets/logos/goldman-sachs.png";
import apolloLogo from "../../assets/logos/apollo.png";
import mastercardLogo from "../../assets/logos/mastercard.png";
import novoNordiskLogo from "../../assets/logos/novo-nordisk.png";
import eliLillyLogo from "../../assets/logos/eli-lilly.png";
import wasteManagementLogo from "../../assets/logos/waste-management.jpg";
import amazonLogo from "../../assets/logos/amazon.png";
import nvidiaLogo from "../../assets/logos/nvidia.png";
import appleLogo from "../../assets/logos/apple.png";

interface CommitteeInfo {
  name: "TMT" | "Contrarian" | "Financials" | "Consumer" | "Healthcare" | "Industrials & Energy";
  /** Full spelled-out name for the header — falls back to `name` when not set. */
  displayName?: string;
  tagline: string;
  description: string;
  activities: string[];
  head: { name: string; image?: string; major?: string };
}

const COMMITTEES: CommitteeInfo[] = [
  {
    name: "TMT",
    displayName: "Technology, Media & Telecom",
    tagline: "Sector coverage for Technology, Media & Telecom",
    head: { name: "Matt Rochford", image: mattRochford, major: "Finance and Economics" },
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
    head: { name: "Matthew Worthington", image: matthewWorthington, major: "Mechanical Engineering and Economics" },
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
    head: { name: "Phillip Gorokhovich", image: phillipGorokhovich, major: "Finance and Accounting" },
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
    head: { name: "Brian Wilk", image: brianWilk, major: "Finance and Accounting" },
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
    head: { name: "Zach Blincoe", image: zachBlincoe, major: "Finance and Economics" },
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
    head: { name: "Hartwell Forstman", image: hartwellForstman, major: "Finance and Accounting" },
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

function CommitteeHead({ name, image, major }: { name: string; image?: string; major?: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3 py-3 sm:w-48 sm:-translate-y-4 sm:translate-x-4">
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-36 w-36 rounded-full object-cover shadow-md ring-[6px] ring-crimson ring-offset-[3px] ring-offset-background sm:h-44 sm:w-44"
        />
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-border bg-crimson/10 text-muted-foreground shadow-md ring-[6px] ring-crimson ring-offset-[3px] ring-offset-background sm:h-44 sm:w-44">
          <User className="h-14 w-14 opacity-40" />
        </div>
      )}
      <div>
        <p className="text-center text-[1.6rem] font-semibold leading-tight text-foreground">{name}</p>
        {major && (
          <p className="mt-1 text-center text-[0.75rem] leading-tight text-muted-foreground">{major}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Full-resolution wordmark logos, served straight from Wikimedia Commons
 * (`Special:FilePath` rasterizes SVGs server-side at whatever width we ask
 * for, so they stay crisp — no pixelation like the old favicon-service
 * crops). A few firms don't have a usable Commons logo; those fall back to
 * Google's favicon service or the firm's own site icon instead.
 */
function commonsLogo(file: string, width = 500): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}
function faviconLogo(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
}

/** Top coverage/holdings companies per committee (from portfolio decisions). */
const COMMITTEE_HOLDINGS: Record<
  string,
  { ticker: string; name: string; logo: string; large?: boolean; bare?: boolean }[]
> = {
  TMT: [
    { ticker: "AMZN", name: "Amazon.com, Inc.", logo: amazonLogo },
    { ticker: "AAPL", name: "Apple Inc.", logo: appleLogo, large: true },
    { ticker: "UBER", name: "Uber Technologies, Inc.", logo: commonsLogo("Uber logo 2018.svg") },
    { ticker: "NVDA", name: "NVIDIA Corporation", logo: nvidiaLogo, large: true },
  ],
  Contrarian: [
    { ticker: "GTBIF", name: "Green Thumb Industries Inc.", logo: greenThumbLogo },
    { ticker: "ACN", name: "Accenture plc", logo: accentureLogo },
    { ticker: "UNH", name: "UnitedHealth Group Incorporated", logo: commonsLogo("UnitedHealth Group logo.svg") },
  ],
  Financials: [
    { ticker: "GS", name: "The Goldman Sachs Group, Inc.", logo: goldmanSachsLogo, large: true },
    { ticker: "APO", name: "Apollo Global Management, Inc.", logo: apolloLogo },
    { ticker: "MA", name: "Mastercard Incorporated", logo: mastercardLogo },
    { ticker: "UNM", name: "Unum Group", logo: commonsLogo("Unum Group logo.svg") },
  ],
  Consumer: [
    { ticker: "SG", name: "Sweetgreen, Inc.", logo: commonsLogo("Sweetgreen logo.svg") },
    { ticker: "CMG", name: "Chipotle Mexican Grill, Inc.", logo: chipotleLogo },
    { ticker: "MC", name: "LVMH Moët Hennessy Louis Vuitton", logo: lvmhLogo },
    { ticker: "ULTA", name: "Ulta Beauty, Inc.", logo: ultaBeautyLogo },
  ],
  Healthcare: [
    { ticker: "VRTX", name: "Vertex Pharmaceuticals", logo: commonsLogo("Vertex logo.svg") },
    { ticker: "LLY", name: "Eli Lilly and Company", logo: eliLillyLogo },
    { ticker: "NVO", name: "Novo Nordisk A/S", logo: novoNordiskLogo },
    { ticker: "ISRG", name: "Intuitive Surgical, Inc.", logo: commonsLogo("Intuitive Surgical logo.svg") },
    { ticker: "RDNT", name: "RadNet, Inc.", logo: faviconLogo("radnet.com") },
  ],
  "Industrials & Energy": [
    { ticker: "WM", name: "Waste Management, Inc.", logo: wasteManagementLogo },
    { ticker: "WMS", name: "Advanced Drainage Systems, Inc.", logo: commonsLogo("Advanced Drainage Systems logo.svg") },
    { ticker: "CVE", name: "Cenovus Energy Inc.", logo: commonsLogo("Cenovus logo.svg") },
    { ticker: "CCJ", name: "Cameco Corporation", logo: commonsLogo("Cameco Logo.svg") },
    { ticker: "VST", name: "Vistra Corp.", logo: commonsLogo("Vistra logo.svg") },
  ],
};

/** Tiny seeded PRNG (mulberry32) so the shuffle/float variation is stable across re-renders. */
function seededRandom(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
/** Deterministic per-committee shuffle — same order every render, different order than the source list. */
function shuffle<T>(arr: T[], seed: string): T[] {
  const rand = seededRandom(hashSeed(seed));
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Holding = {
  ticker: string;
  name: string;
  logo: string;
  large?: boolean;
  highest?: boolean;
  /** Logo image already has its own card/shadow baked in — skip the badge's border/ring so it's not double-framed. */
  bare?: boolean;
};
type SizeTier = "base" | "md" | "lg";

/** Badge height/padding/max-width per size tier, so committees can be scaled as a group.
 *  Padding and maxW are mobile-compact first (tight enough that two badges fit side by
 *  side in a card on a phone) then widen at sm+ to the original desktop sizing. */
const TIER_CLASSES: Record<SizeTier, { box: string; maxW: string }> = {
  base: { box: "h-16 px-2 py-1.5 sm:h-20 sm:px-4 sm:py-2", maxW: "max-w-[100px] sm:max-w-[180px]" },
  md: { box: "h-[4.5rem] px-2 py-1.5 sm:h-[5.5rem] sm:px-4 sm:py-2", maxW: "max-w-[100px] sm:max-w-[200px]" },
  lg: { box: "h-20 px-2 py-1.5 sm:h-24 sm:px-5 sm:py-3", maxW: "max-w-[100px] sm:max-w-[220px]" },
};

/** One logo badge: static `offsetY` (px) for layout placement. */
function LogoBadge({
  h,
  offsetY = 0,
  tier = "base",
}: {
  h: Holding;
  offsetY?: number;
  tier?: SizeTier;
}) {
  // Goldman/NVIDIA/Apple's extra "large" flag bumps the badge a size class further, whatever tier it's in.
  const { box, maxW } = h.large
    ? { box: "h-24 px-3 py-2 sm:h-28 sm:px-6 sm:py-3", maxW: "max-w-[110px] sm:max-w-[260px]" }
    : TIER_CLASSES[tier];
  // Bare logos already have their own card/shadow baked into the image — no border/ring/shadow, so it isn't double-framed.
  const frame = h.bare
    ? "bg-transparent"
    : "border border-border bg-gradient-to-b from-white to-neutral-50 ring-1 ring-black/5 shadow-md hover:shadow-lg";
  return (
    <div style={offsetY ? { transform: `translateY(${offsetY}px)` } : undefined}>
      <div
        className={`relative flex items-center justify-center rounded-xl transition-transform duration-base ease-smooth hover:-translate-y-1 ${frame} ${box}`}
        title={h.name}
      >
        {h.highest && (
          <div
            title="Highest market cap"
            className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-crimson text-white shadow-sm ring-2 ring-white"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </div>
        )}
        {/* Full wordmark, unscaled to a square crop — width follows the logo's own aspect ratio. */}
        <img src={h.logo} alt={h.name} className={`h-full w-auto object-contain ${maxW}`} />
      </div>
    </div>
  );
}

/** TMT stays the baseline; the rest are bumped up so no committee's logo row looks undersized next to it. */
function sizeTierFor(committee: string): SizeTier {
  if (committee === "Industrials & Energy") return "md";
  if (committee === "TMT") return "base";
  return "lg";
}

function CommitteeLogos({ committee }: { committee: string }) {
  const holdings = COMMITTEE_HOLDINGS[committee]?.slice(0, 5) ?? [];
  if (holdings.length === 0) {
    return (
      <div className="flex flex-1 flex-wrap items-center justify-center gap-5 sm:justify-start">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground sm:h-24 sm:w-24"
          >
            <Image className="h-6 w-6 opacity-40" />
          </div>
        ))}
      </div>
    );
  }
  // Mark the highest-market-cap name (the list's original first entry) before shuffling display order.
  const tagged = holdings.map((h, i) => ({ ...h, highest: i === 0 }));
  const shuffled = shuffle(tagged, committee);
  const tier = sizeTierFor(committee);

  // 4 holdings (TMT, Financials, Consumer) — even 2x2 grid, centered as a tight group.
  // Badges are sized mobile-compact (see TIER_CLASSES) so the 2 columns fit a phone card.
  if (shuffled.length === 4) {
    return (
      <div className="flex flex-1 justify-center">
        <div className="grid w-fit grid-cols-2 justify-items-center gap-3 sm:gap-5">
          {shuffled.map((h) => (
            <LogoBadge key={h.ticker} h={h} tier={tier} />
          ))}
        </div>
      </div>
    );
  }

  // 3 holdings (Contrarian) — two on top, one centered underneath. Rows wrap on
  // narrow screens instead of forcing a fixed-width row wider than the viewport.
  if (shuffled.length === 3) {
    return (
      <div className="flex w-full flex-1 flex-col items-center gap-6 sm:gap-8">
        <div className="flex flex-wrap justify-center gap-4 sm:flex-nowrap sm:gap-8">
          <LogoBadge h={shuffled[0]} tier={tier} />
          <LogoBadge h={shuffled[1]} tier={tier} />
        </div>
        <LogoBadge h={shuffled[2]} tier={tier} />
      </div>
    );
  }

  // 5 holdings (Healthcare, Industrials & Energy). Two different layouts by breakpoint:
  // - Mobile: one sequential flex-wrap (2-per-row), so whichever pair the shuffle placed
  //   next to each other (e.g. Cameco/ADS, Novo/Lilly) actually renders side by side —
  //   the sm+ two-row split below breaks that adjacency across the row boundary.
  // - sm+: three on top (Industrials sags its middle logo lower), two staggered underneath.
  if (shuffled.length === 5) {
    const isIndustrials = committee === "Industrials & Energy";
    const rowGap = isIndustrials ? "gap-8" : "gap-5";
    return (
      <>
        <div className="flex w-full flex-1 flex-wrap items-center justify-center gap-3 sm:hidden">
          {shuffled.map((h) => (
            <LogoBadge key={h.ticker} h={h} tier={tier} />
          ))}
        </div>
        <div className="hidden w-full flex-1 flex-col items-center gap-10 sm:flex">
          <div className={`flex ${rowGap}`}>
            <LogoBadge h={shuffled[0]} tier={tier} />
            <LogoBadge h={shuffled[1]} tier={tier} offsetY={isIndustrials ? 24 : 0} />
            <LogoBadge h={shuffled[2]} tier={tier} />
          </div>
          <div className={`flex ${rowGap}`}>
            <LogoBadge h={shuffled[3]} tier={tier} />
            <LogoBadge h={shuffled[4]} tier={tier} />
          </div>
        </div>
      </>
    );
  }

  // Fallback for any other count — free-flowing wrap.
  return (
    <div className="flex w-full flex-1 flex-wrap items-center justify-center gap-6 sm:justify-between">
      {shuffled.map((h) => (
        <LogoBadge key={h.ticker} h={h} tier={tier} />
      ))}
    </div>
  );
}

export default function CommitteesPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-br from-crimson-dark to-crimson px-6 py-14 text-center text-white">
        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">Committees</h1>
      </section>

      {/* Committee cards */}
      <section className="max-w-5xl mx-auto w-full py-14 px-6 space-y-6">
        {COMMITTEES.map((c) => (
          <Card key={c.name} className="relative bg-gradient-to-br from-card to-muted/20 shadow-sm">
            <CardHeader className="items-center pb-4 pt-8 text-center">
              <CardTitle
                className={`font-bold tracking-tight md:text-4xl ${
                  ["Contrarian", "Financials", "Consumer", "Healthcare"].includes(c.name)
                    ? "text-4xl"
                    : "text-3xl"
                }`}
              >
                {c.displayName ?? c.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
                <CommitteeHead name={c.head.name} image={c.head.image} major={c.head.major} />
                <CommitteeLogos committee={c.name} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
