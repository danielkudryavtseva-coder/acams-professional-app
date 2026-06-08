/**
 * Thin Financial Modeling Prep (FMP) client for the Portfolio page.
 *
 * Uses the v2 "stable" API (https://financialmodelingprep.com/stable/...).
 *
 * Free-tier notes:
 * - Quotes are 15-minute delayed.
 * - The free tier accepts only ONE symbol per request, so we fan out 1 call
 *   per ticker. That means a refresh of N positions costs N quote calls
 *   plus N history calls (history only on full refresh).
 * - Daily quota is ~250 calls; this client caches aggressively in
 *   `localStorage` and surfaces 429s as a typed `RateLimitError` so the
 *   UI can show a clear "rate limited" status instead of "no data".
 */

const FMP_BASE = "https://financialmodelingprep.com/stable";
const REQUEST_TIMEOUT_MS = 8_000;
const QUOTE_CONCURRENCY = 4;

export interface FmpQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
}

export interface FmpHistoryPoint {
  date: string;
  close: number;
}

export interface FmpHistorySeries {
  symbol: string;
  historical: FmpHistoryPoint[];
}

/** Thrown when the API responds with HTTP 429 (daily/per-minute quota hit). */
export class RateLimitError extends Error {
  constructor(message = "FMP rate limit reached") {
    super(message);
    this.name = "RateLimitError";
  }
}

interface RawStableQuote {
  symbol: string;
  price?: number;
  change?: number;
  /** New "stable" API uses `changePercentage`; legacy clients expect `changesPercentage`. */
  changePercentage?: number;
  changesPercentage?: number;
}

interface RawStableHistoryRow {
  symbol: string;
  date: string;
  close?: number;
  adjClose?: number;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_FMP_API_KEY as string | undefined;
  if (!key) {
    throw new Error(
      "Missing VITE_FMP_API_KEY. Add it to .env.local — see .env.example.",
    );
  }
  return key;
}

async function fetchJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 429) {
      throw new RateLimitError();
    }
    if (!res.ok) {
      throw new Error(`FMP ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Run an async map with bounded concurrency. Aborts remaining work on first 429. */
async function pooledMap<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let cursor = 0;
  let abort = false;
  const runners = new Array(Math.min(concurrency, items.length))
    .fill(0)
    .map(async () => {
      while (!abort) {
        const idx = cursor++;
        if (idx >= items.length) return;
        try {
          const value = await worker(items[idx]);
          results[idx] = { status: "fulfilled", value };
        } catch (reason) {
          results[idx] = { status: "rejected", reason };
          if (reason instanceof RateLimitError) abort = true;
        }
      }
    });
  await Promise.all(runners);
  // Fill any aborted slots so callers can iterate the array safely.
  for (let i = 0; i < items.length; i++) {
    if (!results[i]) {
      results[i] = { status: "rejected", reason: new RateLimitError() };
    }
  }
  return results;
}

function firstRateLimit(settled: PromiseSettledResult<unknown>[]): RateLimitError | null {
  for (const r of settled) {
    if (r.status === "rejected" && r.reason instanceof RateLimitError) {
      return r.reason;
    }
  }
  return null;
}

/**
 * Fetch quotes for each ticker. Per-symbol failures are isolated so that
 * an OTC/international symbol the free tier cannot resolve does not break
 * the rest of the portfolio.
 *
 * Throws `RateLimitError` if the API responded with 429 — callers should
 * surface this distinctly from "no data".
 */
export async function fetchQuotes(tickers: string[]): Promise<FmpQuote[]> {
  if (tickers.length === 0) return [];
  const key = getApiKey();
  const settled = await pooledMap(
    tickers,
    async (sym) => {
      const url = `${FMP_BASE}/quote?symbol=${encodeURIComponent(sym)}&apikey=${encodeURIComponent(key)}`;
      const raw = await fetchJson<RawStableQuote[]>(url);
      const row = Array.isArray(raw) ? raw[0] : null;
      if (!row || typeof row.price !== "number") {
        throw new Error(`No quote for ${sym}`);
      }
      return {
        symbol: row.symbol ?? sym,
        price: row.price,
        change: row.change ?? 0,
        changesPercentage:
          row.changesPercentage ?? row.changePercentage ?? 0,
      } satisfies FmpQuote;
    },
    QUOTE_CONCURRENCY,
  );
  const rl = firstRateLimit(settled);
  if (rl) throw rl;
  const out: FmpQuote[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") out.push(r.value);
  }
  return out;
}

/**
 * Fetch end-of-day history per ticker, trimmed to the most recent `days`.
 * The "stable" `historical-price-eod/full` endpoint returns a flat array
 * of `{ symbol, date, close, ... }` rows for a single symbol.
 *
 * Throws `RateLimitError` on 429.
 */
export async function fetchHistory(
  tickers: string[],
  days = 365,
): Promise<FmpHistorySeries[]> {
  if (tickers.length === 0) return [];
  const key = getApiKey();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const settled = await pooledMap(
    tickers,
    async (sym) => {
      const url = `${FMP_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(sym)}&apikey=${encodeURIComponent(key)}`;
      const raw = await fetchJson<RawStableHistoryRow[]>(url);
      if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error(`No history for ${sym}`);
      }
      const historical: FmpHistoryPoint[] = [];
      for (const row of raw) {
        if (!row || typeof row.date !== "string") continue;
        if (row.date < cutoffStr) continue;
        const close = typeof row.close === "number"
          ? row.close
          : typeof row.adjClose === "number"
            ? row.adjClose
            : null;
        if (close == null) continue;
        historical.push({ date: row.date, close });
      }
      if (historical.length === 0) {
        throw new Error(`Empty history window for ${sym}`);
      }
      return { symbol: sym, historical } satisfies FmpHistorySeries;
    },
    QUOTE_CONCURRENCY,
  );
  const rl = firstRateLimit(settled);
  if (rl) throw rl;
  const out: FmpHistorySeries[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") out.push(r.value);
  }
  return out;
}
