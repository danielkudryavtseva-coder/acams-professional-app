import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NewsPost } from "../data/mockData";
import { NEWS_CATEGORY_LABELS } from "../data/mockData";
import { getNewsExcerpt } from "../context/NewsContext";
import {
  estimateReadMinutes,
  formatNewsShortDate,
  getNewsCoverSrc,
} from "../lib/newsDisplay";
import { cn } from "./ui/utils";

export function NewsCategoryPill({
  category,
  className,
  variant = "dark",
}: {
  category: NewsPost["category"];
  className?: string;
  /** `dark` = white pill on image overlay; `light` = on gray card */
  variant?: "dark" | "light";
}) {
  const label = NEWS_CATEGORY_LABELS[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        variant === "dark"
          ? "bg-white/95 text-foreground shadow-sm dark:bg-white/90"
          : "bg-background/80 text-earth dark:bg-background/60",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-earth" aria-hidden />
      {label}
    </span>
  );
}

export function NewsFeaturedCard({ post }: { post: NewsPost }) {
  const readMin = estimateReadMinutes(post.body);
  const meta = `${formatNewsShortDate(post.publishedAt)} \u2022 ${readMin} min read`;

  return (
    <article className="group relative isolate min-h-[14rem] overflow-hidden rounded-[1.25rem] shadow-soft ring-1 ring-border/40 md:min-h-[18rem] md:rounded-3xl">
      <img
        src={getNewsCoverSrc(post.id, 1200, 750)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-base ease-smooth group-hover:scale-[1.02]"
        loading="lazy"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[42%] backdrop-blur-[6px]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to top, black 55%, transparent 100%)",
          maskImage: "linear-gradient(to top, black 55%, transparent 100%)",
        }}
        aria-hidden
      />
      <Link
        to={`/news/${post.id}`}
        className="relative z-10 flex h-full min-h-[inherit] flex-col justify-end p-5 md:p-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          {post.pinned && (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              Pinned
            </span>
          )}
          <NewsCategoryPill category={post.category} />
        </div>
        <h2 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight text-white md:text-2xl lg:text-3xl">
          {post.title}
        </h2>
        <p className="mt-2 text-sm text-white/85">{meta}</p>
      </Link>
    </article>
  );
}

export function NewsLatestListItem({ post }: { post: NewsPost }) {
  const readMin = estimateReadMinutes(post.body);
  const meta = `${formatNewsShortDate(post.publishedAt)} \u2022 ${readMin} min read`;

  return (
    <li>
      <Link
        to={`/news/${post.id}`}
        className="flex gap-3 rounded-[1.25rem] p-2 pr-3 transition-colors duration-base ease-smooth hover:bg-muted/70 dark:hover:bg-muted/20"
      >
        <img
          src={getNewsCoverSrc(`${post.id}-list`, 200, 200)}
          alt=""
          className="h-[4.25rem] w-[4.25rem] shrink-0 rounded-2xl object-cover shadow-xs ring-1 ring-border/30"
          loading="lazy"
        />
        <div className="min-w-0 flex-1 py-0.5">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {post.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
        </div>
      </Link>
    </li>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function NewsFoundersCarousel({
  posts,
  title = "Founders corner",
  excludePostId,
}: {
  posts: NewsPost[];
  title?: string;
  /** Featured post on the current page — omit from carousel to reduce duplication. */
  excludePostId?: string;
}) {
  const pool = React.useMemo(() => {
    if (!excludePostId) {
      return posts;
    }
    return posts.filter((p) => p.id !== excludePostId);
  }, [posts, excludePostId]);

  const slides = React.useMemo(() => chunk(pool, 3), [pool]);
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    setSlide((s) => (slides.length === 0 ? 0 : Math.min(s, slides.length - 1)));
  }, [slides.length]);

  const current = slides[slide] ?? [];
  const canPrev = slide > 0;
  const canNext = slide < slides.length - 1;

  if (pool.length === 0) {
    return null;
  }

  const go = (dir: -1 | 1) => {
    setSlide((s) => {
      const next = s + dir;
      if (next < 0 || next >= slides.length) return s;
      return next;
    });
  };

  return (
    <section className="mt-12 md:mt-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label="Previous posts"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs transition-[opacity,background-color] duration-base ease-smooth hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-35",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label="Next posts"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-xs transition-[opacity,background-color] duration-base ease-smooth hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-35",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {current.map((post) => (
          <NewsArticleExcerptCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

export function NewsArticleExcerptCard({ post }: { post: NewsPost }) {
  const readMin = estimateReadMinutes(post.body);
  const meta = `${formatNewsShortDate(post.publishedAt)} \u2022 ${readMin} min read`;
  const excerpt = getNewsExcerpt(post);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-muted/50 shadow-xs ring-1 ring-border/35 dark:bg-muted/25 md:rounded-3xl">
      <Link to={`/news/${post.id}`} className="block shrink-0">
        <img
          src={getNewsCoverSrc(`${post.id}-founders`, 640, 360)}
          alt=""
          className="aspect-[16/10] w-full object-cover"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-earth" aria-hidden />
          <span className="text-xs font-medium text-earth">
            {NEWS_CATEGORY_LABELS[post.category]}
          </span>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
          <Link
            to={`/news/${post.id}`}
            className="transition-colors duration-base ease-smooth hover:text-crimson"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {excerpt}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">{meta}</p>
      </div>
    </article>
  );
}

export function NewsPaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-1 md:gap-2"
      aria-label="News pagination"
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-opacity duration-base ease-smooth hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="mx-1 flex flex-wrap items-center justify-center gap-1 sm:mx-4 sm:gap-2">
        {pages.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPageChange(i)}
            aria-label={`Page ${i + 1}`}
            aria-current={i === page ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-2.5 text-sm font-medium tabular-nums transition-colors duration-base ease-smooth",
              i === page
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-label="Next page"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-opacity duration-base ease-smooth hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
