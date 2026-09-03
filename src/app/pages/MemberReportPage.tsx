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
import { PageHeader } from "../components/PageHeader";

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

  // No PDF library in the app — opens a clean, minimal report in a new tab and hands off
  // to the browser's native print dialog, where "Save as PDF" produces a real PDF with
  // zero added dependencies.
  const exportToPdf = (m: Member) => {
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const attendance = getMemberAttendance(m.id);
    const attended = attendance.filter((a) => a.attended).length;
    const coffeeChats = bookings.filter((b) => b.memberId === m.id).length;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!doctype html><html><head><title>${esc(m.firstName)} ${esc(m.lastName)} — Member Report</title>
      <style>body{font-family:system-ui,sans-serif;padding:2rem;color:#1a1a1a}h1{font-size:1.25rem}
      dl{display:grid;grid-template-columns:auto 1fr;gap:0.4rem 1rem;max-width:32rem}
      dt{font-weight:600}p.statement{margin-top:1.5rem;white-space:pre-wrap}</style></head>
      <body>
        <h1>${esc(m.firstName)} ${esc(m.lastName)}</h1>
        <p>${esc(m.email)}</p>
        <dl>
          <dt>Events attended</dt><dd>${attended}/${attendance.length}</dd>
          <dt>Pitches submitted</dt><dd>${m.pitchesSubmitted}</dd>
          <dt>Coffee chats</dt><dd>${coffeeChats}</dd>
          <dt>Pipeline activity</dt><dd>${m.pipelineActivityCount}</dd>
        </dl>
        <p class="statement">${esc(m.personalStatement ?? "")}</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="p-6 space-y-4 max-w-content mx-auto">
      <PageHeader title="Member Reports" />
      <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white dark:bg-card" />
      <div className="space-y-2">
        {filtered.map((m) => {
          const isActive = m.active !== false;
          return (
            <Card key={m.id} className={cn("bg-white dark:bg-card transition-opacity", !isActive && "opacity-60")}>
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
                        Active · Deactivate
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
                    <Button size="sm" variant="outline" onClick={() => exportToPdf(m)}>Export to PDF</Button>
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
