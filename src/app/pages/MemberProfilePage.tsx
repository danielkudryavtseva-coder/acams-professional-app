import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { MemberTagsCard } from "../components/MemberTagsCard";
import { MemberDecisionsCard } from "../components/MemberDecisionsCard";
import { useMembers } from "../context/MembersContext";
import { useAuth } from "../context/AuthContext";

export default function MemberProfilePage() {
  const { memberId = "" } = useParams();
  const { members } = useMembers();
  const { currentUser, isExec } = useAuth();
  const member = members.find((m) => m.id === memberId);

  if (!member) {
    return <Navigate to="/roster" replace />;
  }

  const editable = currentUser?.id === member.id || isExec;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="h-8 -ml-2">
          <Link to="/roster">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to roster
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {member.firstName} {member.lastName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {member.committee} · Class of {member.graduationYear}
        </p>
      </div>

      <MemberTagsCard memberId={member.id} editable={editable} />
      <MemberDecisionsCard memberId={member.id} />
    </div>
  );
}
