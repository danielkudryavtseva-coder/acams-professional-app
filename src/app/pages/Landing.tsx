import { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { APPLY_URL } from "../components/PublicShell";
import bradyBelden from "../../assets/execs/brady-belden.png";
import cadeAndrews from "../../assets/execs/cade-andrews.png";
import alexWylie from "../../assets/execs/alex-wylie.png";
import lukeLacke from "../../assets/execs/luke-lacke.png";
import fordAlderice from "../../assets/execs/ford-alderice.png";
import matthewWorthington from "../../assets/execs/matthew-worthington.png";
import williamHessler from "../../assets/execs/william-hessler.png";
import mattRochford from "../../assets/execs/matt-rochford.png";
import lucyPetrus from "../../assets/execs/lucy-petrus.png";
import landingHero from "../../assets/landing-hero-mansion.jpg";

interface Executive {
  name: string;
  title: string;
  bio?: string;
  image?: string;
  /**
   * CSS transform (translate% + scale, centered) that lands this exact face at the
   * container's center at a consistent size. Computed offline per-photo — see
   * scripts/headshot-crop notes in git history — by measuring each subject's actual
   * face position/size in their source photo (photos aren't shot at the same distance
   * or framing), rather than guessed. Defaults to no transform when omitted.
   */
  imageTransform?: string;
}

// All 9 headshots are pre-cropped/centered identically in Photoshop, so a single flat
// zoom factor (no per-photo position tweaking needed) applies evenly to all of them.
const HEADSHOT_ZOOM = "translate(0%, 10%) scale(1.7875)";

const EXECUTIVES: Executive[] = [
  {
    name: "Alex Wylie",
    title: "President",
    image: alexWylie,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "Luke Lacke",
    title: "Vice President",
    image: lukeLacke,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "Matthew Worthington",
    title: "Portfolio Manager",
    image: matthewWorthington,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "William Hessler",
    title: "Director of New Member Education",
    image: williamHessler,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "Ford Alderdice",
    title: "Director of Recruitment",
    image: fordAlderice,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "Matt Rochford",
    title: "Co-Director of Professional Development",
    image: mattRochford,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "Brady Belden",
    title: "Co-Director of Professional Development",
    image: bradyBelden,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "Cade Andrews",
    title: "Co-Director of Professional Development",
    image: cadeAndrews,
    imageTransform: HEADSHOT_ZOOM,
  },
  {
    name: "Lucy Petrus",
    title: "Director of Media",
    image: lucyPetrus,
    imageTransform: HEADSHOT_ZOOM,
  },
];

const PILLARS = [
  {
    title: "Investment Management",
    body: "Members manage a real-money portfolio, conducting equity research and presenting investment pitches to the full committee each semester.",
  },
  {
    title: "Recruiting Support",
    body: "We host firm info sessions, mock interviews, and resume workshops — and provide direct introductions to CAMS alumni at top institutions.",
  },
  {
    title: "Professional Development",
    body: "Weekly meetings, guest speakers from Wall Street, and case competitions build the technical and soft skills firms actually look for.",
  },
  {
    title: "Alumni Network",
    body: "Our alumni are placed at Goldman Sachs, BlackRock, J.P. Morgan, and beyond. Active mentorship connects current members with those paths.",
  },
];

interface ExecCardProps {
  name: string;
  title: string;
  image?: string;
  bio?: string;
  imageTransform?: string;
}

function ExecCard({ name, title, image, bio, imageTransform }: ExecCardProps) {
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
      <div className="h-[14rem] w-[14rem] overflow-hidden rounded-full bg-crimson/15 ring-[6px] ring-crimson ring-offset-[3px] ring-offset-background">
        {image ? (
          <img
            src={image}
            alt={`${name} headshot`}
            className="h-full w-full object-cover"
            style={{ transform: imageTransform }}
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

export default function Landing() {
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroBackgroundImgRef = useRef<HTMLImageElement>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [heroDescOpen, setHeroDescOpen] = useState(false);

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

  return (
    <>
      {/* Hero — full-bleed photo under CAMS crimson veil + vignette for readable white copy */}
      <section
        ref={heroSectionRef}
        className="relative isolate min-h-[27rem] overflow-hidden bg-[var(--crimson-darker)] text-white sm:flex sm:min-h-[32rem] sm:flex-col sm:justify-center md:min-h-[38rem]"
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
            className="h-full w-full object-cover object-[center_40%]"
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
        <div className="absolute inset-0 z-10 mx-auto flex max-w-content flex-col items-center justify-center px-6 text-center sm:items-start sm:justify-center sm:py-24 sm:text-left md:min-h-[28rem] md:py-24 lg:py-32">
          <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 flex-col items-center sm:static sm:inset-auto sm:translate-y-0 sm:items-start">
            <h1 className="mt-0 max-w-3xl font-display text-4xl font-semibold uppercase leading-[1.1] tracking-tight drop-shadow-[0_2px_28px_rgba(0,0,0,0.5)] sm:mt-0 md:text-6xl">
              <span className="block">Capstone Asset</span>
              <span className="block">Management Society</span>
            </h1>
            <button
              type="button"
              onClick={() => setHeroDescOpen((v) => !v)}
              aria-expanded={heroDescOpen}
              className="mt-4 flex items-center gap-1.5 text-sm font-medium text-white/90 sm:hidden"
            >
              {heroDescOpen ? "Hide details" : "Learn more"}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-base ease-smooth ${heroDescOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid overflow-hidden transition-all duration-base ease-smooth sm:!grid-rows-[1fr] sm:!opacity-100 ${
                heroDescOpen ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0">
                <p className="max-w-2xl text-lg leading-relaxed text-white [text-shadow:0_1px_22px_rgba(0,0,0,0.55)] sm:mt-5 md:text-xl">
                  Cultivating future leaders in finance through real-world asset
                  management, investment research, and recruiting support at The
                  University of Alabama.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-6 bottom-14 flex flex-wrap justify-center gap-3 sm:static sm:inset-auto sm:mt-8 sm:w-auto sm:justify-start">
            {/* Mobile: single big pill Apply button */}
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 w-full items-center justify-center rounded-full bg-white px-5 text-xl font-semibold text-crimson shadow-hero transition-[box-shadow,background-color,color] duration-base ease-smooth hover:bg-paper hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-crimson sm:hidden"
            >
              Apply
            </a>

            {/* Desktop/tablet CTA */}
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center justify-center rounded-md bg-white px-[35px] py-[21px] text-[24.5px] font-semibold text-crimson shadow-hero transition-[box-shadow,background-color,color] duration-base ease-smooth hover:bg-paper hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-crimson sm:inline-flex"
            >
              Apply
            </a>
          </div>
        </div>
      </section>

      {/* Mission & What We Do — collapsed accordion by default on all breakpoints */}
      <section className="border-y border-border/60 bg-paper pb-4 pt-6 dark:border-border dark:bg-card md:py-8">
        <div className="mx-auto max-w-content px-6">
          <button
            type="button"
            onClick={() => setMissionOpen((v) => !v)}
            aria-expanded={missionOpen}
            className="flex w-full items-center justify-center gap-3"
          >
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
              Mission &amp; What We Do
            </h2>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-base ease-smooth ${missionOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className={`grid overflow-hidden transition-all duration-base ease-smooth ${
              missionOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground md:mt-3 md:max-w-3xl md:text-base">
                The Capstone Asset Management Society (CAMS) is a student-led
                organization dedicated to helping members grow their
                knowledge of investing and prepare for successful careers in
                finance. We offer a multitude of resources to assist
                committed and eager students in learning the principles of
                value investing and market analysis. CAMS is open to all
                students, regardless of grade level or prior experience, and
                is focused on helping members secure internships and careers
                in the financial services industry through networking
                opportunities, member education seminars, and career
                development workshops.
              </p>
              <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 md:mt-6 md:grid-cols-4 md:gap-x-6">
                {PILLARS.map(({ title, body }) => (
                  <div key={title} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" />
                    <p className="text-sm leading-snug text-muted-foreground">
                      <span className="font-semibold text-foreground">{title}.</span> {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Executives */}
      <section className="pb-16 pt-8 md:py-20">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Meet the <span className="text-crimson">Executives</span>
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Student leaders driving research, portfolio strategy, and member
            development.
          </p>
          <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {EXECUTIVES.map((e) => (
              <ExecCard key={e.name} {...e} />
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
