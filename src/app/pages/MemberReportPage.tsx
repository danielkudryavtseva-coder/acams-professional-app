import * as React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { useMembers } from "../context/MembersContext";
import { useEvents } from "../context/EventsContext";
import { useConnect } from "../context/ConnectContext";
import { cn } from "../components/ui/utils";
import type { Member } from "../data/mockData";

export default function MemberReportPage() {
  const { members, deactivateMember, reactivateMember } = useMembers();
  const { getMemberAttendance } = useEvents();
  const { bookings } = useConnect();
  const [search, setSearch] = React.useState("");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  // Tracks which member's deactivate confirmation dialog is open. Using a
  // single piece of state keeps only one AlertDialog mounted at a time.
  const [pendingDeactivate, setPendingDeactivate] = React.useState<Member | null>(null);

  const filtered = members.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Member Reports</h1>
      <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white" />
      <div className="space-y-2">
        {filtered.map((m) => {
          const isActive = m.active !== false;
          return (
            <Card key={m.id} className={cn("bg-white transition-opacity", !isActive && "opacity-60")}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-muted-foreground">{m.committee} · {m.classYear}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setPendingDeactivate(m)}
                        className="bg-emerald-600 text-white hover:bg-crimson hover:text-white border border-emerald-700"
                      >
                        Automatically Active
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => reactivateMember(m.id)}
                        className="border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100"
                      >
                        Deactivated · Reactivate
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setExpanded(expanded === m.id ? null : m.id)}>View Report</Button>
                  </div>
                </div>
                {expanded === m.id && (
                  <div className="border rounded p-3 text-sm space-y-1">
                    <p>Events attended: {getMemberAttendance(m.id).filter((a) => a.attended).length}/{getMemberAttendance(m.id).length}</p>
                    <p>Pitches submitted: {m.pitchesSubmitted}</p>
                    <p>Coffee chats: {bookings.filter((b) => b.memberId === m.id).length}</p>
                    <p>Pipeline activity: {m.pipelineActivityCount}</p>
                    <p className="text-muted-foreground">{m.personalStatement}</p>
                    <Button size="sm" variant="outline">Export to PDF</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={pendingDeactivate !== null} onOpenChange={(open) => { if (!open) setPendingDeactivate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDeactivate ? `Deactivate ${pendingDeactivate.firstName} ${pendingDeactivate.lastName}?` : "Deactivate member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              They will be temporarily hidden from the public roster until reactivated. Their record and historical data are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-crimson text-white hover:bg-crimson-dark"
              onClick={() => {
                if (pendingDeactivate) deactivateMember(pendingDeactivate.id);
                setPendingDeactivate(null);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
