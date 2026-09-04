import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Users, Activity, Calendar, ArrowUpRight, ArrowUp, ArrowDown } from "lucide-react";
import { DashboardCell } from "../components/ui/DashboardCell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MOCK_PROGRAMS } from "../data/mockData";
import { usePipeline } from "../context/PipelineContext";
import {
  PORTFOLIO_BONDS,
  PORTFOLIO_HOLDINGS,
  PORTFOLIO_MUTUAL_FUNDS,
} from "../data/portfolioHoldings";
import { usePortfolioLiveData } from "../hooks/usePortfolioLiveData";
import { usePortfolioMarkToMarket } from "../hooks/usePortfolioMarkToMarket";
import {
  buildMonthlyPortfolioTrend,
  buildSyntheticMonthly,
  ytdStartFromHistory,
} from "../lib/portfolioLiveSeries";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { useCheckin } from "../context/CheckinContext";
import { sortNewsPosts, useNews } from "../context/NewsContext";
import { estimateReadMinutes, formatNewsShortDate, getNewsCoverSrc } from "../lib/newsDisplay";
import { WeeklyCheckinModal } from "../components/WeeklyCheckinModal";
import { cn } from "../components/ui/utils";
import { PageHeader } from "../components/PageHeader";

/** Coarse relative-time label ("2h ago", "3 days ago") for a past ISO timestamp. */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { currentUser, isExec } = useAuth();
  const { visiblePosts } = useNews();
  const posts = React.useMemo(
    () => visiblePosts({ isExec }),
    [visiblePosts, isExec],
  );
  const { events, attendance } = useEvents();
  const { hasCheckedInThisWeek } = useCheckin();
  const { contacts: pipelineContacts } = usePipeline();
  const [checkinOpen, setCheckinOpen] = React.useState(false);

  // Real recent activity — most recently added pipeline contacts. (There's no broader
  // activity log in the app yet; this reflects the one thing we actually track a
  // timestamp for, rather than showing made-up sample events.)
  const recentActivity = React.useMemo(
    () =>
      [...pipelineContacts]
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 4),
    [pipelineContacts],
  );

  const now = Date.now();
  const upcomingEvents = React.useMemo(
    () =>
      events
        .filter((e) => new Date(e.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3),
    [events, now],
  );

  const openPrograms = React.useMemo(
    () => MOCK_PROGRAMS.filter((p) => p.status === "open"),
    [],
  );
  const upcomingDeadlines = React.useMemo(
    () =>
      openPrograms
        .filter((p) => p.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 4),
    [openPrograms],
  );
  const activePipeline = pipelineContacts.filter(
    (c) => c.stage !== "rejected" && c.stage !== "accepted",
  );
  const offerStageCount = pipelineContacts.filter((c) => c.stage === "offer").length;
  const soonDeadlines = openPrograms.filter((p) => {
    if (!p.deadline) return false;
    const diff = new Date(p.deadline).getTime() - Date.now();
    return diff > 0 && diff < 14 * 24 * 3600 * 1000;
  }).length;

  // Live portfolio data: shared source of truth with the full /portfolio page.
  const { quotes, history, status } = usePortfolioLiveData();
  const {
    liveHoldings,
    bondValue,
    fundValue,
    totalValue,
    totalGain,
    totalReturnPct,
  } = usePortfolioMarkToMarket(quotes);

  const ytdStart = React.useMemo(
    () => ytdStartFromHistory(liveHoldings, history),
    [liveHoldings, history],
  );
  const ytdGain = ytdStart != null ? totalValue - ytdStart : totalGain;
  const ytdReturnFrac = ytdStart && ytdStart > 0 ? (totalValue - ytdStart) / ytdStart : null;

  // YTD-annualized when we have history; otherwise fall back to total return %.
  const yearStartMs = new Date(new Date().getFullYear(), 0, 1).getTime();
  const yearFraction = Math.max(0.05, (Date.now() - yearStartMs) / (365.25 * 24 * 3600 * 1000));
  const annualizedPct = ytdReturnFrac != null
    ? (Math.pow(1 + ytdReturnFrac, 1 / yearFraction) - 1) * 100
    : totalReturnPct;

  const bondAndFundMarketValue = bondValue + fundValue;
  const liveMonthly = React.useMemo(
    () => buildMonthlyPortfolioTrend(liveHoldings, history, 12, bondAndFundMarketValue),
    [liveHoldings, history, bondAndFundMarketValue],
  );
  const portfolioSeries = liveMonthly.length > 0
    ? liveMonthly
    : buildSyntheticMonthly(totalValue, 12);

  const totalPositions =
    PORTFOLIO_HOLDINGS.length + PORTFOLIO_BONDS.length + PORTFOLIO_MUTUAL_FUNDS.length;
  const portfolioValueShort = `$${(totalValue / 1000).toFixed(1)}K`;
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

  return (
    <div className="p-6 space-y-6 max-w-content mx-auto min-h-screen bg-paper">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${currentUser?.firstName ?? "Member"} — University of Alabama`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCell
          title="Portfolio Value"
          value={portfolioValueShort}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={totalReturnPct >= 0 ? "up" : "down"}
          trendValue={`${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct.toFixed(2)}% total return`}
        />
        <DashboardCell
          title="Active Pipeline"
          value={String(activePipeline.length)}
          icon={<Activity className="h-4 w-4" />}
          trendValue={offerStageCount > 0 ? `${offerStageCount} at offer stage` : "no offers yet"}
        />
        <DashboardCell
          title="Contacts Tracked"
          value={String(pipelineContacts.length)}
          icon={<Users className="h-4 w-4" />}
          trendValue="your pipeline"
        />
        <DashboardCell
          title="Programs Open"
          value={String(openPrograms.length)}
          icon={<Calendar className="h-4 w-4" />}
          trendValue={`${soonDeadlines} deadlines in 14 days`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base font-display">Portfolio Performance</CardTitle>
                  <CardDescription>
                    {trendIsLive ? "Live monthly closes from FMP" : "Estimated trend - add VITE_FMP_API_KEY for live history"}
                  </CardDescription>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm tabular">
                <div>
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="font-semibold">${totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">YTD Gain</p>
                  <p
                    className={cn(
                      "font-semibold inline-flex items-center gap-1",
                      ytdGain >= 0 ? "text-crimson" : "text-ink",
                    )}
                  >
                    {ytdGain >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {ytdGain >= 0 ? "+" : "-"}${Math.abs(Math.round(ytdGain / 1000))}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Return</p>
                  <p className="font-semibold">
                    {totalReturnPct >= 0 ? "+" : ""}{totalReturnPct.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ann. Return</p>
                  <p className="font-semibold">
                    {annualizedPct >= 0 ? "+" : ""}{annualizedPct.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={portfolioSeries} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#portfolioFill)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-sm font-semibold">Portfolio Management</p>
                <p className="text-xs text-muted-foreground mt-1 tabular">
                  {totalPositions} positions · ${totalValue.toLocaleString()} total value
                </p>
                <button
                  className="mt-2 text-xs text-crimson inline-flex items-center gap-1"
                  onClick={() => navigate("/dashboard/portfolio")}
                >
                  View Portfolio <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-sm font-semibold">Deal Pipeline</p>
                <p className="text-xs text-muted-foreground mt-1">{activePipeline.length} active · {offerStageCount} offer stage</p>
                <button
                  className="mt-2 text-xs text-crimson inline-flex items-center gap-1"
                  onClick={() => navigate("/dashboard/pipeline")}
                >
                  Manage Pipeline <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-sm font-semibold">CRM & Contacts</p>
                <p className="text-xs text-muted-foreground mt-1">{pipelineContacts.length} contacts tracked</p>
                <button
                  className="mt-2 text-xs text-crimson inline-flex items-center gap-1"
                  onClick={() => navigate("/dashboard/contacts")}
                >
                  View Network <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-sm font-semibold">Recruiting Portal</p>
                <p className="text-xs text-muted-foreground mt-1">{openPrograms.length} programs open · {soonDeadlines} deadlines soon</p>
                <button
                  className="mt-2 text-xs text-crimson inline-flex items-center gap-1"
                  onClick={() => navigate("/dashboard/recruiting")}
                >
                  Browse Programs <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent activity yet — add a contact to your pipeline to see it here.
                </p>
              ) : (
                recentActivity.map((contact) => (
                  <div key={contact.id} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-crimson" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">New contact added</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.name}, {contact.firm}</p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo(contact.addedAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Team Updates</CardTitle>
              <CardDescription>Latest club news</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {posts.length === 0 && (
                <p className="text-sm text-muted-foreground">No news posted yet.</p>
              )}
              {sortNewsPosts(posts).slice(0, 3).map((item) => {
                const readMin = estimateReadMinutes(item.body);
                const meta = `${formatNewsShortDate(item.publishedAt)} \u2022 ${readMin} min read`;
                return (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="flex gap-3 rounded-[1rem] p-2 text-left transition-colors duration-base ease-smooth hover:bg-muted/70"
                  >
                    <img
                      src={getNewsCoverSrc(`${item.id}-dash`, 160, 160)}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-border/30"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                <button className="text-xs text-crimson" onClick={() => navigate("/dashboard/recruiting")}>
                  View all
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingDeadlines.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming deadlines right now.</p>
              )}
              {upcomingDeadlines.map((program) => (
                <div key={program.id} className="flex items-center justify-between gap-2 border-b last:border-b-0 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{program.firm}</p>
                    <p className="text-xs text-muted-foreground truncate">{program.role}</p>
                  </div>
                  <Badge variant="secondary" className="bg-crimson/10 text-crimson">
                    {new Date(program.deadline!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader><CardTitle className="text-sm font-medium">Upcoming Events</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming events on the calendar yet.</p>
              )}
              {upcomingEvents.map((e) => {
                const rec = currentUser ? attendance.find((a) => a.memberId === currentUser.id && a.eventId === e.id) : undefined;
                return (
                  <div key={e.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</p>
                    {rec && <Badge variant="outline" className="mt-1 text-xs">{rec.rsvp}</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
      <button
        className="fixed bottom-6 right-6 h-12 px-4 rounded-full bg-crimson text-white shadow-lg text-sm font-medium"
        onClick={() => setCheckinOpen(true)}
      >
        Weekly Check-in {!hasCheckedInThisWeek(currentUser?.id ?? "") && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-300" />}
      </button>
      <WeeklyCheckinModal open={checkinOpen} onOpenChange={setCheckinOpen} />
    </div>
  );
}
