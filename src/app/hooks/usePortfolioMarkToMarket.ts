import * as React from "react";
import {
  PORTFOLIO_BONDS,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_MUTUAL_FUNDS,
  type PortfolioHolding,
} from "../data/portfolioHoldings";
import type { FmpQuote } from "../lib/fmp";

export interface PortfolioMarkToMarket {
  liveHoldings: PortfolioHolding[];
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
}

/**
 * Single mark-to-market pass for CAMS portfolio sleeves, given live equity quotes.
 * Used by dashboard and full portfolio so summary numbers stay aligned.
 */
export function usePortfolioMarkToMarket(
  quotes: Record<string, FmpQuote>,
): PortfolioMarkToMarket {
  return React.useMemo(() => {
    const liveHoldings: PortfolioHolding[] = PORTFOLIO_HOLDINGS.map((h) => {
      const live = quotes[h.ticker];
      const livePrice = typeof live?.price === "number" ? live.price : null;
      if (livePrice == null) return h;
      const currentValue = h.shares * livePrice;
      const unrealizedGain = currentValue - h.shares * h.avgCost;
      const changePct = ((livePrice - h.avgCost) / h.avgCost) * 100;
      return {
        ...h,
        currentPrice: livePrice,
        currentValue: Math.round(currentValue),
        unrealizedGain: Math.round(unrealizedGain),
        changePct: Number(changePct.toFixed(2)),
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
    };
  }, [quotes]);
}
