import * as React from "react";
import { Trophy, Medal, Award, ArrowUp, ArrowDown, Search, Sparkles } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useMembers } from "../context/MembersContext";
import { useEvents } from "../context/EventsContext";
import { useConnect } from "../context/ConnectContext";
import { COMMITTEE_COLORS } from "../data/constants";
import { cn } from "../components/ui/utils";
import type { Committee, Member } from "../data/mockData";

/**
 * Score formula (documented for transparency, also surfaced under the table):
 *   score = pipelineActivity
 *         + (pitchesSubmitted   * 3)
 *         + (coffeeChats        * 2)
 *         + (offers             * 5)
 *         + (eventsAttended     * 1)
 *
 * Pitches and offers carry the biggest multipliers because they reflect the
 * highest-effort recruiting milestones; events are 1 point each so simple
 * showing-up counts but doesn't drown out the higher-value metrics.
 */
const WEIGHTS = { pipeline: 1, pitches: 3, coffee: 2, offers: 5, events: 1 };

type SortKey = "score" | "pipeline" | "pitches" | "coffee" | "offers" | "events";

const CLASS_YEARS: Member["classYear"][] = ["Freshman", "Sophomore", "Junior", "Senior"];

interface MemberStats {
  member: Member;
  pipeline: number;
  pitches: number;
  coffeeChats: number;
  offers: number;
  eventsAttended: number;
  eventsTotal: number;
  attendanceRate: number;
  score: number;
}

const SORT_LABELS: Record<SortKey, string> = {
  score: "Score",
  pipeline: "Pipeline",
  pitches: "Pitches",
  coffee: "Coffee",
  offers: "Offers",
  events: "Events",
};

function getStatValue(stats: MemberStats, key: SortKey): number {
  switch (key) {
    case "score": return stats.score;
    case "pipeline": return stats.pipeline;
    case "pitches": return stats.pitches;
    case "coffee": return stats.coffeeChats;
    case "offers": return stats.offers;
    case "events": return stats.eventsAttended;
  }
}

function rankAccent(rank: number) {
  if (rank === 1) {
    return {
      icon: <Trophy className="h-4 w-4" />,
      pill: "bg-crimson text-white",
      row: "bg-crimson/5 border-l-4 border-l-crimson",
      ring: "ring-2 ring-crimson/40",
    };
  }
  if (rank === 2) {
    return {
      icon: <Medal className="h-4 w-4" />,
      pill: "bg-slate-200 text-slate-800",
      row: "bg-slate-50 border-l-4 border-l-slate-300",
      ring: "ring-1 ring-slate-300",
    };
  }
  if (rank === 3) {
    return {
      icon: <Award className="h-4 w-4" />,
      pill: "bg-amber-100 text-amber-800",
      row: "bg-amber-50/60 border-l-4 border-l-amber-300",
      ring: "ring-1 ring-amber-300",
    };
  }
  return {
    icon: null,
    pill: "bg-muted text-muted-foreground",
    row: "border-l-4 border-l-transparent",
    ring: "",
  };
}

export default function ScoreboardPage() {
  const { members } = useMembers();
  const { getMemberAttendance } = useEvents();
  const { bookings } = useConnect();
  const [search, setSearch] = React.useState("");
  const [committee, setCommittee] = React.useState<"all" | Committee>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("score");
  const [sortDir, setSortDir] = React.useState<"desc" | "asc">("desc");
  const [activeTab, setActiveTab] = React.useState<Member["classYear"]>("Junior");

  // All metrics derive live from the same contexts the rest of the app uses,
  // so any new registration / attendance mark / pitch submission flows through
  // automatically on the next render.
  const allStats: MemberStats[] = React.useMemo(() => {
    // Deactivated members are temporarily excluded from the leaderboard so
    // ranks, podiums, and KPIs all reflect the live active cohort.
    return members.filter((m) => m.active !== false).map((m) => {
      const attendance = getMemberAttendance(m.id);
      const eventsTotal = attendance.length;
      const eventsAttended = attendance.filter((a) => a.attended).length;
      const attendanceRate = eventsTotal > 0 ? (eventsAttended / eventsTotal) * 100 : 0;
      // Prefer live booking count from ConnectContext if it has any records for
      // this member; otherwise fall back to the persisted Member field.
      const liveBookings = bookings.filter((b) => b.memberId === m.id).length;
      const coffeeChats = liveBookings > 0 ? liveBookings : m.coffeeChatsCompleted;
      const pipeline = m.pipelineActivityCount;
      const pitches = m.pitchesSubmitted;
      const offers = m.offers ?? 0;
      const score =
        pipeline * WEIGHTS.pipeline +
        pitches * WEIGHTS.pitches +
        coffeeChats * WEIGHTS.coffee +
        offers * WEIGHTS.offers +
        eventsAttended * WEIGHTS.events;
      return { member: m, pipeline, pitches, coffeeChats, offers, eventsAttended, eventsTotal, attendanceRate, score };
    });
  }, [members, getMemberAttendance, bookings]);

  // Pre-bucket by class year and rank within each class.
  const byClass = React.useMemo(() => {
    const out: Record<Member["classYear"], MemberStats[]> = {
      Freshman: [], Sophomore: [], Junior: [], Senior: [],
    };
    for (const s of allStats) out[s.member.classYear].push(s);
    for (const year of CLASS_YEARS) out[year].sort((a, b) => b.score - a.score);
    return out;
  }, [allStats]);

  // `totalMembers` reflects the active cohort (deactivated members are
  // excluded above) so KPIs stay consistent with the per-class boards.
  const totalMembers = allStats.length;
  const activeMembers = allStats.filter((s) => s.score > 0).length;
  const avgPitches = totalMembers > 0
    ? allStats.reduce((sum, s) => sum + s.pitches, 0) / totalMembers
    : 0;
  const avgAttendance = totalMembers > 0
    ? allStats.reduce((sum, s) => sum + s.attendanceRate, 0) / totalMembers
    : 0;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "desc"
      ? <ArrowDown className="h-3 w-3 inline-block ml-1" />
      : <ArrowUp className="h-3 w-3 inline-block ml-1" />;
  };

  return (
    <div className="p-6 space-y-6 bg-paper min-h-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display text-ink flex items-center gap-2">
            <Trophy className="h-7 w-7 text-crimson" />
            Scoreboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-crimson" />
            Auto-updates as members join and log activity — separate boards per class year.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Members" value={totalMembers.toString()} />
        <KpiCard
          label="Active Members"
          value={activeMembers.toString()}
          sub={`${totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}% of cohort`}
        />
        <KpiCard label="Avg Pitches" value={avgPitches.toFixed(1)} />
        <KpiCard label="Avg Attendance" value={`${avgAttendance.toFixed(0)}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="bg-white pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border px-3 text-sm bg-white"
          value={committee}
          onChange={(e) => setCommittee(e.target.value as "all" | Committee)}
        >
          <option value="all">All committees</option>
          <option value="Investment">Investment</option>
          <option value="Recruiting">Recruiting</option>
          <option value="Operations">Operations</option>
          <option value="Marketing">Marketing</option>
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Member["classYear"])}>
        <TabsList className="grid grid-cols-4 w-full md:max-w-xl bg-white">
          {CLASS_YEARS.map((year) => (
            <TabsTrigger key={year} value={year} className="data-[state=active]:bg-crimson data-[state=active]:text-white">
              {year}
              <span className="ml-1.5 text-[11px] tabular opacity-80">({byClass[year].length})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CLASS_YEARS.map((year) => (
          <TabsContent key={year} value={year} className="space-y-4 mt-4">
            <ClassBoard
              year={year}
              ranked={byClass[year]}
              search={search}
              committee={committee}
              sortKey={sortKey}
              sortDir={sortDir}
              toggleSort={toggleSort}
              sortIcon={sortIcon}
            />
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-[11px] text-muted-foreground">
        Score = pipeline + (pitches × {WEIGHTS.pitches}) + (coffee chats × {WEIGHTS.coffee}) + (offers × {WEIGHTS.offers}) + events attended.
        New members appear automatically once they finish registration.
      </p>
    </div>
  );
}

interface ClassBoardProps {
  year: Member["classYear"];
  ranked: MemberStats[];
  search: string;
  committee: "all" | Committee;
  sortKey: SortKey;
  sortDir: "desc" | "asc";
  toggleSort: (key: SortKey) => void;
  sortIcon: (key: SortKey) => React.ReactNode;
}

function ClassBoard({ year, ranked, search, committee, sortKey, sortDir, toggleSort, sortIcon }: ClassBoardProps) {
  // Ranks are computed from the full class roster (pre-filter) so a member's
  // standing is preserved even when the user filters/searches.
  const rankMap = React.useMemo(() => {
    const map = new Map<string, number>();
    ranked.forEach((s, i) => map.set(s.member.id, i + 1));
    return map;
  }, [ranked]);

  const filtered = React.useMemo(() => {
    return ranked.filter((s) => {
      const name = `${s.member.firstName} ${s.member.lastName}`.toLowerCase();
      const matchesSearch = !search || name.includes(search.toLowerCase());
      const matchesCommittee = committee === "all" || s.member.committee === committee;
      return matchesSearch && matchesCommittee;
    });
  }, [ranked, search, committee]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = getStatValue(a, sortKey);
      const bv = getStatValue(b, sortKey);
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  if (ranked.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          No {year.toLowerCase()}s yet. The first to register will take the top spot.
        </CardContent>
      </Card>
    );
  }

  const podium = ranked.slice(0, 3);

  return (
    <>
      <div>
        <h2 className="text-xl font-display text-ink mb-3">{year} Leaderboard</h2>
        {podium.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {podium.map((s, idx) => {
              const rank = idx + 1;
              const accent = rankAccent(rank);
              return (
                <Card key={s.member.id} className={cn("bg-white border", accent.ring)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold", accent.pill)}>
                        {accent.icon}
                        Rank #{rank}
                      </span>
                      <Badge className={COMMITTEE_COLORS[s.member.committee]}>{s.member.committee}</Badge>
                    </div>
                    <p className="font-display text-xl text-ink">
                      {s.member.firstName} {s.member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">Class of {s.member.graduationYear}</p>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className={cn("text-3xl font-bold tabular", rank === 1 ? "text-crimson" : "text-ink")}>
                        {s.score}
                      </span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <PodiumStat label="Pipeline" value={s.pipeline} />
                      <PodiumStat label="Pitches" value={s.pitches} />
                      <PodiumStat label="Offers" value={s.offers} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="bg-white">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 w-16">Rank</th>
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Committee</th>
                {(["pipeline", "pitches", "coffee", "offers", "events", "score"] as SortKey[]).map((key) => (
                  <SortableTh
                    key={key}
                    active={sortKey === key}
                    onClick={() => toggleSort(key)}
                  >
                    {SORT_LABELS[key]} {sortIcon(key)}
                  </SortableTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const rank = rankMap.get(s.member.id) ?? 0;
                const accent = rankAccent(rank);
                return (
                  <tr
                    key={s.member.id}
                    className={cn("border-t transition-colors hover:bg-muted/30", accent.row)}
                  >
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center justify-center gap-1 min-w-[2.75rem] px-2 py-1 rounded-md text-xs font-semibold tabular", accent.pill)}>
                        {accent.icon}
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{s.member.firstName} {s.member.lastName}</p>
                      <p className="md:hidden text-xs text-muted-foreground mt-0.5">{s.member.committee}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge className={COMMITTEE_COLORS[s.member.committee]}>{s.member.committee}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular">{s.pipeline}</td>
                    <td className="px-4 py-3 text-right tabular">{s.pitches}</td>
                    <td className="px-4 py-3 text-right tabular">{s.coffeeChats}</td>
                    <td className="px-4 py-3 text-right tabular">{s.offers}</td>
                    <td className="px-4 py-3 text-right tabular">
                      {s.eventsTotal > 0
                        ? <span>{s.eventsAttended}<span className="text-muted-foreground">/{s.eventsTotal}</span></span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("tabular font-semibold", rank === 1 && "text-crimson")}>
                        {s.score}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No {year.toLowerCase()}s match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular text-ink mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function PodiumStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular text-ink">{value}</p>
    </div>
  );
}

function SortableTh({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <th
      className={cn(
        "text-right px-4 py-3 cursor-pointer select-none hover:text-foreground",
        active && "text-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </th>
  );
}
