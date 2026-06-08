import * as React from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { useMembers } from "../context/MembersContext";
import { MissReasonModal } from "../components/MissReasonModal";

export default function EventsPage() {
  const { currentUser } = useAuth();
  const { events, attendance, rsvp, getConsecutiveMisses } = useEvents();
  const { members, setPnlTag } = useMembers();
  const [modal, setModal] = React.useState<{ open: boolean; eventId: string; title: string }>({ open: false, eventId: "", title: "" });

  React.useEffect(() => {
    // Only flip tagged → tagged transitions; without this guard `setPnlTag`
    // would always produce a fresh members array (see MembersContext.save),
    // which retriggers this effect → "Maximum update depth exceeded".
    members.forEach((m) => {
      if (m.pnlTagged) return;
      if (getConsecutiveMisses(m.id) >= 3) {
        setPnlTag(m.id, true, "3 consecutive mandatory event misses");
      }
    });
  }, [attendance, members, getConsecutiveMisses, setPnlTag]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Events</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {events.map((event) => {
          const myRecord = currentUser ? attendance.find((r) => r.memberId === currentUser.id && r.eventId === event.id) : undefined;
          const past = new Date(event.date) < new Date();
          return (
            <Card key={event.id} className="bg-white">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{event.title}</p>
                  {event.mandatory && <Badge variant="destructive">Mandatory</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleString()} · {event.location}</p>
                <p className="text-sm">{event.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={() => currentUser && rsvp(currentUser.id, event.id, "confirmed")}>Confirm Attendance</Button>
                  <Button size="sm" variant="outline" onClick={() => setModal({ open: true, eventId: event.id, title: event.title })}>Can’t Make It</Button>
                  {myRecord && <Badge variant="outline">{myRecord.rsvp}</Badge>}
                  {past && myRecord && <Badge variant={myRecord.attended ? "default" : "destructive"}>{myRecord.attended ? "Attended" : "Missed"}</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <MissReasonModal
        open={modal.open}
        onOpenChange={(open) => setModal((prev) => ({ ...prev, open }))}
        eventName={modal.title}
        onSubmit={(reason) => currentUser && rsvp(currentUser.id, modal.eventId, "denied", reason)}
      />
    </div>
  );
}
