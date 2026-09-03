import * as React from "react";
import { ExternalLink, Mail, Phone, User, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useMembers } from "../context/MembersContext";
import { useAuth } from "../context/AuthContext";
import { useTags } from "../context/TagsContext";
import { COMMITTEE_COLORS, TRACK_COLORS, GRAD_YEAR_LABEL } from "../data/constants";
import type { Member, Committee } from "../data/mockData";
import type { Tag } from "../data/tags";
import { TAG_CATEGORY_COLORS, type TagCategory } from "../data/tags";
import { PageHeader } from "../components/PageHeader";

// ─── GROUP PHOTOS ─────────────────────────────────────────────────────────────
// Add photos here. Place image files in /public/photos/ and reference as
// "/photos/filename.jpg". Caption is optional.
// Example: { src: "/photos/spring2026.jpg", caption: "Spring 2026" }
const ROSTER_PHOTOS: { src: string; caption?: string }[] = [];
// ──────────────────────────────────────────────────────────────────────────────

// Derived from CURRENT_COHORT (constants.ts) so it self-updates each semester instead of going stale.
const GRAD_YEAR: Record<string, string> = GRAD_YEAR_LABEL;

const CLASS_YEAR_ORDER = ["Senior", "Junior", "Sophomore", "Freshman"] as const;
const COMMITTEE_ORDER: Committee[] = ["TMT", "Contrarian", "Financials", "Consumer", "Healthcare", "Industrials & Energy"];

type ViewMode = "flat" | "committee" | "year";

const TAG_PRIORITY: Record<TagCategory, number> = {
  alumni: 0,
  career: 1,
  grade: 2,
  committee: 3,
  custom: 4,
};

function rosterPreviewTags(tags: Tag[]): Tag[] {
  return [...tags]
    .sort((a, b) => TAG_PRIORITY[a.category] - TAG_PRIORITY[b.category])
    .slice(0, 3);
}

function MemberAvatar({ member }: { member: Member }) {
  const [errored, setErrored] = React.useState(false);
  const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase();
  const showImage = member.avatarUrl && !errored;
  return (
    <div className="h-16 w-16 rounded-xl overflow-hidden border border-border bg-gradient-to-br from-[#fdecef] to-[#f3d5dc] flex items-center justify-center text-base font-semibold text-[#7a142e] shrink-0 relative">
      {showImage ? (
        <img
          src={member.avatarUrl}
          alt={`${member.firstName} ${member.lastName}`}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      ) : initials ? (
        <span aria-hidden>{initials}</span>
      ) : (
        <User className="h-6 w-6 text-[#7a142e]/60" aria-hidden />
      )}
    </div>
  );
}

export default function RosterPage() {
  const { members, updateMember } = useMembers();
  const { isExec, currentUser } = useAuth();
  const { tags, getTagsForMember } = useTags();

  const [search, setSearch] = React.useState("");
  const [committee, setCommittee] = React.useState("all");
  const [track, setTrack] = React.useState("all");
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<ViewMode>("flat");

  const tagFilterByCategory = React.useMemo(() => {
    const m = new Map<TagCategory, Set<string>>();
    for (const id of selectedTagIds) {
      const t = tags.find((x) => x.id === id);
      if (!t) continue;
      if (!m.has(t.category)) m.set(t.category, new Set());
      m.get(t.category)!.add(id);
    }
    return m;
  }, [selectedTagIds, tags]);

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId],
    );
  };

  const clearTagFilters = () => setSelectedTagIds([]);

  const filtered = members.filter((m) => {
    if (m.active === false) return false;
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const matchesCommittee = committee === "all" || m.committee === committee;
    const matchesTrack = track === "all" || m.interests.includes(track as never);
    const memberTags = getTagsForMember(m.id);
    const memberTagIds = new Set(memberTags.map((t) => t.id));
    let matchesTagDims = true;
    for (const [, wanted] of tagFilterByCategory) {
      const ok = [...wanted].some((id) => memberTagIds.has(id));
      if (!ok) { matchesTagDims = false; break; }
    }
    return matchesSearch && matchesCommittee && matchesTrack && matchesTagDims;
  });

  function MemberCard({ m }: { m: Member }) {
    const allMemberTags = getTagsForMember(m.id);
    const preview = rosterPreviewTags(allMemberTags);
    const extra = allMemberTags.length - preview.length;
    return (
      <Card className="bg-white dark:bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MemberAvatar member={m} />
            <div className="min-w-0 flex-1">
              {currentUser ? (
                <Link
                  to={`/dashboard/members/${m.id}`}
                  className="font-semibold truncate block hover:underline text-foreground"
                >
                  {m.firstName} {m.lastName}
                </Link>
              ) : (
                <p className="font-semibold truncate">{m.firstName} {m.lastName}</p>
              )}
              <div className="flex gap-1 mt-1 flex-wrap">
                {m.role === "exec" && <Badge className="bg-amber-100 text-amber-800">Exec</Badge>}
                {isExec && m.pnlTagged && <Badge variant="destructive">PNL</Badge>}
                <Badge className={COMMITTEE_COLORS[m.committee]}>{m.committee}</Badge>
              </div>
            </div>
            {/* Exec-only role toggle. Hidden on your own row to avoid accidentally
                demoting yourself out of exec access. The DB trigger still enforces
                server-side that only an exec can change this field either way. */}
            {isExec && currentUser?.id !== m.id && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 shrink-0"
                onClick={() => updateMember(m.id, { role: m.role === "exec" ? "member" : "exec" })}
              >
                {m.role === "exec" ? "Remove Exec" : "Make Exec"}
              </Button>
            )}
          </div>
          <div className="flex gap-1 flex-wrap items-center">
            {preview.map((t) => (
              <Badge key={t.id} className={t.color ?? TAG_CATEGORY_COLORS[t.category]}>
                {t.label}
              </Badge>
            ))}
            {extra > 0 && (
              <Badge variant="outline" className="text-muted-foreground">+{extra}</Badge>
            )}
            {preview.length === 0 && extra <= 0 && (
              <span className="text-[11px] text-muted-foreground">No member tags</span>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {m.interests.slice(0, 2).map((i) => (
              <Badge key={i} className={TRACK_COLORS[i]}>{i}</Badge>
            ))}
            {m.interests.length > 2 && (
              <Badge variant="outline">+{m.interests.length - 2} more</Badge>
            )}
          </div>
          <p className="text-xs flex items-center gap-1 truncate">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{m.email}</span>
          </p>
          <p className="text-xs flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" /> {m.phone}
          </p>
          <p className="text-xs flex items-center gap-1 truncate">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{m.linkedin}</span>
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{m.cohort}</Badge>
            <span className="text-[11px] text-muted-foreground">
              {GRAD_YEAR[m.classYear] ?? m.classYear}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  function MemberGrid({ items }: { items: Member[] }) {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground py-4">No members match the current filters.</p>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((m) => <MemberCard key={m.id} m={m} />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-content mx-auto">
      <PageHeader title="Roster" />
      {/* Group photos */}
      {ROSTER_PHOTOS.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Group Photos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ROSTER_PHOTOS.map(({ src, caption }) => (
              <div key={src} className="space-y-1">
                <img
                  src={src}
                  alt={caption ?? "CAMS group photo"}
                  className="w-full aspect-[4/3] object-cover rounded-lg border"
                />
                {caption && (
                  <p className="text-xs text-muted-foreground text-center">{caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo placeholder — only shown when no photos are configured */}
      {ROSTER_PHOTOS.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center gap-2 text-muted-foreground">
          <Image className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">Group photos coming soon</p>
          <p className="text-xs">Add photos to the ROSTER_PHOTOS array in RosterPage.tsx</p>
        </div>
      )}

      {/* Announcement banner */}
      <Card className="bg-white border-crimson dark:bg-card">
        <CardContent className="p-4 font-medium">Congratulations, Spring 2026 Class!</CardContent>
      </Card>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member..."
          className="bg-white dark:bg-card"
        />
        <select
          className="h-10 rounded-md border px-3 text-sm bg-white dark:bg-card"
          value={committee}
          onChange={(e) => setCommittee(e.target.value)}
        >
          <option value="all">All committees</option>
          {COMMITTEE_ORDER.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border px-3 text-sm bg-white dark:bg-card"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
        >
          <option value="all">All tracks</option>
          <option value="IB">IB</option>
          <option value="PE">PE</option>
          <option value="VC">VC</option>
          <option value="ER">ER</option>
          <option value="AM">AM</option>
          <option value="Consulting">Consulting</option>
        </select>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {(["flat", "committee", "year"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode
                ? "bg-white dark:bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode === "flat" ? "All Members" : mode === "committee" ? "By Committee" : "By Year"}
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground pr-1">
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tag filters */}
      <div className="rounded-lg border bg-white dark:bg-card p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</span>
          {selectedTagIds.length > 0 && (
            <button type="button" className="text-xs text-crimson hover:underline" onClick={clearTagFilters}>
              Clear
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          OR within each category, AND across categories.
        </p>
        <div className="flex flex-wrap gap-3">
          {(["alumni", "career", "grade", "committee", "custom"] as TagCategory[]).map((cat) => {
            const inCat = tags.filter((t) => t.category === cat);
            if (inCat.length === 0) return null;
            return (
              <div key={cat} className="min-w-[140px] space-y-1">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">{cat}</p>
                <div className="flex flex-wrap gap-1">
                  {inCat.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTagFilter(t.id)}
                      className={`text-[10px] rounded-full border px-2 py-0.5 transition-colors ${
                        selectedTagIds.includes(t.id)
                          ? "border-crimson bg-crimson/10 text-crimson"
                          : "border-border bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member list */}
      {viewMode === "flat" && <MemberGrid items={filtered} />}

      {viewMode === "committee" && (
        <div className="space-y-8">
          {COMMITTEE_ORDER.map((com) => {
            const group = filtered.filter((m) => m.committee === com);
            if (group.length === 0) return null;
            return (
              <section key={com}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`${COMMITTEE_COLORS[com]} text-sm px-3 py-1`}>{com}</Badge>
                  <span className="text-sm text-muted-foreground">{group.length} member{group.length !== 1 ? "s" : ""}</span>
                </div>
                <MemberGrid items={group} />
              </section>
            );
          })}
        </div>
      )}

      {viewMode === "year" && (
        <div className="space-y-8">
          {CLASS_YEAR_ORDER.map((yr) => {
            const group = filtered.filter((m) => m.classYear === yr);
            if (group.length === 0) return null;
            return (
              <section key={yr}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-semibold text-base">{yr}</h3>
                  <Badge variant="outline">{GRAD_YEAR[yr]}</Badge>
                  <span className="text-sm text-muted-foreground">{group.length} member{group.length !== 1 ? "s" : ""}</span>
                </div>
                <MemberGrid items={group} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
