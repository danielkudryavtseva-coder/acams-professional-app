import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { MemberTagsCard } from "../components/MemberTagsCard";
import { MemberDecisionsCard } from "../components/MemberDecisionsCard";
import { useMembers } from "../context/MembersContext";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";

export default function MemberProfilePage() {
  const { memberId = "" } = useParams();
  const { members } = useMembers();
  const { currentUser, isExec } = useAuth();
  const member = members.find((m) => m.id === memberId);

  if (!member) {
    return <Navigate to="/dashboard/roster" replace />;
  }

  const editable = currentUser?.id === member.id || isExec;

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
      />

      <MemberTagsCard memberId={member.id} editable={editable} />
      <MemberDecisionsCard memberId={member.id} />
    </div>
  );
}
