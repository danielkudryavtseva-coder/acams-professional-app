import type { PortfolioHolding } from "../data/portfolioHoldings";
import type { FmpHistorySeries } from "./fmp";

export interface MonthlyPortfolioPoint {
  month: string;
  value: number;
}

/**
 * Monthly rollup from FMP history. Each point is full portfolio market value:
 * equities from daily closes × shares, plus bonds & mutual funds at current marks.
 */
export function buildMonthlyPortfolioTrend(
  holdings: PortfolioHolding[],
  history: Record<string, FmpHistorySeries>,
  months: number,
  bondAndFundMarketValue: number,
): MonthlyPortfolioPoint[] {
  const usable = holdings.filter((h) => history[h.ticker]?.historical?.length);
  if (usable.length === 0) return [];

  const dateSet = new Set<string>();
  for (const h of usable) for (const pt of history[h.ticker].historical) dateSet.add(pt.date);
  const allDates = Array.from(dateSet).sort();

  const cursors = new Map<string, number>(usable.map((h) => [h.ticker, -1]));
  const lastClose = new Map<string, number>();
  const byMonth = new Map<string, number>();

  for (const date of allDates) {
    let total = bondAndFundMarketValue;
    for (const h of usable) {
      const series = history[h.ticker].historical;
      let i = cursors.get(h.ticker)!;
      while (i + 1 < series.length && series[i + 1].date <= date) i++;
      cursors.set(h.ticker, i);
      const close = i >= 0 ? series[i].close : NaN;
      if (Number.isFinite(close)) lastClose.set(h.ticker, close);
      const px = lastClose.get(h.ticker);
      if (px != null) total += h.shares * px;
    }
    for (const h of holdings) {
      if (!history[h.ticker]?.historical?.length) total += h.shares * h.currentPrice;
    }
    byMonth.set(date.slice(0, 7), Math.round(total));
  }

  const ordered = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
  return ordered.slice(-months).map(([ym, value]) => ({
    month: new Date(ym + "-01").toLocaleDateString("en-US", { month: "short" }),
    value,
  }));
}

/**
 * Synthetic monthly trend when FMP history is unavailable; deterministic from totalValue.
 */
export function buildSyntheticMonthly(
  totalValue: number,
  months: number,
): MonthlyPortfolioPoint[] {
  if (totalValue <= 0) return [];
  let seed = Math.max(1, Math.floor(totalValue));
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const startMult = 0.9 + rand() * 0.12;
  let value = totalValue;
  const reverse: MonthlyPortfolioPoint[] = [];
  const today = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    reverse.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      value: Math.round(value),
    });
    const target = startMult * totalValue;
    const pull = (value - target) / Math.max(1, months - i);
    const noise = (rand() - 0.5) * 0.02 * value;
    value = value - pull + noise;
  }
  return reverse.reverse();
}

/** Portfolio value at the first close on/after Jan 1 of the current year (equity history path). */
export function ytdStartFromHistory(
  holdings: PortfolioHolding[],
  history: Record<string, FmpHistorySeries>,
): number | null {
  const usable = holdings.filter((h) => history[h.ticker]?.historical?.length);
  if (usable.length === 0) return null;
  const yearStart = `${new Date().getFullYear()}-01-01`;
  let total = 0;
  for (const h of usable) {
    const series = history[h.ticker].historical;
    let close: number | null = null;
    for (const pt of series) {
      if (pt.date >= yearStart) {
        close = pt.close;
        break;
      }
      close = pt.close;
    }
    if (close != null) total += h.shares * close;
  }
  for (const h of holdings) {
    if (!history[h.ticker]?.historical?.length) total += h.shares * h.currentPrice;
  }
  return Math.round(total);
}

/**
 * Annualized Sharpe ratio from strictly chronological monthly portfolio values.
 * Uses simple monthly returns, sample volatility, risk-free = 0; scales by sqrt(12).
 */
export function sharpeAnnualizedFromMonthlyValues(values: number[]): number | null {
  if (values.length < 4) return null;
  const rets: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const cur = values[i];
    if (!(prev > 0) || !Number.isFinite(cur)) return null;
    rets.push(cur / prev - 1);
  }
  if (rets.length < 3) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varSample =
    rets.reduce((s, r) => s + (r - mean) ** 2, 0) / Math.max(1, rets.length - 1);
  const std = Math.sqrt(varSample);
  if (std < 1e-8) return null;
  return (mean / std) * Math.sqrt(12);
}
