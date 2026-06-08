"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  PORTFOLIO_BONDS,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_MUTUAL_FUNDS,
  type PortfolioHolding,
} from "../data/portfolioHoldings";
import { usePortfolioLiveData } from "../hooks/usePortfolioLiveData";
import {
  buildMonthlyPortfolioTrend,
  buildSyntheticMonthly,
} from "../lib/portfolioLiveSeries";
import { cn } from "./ui/utils";

export function LandingPortfolioMiniChart() {
  const { quotes, history, status } = usePortfolioLiveData();

  const liveHoldings = React.useMemo<PortfolioHolding[]>(() => {
    return PORTFOLIO_HOLDINGS.map((h) => {
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
  }, [quotes]);

  const equityValue = liveHoldings.reduce((s, h) => s + h.currentValue, 0);
  const bondValue = PORTFOLIO_BONDS.reduce((s, b) => s + b.value, 0);
  const fundValue = PORTFOLIO_MUTUAL_FUNDS.reduce((s, m) => s + m.value, 0);
  const totalValue = equityValue + bondValue + fundValue;
  const bondAndFundMarketValue = bondValue + fundValue;

  const liveMonthly = React.useMemo(
    () => buildMonthlyPortfolioTrend(liveHoldings, history, 12, bondAndFundMarketValue),
    [liveHoldings, history, bondAndFundMarketValue],
  );
  const portfolioSeries =
    liveMonthly.length > 0 ? liveMonthly : buildSyntheticMonthly(totalValue, 12);

  const trendIsLive = liveMonthly.length > 0;
  const isLive = status === "live";
  const isLoading = status === "loading";
  const livePillTone = isLive ? "ok" : isLoading ? "loading" : "warn";
  const livePillLabel = isLive
    ? "Live"
    : isLoading
      ? "Loading"
      : status === "rate_limited"
        ? "Rate limited"
        : "Cached";

  const showLoadingHint = status === "loading" && Object.keys(quotes).length === 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
        <h3 className="font-display text-lg font-semibold">Portfolio snapshot</h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
            livePillTone === "ok" && "bg-green-50 text-green-700",
            livePillTone === "warn" && "bg-amber-50 text-amber-700",
            livePillTone === "loading" && "bg-slate-100 text-slate-600",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              livePillTone === "ok" && "bg-green-500",
              livePillTone === "warn" && "bg-amber-500",
              livePillTone === "loading" && "bg-slate-400 animate-pulse",
            )}
          />
          {livePillLabel}
        </span>
      </div>
      {showLoadingHint && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Loading quotes…
        </p>
      )}
      <div className={cn("mt-3", showLoadingHint && "opacity-90")}>
        {portfolioSeries.length === 0 ? (
          <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-3 text-center text-sm text-muted-foreground">
            No chart data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart
              data={portfolioSeries}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="landingPortfolioMiniFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="chart-grid" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                domain={["auto", "auto"]}
                width={44}
              />
              <Tooltip
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Market value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--chart-1))"
                fill="url(#landingPortfolioMiniFill)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-prose text-center text-xs leading-relaxed text-muted-foreground">
        {trendIsLive
          ? "Trailing 12 months: equities from daily closes; bonds & funds at current marks. Values are total market value (includes unrealized P&L)."
          : "Estimated total market value trend · set VITE_FMP_API_KEY for live history"}
      </p>
    </div>
  );
}
