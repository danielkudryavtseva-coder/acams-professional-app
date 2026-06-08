import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { sortNewsPosts, useNews } from "../context/NewsContext";
import {
  NewsFeaturedCard,
  NewsLatestListItem,
} from "../components/NewsBlogLayout";
import { LandingPortfolioMiniChart } from "../components/LandingPortfolioMiniChart";
import { usePortfolioLiveData } from "../hooks/usePortfolioLiveData";
import { usePortfolioMarkToMarket } from "../hooks/usePortfolioMarkToMarket";
import {
  buildMonthlyPortfolioTrend,
  sharpeAnnualizedFromMonthlyValues,
  ytdStartFromHistory,
} from "../lib/portfolioLiveSeries";
import campbellWatts from "../../assets/execs/campbell-watts.jpg";
import bradyBelden from "../../assets/execs/brady-belden.jpg";
import chrisRinaldi from "../../assets/execs/chris-rinaldi.jpg";
import corbinPurdum from "../../assets/execs/corbin-purdum.jpg";
import jakeKroner from "../../assets/execs/jake-kroner.jpg";
import ceciliaCordell from "../../assets/execs/cecilia-cordell.jpg";
import cadeAndrews from "../../assets/execs/cade-andrews.jpg";
import quinnRinke from "../../assets/execs/quinn-rinke.png";
import landingHero from "../../assets/landing-hero.png";

interface Executive {
  name: string;
  title: string;
  bio: string;
  image: string;
}

const EXECUTIVES: Executive[] = [
  {
    name: "Campbell Watts",
    title: "President",
    image: campbellWatts,
    bio:
      "Senior from Marietta, GA studying Management Information Systems in the Accelerated Master's Program. " +
      "Spent this past summer as a Consulting Intern for 84.51° in Cincinnati, OH. " +
      "Outside of school, Campbell works at the Rec Center on campus and plays basketball with friends.",
  },
  {
    name: "Brady Belden",
    title: "Vice President",
    image: bradyBelden,
    bio:
      "Sophomore from San Antonio, TX studying Finance and Economics with a minor in Value Investing. " +
      "Spent this past summer as an Investment Banking intern for Young American Capital in Mamaroneck, NY. " +
      "Outside of school, Brady enjoys weightlifting, bass fishing, and sports card collecting/trading.",
  },
  {
    name: "Chris Rinaldi",
    title: "Portfolio Manager",
    image: chrisRinaldi,
    bio:
      "Senior from Denver, CO studying Finance and Accounting with a minor in Value Investing. " +
      "Will be interning this summer with J.P. Morgan in the firm's Asset Management segment in Columbus. " +
      "Member of the UA M&A Group, Alpha Kappa Lambda, and Bama Catholic; concurrently a TMT analyst at Young America Capital. " +
      "In his free time, Chris enjoys producing music, fishing, and golfing.",
  },
  {
    name: "Corbin Purdum",
    title: "Director of New Member Education",
    image: corbinPurdum,
    bio:
      "Senior from Littleton, CO studying Finance and Accounting. " +
      "After graduation, Corbin plans to pursue a career in investment management. " +
      "Involved in Sigma Phi Epsilon and Campus Outreach ministry; in his free time he trains in Brazilian Jiu-Jitsu and plays the drums.",
  },
  {
    name: "Jake Kroner",
    title: "Director of Recruitment",
    image: jakeKroner,
    bio:
      "Junior from Chicago, IL majoring in Finance and Accounting with a minor in Value Investing. " +
      "Last summer, Jake interned with Timber Hill Group in Chicago as a Private Equity Real Estate Analyst. " +
      "Member of Sigma Phi Epsilon, M&A Group, and served in the Interfraternity Council. In his free time, Jake enjoys golf and python hunting.",
  },
  {
    name: "Cecilia Cordell",
    title: "Co-Director of Member Development",
    image: ceciliaCordell,
    bio:
      "Senior from Atlanta, GA studying Finance, Economics, and Math, on the AMP track for a Master's in Quantitative Economics. " +
      "Completed an internship with JP Morgan Equity Research in NYC and is joining full-time upon graduation. " +
      "Involved with the Faculty Scholars Program, Manderson Specialized Masters Association, and serves as a Research Ambassador. " +
      "In her free time, Cecilia enjoys baking and playing instruments.",
  },
  {
    name: "Cade Andrews",
    title: "Co-Director of Member Development",
    image: cadeAndrews,
    bio:
      "Junior from Scottsdale, AZ studying Finance and Economics. " +
      "This upcoming summer, he will be interning as an Investment Analyst at Hood River Capital Management in West Palm Beach. " +
      "Member of Pi Kappa Alpha; enjoys running, lifting, reading, and cooking in his free time.",
  },
  {
    name: "Quinn Rinke",
    title: "Director of Media",
    image: quinnRinke,
    bio:
      "Junior from Cleveland, OH studying Finance and Economics with double minors in Value Investing and Liberal Arts. " +
      "Spent her summer as a Finance Intern for MRP Solutions in Plattsburgh, NY. " +
      "VP of Finance for Delta Sigma Pi and a member of Women Talk Wealth. In her free time, Quinn enjoys reading and playing piano.",
  },
];

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border/90 bg-card px-4 py-4 text-center shadow-soft ring-1 ring-border/35 transition-shadow duration-base ease-smooth hover:shadow-elevated md:px-5 md:py-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-crimson">
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-semibold tabular md:text-3xl">
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs leading-snug text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}

interface ExecCardProps {
  name: string;
  title: string;
  image?: string;
  bio?: string;
}

function ExecCard({ name, title, image, bio }: ExecCardProps) {
  const [expanded, setExpanded] = useState(false);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("");

  let firstSentence = bio ?? "";
  let rest = "";
  if (bio) {
    const match = bio.match(/^(.*?[.!?])\s+(.*)$/s);
    if (match) {
      firstSentence = match[1];
      rest = match[2];
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="h-[10.5rem] w-[10.5rem] overflow-hidden rounded-full bg-crimson/15 ring-[6px] ring-crimson ring-offset-[3px] ring-offset-background">
        {image ? (
          <img
            src={image}
            alt={`${name} headshot`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl font-semibold text-muted-foreground">
            {initials}
          </div>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{name}</h3>
      <p className="text-sm text-crimson">{title}</p>
      {firstSentence && (
        <p className="mt-2 max-w-[18rem] text-xs leading-relaxed text-muted-foreground">
          {firstSentence}
          {expanded && rest && <> {rest}</>}
        </p>
      )}
      {rest && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-md text-xs font-medium text-crimson underline-offset-2 transition-colors duration-base ease-smooth hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {expanded ? "Show less" : "Show more"}
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-base ease-smooth ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

const HERO_PARALLAX_MAX_PX = 24;
const HERO_PARALLAX_MIN_PX = 8;

function formatAumUsd(totalValue: number): string {
  if (totalValue >= 1_000_000) return `$${(totalValue / 1_000_000).toFixed(2)}M`;
  return `$${(totalValue / 1000).toFixed(1)}K`;
}

export default function Landing() {
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroBackgroundImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;
    let scrollListening = false;

    const applyParallax = () => {
      rafId = 0;
      const section = heroSectionRef.current;
      const img = heroBackgroundImgRef.current;
      if (!section || !img) return;

      if (mq.matches) {
        img.style.transform = "";
        img.style.removeProperty("will-change");
        return;
      }

      const h = section.offsetHeight || window.innerHeight;
      const maxPx = Math.min(
        HERO_PARALLAX_MAX_PX,
        Math.max(HERO_PARALLAX_MIN_PX, Math.round(h * 0.015)),
      );
      const progress = Math.min(1, window.scrollY / h);
      const translateY = -progress * maxPx;
      img.style.transform = `translate3d(0, ${translateY}px, 0)`;
      img.style.setProperty("will-change", "transform");
    };

    const onScrollOrResize = () => {
      if (rafId !== 0) return;
      rafId = requestAnimationFrame(applyParallax);
    };

    const startScroll = () => {
      if (scrollListening) return;
      applyParallax();
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize, { passive: true });
      scrollListening = true;
    };

    const stopScroll = () => {
      if (!scrollListening) return;
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      scrollListening = false;
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      const img = heroBackgroundImgRef.current;
      if (img) {
        img.style.transform = "";
        img.style.removeProperty("will-change");
      }
    };

    const syncMotionPreference = () => {
      if (mq.matches) {
        stopScroll();
      } else {
        startScroll();
      }
    };

    syncMotionPreference();
    mq.addEventListener("change", syncMotionPreference);

    return () => {
      mq.removeEventListener("change", syncMotionPreference);
      stopScroll();
    };
  }, []);

  const { posts } = useNews();
  const landingNews = useMemo(() => sortNewsPosts(posts).slice(0, 5), [posts]);
  const landingFeatured = landingNews[0];
  const landingRest = landingNews.slice(1, 5);

  const { quotes, history } = usePortfolioLiveData();
  const {
    liveHoldings,
    bondValue,
    fundValue,
    totalValue,
    totalReturnPct,
  } = usePortfolioMarkToMarket(quotes);
  const bondAndFundMarketValue = bondValue + fundValue;
  const ytdStart = useMemo(
    () => ytdStartFromHistory(liveHoldings, history),
    [liveHoldings, history],
  );
  const ytdReturnFrac =
    ytdStart != null && ytdStart > 0 ? (totalValue - ytdStart) / ytdStart : null;
  const ytdPct = ytdReturnFrac != null ? ytdReturnFrac * 100 : null;
  const ytdValueStr =
    ytdPct != null
      ? `${ytdPct >= 0 ? "+" : ""}${ytdPct.toFixed(2)}%`
      : `${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct.toFixed(2)}%`;
  const ytdSub =
    ytdPct != null
      ? "Calendar YTD — same marks as portfolio"
      : "All-time return (add FMP history for calendar YTD)";

  const liveMonthly = useMemo(
    () => buildMonthlyPortfolioTrend(liveHoldings, history, 12, bondAndFundMarketValue),
    [liveHoldings, history, bondAndFundMarketValue],
  );
  const sharpe = useMemo(
    () =>
      liveMonthly.length > 0
        ? sharpeAnnualizedFromMonthlyValues(liveMonthly.map((p) => p.value))
        : null,
    [liveMonthly],
  );
  const sharpeValueStr = sharpe != null ? sharpe.toFixed(1) : "—";
  const sharpeSub =
    sharpe != null
      ? "From live monthly portfolio values (12m)"
      : "Needs live price history (FMP)";

  return (
    <>
      {/* Hero — full-bleed photo under CAMS crimson veil + vignette for readable white copy */}
      <section
        ref={heroSectionRef}
        className="relative isolate min-h-[20rem] overflow-hidden bg-[var(--crimson-darker)] text-white sm:min-h-[24rem] md:min-h-[28rem]"
      >
        <div className="absolute inset-0">
          <img
            ref={heroBackgroundImgRef}
            src={landingHero}
            alt=""
            width={1600}
            height={900}
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover object-[center_48%]"
            aria-hidden
          />
        </div>
        <div
          className="landing-hero-photo-overlay pointer-events-none absolute inset-0"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.42)_0%,transparent_38%,transparent_72%,rgba(0,0,0,0.28)_100%)] md:bg-[linear-gradient(to_right,rgba(0,0,0,0.38)_0%,transparent_55%)]"
          aria-hidden
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="white"
            strokeWidth="2"
            points="0,300 100,260 200,280 300,210 400,230 500,170 600,200 700,140 800,180 900,110 1000,150 1100,80 1200,120"
          />
        </svg>
        <div className="relative z-10 mx-auto flex max-w-content flex-col justify-end px-6 pb-14 pt-28 sm:justify-center sm:pb-20 sm:pt-20 md:min-h-[28rem] md:py-24 lg:py-32">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight drop-shadow-[0_2px_28px_rgba(0,0,0,0.5)] md:text-6xl">
            Capstone Asset Management Society
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white [text-shadow:0_1px_22px_rgba(0,0,0,0.55)] md:text-xl">
            Cultivating future leaders in finance through real-world asset
            management, investment research, and recruiting support at The
            University of Alabama.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/portfolio"
              className="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-crimson shadow-hero transition-[box-shadow,background-color,color] duration-base ease-smooth hover:bg-paper hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-crimson"
            >
              Explore Our Portfolio
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md border border-white/80 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-soft backdrop-blur-[2px] transition-[background-color,border-color,box-shadow] duration-base ease-smooth hover:border-white hover:bg-white/12 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-crimson"
            >
              Learn About Membership
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio Performance & Insights */}
      <section className="border-y border-border/60 bg-paper py-12 md:py-14 dark:border-border dark:bg-card">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-foreground">
            Portfolio Performance &amp; Insights
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            A snapshot of what CAMS is managing right now.
          </p>
          <div className="mt-6 flex flex-col items-center gap-6 md:gap-8">
            <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              <StatCard
                label="AUM"
                value={formatAumUsd(totalValue)}
                sub="Live mark-to-market (equities + FI + funds)"
              />
              <StatCard
                label="YTD Return"
                value={ytdValueStr}
                sub={ytdSub}
              />
              <StatCard
                label="Sharpe Ratio"
                value={sharpeValueStr}
                sub={sharpeSub}
              />
            </div>
            <div className="w-full max-w-2xl">
              <LandingPortfolioMiniChart />
            </div>
            <div className="text-center">
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium text-crimson underline-offset-4 transition-colors duration-base ease-smooth hover:underline"
              >
                View live portfolio details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Executives */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Meet the <span className="text-crimson">Executives</span>
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Student leaders driving research, portfolio strategy, and member
            development.
          </p>
          <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {EXECUTIVES.map((e) => (
              <ExecCard key={e.name} {...e} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/roster"
              className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-crimson underline-offset-4 transition-colors duration-base ease-smooth hover:underline"
            >
              See the full society roster
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Society News */}
      <section className="border-y border-border/60 bg-paper py-16 dark:border-border dark:bg-card">
        <div className="mx-auto max-w-content px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Latest Society News
            </h2>
            <Link
              to="/news"
              className="hidden rounded-md text-sm font-medium text-crimson underline-offset-4 transition-colors duration-base ease-smooth hover:underline sm:inline-flex"
            >
              All news &rarr;
            </Link>
          </div>
          {landingFeatured ? (
            <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:items-start">
              <div className="lg:col-span-2">
                <NewsFeaturedCard post={landingFeatured} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
                  Latest post
                </h3>
                {landingRest.length > 0 ? (
                  <ul className="mt-4 space-y-1 border-t border-border/60 pt-2">
                    {landingRest.map((p) => (
                      <NewsLatestListItem key={p.id} post={p} />
                    ))}
                  </ul>
                ) : null}
                <Link
                  to="/news"
                  className="mt-6 inline-flex rounded-md text-sm font-medium text-crimson underline-offset-4 transition-colors duration-base ease-smooth hover:underline sm:hidden"
                >
                  All news &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Check back soon for society updates.
            </p>
          )}
        </div>
      </section>

      {/* Member CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-content px-6">
          <div className="rounded-lg border border-border/90 bg-card p-8 text-center shadow-elevated ring-1 ring-border/40 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-crimson">
              For CAMS members
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Track recruiting, contacts, pipeline, and pitches in one place.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Members get access to the full CAMS workspace — recruiting
              programs, contact CRM, deal pipeline, alumni rolodex, events, and
              exec tools.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/apply"
                className="inline-flex items-center justify-center rounded-md bg-crimson px-5 py-3 text-sm font-semibold text-white shadow-soft transition-[background-color,box-shadow] duration-base ease-smooth hover:bg-crimson-dark hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Apply
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold shadow-xs transition-[background-color,box-shadow,border-color] duration-base ease-smooth hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
