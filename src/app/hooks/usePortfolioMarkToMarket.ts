import * as React from "react";
import {
  PORTFOLIO_BONDS,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_MUTUAL_FUNDS,
  type PortfolioHolding,
} from "../data/portfolioHoldings";
import type { FmpDividendSeries, FmpQuote } from "../lib/fmp";

export interface PortfolioHoldingWithDividends extends PortfolioHolding {
  /** Sum of per-share dividends paid over the trailing ~12 months. */
  ttmDividendPerShare: number;
  /** `shares * ttmDividendPerShare` — this position's trailing annual dividend income. */
  annualDividendIncome: number;
}

export interface PortfolioMarkToMarket {
  liveHoldings: PortfolioHoldingWithDividends[];
  equityValue: number;
  equityGain: number;
  bondValue: number;
  bondGain: number;
  fundValue: number;
  fundGain: number;
  totalValue: number;
  totalGain: number;
  totalCost: number;
  /** Percent, not fraction */
  totalReturnPct: number;
  /** Sum of `annualDividendIncome` across all equity holdings (trailing 12mo, from FMP). */
  totalAnnualDividendIncome: number;
}

/** Sum of dividend payments dated within the trailing 365 days. */
function ttmSum(series: FmpDividendSeries | undefined): number {
  if (!series) return 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return series.historical
    .filter((p) => p.date >= cutoffStr)
    .reduce((s, p) => s + p.dividend, 0);
}

/**
 * Single mark-to-market pass for CAMS portfolio sleeves, given live equity quotes
 * and trailing dividend history. Used by dashboard and full portfolio so summary
 * numbers stay aligned.
 */
export function usePortfolioMarkToMarket(
  quotes: Record<string, FmpQuote>,
  dividends: Record<string, FmpDividendSeries> = {},
): PortfolioMarkToMarket {
  return React.useMemo(() => {
    const liveHoldings: PortfolioHoldingWithDividends[] = PORTFOLIO_HOLDINGS.map((h) => {
      const live = quotes[h.ticker];
      const livePrice = typeof live?.price === "number" ? live.price : null;
      const ttmDividendPerShare = ttmSum(dividends[h.ticker]);
      const annualDividendIncome = Math.round(h.shares * ttmDividendPerShare);
      if (livePrice == null) {
        return { ...h, ttmDividendPerShare, annualDividendIncome };
      }
      const currentValue = h.shares * livePrice;
      const unrealizedGain = currentValue - h.shares * h.avgCost;
      const changePct = ((livePrice - h.avgCost) / h.avgCost) * 100;
      return {
        ...h,
        currentPrice: livePrice,
        currentValue: Math.round(currentValue),
        unrealizedGain: Math.round(unrealizedGain),
        changePct: Number(changePct.toFixed(2)),
        ttmDividendPerShare,
        annualDividendIncome,
      };
    });

    const equityValue = liveHoldings.reduce((s, h) => s + h.currentValue, 0);
    const equityGain = liveHoldings.reduce((s, h) => s + h.unrealizedGain, 0);
    const bondValue = PORTFOLIO_BONDS.reduce((s, b) => s + b.value, 0);
    const bondGain = PORTFOLIO_BONDS.reduce((s, b) => s + b.unrealizedGain, 0);
    const fundValue = PORTFOLIO_MUTUAL_FUNDS.reduce((s, m) => s + m.value, 0);
    const fundGain = PORTFOLIO_MUTUAL_FUNDS.reduce((s, m) => s + m.unrealizedGain, 0);
    const totalValue = equityValue + bondValue + fundValue;
    const totalGain = equityGain + bondGain + fundGain;
    const totalCost = totalValue - totalGain;
    const totalReturnPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const totalAnnualDividendIncome = liveHoldings.reduce(
      (s, h) => s + h.annualDividendIncome,
      0,
    );

    return {
      liveHoldings,
      equityValue,
      equityGain,
      bondValue,
      bondGain,
      fundValue,
      fundGain,
      totalValue,
      totalGain,
      totalCost,
      totalReturnPct,
      totalAnnualDividendIncome,
    };
  }, [quotes, dividends]);
}
