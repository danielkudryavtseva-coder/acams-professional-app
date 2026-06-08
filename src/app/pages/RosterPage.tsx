import * as React from "react";
import { ExternalLink, Mail, Phone, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { useMembers } from "../context/MembersContext";
import { useAuth } from "../context/AuthContext";
import { useTags } from "../context/TagsContext";
import { COMMITTEE_COLORS, TRACK_COLORS } from "../data/constants";
import type { Member } from "../data/mockData";
import type { Tag } from "../data/tags";
import { TAG_CATEGORY_COLORS, type TagCategory } from "../data/tags";

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
  const { members } = useMembers();
  const { isExec, currentUser } = useAuth();
  const { tags, getTagsForMember } = useTags();
  const [search, setSearch] = React.useState("");
  const [committee, setCommittee] = React.useState("all");
  const [track, setTrack] = React.useState("all");
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);

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
      if (!ok) {
        matchesTagDims = false;
        break;
      }
    }
    return matchesSearch && matchesCommittee && matchesTrack && matchesTagDims;
  });

  return (
    <div className="p-6 space-y-4">
      <Card className="bg-white border-[#c63f60]">
        <CardContent className="p-4 font-medium">Congratulations, Spring 2026 Class!</CardContent>
      </Card>
      <div className="grid md:grid-cols-3 gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member..."
          className="bg-white"
        />
        <select
          className="h-10 rounded-md border px-3 text-sm bg-white"
          value={committee}
          onChange={(e) => setCommittee(e.target.value)}
        >
          <option value="all">All committees</option>
          <option value="Investment">Investment</option>
          <option value="Recruiting">Recruiting</option>
          <option value="Operations">Operations</option>
          <option value="Marketing">Marketing</option>
        </select>
        <select
          className="h-10 rounded-md border px-3 text-sm bg-white"
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

      <div className="rounded-lg border bg-white p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tags
          </span>
          {selectedTagIds.length > 0 && (
            <button
              type="button"
              className="text-xs text-crimson hover:underline"
              onClick={clearTagFilters}
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          OR within each category you select, AND across categories. Works with the filters above.
        </p>
        <div className="flex flex-wrap gap-3">
          {(["alumni", "career", "grade", "committee", "custom"] as TagCategory[]).map(
            (cat) => {
              const inCat = tags.filter((t) => t.category === cat);
              if (inCat.length === 0) return null;
              return (
                <div key={cat} className="min-w-[140px] space-y-1">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {cat}
                  </p>
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
            },
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const allMemberTags = getTagsForMember(m.id);
          const preview = rosterPreviewTags(allMemberTags);
          const extra = allMemberTags.length - preview.length;
          return (
            <Card key={m.id} className="bg-white">
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
                      <p className="font-semibold truncate">
                        {m.firstName} {m.lastName}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {m.role === "exec" && <Badge className="bg-amber-100 text-amber-800">Exec</Badge>}
                      {isExec && m.pnlTagged && <Badge variant="destructive">PNL</Badge>}
                      <Badge className={COMMITTEE_COLORS[m.committee]}>{m.committee}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap items-center">
                  {preview.map((t) => (
                    <Badge
                      key={t.id}
                      className={t.color ?? TAG_CATEGORY_COLORS[t.category]}
                    >
                      {t.label}
                    </Badge>
                  ))}
                  {extra > 0 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      +{extra}
                    </Badge>
                  )}
                  {preview.length === 0 && extra <= 0 && (
                    <span className="text-[11px] text-muted-foreground">No member tags</span>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {m.interests.slice(0, 2).map((i) => (
                    <Badge key={i} className={TRACK_COLORS[i]}>
                      {i}
                    </Badge>
                  ))}
                  {m.interests.length > 2 && (
                    <Badge variant="outline">+{m.interests.length - 2} more</Badge>
                  )}
                </div>
                <p className="text-xs flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" />{" "}
                  <span className="truncate">{m.email}</span>
                </p>
                <p className="text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" /> {m.phone}
                </p>
                <p className="text-xs flex items-center gap-1 truncate">
                  <ExternalLink className="h-3 w-3 shrink-0" />{" "}
                  <span className="truncate">{m.linkedin}</span>
                </p>
                <Badge variant="outline">{m.cohort}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
