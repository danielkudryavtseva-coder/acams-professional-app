import * as React from "react";
import { addDays, addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  Filter,
  Lightbulb,
  PanelLeft,
  PanelLeftClose,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { cn } from "../components/ui/utils";
import { FirmIntelModal } from "../components/FirmIntelModal";
import { MOCK_PROGRAMS, type Program, type ProgramCategory, type ProgramClassYear, type ProgramTrack } from "../data/mockData";

const TARGET_YEARS: ProgramClassYear[] = ["Freshman", "Sophomore", "Junior", "Senior"];

const TRACK_LABELS: Record<ProgramTrack, string> = {
  IB: "Investment Banking",
  PE: "Private Equity",
  HF: "Hedge Fund",
  AM: "Asset Management",
  VC: "Venture Capital",
  consulting: "Consulting",
  ER: "Equity Research",
  ST: "Sales & Trading",
  RX: "Restructuring",
  Multi: "Multi-Division",
};

const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  SA: "Summer Analyst",
  FT: "Full-Time",
  Sophomore: "Sophomore",
  Freshman: "Freshman",
  Insight: "Insight",
  Discovery: "Discovery",
  Fellowship: "Fellowship",
  OffCycle: "Off-Cycle",
};

const TRACK_COLORS: Record<ProgramTrack, string> = {
  IB: "#c63f60",
  PE: "#7d2c45",
  HF: "#3a3a3a",
  AM: "#5a8ca8",
  VC: "#f0a500",
  consulting: "#94a3b8",
  ER: "#2f6b8a",
  ST: "#a05a3c",
  RX: "#8b1d3f",
  Multi: "#2f2e2e",
};

const STATUS_FILTERS = ["now", "opening", "closing"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function getProgramClassYears(p: Program): ProgramClassYear[] {
  if (p.classYears && p.classYears.length) return p.classYears;
  const lower = p.role.toLowerCase();
  const inferred: ProgramClassYear[] = [];
  if (lower.includes("freshman")) inferred.push("Freshman");
  if (lower.includes("sophomore")) inferred.push("Sophomore");
  if (lower.includes("junior")) inferred.push("Junior");
  if (lower.includes("senior")) inferred.push("Senior");
  return inferred.length ? inferred : ["Junior"];
}

/**
 * Parse an ISO date string as local noon to avoid UTC-midnight timezone drift.
 * e.g. "2026-06-09" → June 9 12:00 local (not June 8 19:00 in UTC-5).
 * Non-ISO strings fall through to the browser's native parser.
 */
function parseLocalDate(iso: string): Date {
  const parts = iso.split("T")[0].split("-").map(Number);
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  return new Date(iso);
}

function programIsNowOpen(p: Program, today: Date): boolean {
  if (p.status === "closed") return false;
  const open = p.openDate ? parseLocalDate(p.openDate) : null;
  const close = p.deadline ? parseLocalDate(p.deadline) : null;
  if (open && open > today) return false;
  if (close && close < today && !p.rolling) return false;
  return p.status === "open" || p.status === "applied" || p.status === "interviewing";
}

function programIsOpeningSoon(p: Program, today: Date): boolean {
  if (!p.openDate) return false;
  const open = parseLocalDate(p.openDate);
  if (isNaN(open.getTime())) return false;
  const days = (open.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 60;
}

function programIsClosingSoon(p: Program, today: Date): boolean {
  if (!p.deadline) return false;
  const close = parseLocalDate(p.deadline);
  if (close < today) return false;
  const days = (close.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

function formatDateShort(iso?: string): string {
  if (!iso) return "TBD";
  const d = parseLocalDate(iso);
  if (isNaN(d.getTime())) return iso;
  return format(d, "MMM d, yyyy");
}

export default function RecruitingPage() {
  const [search, setSearch] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(true);
  const [selectedTargetYears, setSelectedTargetYears] = React.useState<ProgramClassYear[]>([...TARGET_YEARS]);
  const [selectedStatusFilters, setSelectedStatusFilters] = React.useState<StatusFilter[]>([]);
  const [selectedTracks, setSelectedTracks] = React.useState<ProgramTrack[]>(
    Object.keys(TRACK_LABELS) as ProgramTrack[],
  );
  const [selectedCategories, setSelectedCategories] = React.useState<ProgramCategory[]>(
    Object.keys(CATEGORY_LABELS) as ProgramCategory[],
  );
  const [diversityOnly, setDiversityOnly] = React.useState(false);
  const [expandedFilters, setExpandedFilters] = React.useState<Record<string, boolean>>({
    "Target Year": true,
    Sectors: true,
    "Opportunity Type": true,
    Firms: false,
    Other: false,
  });
  const allFirms = React.useMemo(
    () => [...new Set(MOCK_PROGRAMS.map((p) => p.firm))].sort((a, b) => a.localeCompare(b)),
    [],
  );
  const [selectedFirms, setSelectedFirms] = React.useState<string[]>(allFirms);
  const [intelFirm, setIntelFirm] = React.useState<string | null>(null);
  const [month, setMonth] = React.useState(new Date());
  const [deadlineMonth, setDeadlineMonth] = React.useState(new Date());
  const [briefingOpen, setBriefingOpen] = React.useState(false);

  const today = React.useMemo(() => new Date(), []);

  // Sector distribution derived from the dataset itself.
  const sectorData = React.useMemo(() => {
    const counts = new Map<ProgramTrack, number>();
    for (const p of MOCK_PROGRAMS) counts.set(p.type, (counts.get(p.type) ?? 0) + 1);
    const total = MOCK_PROGRAMS.length || 1;
    return [...counts.entries()]
      .map(([track, n]) => ({
        name: TRACK_LABELS[track],
        track,
        value: (n / total) * 100,
        count: n,
        fill: TRACK_COLORS[track],
      }))
      .sort((a, b) => b.value - a.value);
  }, []);

  // Opening + closing timeline: bucket the next 8 weeks of open dates and deadlines.
  const deadlineBars = React.useMemo(() => {
    const buckets: { week: string; opening: number; closing: number; date: Date }[] = [];
    for (let i = 0; i < 8; i++) {
      const weekStart = addDays(today, i * 7);
      buckets.push({ week: format(weekStart, "MMM d"), opening: 0, closing: 0, date: weekStart });
    }
    for (const p of MOCK_PROGRAMS) {
      if (p.deadline) {
        const d = parseLocalDate(p.deadline);
        if (!isNaN(d.getTime())) {
          const days = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0 && days < 56) buckets[Math.floor(days / 7)].closing += 1;
        }
      }
      if (p.openDate) {
        const d = parseLocalDate(p.openDate);
        if (!isNaN(d.getTime())) {
          const days = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (days >= 0 && days < 56) buckets[Math.floor(days / 7)].opening += 1;
        }
      }
    }
    return buckets;
  }, [today]);

  const filteredPrograms = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_PROGRAMS.filter((p) => {
      if (q) {
        const haystack = `${p.firm} ${p.role} ${p.division ?? ""} ${p.programName ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (!selectedFirms.includes(p.firm)) return false;
      if (!selectedTracks.includes(p.type)) return false;
      if (p.category && !selectedCategories.includes(p.category)) return false;
      if (diversityOnly && !p.diversity) return false;
      const years = getProgramClassYears(p);
      if (!years.some((y) => selectedTargetYears.includes(y))) return false;
      if (selectedStatusFilters.length === 0) return true;
      return selectedStatusFilters.some((s) => {
        if (s === "now") return programIsNowOpen(p, today);
        if (s === "opening") return programIsOpeningSoon(p, today);
        if (s === "closing") return programIsClosingSoon(p, today);
        return false;
      });
    });
  }, [
    search,
    selectedFirms,
    selectedTracks,
    selectedCategories,
    selectedTargetYears,
    selectedStatusFilters,
    diversityOnly,
    today,
  ]);

  // Sort: now-open first, then by closest deadline.
  const sortedPrograms = React.useMemo(() => {
    return [...filteredPrograms].sort((a, b) => {
      const aOpen = programIsNowOpen(a, today) ? 0 : 1;
      const bOpen = programIsNowOpen(b, today) ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      const aD = a.deadline ? parseLocalDate(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const bD = b.deadline ? parseLocalDate(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return aD - bD;
    });
  }, [filteredPrograms, today]);

  // Deadline + opening mini-calendar — uses filteredPrograms so it respects active filters.
  const deadlineCalendar = React.useMemo(() => {
    const start = startOfMonth(deadlineMonth);
    const daysInMonth = endOfMonth(deadlineMonth).getDate();
    const offset = start.getDay();
    const cells = Array.from({ length: 42 }).map((_, idx) => {
      const day = idx - offset + 1;
      return day > 0 && day <= daysInMonth ? day : null;
    });
    const byDay = new Map<number, Program[]>();
    const byOpenDay = new Map<number, Program[]>();
    const y = deadlineMonth.getFullYear();
    const m = deadlineMonth.getMonth();
    for (const p of filteredPrograms) {
      if (p.deadline) {
        const d = parseLocalDate(p.deadline);
        if (!isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m) {
          const day = d.getDate();
          const arr = byDay.get(day) ?? [];
          arr.push(p);
          byDay.set(day, arr);
        }
      }
      if (p.openDate) {
        const d = parseLocalDate(p.openDate);
        if (!isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m) {
          const day = d.getDate();
          const arr = byOpenDay.get(day) ?? [];
          arr.push(p);
          byOpenDay.set(day, arr);
        }
      }
    }
    return { cells, byDay, byOpenDay };
  }, [deadlineMonth, filteredPrograms]);

  const deadlineCount = React.useMemo(() => {
    let closing = 0;
    let opening = 0;
    for (const arr of deadlineCalendar.byDay.values()) closing += arr.length;
    for (const arr of deadlineCalendar.byOpenDay.values()) opening += arr.length;
    return { closing, opening, total: closing + opening };
  }, [deadlineCalendar]);

  const isCurrentMonth =
    deadlineMonth.getFullYear() === today.getFullYear() && deadlineMonth.getMonth() === today.getMonth();

  const calendarCells = React.useMemo(() => {
    const start = startOfMonth(month);
    const daysInMonth = endOfMonth(month).getDate();
    const offset = start.getDay();
    return Array.from({ length: 42 })
      .map((_, idx) => idx - offset + 1)
      .map((day) => (day > 0 && day <= daysInMonth ? day : null));
  }, [month]);

  const headlineCounts = React.useMemo(() => {
    let now = 0;
    let opening = 0;
    let closing = 0;
    let diversity = 0;
    for (const p of MOCK_PROGRAMS) {
      if (programIsNowOpen(p, today)) now += 1;
      if (programIsOpeningSoon(p, today)) opening += 1;
      if (programIsClosingSoon(p, today)) closing += 1;
      if (p.diversity) diversity += 1;
    }
    return { now, opening, closing, diversity, total: MOCK_PROGRAMS.length };
  }, [today]);

  const toggleTrack = (t: ProgramTrack) =>
    setSelectedTracks((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleCategory = (c: ProgramCategory) =>
    setSelectedCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleStatus = (s: StatusFilter) =>
    setSelectedStatusFilters((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  return (
    <div className="p-4 w-full bg-[#e1e7f74d] min-h-screen">
      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          <div className={cn("grid grid-cols-1 gap-4", filtersOpen ? "xl:grid-cols-[280px_1fr]" : "xl:grid-cols-1")}>
            {filtersOpen && (
              <div className="space-y-4">
              <aside className="bg-white border rounded-xl p-4 h-fit space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 px-2 text-xs"
                    onClick={() => setFiltersOpen(false)}
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" /> Hide
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9"
                    placeholder="Firm, role, division..."
                  />
                </div>

                <FilterGroup
                  label="Target Year"
                  expanded={expandedFilters["Target Year"]}
                  onToggle={() => setExpandedFilters((p) => ({ ...p, "Target Year": !p["Target Year"] }))}
                >
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTargetYears([...TARGET_YEARS])}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                    >
                      All
                    </button>
                    {TARGET_YEARS.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() =>
                          setSelectedTargetYears((prev) =>
                            prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
                          )
                        }
                      >
                        <Badge
                          className={cn(
                            "hover:bg-[#c63f60]",
                            selectedTargetYears.includes(year)
                              ? "bg-[#c63f60] text-white"
                              : "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20",
                          )}
                        >
                          {year}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup
                  label="Sectors"
                  expanded={expandedFilters.Sectors}
                  onToggle={() => setExpandedFilters((p) => ({ ...p, Sectors: !p.Sectors }))}
                >
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      onClick={() => setSelectedTracks(Object.keys(TRACK_LABELS) as ProgramTrack[])}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      onClick={() => setSelectedTracks([])}
                    >
                      None
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(Object.keys(TRACK_LABELS) as ProgramTrack[]).map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTracks.includes(t)}
                          onChange={() => toggleTrack(t)}
                          className="accent-[#c63f60]"
                        />
                        <span
                          className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: TRACK_COLORS[t] }}
                        />
                        <span className="flex-1">{TRACK_LABELS[t]}</span>
                      </label>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup
                  label="Opportunity Type"
                  expanded={expandedFilters["Opportunity Type"]}
                  onToggle={() => setExpandedFilters((p) => ({ ...p, "Opportunity Type": !p["Opportunity Type"] }))}
                >
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      onClick={() => setSelectedCategories(Object.keys(CATEGORY_LABELS) as ProgramCategory[])}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      onClick={() => setSelectedCategories([])}
                    >
                      None
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(CATEGORY_LABELS) as ProgramCategory[]).map((c) => (
                      <button key={c} type="button" onClick={() => toggleCategory(c)}>
                        <Badge
                          className={cn(
                            "hover:bg-[#c63f60] cursor-pointer",
                            selectedCategories.includes(c)
                              ? "bg-[#c63f60] text-white"
                              : "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20",
                          )}
                        >
                          {CATEGORY_LABELS[c]}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup
                  label="Other"
                  expanded={expandedFilters.Other}
                  onToggle={() => setExpandedFilters((p) => ({ ...p, Other: !p.Other }))}
                >
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={diversityOnly}
                      onChange={(e) => setDiversityOnly(e.target.checked)}
                      className="accent-[#c63f60]"
                    />
                    <ShieldCheck className="h-3.5 w-3.5 text-[#c63f60]" />
                    <span>Diversity / affinity programs only</span>
                  </label>
                </FilterGroup>

                <FilterGroup
                  label={`Firms (${selectedFirms.length}/${allFirms.length})`}
                  expanded={expandedFilters.Firms}
                  onToggle={() => setExpandedFilters((p) => ({ ...p, Firms: !p.Firms }))}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedFirms(allFirms)}
                    >
                      All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSelectedFirms([])}
                    >
                      None
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {allFirms.map((f) => (
                      <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFirms.includes(f)}
                          onChange={(e) =>
                            setSelectedFirms((prev) =>
                              e.target.checked ? [...prev, f] : prev.filter((x) => x !== f),
                            )
                          }
                          className="accent-[#c63f60]"
                        />
                        <span className="truncate">{f}</span>
                      </label>
                    ))}
                  </div>
                </FilterGroup>
              </aside>

              <MarketIntelBriefing open={briefingOpen} onToggle={() => setBriefingOpen((v) => !v)} />
              </div>
            )}

            <div className="space-y-4 min-w-0">
              {!filtersOpen && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white hover:bg-white"
                  onClick={() => setFiltersOpen(true)}
                >
                  <PanelLeft className="h-4 w-4" /> Show Filters
                </Button>
              )}

              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-bold">Recruiting & Programs</h1>
                  <p className="text-sm text-muted-foreground">
                    Capstone Asset Management Society · University of Alabama · {headlineCounts.total} tracked programs
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Today: {today.toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryStat label="Now Open" value={headlineCounts.now} icon={<Sparkles className="h-3.5 w-3.5" />} />
                <SummaryStat label="Opening Soon" value={headlineCounts.opening} icon={<Clock3 className="h-3.5 w-3.5" />} />
                <SummaryStat
                  label="Closing in 14d"
                  value={headlineCounts.closing}
                  icon={<CircleAlert className="h-3.5 w-3.5" />}
                />
                <SummaryStat
                  label="Diversity / affinity"
                  value={headlineCounts.diversity}
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                />
              </div>

              <div className="bg-white border rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  <Card className="bg-white h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sector Distribution</CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-1">{MOCK_PROGRAMS.length} programs across {sectorData.length} sectors</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                          <Pie data={sectorData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68}>
                            {sectorData.map((s) => (
                              <Cell key={s.name} fill={s.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(
                              value: number,
                              _name,
                              item: { payload?: { name?: string; count?: number } },
                            ) => {
                              const p = item.payload;
                              return [
                                `${value.toFixed(1)}% (${p?.count ?? 0})`,
                                p?.name ?? "",
                              ];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
                        {sectorData.map((s) => (
                          <div key={s.name} className="flex items-center gap-2 text-xs">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }} />
                            <span className="text-muted-foreground flex-1 truncate">{s.name}</span>
                            <span className="font-medium tabular-nums">
                              {s.count} · {s.value.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">Deadline Calendar</CardTitle>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setDeadlineMonth((m) => addMonths(m, -1))}
                            aria-label="Previous month"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs font-medium min-w-[88px] text-center">
                            {format(deadlineMonth, "MMM yyyy")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setDeadlineMonth((m) => addMonths(m, 1))}
                            aria-label="Next month"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-muted-foreground">
                          {deadlineCount.total === 0
                            ? "No events this month"
                            : `${deadlineCount.opening} opening · ${deadlineCount.closing} closing (filtered)`}
                        </p>
                        {!isCurrentMonth && (
                          <button
                            type="button"
                            className="text-[11px] text-[#c63f60] hover:underline"
                            onClick={() => setDeadlineMonth(new Date())}
                          >
                            Today
                          </button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1">
                      <div className="grid grid-cols-7 gap-1 text-center text-xs w-full">
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                          <div key={`dow-${i}`} className="text-muted-foreground py-1 font-medium">
                            {d}
                          </div>
                        ))}
                        <div className="col-span-7 flex items-center gap-3 pb-1 pt-0.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Opens</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#c63f60] inline-block" /> Closes</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Both</span>
                        </div>
                        {deadlineCalendar.cells.map((day, i) => {
                          const closePrograms = day ? deadlineCalendar.byDay.get(day) : undefined;
                          const openPrograms = day ? deadlineCalendar.byOpenDay.get(day) : undefined;
                          const hasClose = !!closePrograms?.length;
                          const hasOpen = !!openPrograms?.length;
                          const isToday = day != null && isCurrentMonth && day === today.getDate();
                          const titleLines = [
                            ...(openPrograms ?? []).map((p) => `↑ Opens: ${p.firm} — ${p.role}`),
                            ...(closePrograms ?? []).map((p) => `✕ Closes: ${p.firm} — ${p.role}`),
                          ];
                          return (
                            <div
                              key={i}
                              title={titleLines.length ? titleLines.join("\n") : undefined}
                              className={cn(
                                "h-8 rounded-md flex items-center justify-center border text-[11px] relative cursor-default",
                                day === null && "border-transparent",
                                hasClose && !hasOpen && "bg-[#c63f60]/10 border-[#c63f60] text-[#c63f60] font-semibold",
                                hasOpen && !hasClose && "bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold",
                                hasOpen && hasClose && "bg-amber-50 border-amber-500 text-amber-700 font-semibold",
                                !hasClose && !hasOpen && day !== null && "border-border",
                                isToday && "ring-1 ring-[#c63f60]",
                              )}
                            >
                              {day ?? ""}
                              {(hasClose || hasOpen) && (
                                <span className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5">
                                  {hasOpen && <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block" />}
                                  {hasClose && <span className="h-1 w-1 rounded-full bg-[#c63f60] inline-block" />}
                                </span>
                              )}
                              {(hasClose || hasOpen) && ((closePrograms?.length ?? 0) + (openPrograms?.length ?? 0)) > 1 && (
                                <span className="absolute top-0.5 right-0.5 text-[8px] leading-none font-bold">
                                  {(closePrograms?.length ?? 0) + (openPrograms?.length ?? 0)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white h-full flex flex-col">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Opening & Closing Timeline (Next 8 weeks)</CardTitle>
                      <p className="text-[11px] text-muted-foreground mt-1">Programs opening and closing by calendar week</p>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1">
                      <div className="h-full min-h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={deadlineBars} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="opening" name="Opening" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="closing" name="Closing" fill="#c63f60" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Available Programs
                    <span className="text-xs text-muted-foreground font-normal">
                      ({sortedPrograms.length} of {MOCK_PROGRAMS.length})
                    </span>
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={selectedStatusFilters.length === 0 ? "default" : "outline"}
                      size="sm"
                      className={selectedStatusFilters.length === 0 ? "bg-[#2f2e2e] hover:bg-[#2f2e2e]" : ""}
                      onClick={() => setSelectedStatusFilters([])}
                    >
                      All Programs
                    </Button>
                    <Button
                      variant={selectedStatusFilters.includes("now") ? "default" : "outline"}
                      size="sm"
                      className={selectedStatusFilters.includes("now") ? "bg-[#c63f60] hover:bg-[#c63f60]" : ""}
                      onClick={() => toggleStatus("now")}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> Now Open
                    </Button>
                    <Button
                      variant={selectedStatusFilters.includes("opening") ? "default" : "outline"}
                      size="sm"
                      className={selectedStatusFilters.includes("opening") ? "bg-[#c63f60] hover:bg-[#c63f60]" : ""}
                      onClick={() => toggleStatus("opening")}
                    >
                      <Clock3 className="h-3.5 w-3.5 mr-1" /> Opening Soon
                    </Button>
                    <Button
                      variant={selectedStatusFilters.includes("closing") ? "default" : "outline"}
                      size="sm"
                      className={selectedStatusFilters.includes("closing") ? "bg-[#c63f60] hover:bg-[#c63f60]" : ""}
                      onClick={() => toggleStatus("closing")}
                    >
                      <CircleAlert className="h-3.5 w-3.5 mr-1" /> Closing Soon
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {sortedPrograms.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-12">
                      No programs match these filters. Try widening the search or toggling status chips.
                    </div>
                  )}
                  {sortedPrograms.map((program) => (
                    <ProgramRow
                      key={program.id}
                      program={program}
                      today={today}
                      onIntel={() => setIntelFirm(program.firm)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Recruiting Calendar</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Showing deadlines for {filteredPrograms.length} filtered programs
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, -1))}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Badge variant="outline" className="px-3 text-sm font-medium">{format(month, "MMMM yyyy")}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="font-semibold text-muted-foreground pb-1">
                    {d}
                  </div>
                ))}
                {calendarCells.map((day, idx) => {
                  const matches = day
                    ? filteredPrograms.filter((p) => {
                        if (!p.deadline) return false;
                        const d = parseLocalDate(p.deadline);
                        if (isNaN(d.getTime())) return false;
                        return (
                          d.getFullYear() === month.getFullYear() &&
                          d.getMonth() === month.getMonth() &&
                          d.getDate() === day
                        );
                      })
                    : [];
                  const isToday =
                    day != null &&
                    month.getFullYear() === today.getFullYear() &&
                    month.getMonth() === today.getMonth() &&
                    day === today.getDate();
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[88px] border rounded-lg p-1.5 text-left text-xs overflow-hidden",
                        day === null && "border-transparent bg-transparent",
                        matches.length > 0 && "border-[#c63f60]/40 bg-[#c63f60]/5",
                        isToday && "ring-2 ring-[#c63f60]",
                      )}
                      title={matches.map((p) => `${p.firm} – ${p.role}`).join("\n") || undefined}
                    >
                      <div className={cn("font-semibold mb-0.5", isToday && "text-[#c63f60]")}>{day ?? ""}</div>
                      {matches.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="truncate text-[10px] text-[#c63f60] leading-snug"
                        >
                          {p.firm}
                        </div>
                      ))}
                      {matches.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{matches.length - 3} more</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <FirmIntelModal firmName={intelFirm ?? ""} open={!!intelFirm} onClose={() => setIntelFirm(null)} />
    </div>
  );
}

function FilterGroup({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-full"
        onClick={onToggle}
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform flex-shrink-0", !expanded && "-rotate-90")} />
        {label}
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
}

interface AcceptanceStat {
  firm: string;
  year: string;
  applications: string;
  spots: string;
  rate: string;
  source: { label: string; href: string };
}

const ACCEPTANCE_STATS: AcceptanceStat[] = [
  {
    firm: "Goldman Sachs",
    year: "2024 SA",
    applications: "315,126",
    spots: "2,700",
    rate: "0.9%",
    source: {
      label: "businessinsider",
      href: "https://www.businessinsider.com/goldman-internship-just-got-harder-summer-analyst-acceptance-rate-2024",
    },
  },
  {
    firm: "Goldman Sachs",
    year: "2025 SA",
    applications: "360,000",
    spots: "2,600",
    rate: "0.7%",
    source: { label: "quantnet", href: "https://quantnet.com/threads/acceptance-rate-for-2025-internship.61798/" },
  },
  {
    firm: "JPMorgan",
    year: "2025 SA",
    applications: "630,000",
    spots: "4,100",
    rate: "0.6%",
    source: { label: "quantnet", href: "https://quantnet.com/threads/acceptance-rate-for-2025-internship.61798/" },
  },
  {
    firm: "Harvard (reference)",
    year: "2025",
    applications: "—",
    spots: "—",
    rate: "3.6%",
    source: {
      label: "businessinsider",
      href: "https://www.businessinsider.com/goldman-internship-just-got-harder-summer-analyst-acceptance-rate-2024",
    },
  },
];

interface IntelPoint {
  title: string;
  body: string;
  source: { label: string; href: string };
}

const RATE_DRIVERS: IntelPoint[] = [
  {
    title: "Inflated denominator: AI mass-applying",
    body: "LinkedIn now sees 11,000 applications per minute, up 45% YoY, with bots submitting applications candidates never personally reviewed.",
    source: {
      label: "nytimes",
      href: "https://www.nytimes.com/2025/06/21/business/dealbook/ai-job-applications.html",
    },
  },
  {
    title: "Shrinking numerator: leaner classes",
    body: "JPMorgan hired 4,100 interns in 2025, down from 4,500 the year before. Goldman CEO David Solomon: AI can draft 95% of an IPO prospectus in minutes — work that used to take a six-person team two weeks.",
    source: {
      label: "businessinsider",
      href: "https://www.businessinsider.com/goldman-internship-just-got-harder-summer-analyst-acceptance-rate-2024",
    },
  },
];

const TOP_TACTICS: IntelPoint[] = [
  {
    title: "Start 12–18 months early",
    body: "Top candidates start 12–18 months before the application opens, not 2 weeks before a deadline.",
    source: {
      label: "linkedin",
      href: "https://www.linkedin.com/posts/stkacs_ai-now-allows-candidates-to-apply-to-200-activity-7434392348853387264-93NE",
    },
  },
  {
    title: "Build internal champions, not contact lists",
    body: "Convert networking from 'getting seen' to building advocates inside the firm. Coffee chats are relationship-building, not checkbox exercises.",
    source: {
      label: "linkedin",
      href: "https://www.linkedin.com/posts/timvipond_goldman-sachs-ceo-ai-can-draft-95-of-an-activity-7291105515177226240-U5NF",
    },
  },
  {
    title: "Quantify everything on the resume",
    body: "Basis points, revenue figures, error reduction rates — Goldman CV reviewers scan for numbers before anything else.",
    source: {
      label: "getsmartresume",
      href: "https://www.getsmartresume.com/article/guggenheim-ibd-summer-analyst",
    },
  },
  {
    title: "Apply technicals to live markets",
    body: "Don't memorize answers. Apply DCF and LBO logic to current rate environments, deal flow, and recent transactions during Superday.",
    source: {
      label: "linkedin",
      href: "https://www.linkedin.com/posts/timvipond_goldman-sachs-ceo-ai-can-draft-95-of-an-activity-7291105515177226240-U5NF",
    },
  },
  {
    title: "Be a 'Dynamic Banker'",
    body: "Combine intense drive with adaptability, genuine curiosity, and commercial awareness — not just raw technical perfection.",
    source: {
      label: "getsmartresume",
      href: "https://www.getsmartresume.com/article/centerview-summer-analyst",
    },
  },
];

function MarketIntelBriefing({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#e1e7f74d] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-[#c63f60]/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-[#c63f60]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Market Intel: why acceptance rates are under 1% — and what the top 0.8% do</p>
            <p className="text-xs text-muted-foreground truncate">
              GS 0.7% · JPM 0.6% · harder than Harvard (3.6%). The effective competition is much smaller than the headline.
            </p>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform flex-shrink-0", !open && "-rotate-90")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            {ACCEPTANCE_STATS.map((s) => (
              <div key={`${s.firm}-${s.year}`} className="border rounded-lg p-3 bg-[#e1e7f74d]/40">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.year}</p>
                <p className="font-semibold text-sm truncate">{s.firm}</p>
                <p className="text-2xl font-bold text-[#c63f60] tabular-nums mt-1">{s.rate}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {s.applications === "—" ? "Reference comparison" : `${s.applications} apps · ${s.spots} spots`}
                </p>
                <a
                  href={s.source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#c63f60] hover:underline inline-flex items-center gap-1 mt-1"
                >
                  {s.source.label}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-[#c63f60]/5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-[#c63f60]" />
                <p className="font-semibold text-sm">Why the rates are this low</p>
              </div>
              <ul className="space-y-3">
                {RATE_DRIVERS.map((p) => (
                  <li key={p.title} className="text-xs">
                    <p className="font-medium text-sm text-[#2f2e2e]">{p.title}</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{p.body}</p>
                    <a
                      href={p.source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#c63f60] hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      {p.source.label}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border rounded-lg p-4 bg-[#7d2c45]/5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#7d2c45]" />
                <p className="font-semibold text-sm">What the top 0.8% do differently</p>
              </div>
              <ul className="space-y-3">
                {TOP_TACTICS.map((p) => (
                  <li key={p.title} className="text-xs">
                    <p className="font-medium text-sm text-[#2f2e2e]">{p.title}</p>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{p.body}</p>
                    <a
                      href={p.source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#7d2c45] hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      {p.source.label}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic border-l-2 border-[#c63f60] pl-3">
            Bottom line: the effective competition is a much smaller pool than 360,000 suggests. But at Superday the
            margin of differentiation is genuinely thin — which is where preparation over 18+ months pays off.
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function ProgramRow({
  program,
  today,
  onIntel,
}: {
  program: Program;
  today: Date;
  onIntel: () => void;
}) {
  const closingSoon = programIsClosingSoon(program, today);
  const openingSoon = programIsOpeningSoon(program, today);
  const isOpen = programIsNowOpen(program, today);
  const classYears = getProgramClassYears(program);
  return (
    <div
      className={cn(
        "border rounded-xl p-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3",
        closingSoon && "border-[#c63f60]/60 bg-[#c63f60]/5",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold">{program.firm}</p>
          <Badge
            className="text-white"
            style={{ backgroundColor: TRACK_COLORS[program.type] }}
          >
            {TRACK_LABELS[program.type]}
          </Badge>
          {program.category && (
            <Badge variant="outline" className="border-[#2f2e2e]/30 text-[#2f2e2e]">
              {CATEGORY_LABELS[program.category]}
            </Badge>
          )}
          {program.diversity && (
            <Badge className="bg-[#7d2c45] text-white gap-1">
              <ShieldCheck className="h-3 w-3" />
              Diversity
            </Badge>
          )}
          {isOpen && !closingSoon && (
            <Badge className="bg-emerald-600 text-white gap-1">
              <Sparkles className="h-3 w-3" /> Open
            </Badge>
          )}
          {closingSoon && (
            <Badge className="bg-[#c63f60] text-white gap-1">
              <CircleAlert className="h-3 w-3" />
              Closes soon
            </Badge>
          )}
          {openingSoon && !isOpen && (
            <Badge variant="outline" className="border-[#c63f60] text-[#c63f60]">
              Opening soon
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {program.role}
          {program.division && ` · ${program.division}`}
        </p>
        {program.diversityTypes && program.diversityTypes.length > 0 && (
          <p className="text-xs text-[#7d2c45] mt-1">
            Affinity: {program.diversityTypes.join(", ")}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {classYears.join(" / ")}
          </span>
          {program.location && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> {program.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" /> Open: {formatDateShort(program.openDate)}
          </span>
          <span className="flex items-center gap-1">
            <CircleAlert className="h-3.5 w-3.5" /> Close: {formatDateShort(program.deadline)}
            {program.rolling && " (rolling)"}
          </span>
        </div>
        {program.notes && (
          <p className="text-xs text-muted-foreground mt-2 italic">{program.notes}</p>
        )}
      </div>
      <div className="flex flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onIntel}>
          Firm Intel
        </Button>
        {program.applicationLink ? (
          <Button size="sm" className="bg-[#c63f60] hover:bg-[#c63f60]" asChild>
            <a href={program.applicationLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Apply
            </a>
          </Button>
        ) : (
          <Button size="sm" className="bg-[#c63f60] hover:bg-[#c63f60]" disabled>
            Apply
          </Button>
        )}
      </div>
    </div>
  );
}
