import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";
import { useEvents } from "../context/EventsContext";
import { useTags } from "../context/TagsContext";
import { sortNewsPosts, useNews } from "../context/NewsContext";
import { NEWS_AUDIENCE_LABELS } from "../data/mockData";
import { usePnlAutoTagging } from "../hooks/usePnlAutoTagging";
import { PageHeader } from "../components/PageHeader";
import {
  TAG_CATEGORY_LABELS,
  type TagCategory,
} from "../data/tags";

export default function ExecToolsPage() {
  // This whole page lives behind RequireExec (see routes.tsx) — every viewer
  // here is already a confirmed exec, enforced server-side by Supabase RLS.
  const { currentUser } = useAuth();
  const { members, setPnlTag } = useMembers();
  const { getConsecutiveMisses, events, attendance } = useEvents();
  usePnlAutoTagging();
  const {
    tags,
    assignments,
    approveTag,
    rejectTag,
    createCustomTag,
  } = useTags();
  const { posts } = useNews();
  // Keyed by member id — a single shared string here would let typing a reason
  // for one member's row leak into whichever row's "Tag PNL" gets clicked next.
  const [reasons, setReasons] = React.useState<Record<string, string>>({});

  const [customLabel, setCustomLabel] = React.useState("");
  const [customCategory, setCustomCategory] = React.useState<TagCategory>("custom");
  const [customColor, setCustomColor] = React.useState("");
  const [customRequiresApproval, setCustomRequiresApproval] = React.useState(false);

  const pastMandatory = React.useMemo(
    () => events.filter((e) => e.mandatory && new Date(e.date) < new Date()),
    [events],
  );
  const attendancePct = React.useMemo(() => {
    const expected = pastMandatory.length * members.length;
    if (expected === 0) return 100;
    const attended = attendance.filter(
      (a) => a.attended === true && pastMandatory.some((e) => e.id === a.eventId),
    ).length;
    return Math.round((attended / expected) * 100);
  }, [pastMandatory, members, attendance]);
  const checkinPct = React.useMemo(() => {
    const total = attendance.filter((a) => a.rsvp === "confirmed").length;
    if (total === 0) return 100;
    const confirmed = attendance.filter((a) => a.attended === true).length;
    return Math.round((confirmed / total) * 100);
  }, [attendance]);
  const pnlPenalty = Math.min(20, members.filter((m) => m.pnlTagged).length * 2);
  const score = Math.max(0, Math.round(attendancePct * 0.5 + checkinPct * 0.3 - pnlPenalty));

  const pendingAll = React.useMemo(
    () => assignments.filter((a) => a.status === "pending"),
    [assignments],
  );

  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : id;
  };

  return (
    <div className="p-6 space-y-6 max-w-content mx-auto">
      <PageHeader title="Exec Tools" description="Member standing, tag approvals, and society-wide notifications." />
      <Card className="bg-white dark:bg-card">
        <CardHeader>
          <CardTitle>Cohort Health Score: {score}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={score} />
        </CardContent>
      </Card>
      <Tabs defaultValue="members">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="members">Members Overview</TabsTrigger>
          <TabsTrigger value="tags">Alumni &amp; tag approvals</TabsTrigger>
          <TabsTrigger value="notifications">Mass Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="space-y-2">
          {members.map((m) => (
            <Card key={m.id} className="bg-white dark:bg-card">
              <CardContent className="p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.committee} · consecutive misses: {getConsecutiveMisses(m.id)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {m.pnlTagged ? (
                    <Badge variant="destructive">PNL</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  )}
                  <Input
                    value={reasons[m.id] ?? ""}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    placeholder="Reason"
                    className="h-8 w-44"
                  />
                  <Button
                    size="sm"
                    onClick={() => setPnlTag(m.id, !m.pnlTagged, reasons[m.id] || undefined)}
                  >
                    {m.pnlTagged ? "Remove PNL" : "Tag PNL"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card className="bg-white dark:bg-card">
            <CardHeader>
              <CardTitle className="text-base">Pending tag requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingAll.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending tag approvals.</p>
              ) : (
                pendingAll.map((a) => {
                  const tag = tags.find((t) => t.id === a.tagId);
                  return (
                    <div
                      key={a.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium">
                          <Link
                            to={`/dashboard/members/${a.memberId}`}
                            className="hover:underline text-crimson"
                          >
                            {memberName(a.memberId)}
                          </Link>
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · {tag?.label ?? a.tagId}
                          </span>
                        </p>
                        {a.reason && (
                          <p className="text-xs text-muted-foreground italic truncate">
                            {a.reason}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          Requested {new Date(a.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      {currentUser && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-600 text-emerald-700"
                            onClick={() => approveTag(a.id, currentUser.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-crimson text-crimson"
                            onClick={() => rejectTag(a.id, currentUser.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Authoring a new tag type is an occasional admin task, not the primary reason an
              exec opens this tab (approving pending requests, above, is) — collapsed by
              default so it doesn't compete with the approval queue for attention. */}
          <Accordion type="single" collapsible>
            <AccordionItem value="tag-catalog" className="border-none">
              <Card className="bg-white dark:bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="text-left">
                    <p className="text-base font-semibold">Tag catalog (custom)</p>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">
                      Admin — define a new tag type members can request
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <div className="space-y-3 max-w-md">
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        className="mt-1"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="e.g. Sector — Healthcare"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Category</Label>
                      <select
                        className="mt-1 h-10 w-full rounded-md border px-3 text-sm bg-white dark:bg-card"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as TagCategory)}
                      >
                        {(Object.keys(TAG_CATEGORY_LABELS) as TagCategory[]).map((c) => (
                          <option key={c} value={c}>
                            {TAG_CATEGORY_LABELS[c]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Tailwind chip classes (optional)</Label>
                      <Input
                        className="mt-1"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="bg-teal-100 text-teal-900"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="req-appr"
                        checked={customRequiresApproval}
                        onCheckedChange={(v) => setCustomRequiresApproval(v === true)}
                      />
                      <Label htmlFor="req-appr" className="text-sm font-normal cursor-pointer">
                        Requires exec approval
                      </Label>
                    </div>
                    <Button
                      type="button"
                      disabled={!customLabel.trim() || !currentUser}
                      onClick={() => {
                        if (!currentUser) return;
                        createCustomTag(
                          {
                            category: customCategory,
                            label: customLabel.trim(),
                            color: customColor.trim() || undefined,
                            requiresApproval: customRequiresApproval,
                            execOnly: true,
                          },
                          currentUser.id,
                        );
                        setCustomLabel("");
                        setCustomColor("");
                        setCustomRequiresApproval(false);
                      }}
                    >
                      Add to catalog
                    </Button>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-white dark:bg-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Recently sent</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Every audience-scoped update sent to <span className="text-crimson font-medium">/news</span> and the home page.
                  </p>
                </div>
                <Button className="bg-crimson text-white hover:bg-crimson/90 shrink-0" asChild>
                  <Link to="/dashboard/exec/new-post">New post</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing published yet.</p>
              ) : (
                sortNewsPosts(posts).slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.publishedAt).toLocaleString()} · {p.author}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {NEWS_AUDIENCE_LABELS[p.audience ?? "all"]}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
