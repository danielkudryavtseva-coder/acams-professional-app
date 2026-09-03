import * as React from "react";
import { Check, X, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useMembers } from "../context/MembersContext";
import { COMMITTEE_COLORS } from "../data/constants";
import { PageHeader } from "../components/PageHeader";

export default function ExecApprovalsPage() {
  const { members, updateMember } = useMembers();

  const pending = members
    .filter((m) => m.approvalStatus === "pending")
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  const [busyId, setBusyId] = React.useState<string | null>(null);

  const decide = (id: string, decision: "approved" | "rejected") => {
    setBusyId(id);
    updateMember(id, { approvalStatus: decision });
    setBusyId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-content mx-auto">
      <PageHeader
        title="Pending Approvals"
        icon={<UserCheck className="h-6 w-6 text-crimson" />}
        description="New accounts land here until an exec approves them. Rejected accounts stay locked out."
      />

      {pending.length === 0 ? (
        <Card className="bg-white dark:bg-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No accounts waiting on approval.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {pending.map((m) => (
            <Card key={m.id} className="bg-white dark:bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {m.firstName} {m.lastName}
                    </CardTitle>
                    <CardDescription>{m.email}</CardDescription>
                  </div>
                  <Badge className={COMMITTEE_COLORS[m.committee]}>{m.committee}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {m.classYear} · Class of {m.graduationYear} · Applied {new Date(m.joinedAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === m.id}
                    onClick={() => decide(m.id, "rejected")}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" disabled={busyId === m.id} onClick={() => decide(m.id, "approved")}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
