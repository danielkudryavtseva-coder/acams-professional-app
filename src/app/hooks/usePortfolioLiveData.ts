import * as React from "react";
import {
  fetchHistory,
  fetchQuotes,
  RateLimitError,
  type FmpHistorySeries,
  type FmpQuote,
} from "../lib/fmp";
import {
  FMP_SYMBOL_OVERRIDES,
  PORTFOLIO_HOLDINGS,
} from "../data/portfolioHoldings";

export type LiveStatus =
  | "idle"
  | "loading"
  | "live"
  | "stale"
  | "rate_limited"
  | "error";

export interface PortfolioLiveData {
  /** Map of holding ticker (NOT FMP symbol) -> quote. */
  quotes: Record<string, FmpQuote>;
  /** Map of holding ticker -> historical series (sorted oldest -> newest). */
  history: Record<string, FmpHistorySeries>;
  status: LiveStatus;
  lastUpdated: Date | null;
  error: string | null;
  refresh: () => void;
}

// Free-tier daily quota is ~250 calls. Each holding is 1 call per fetch
// (no batching), so we cache aggressively. Quotes are 15-min delayed
// upstream so a 10-min cache is effectively transparent.
const QUOTE_CACHE_TTL_MS = 10 * 60_000;
const HISTORY_CACHE_TTL_MS = 6 * 60 * 60_000;
// Auto-refresh slowest of the two TTLs so background ticks don't burn
// the daily quota while the user is just leaving the tab open.
const AUTO_REFRESH_INTERVAL_MS = QUOTE_CACHE_TTL_MS;

const QUOTES_CACHE_KEY = "cams.portfolio.quotes.v2";
const HISTORY_CACHE_KEY = "cams.portfolio.history.v2";
const RATE_LIMIT_KEY = "cams.portfolio.fmp.rateLimitedUntil";

interface CacheEnvelope<T> {
  ts: number;
  data: T;
}

function readCache<T>(key: string): CacheEnvelope<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Quota exceeded or storage disabled — fail silently.
  }
}

function readRateLimitedUntil(): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(RATE_LIMIT_KEY);
  return v ? Number(v) || 0 : 0;
}

function writeRateLimitedUntil(ts: number): void {
  if (typeof window === "undefined") return;
  if (ts <= 0) window.localStorage.removeItem(RATE_LIMIT_KEY);
  else window.localStorage.setItem(RATE_LIMIT_KEY, String(ts));
}

/** Translate a portfolio ticker to the symbol FMP expects. */
function fmpSymbolFor(ticker: string): string {
  return FMP_SYMBOL_OVERRIDES[ticker] ?? ticker;
}

function buildReverseMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of PORTFOLIO_HOLDINGS) {
    const sym = fmpSymbolFor(h.ticker);
    out[sym.toUpperCase()] = h.ticker;
  }
  return out;
}

function remapQuotes(raw: FmpQuote[], reverse: Record<string, string>): Record<string, FmpQuote> {
  const out: Record<string, FmpQuote> = {};
  for (const q of raw) {
    const portfolioTicker = reverse[q.symbol?.toUpperCase()];
    if (portfolioTicker) out[portfolioTicker] = q;
  }
  return out;
}

function remapHistory(
  raw: FmpHistorySeries[],
  reverse: Record<string, string>,
): Record<string, FmpHistorySeries> {
  const out: Record<string, FmpHistorySeries> = {};
  for (const s of raw) {
    const portfolioTicker = reverse[s.symbol?.toUpperCase()];
    if (!portfolioTicker) continue;
    const sorted = [...s.historical].sort((a, b) => a.date.localeCompare(b.date));
    out[portfolioTicker] = { symbol: s.symbol, historical: sorted };
  }
  return out;
}

export function usePortfolioLiveData(): PortfolioLiveData {
  const reverseMap = React.useMemo(buildReverseMap, []);
  const tickers = React.useMemo(
    () => PORTFOLIO_HOLDINGS.map((h) => fmpSymbolFor(h.ticker)),
    [],
  );

  // Hydrate from localStorage immediately so the page doesn't flicker into
  // "no data" while the initial fetch runs (or while we're rate-limited).
  const initialQuotesCache = React.useMemo(
    () => readCache<Record<string, FmpQuote>>(QUOTES_CACHE_KEY),
    [],
  );
  const initialHistoryCache = React.useMemo(
    () => readCache<Record<string, FmpHistorySeries>>(HISTORY_CACHE_KEY),
    [],
  );

  const [quotes, setQuotes] = React.useState<Record<string, FmpQuote>>(
    () => initialQuotesCache?.data ?? {},
  );
  const [history, setHistory] = React.useState<Record<string, FmpHistorySeries>>(
    () => initialHistoryCache?.data ?? {},
  );
  const [status, setStatus] = React.useState<LiveStatus>("idle");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(
    () => (initialQuotesCache ? new Date(initialQuotesCache.ts) : null),
  );
  const [error, setError] = React.useState<string | null>(null);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [rateLimitedUntil, setRateLimitedUntil] = React.useState<number>(
    () => readRateLimitedUntil(),
  );

  const isFreshCache = React.useCallback(
    (envelope: CacheEnvelope<unknown> | null, ttl: number) =>
      !!envelope && Date.now() - envelope.ts < ttl,
    [],
  );

  const refresh = React.useCallback(() => {
    // Manual refresh clears any previous rate-limit so the user can retry
    // immediately after the FMP quota resets.
    writeRateLimitedUntil(0);
    setRateLimitedUntil(0);
    setRefreshTick((n) => n + 1);
  }, []);

  // Initial load + manual refresh: pull quotes + history (with cache).
  React.useEffect(() => {
    let cancelled = false;

    const now = Date.now();
    const stillRateLimited = rateLimitedUntil > now;

    const quotesEnvelope = readCache<Record<string, FmpQuote>>(QUOTES_CACHE_KEY);
    const historyEnvelope = readCache<Record<string, FmpHistorySeries>>(HISTORY_CACHE_KEY);
    const quotesFresh = isFreshCache(quotesEnvelope, QUOTE_CACHE_TTL_MS);
    const historyFresh = isFreshCache(historyEnvelope, HISTORY_CACHE_TTL_MS);

    if (quotesEnvelope) {
      setQuotes(quotesEnvelope.data);
      setLastUpdated(new Date(quotesEnvelope.ts));
    }
    if (historyEnvelope) setHistory(historyEnvelope.data);

    if (stillRateLimited) {
      setStatus("rate_limited");
      setError(
        `FMP daily quota reached. Live data resumes after the FMP quota resets.`,
      );
      return () => {
        cancelled = true;
      };
    }

    // If both caches are fresh, skip the network hit entirely.
    if (quotesFresh && historyFresh) {
      setStatus("live");
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    setStatus(quotesEnvelope ? "stale" : "loading");
    setError(null);

    Promise.allSettled([
      quotesFresh ? Promise.resolve([] as FmpQuote[]) : fetchQuotes(tickers),
      historyFresh
        ? Promise.resolve([] as FmpHistorySeries[])
        : fetchHistory(tickers, 365),
    ]).then(([qRes, hRes]) => {
      if (cancelled) return;

      const rateLimitHit =
        (qRes.status === "rejected" && qRes.reason instanceof RateLimitError) ||
        (hRes.status === "rejected" && hRes.reason instanceof RateLimitError);

      if (rateLimitHit) {
        // FMP free-tier resets daily; we don't get an exact reset time so
        // we lock for 6 hours and let the user manually refresh sooner.
        const until = Date.now() + 6 * 60 * 60_000;
        writeRateLimitedUntil(until);
        setRateLimitedUntil(until);
        setStatus("rate_limited");
        setError(
          "FMP daily quota reached (250 calls/day on the free tier). " +
            "Falling back to cached values; live data resumes when the quota resets.",
        );
        return;
      }

      let anyOk = false;
      if (qRes.status === "fulfilled" && qRes.value.length > 0) {
        const remapped = remapQuotes(qRes.value, reverseMap);
        if (Object.keys(remapped).length > 0) {
          setQuotes(remapped);
          writeCache(QUOTES_CACHE_KEY, remapped);
          anyOk = true;
        }
      } else if (quotesFresh && quotesEnvelope) {
        anyOk = true;
      }

      if (hRes.status === "fulfilled" && hRes.value.length > 0) {
        const remapped = remapHistory(hRes.value, reverseMap);
        if (Object.keys(remapped).length > 0) {
          setHistory(remapped);
          writeCache(HISTORY_CACHE_KEY, remapped);
          anyOk = true;
        }
      } else if (historyFresh && historyEnvelope) {
        anyOk = true;
      }

      if (anyOk) {
        setStatus("live");
        setLastUpdated(new Date());
        setError(null);
      } else {
        const reason =
          qRes.status === "rejected"
            ? (qRes.reason as Error)?.message
            : hRes.status === "rejected"
              ? (hRes.reason as Error)?.message
              : "FMP returned no data";
        setStatus("error");
        setError(reason ?? "FMP unreachable");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tickers, reverseMap, refreshTick, rateLimitedUntil, isFreshCache]);

  // Quote-only auto-refresh, paused when tab hidden, paused when rate-limited.
  React.useEffect(() => {
    if (rateLimitedUntil > Date.now()) return;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const res = await fetchQuotes(tickers);
        if (res.length > 0) {
          const remapped = remapQuotes(res, reverseMap);
          setQuotes(remapped);
          writeCache(QUOTES_CACHE_KEY, remapped);
          setStatus("live");
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (e) {
        if (e instanceof RateLimitError) {
          const until = Date.now() + 6 * 60 * 60_000;
          writeRateLimitedUntil(until);
          setRateLimitedUntil(until);
          setStatus("rate_limited");
          setError(
            "FMP daily quota reached (250 calls/day on the free tier). " +
              "Falling back to cached values; live data resumes when the quota resets.",
          );
          if (timer != null) {
            window.clearInterval(timer);
            timer = null;
          }
        } else {
          setStatus("stale");
          setError((e as Error)?.message ?? "Quote refresh failed");
        }
      }
    };

    const start = () => {
      if (timer != null) return;
      timer = window.setInterval(tick, AUTO_REFRESH_INTERVAL_MS);
    };
    const stop = () => {
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [tickers, reverseMap, rateLimitedUntil]);

  return { quotes, history, status, lastUpdated, error, refresh };
}
