import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { DashboardCell } from "../components/ui/DashboardCell";
import { Button } from "../components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  PORTFOLIO_AS_OF,
  PORTFOLIO_BONDS,
  PORTFOLIO_MUTUAL_FUNDS,
  type PortfolioHolding,
} from "../data/portfolioHoldings";
import { usePortfolioLiveData } from "../hooks/usePortfolioLiveData";
import { usePortfolioMarkToMarket } from "../hooks/usePortfolioMarkToMarket";
import type { FmpHistorySeries } from "../lib/fmp";
import { cn } from "../components/ui/utils";
import { useMembers } from "../context/MembersContext";
import { MOCK_PORTFOLIO_DECISIONS } from "../data/mockData";
import { TaggedMembersRow } from "../components/TaggedMembersRow";

const SECTOR_CHART_FILLS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface TrendPoint {
  date: string;
  label: string;
  value: number;
}

interface TimeframeOption {
  id: string;
  label: string;
  days: number;
}

const TIMEFRAMES: TimeframeOption[] = [
  { id: "1W", label: "1W", days: 7 },
  { id: "1M", label: "1M", days: 30 },
  { id: "2M", label: "2M", days: 60 },
  { id: "3M", label: "3M", days: 90 },
  { id: "4M", label: "4M", days: 120 },
  { id: "5M", label: "5M", days: 150 },
  { id: "6M", label: "6M", days: 180 },
  { id: "1Y", label: "1Y", days: 365 },
];

const DEFAULT_TIMEFRAME_ID = "6M";

const EXCEL_PORTFOLIO_URL =
  "https://bama365-my.sharepoint.com/:x:/g/personal/crinaldi_crimson_ua_edu/IQDLjDUXinnCT5cGeSim0BgJAXY4LqlBY-BExzN9-2wv4GM?e=OloU3F";

/** Pick a label format that stays readable across timeframe widths. */
function formatTrendLabel(date: Date, days: number): string {
  if (days <= 30) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (days <= 180) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/** Downsample to ~60 points for chart performance/legibility. */
function downsamplePoints(points: TrendPoint[]): TrendPoint[] {
  if (points.length <= 60) return points;
  const stride = Math.ceil(points.length / 60);
  const out: TrendPoint[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  // Always include the most recent point so the line ends "now".
  if (out[out.length - 1]?.date !== points[points.length - 1].date) {
    out.push(points[points.length - 1]);
  }
  return out;
}

/**
 * Build a daily portfolio-value series from FMP daily closes, then trim to the
 * requested window and downsample for the chart.
 *
 * Strategy: walk every trading date that appears in any series, take the most
 * recent close <= that date for each holding (carry-forward for missing days),
 * sum `shares * close`. Filter by `days` window. Downsample to ~60 points.
 */
function buildTrendSeries(
  holdings: PortfolioHolding[],
  history: Record<string, FmpHistorySeries>,
  days: number,
): TrendPoint[] {
  const usable = holdings.filter((h) => history[h.ticker]?.historical?.length);
  if (usable.length === 0) return [];

  const dateSet = new Set<string>();
  for (const h of usable) {
    for (const pt of history[h.ticker].historical) dateSet.add(pt.date);
  }
  const allDates = Array.from(dateSet).sort();

  const cursors = new Map<string, number>(usable.map((h) => [h.ticker, -1]));
  const lastClose = new Map<string, number>();

  const daily: TrendPoint[] = [];
  for (const date of allDates) {
    let total = 0;
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
    daily.push({ date, label: date, value: Math.round(total) });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const windowed = daily.filter((pt) => pt.date >= cutoffStr);
  const points = windowed.length > 0 ? windowed : daily.slice(-1);

  return downsamplePoints(points).map((pt) => ({
    ...pt,
    label: formatTrendLabel(new Date(pt.date), days),
  }));
}

/**
 * Deterministic synthetic daily trend used when FMP history is unavailable
 * (no API key, rate limited, or all symbols unsupported on the free tier).
 *
 * Anchors to current totalValue at the end and draws a gentle pseudo-random walk
 * backwards. Seeded from the value so the curve stays stable across re-renders.
 * The same daily series is generated for any window so switching timeframes
 * just trims the visible portion (no jitter on switch).
 */
function buildSyntheticTrend(totalValue: number, days: number): TrendPoint[] {
  if (totalValue <= 0) return [];
  // Generate the full 1Y history then trim — keeps each timeframe visually
  // consistent (1W is just the tail of 1Y).
  const totalDays = 366;
  let seed = Math.max(1, Math.floor(totalValue));
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  // Random start drift: portfolio "started" at -10% to +2% of current.
  const startMultiplier = 0.9 + rand() * 0.12;
  let value = totalValue;
  const reverse: TrendPoint[] = [];
  const today = new Date();
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    reverse.push({
      date: date.toISOString().slice(0, 10),
      label: "",
      value: Math.round(value),
    });
    const target = startMultiplier * totalValue;
    const pull = (value - target) / Math.max(1, totalDays - i);
    // Daily noise smaller than weekly (~0.4% per day).
    const noise = (rand() - 0.5) * 0.008 * value;
    value = value - pull + noise;
  }
  const full: TrendPoint[] = [];
  for (let i = reverse.length - 1; i >= 0; i--) full.push(reverse[i]);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const windowed = full.filter((pt) => pt.date >= cutoffStr);

  return downsamplePoints(windowed).map((pt) => ({
    ...pt,
    label: formatTrendLabel(new Date(pt.date), days),
  }));
}

function formatRelative(d: Date | null): string {
  if (!d) return "never";
  const seconds = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export default function Portfolio() {
  const { quotes, history, status, lastUpdated, error, refresh } = usePortfolioLiveData();
  const {
    liveHoldings: holdings,
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
  } = usePortfolioMarkToMarket(quotes);
  const { members } = useMembers();
  const membersById = React.useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );
  const [timeframeId, setTimeframeId] = React.useState<string>(DEFAULT_TIMEFRAME_ID);
  const timeframe = TIMEFRAMES.find((t) => t.id === timeframeId) ?? TIMEFRAMES[6];

  // Re-render once a second so "12s ago" actually counts up.
  const [, setNowTick] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const totalReturn = totalReturnPct.toFixed(2);

  const sectorData = Object.entries(
    holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.sector] = (acc[h.sector] || 0) + h.currentValue;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value: Math.round(value) }));
  // Roll bonds and mutual funds into the sector pie as their own slices.
  if (bondValue > 0) sectorData.push({ name: "Fixed Income", value: bondValue });
  if (fundValue > 0) sectorData.push({ name: "Mutual Funds", value: fundValue });

  const totalValueForTrend = totalValue;
  const liveTrend = React.useMemo(
    () => buildTrendSeries(holdings, history, timeframe.days),
    [holdings, history, timeframe.days],
  );
  const trendSeries = React.useMemo(
    () =>
      liveTrend.length > 0
        ? liveTrend
        : buildSyntheticTrend(totalValueForTrend, timeframe.days),
    [liveTrend, totalValueForTrend, timeframe.days],
  );
  const trendIsLive = liveTrend.length > 0;
  const trendChangeAbs = trendSeries.length > 1
    ? trendSeries[trendSeries.length - 1].value - trendSeries[0].value
    : 0;
  const trendChangePct = trendSeries.length > 1 && trendSeries[0].value > 0
    ? (trendChangeAbs / trendSeries[0].value) * 100
    : 0;
  const trendIsUp = trendChangeAbs >= 0;

  const liveCoverage = holdings.filter((h) => quotes[h.ticker]).length;
  const apiKeyMissing =
    status === "error" && (error?.includes("VITE_FMP_API_KEY") ?? false);
  const rateLimited = status === "rate_limited";

  const statusBadge = (() => {
    if (status === "loading") {
      return { label: "Loading live data...", tone: "loading" as const };
    }
    if (rateLimited) {
      return {
        label: `Rate limited - cached from ${formatRelative(lastUpdated)}`,
        tone: "warn" as const,
      };
    }
    if (status === "error") {
      return { label: `Using cached values - ${error ?? "FMP unreachable"}`, tone: "warn" as const };
    }
    if (status === "stale") {
      return { label: `Stale - last update ${formatRelative(lastUpdated)}`, tone: "warn" as const };
    }
    if (status === "live") {
      return { label: `Live - updated ${formatRelative(lastUpdated)}`, tone: "ok" as const };
    }
    return { label: "Idle", tone: "warn" as const };
  })();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {holdings.length} equities · {PORTFOLIO_BONDS.length} bonds ·{" "}
            {PORTFOLIO_MUTUAL_FUNDS.length} funds ·{" "}
            {status === "live" ? (
              <span className="text-green-700">Live data</span>
            ) : (
              <span>Seed values as of {PORTFOLIO_AS_OF}</span>
            )}
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="h-8 shrink-0">
          <a href={EXCEL_PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Excel Portfolio
          </a>
        </Button>
      </div>

      {rateLimited && (
        <Alert>
          <KeyRound className="h-4 w-4" />
          <AlertTitle>FMP daily quota reached</AlertTitle>
          <AlertDescription className="space-y-1">
            <p className="text-muted-foreground">
              The free tier allows ~250 calls/day. The portfolio is showing the most
              recent cached values
              {lastUpdated ? ` (snapshot from ${formatRelative(lastUpdated)})` : ""}.
              Live data will resume automatically once the quota resets in ~24h, or
              upgrade your FMP plan for higher limits.
            </p>
            <p className="text-xs text-muted-foreground">
              Tip: hit{" "}
              <span className="font-medium">Refresh</span>{" "}
              after the reset to retry immediately.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {apiKeyMissing && (
        <Alert>
          <KeyRound className="h-4 w-4" />
          <AlertTitle>Connect the live-quotes plug-in</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-muted-foreground">
              Live quotes and 1-year history are powered by{" "}
              <span className="font-medium">Financial Modeling Prep (FMP)</span>.
              Add a free API key to <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>{" "}
              and restart the dev server to enable real-time data.
            </p>
            <ol className="list-decimal pl-5 text-xs text-muted-foreground space-y-0.5">
              <li>
                Sign up free at{" "}
                <a
                  href="https://site.financialmodelingprep.com/developer/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  financialmodelingprep.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                Set <code className="rounded bg-muted px-1 py-0.5">VITE_FMP_API_KEY=</code> in{" "}
                <code className="rounded bg-muted px-1 py-0.5">.env.local</code>
              </li>
              <li>
                Restart with <code className="rounded bg-muted px-1 py-0.5">npm run dev</code>
              </li>
            </ol>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCell
          title="Portfolio Value"
          icon={<DollarSign className="h-4 w-4" />}
        >
          <div className="text-2xl font-bold">
            ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p
            className={cn(
              "text-xs mt-1 inline-flex items-center gap-1 font-medium",
              totalGain >= 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {totalGain >= 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {totalGain >= 0 ? "+" : ""}${Math.abs(totalGain).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span className="text-muted-foreground font-normal ml-0.5">
              unrealized ({Number(totalReturn) >= 0 ? "+" : ""}{totalReturn}%)
            </span>
          </p>
        </DashboardCell>
        <DashboardCell
          title="Total Cost"
          value={`$${totalCost.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          description="Book value"
        />
        <DashboardCell
          title="Unrealized Gains"
          icon={totalGain >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        >
          <div
            className={cn(
              "text-2xl font-bold",
              totalGain >= 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {totalGain >= 0 ? "+" : ""}${totalGain.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
            <span className="flex justify-between gap-2">
              <span>Equities</span>
              <span className={cn("font-medium", equityGain >= 0 ? "text-green-600" : "text-red-600")}>
                {equityGain >= 0 ? "+" : ""}${equityGain.toLocaleString()}
              </span>
            </span>
            <span className="flex justify-between gap-2">
              <span>Fixed Income</span>
              <span className={cn("font-medium", bondGain >= 0 ? "text-green-600" : "text-red-600")}>
                {bondGain >= 0 ? "+" : ""}${bondGain.toLocaleString()}
              </span>
            </span>
            <span className="flex justify-between gap-2">
              <span>Mutual Funds</span>
              <span className={cn("font-medium", fundGain >= 0 ? "text-green-600" : "text-red-600")}>
                {fundGain >= 0 ? "+" : ""}${fundGain.toLocaleString()}
              </span>
            </span>
          </div>
        </DashboardCell>
        <DashboardCell
          title="Total Return"
          value={`${Number(totalReturn) >= 0 ? "+" : ""}${totalReturn}%`}
          icon={Number(totalReturn) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          trend={Number(totalReturn) >= 0 ? "up" : "down"}
          trendValue="All-time"
        />
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <CardTitle>Portfolio Value Trend</CardTitle>
                <CardDescription>
                  {trendIsLive
                    ? `Daily closes from FMP - ${liveCoverage}/${holdings.length} positions live`
                    : "Estimated trend - add VITE_FMP_API_KEY in .env.local for live history"}
                </CardDescription>
              </div>
              {trendSeries.length > 1 && (
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold">
                    ${trendSeries[trendSeries.length - 1].value.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium inline-flex items-center gap-1",
                      trendIsUp ? "text-green-600" : "text-red-600",
                    )}
                  >
                    {trendIsUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {trendIsUp ? "+" : ""}${Math.abs(trendChangeAbs).toLocaleString()}
                    {" "}({trendIsUp ? "+" : ""}{trendChangePct.toFixed(2)}%)
                    <span className="text-muted-foreground font-normal ml-1">{timeframe.label}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  statusBadge.tone === "ok" && "bg-green-50 text-green-700",
                  statusBadge.tone === "warn" && "bg-amber-50 text-amber-700",
                  statusBadge.tone === "loading" && "bg-slate-100 text-slate-600",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    statusBadge.tone === "ok" && "bg-green-500",
                    statusBadge.tone === "warn" && "bg-amber-500",
                    statusBadge.tone === "loading" && "bg-slate-400 animate-pulse",
                  )}
                />
                {statusBadge.label}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={refresh}
                disabled={status === "loading"}
                className="h-8"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", status === "loading" && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="inline-flex rounded-md border bg-muted/30 p-0.5" role="group" aria-label="Timeframe">
              {TIMEFRAMES.map((tf) => {
                const active = tf.id === timeframeId;
                return (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframeId(tf.id)}
                    aria-pressed={active}
                    className={cn(
                      "px-2.5 h-7 text-xs font-medium rounded transition-colors",
                      active
                        ? "bg-white text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground">
              {trendSeries.length} {trendSeries.length === 1 ? "point" : "points"}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendSeries} margin={{ top: 8, right: 12, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c63f60" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#c63f60" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} labelFormatter={(l) => String(l)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#c63f60"
                fill="url(#portfolioTrendFill)"
                strokeWidth={2}
                name="Portfolio Value"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Long Equities</CardTitle>
              <CardDescription>
                {holdings.length} positions ·{" "}
                ${equityValue.toLocaleString()} ·{" "}
                <span className={cn(equityGain >= 0 ? "text-green-600" : "text-red-600")}>
                  {equityGain >= 0 ? "+" : ""}${equityGain.toLocaleString()} unrealized
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Avg Cost</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Return</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => {
                    const value = holding.currentValue;
                    const gainPct = holding.changePct;
                    const isPositive = gainPct >= 0;
                    const isLive = !!quotes[holding.ticker];
                    return (
                      <TableRow key={holding.ticker}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-1.5">
                              {holding.ticker}
                              {isLive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Live price" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{holding.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{holding.shares}</TableCell>
                        <TableCell className="text-sm">${holding.avgCost.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">${holding.currentPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          ${value.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center gap-1 text-sm font-medium", isPositive ? "text-green-600" : "text-red-600")}>
                            {isPositive ? "+" : ""}{gainPct.toFixed(2)}%
                            {isPositive ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sector allocation, then fixed income and mutual funds (stacked below on all breakpoints) */}
        <div className="flex flex-col gap-6">
          {/* Sector Allocation */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Sector Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sectorData} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SECTOR_CHART_FILLS[index % SECTOR_CHART_FILLS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, _name, item: { payload?: { name?: string } }) => {
                      const label = item.payload?.name ?? "";
                      const pct =
                        totalValue > 0 ? ((v / totalValue) * 100).toFixed(0) : "0";
                      return [`$${v.toLocaleString()} (${pct}%)`, label];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {sectorData.map((sector, i) => (
                  <div key={sector.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-sm flex-shrink-0" style={{ backgroundColor: SECTOR_CHART_FILLS[i % SECTOR_CHART_FILLS.length] }} />
                    <span className="text-sm flex-1">{sector.name}</span>
                    <span className="text-sm font-medium">
                      {((sector.value / totalValue) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Fixed Income</CardTitle>
              <CardDescription>
                {PORTFOLIO_BONDS.length} bond{PORTFOLIO_BONDS.length === 1 ? "" : "s"} ·{" "}
                ${bondValue.toLocaleString()} ·{" "}
                <span className={cn(bondGain >= 0 ? "text-green-600" : "text-red-600")}>
                  {bondGain >= 0 ? "+" : ""}${bondGain.toLocaleString()} unrealized
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holding</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PORTFOLIO_BONDS.map((b) => (
                    <TableRow key={b.name}>
                      <TableCell className="text-sm font-medium">{b.name}</TableCell>
                      <TableCell className="text-right text-sm">{b.shares}</TableCell>
                      <TableCell className="text-right text-sm">${b.purchasePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">${b.currentPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        ${b.value.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-sm font-medium",
                          b.unrealizedGain >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {b.unrealizedGain >= 0 ? "+" : ""}${b.unrealizedGain.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Mutual Funds & ETFs</CardTitle>
              <CardDescription>
                {PORTFOLIO_MUTUAL_FUNDS.length} fund{PORTFOLIO_MUTUAL_FUNDS.length === 1 ? "" : "s"} ·{" "}
                ${fundValue.toLocaleString()} ·{" "}
                <span className={cn(fundGain >= 0 ? "text-green-600" : "text-red-600")}>
                  {fundGain >= 0 ? "+" : ""}${fundGain.toLocaleString()} unrealized
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PORTFOLIO_MUTUAL_FUNDS.map((m) => (
                    <TableRow key={m.ticker}>
                      <TableCell>
                        <p className="text-sm font-medium">{m.ticker}</p>
                        <p className="text-xs text-muted-foreground">{m.name}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm">{m.shares}</TableCell>
                      <TableCell className="text-right text-sm">${m.purchasePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm">${m.currentPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        ${m.value.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-sm font-medium",
                          m.unrealizedGain >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {m.unrealizedGain >= 0 ? "+" : ""}${m.unrealizedGain.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Committee decisions</CardTitle>
          <CardDescription>
            Members tagged on each decision, with tag snapshots frozen at decision time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ticker</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tagged members &amp; snapshot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PORTFOLIO_DECISIONS.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(d.decidedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{d.ticker}</TableCell>
                  <TableCell className="text-sm">{d.title}</TableCell>
                  <TableCell className="text-sm capitalize">{d.decisionType}</TableCell>
                  <TableCell className="text-sm min-w-[12rem]">
                    <TaggedMembersRow
                      taggedMemberIds={d.taggedMemberIds}
                      membersById={membersById}
                      tagSnapshot={d.tagSnapshot}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
