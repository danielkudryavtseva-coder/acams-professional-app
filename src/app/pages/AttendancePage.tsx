import * as React from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useEvents } from "../context/EventsContext";
import { useMembers } from "../context/MembersContext";
import { AddEventModal } from "../components/AddEventModal";

export default function AttendancePage() {
  const { events, attendance, markAttended, addEvent, getConsecutiveMisses } = useEvents();
  const { members, setPnlTag } = useMembers();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    // Skip already-tagged members; otherwise `setPnlTag` always returns a fresh
    // members array (see MembersContext.save), which retriggers this effect →
    // "Maximum update depth exceeded".
    members.forEach((m) => {
      if (m.pnlTagged) return;
      if (getConsecutiveMisses(m.id) >= 3) setPnlTag(m.id, true, "3 consecutive mandatory event misses");
    });
  }, [attendance, members, getConsecutiveMisses, setPnlTag]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <Button onClick={() => setOpen(true)}>Add Event</Button>
      </div>
      <Card className="bg-white">
        <CardContent className="p-4 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Member</th>
                {events.map((e) => <th key={e.id} className="p-2">{e.title}</th>)}
                <th className="p-2">Consecutive Misses</th>
                <th className="p-2">PNL</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2">{m.firstName} {m.lastName}</td>
                  {events.map((e) => {
                    const rec = attendance.find((a) => a.memberId === m.id && a.eventId === e.id);
                    const past = new Date(e.date) < new Date();
                    return (
                      <td key={e.id} className="p-2 text-center cursor-pointer" onClick={() => past && markAttended(m.id, e.id, !(rec?.attended ?? false))}>
                        {!past ? <Clock3 className="inline h-4 w-4 text-muted-foreground" /> : rec?.attended ? <CheckCircle2 className="inline h-4 w-4 text-green-600" /> : <XCircle className="inline h-4 w-4 text-red-600" />}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center">{getConsecutiveMisses(m.id)}</td>
                  <td className="p-2 text-center">{m.pnlTagged ? <Badge variant="destructive">PNL</Badge> : <Badge variant="outline">OK</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <AddEventModal open={open} onOpenChange={setOpen} onSubmit={addEvent} />
    </div>
  );
}
