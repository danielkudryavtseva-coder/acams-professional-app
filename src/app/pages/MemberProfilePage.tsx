import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Handshake, LineChart, Mic2, ShieldAlert } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MemberTagsCard } from "../components/MemberTagsCard";
import { MemberDecisionsCard } from "../components/MemberDecisionsCard";
import { useMembers } from "../context/MembersContext";
import { useAuth } from "../context/AuthContext";
import { useEvents } from "../context/EventsContext";
import { PageHeader } from "../components/PageHeader";

export default function MemberProfilePage() {
  const { memberId = "" } = useParams();
  const { members } = useMembers();
  const { currentUser, isExec } = useAuth();
  const { getMemberAttendance, getConsecutiveMisses } = useEvents();
  const member = members.find((m) => m.id === memberId);

  if (!member) {
    return <Navigate to="/dashboard/roster" replace />;
  }

  const editable = currentUser?.id === member.id || isExec;
  const attendance = getMemberAttendance(member.id);
  const attended = attendance.filter((a) => a.attended === true).length;
  const consecutiveMisses = getConsecutiveMisses(member.id);

  return (
    <div className="p-6 space-y-6 max-w-content mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="h-8 -ml-2">
          <Link to="/dashboard/roster">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to roster
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${member.firstName} ${member.lastName}`}
        description={`${member.committee} · Class of ${member.graduationYear}`}
        actions={
          member.pnlTagged ? (
            <Badge variant="destructive" className="inline-flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> PNL{member.pnlReason ? `: ${member.pnlReason}` : ""}
            </Badge>
          ) : undefined
        }
      />

      {/*
        Consolidated member-detail view — an exec landing here from the Roster used to get
        just tags/decisions and then had to separately visit Attendance, Member Reports, and
        Scoreboard to piece together a full picture of one person. These stats already exist
        on the Member record / EventsContext; this just surfaces them in one place.
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarCheck className="h-3.5 w-3.5" /> Attendance
            </div>
            <p className="text-xl font-semibold mt-1">
              {attended}/{attendance.length}
            </p>
            {consecutiveMisses > 0 && (
              <p className="text-xs text-destructive mt-0.5">{consecutiveMisses} consecutive misses</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <LineChart className="h-3.5 w-3.5" /> Pipeline activity
            </div>
            <p className="text-xl font-semibold mt-1">{member.pipelineActivityCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mic2 className="h-3.5 w-3.5" /> Pitches submitted
            </div>
            <p className="text-xl font-semibold mt-1">{member.pitchesSubmitted}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Handshake className="h-3.5 w-3.5" /> Coffee chats
            </div>
            <p className="text-xl font-semibold mt-1">{member.coffeeChatsCompleted}</p>
            {member.offers > 0 && (
              <p className="text-xs text-crimson mt-0.5">{member.offers} offer{member.offers === 1 ? "" : "s"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <MemberTagsCard memberId={member.id} editable={editable} />
      <MemberDecisionsCard memberId={member.id} />

      <Card className="bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-sm">More detail</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          {isExec && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/exec/attendance">Full attendance record</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/exec/member-report">Member reports</Link>
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/scoreboard">Scoreboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
