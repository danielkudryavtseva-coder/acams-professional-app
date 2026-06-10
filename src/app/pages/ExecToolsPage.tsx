import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Link } from "react-router-dom";
import { EXEC_PASSWORD } from "../data/constants";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";
import { useEvents } from "../context/EventsContext";
import { useTags } from "../context/TagsContext";
import {
  TAG_CATEGORY_LABELS,
  type TagCategory,
} from "../data/tags";

export default function ExecToolsPage() {
  const { isExec, currentUser } = useAuth();
  const { members, setPnlTag } = useMembers();
  const { getConsecutiveMisses, events, attendance } = useEvents();
  const {
    tags,
    assignments,
    approveTag,
    rejectTag,
    createCustomTag,
  } = useTags();
  const [password, setPassword] = React.useState("");
  const [unlocked, setUnlocked] = React.useState(isExec);
  const [reason, setReason] = React.useState("");

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

  if (!unlocked) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto bg-white">
          <CardContent className="p-6 space-y-3">
            <p className="font-semibold">Exec Access Required</p>
            <Input
              type="password"
              placeholder="Exec password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={() => setUnlocked(password === EXEC_PASSWORD)}>Unlock</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {isExec && (
        <Card className="sticky top-0 z-10 bg-paper border-border shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h2 className="font-display text-xl font-semibold tracking-tight">Publish update</h2>
              <p className="text-sm text-muted-foreground">
                Society news appears on <span className="text-crimson font-medium">/news</span> and the home page.
              </p>
            </div>
            <Button className="bg-crimson text-white hover:bg-crimson/90 shrink-0 w-full sm:w-auto" asChild>
              <Link to="/dashboard/exec/new-post">New post</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {unlocked && !isExec && (
        <Card className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Only executives can publish society news.</p>
            <p className="text-muted-foreground mt-1">
              Your account does not have the executive role. If you are on the board, ask an admin to update your role, or review the{" "}
              <Link to="/roster" className="text-crimson font-medium underline-offset-4 hover:underline">
                roster
              </Link>
              {" "}and{" "}
              <Link to="/dashboard/profile" className="text-crimson font-medium underline-offset-4 hover:underline">
                your profile
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}
      <Card className="bg-white">
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
          <TabsTrigger value="ai">AI Recruiter Suite</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="space-y-2">
          {members.map((m) => (
            <Card key={m.id} className="bg-white">
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
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason"
                    className="h-8 w-44"
                  />
                  <Button
                    size="sm"
                    onClick={() => setPnlTag(m.id, !m.pnlTagged, reason || undefined)}
                  >
                    {m.pnlTagged ? "Remove PNL" : "Tag PNL"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          {!isExec ? (
            <Card className="bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Alumni &amp; tag approvals are restricted to executive board members.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white">
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

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base">Tag catalog (custom)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-md">
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
                  className="mt-1 h-10 w-full rounded-md border px-3 text-sm bg-white"
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
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-white">
            <CardContent className="p-4">
              Notification composer available for all/spring2026/alumni/exec audiences.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <Card className="bg-white">
            <CardContent className="p-4">
              Outreach template suite with copy/customize actions.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
