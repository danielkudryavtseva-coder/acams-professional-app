import * as React from "react";
import { startOfWeek } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useAuth } from "../context/AuthContext";
import { useCheckin } from "../context/CheckinContext";

interface WeeklyCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeeklyCheckinModal({ open, onOpenChange }: WeeklyCheckinModalProps) {
  const { currentUser } = useAuth();
  const { submitCheckin } = useCheckin();
  const [q1, setQ1] = React.useState("");
  const [q2, setQ2] = React.useState("");
  const [q3, setQ3] = React.useState("");

  const handleSubmit = () => {
    if (!currentUser) return;
    submitCheckin({
      memberId: currentUser.id,
      weekOf: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      q1_recruiting: q1,
      q2_blockers: q2,
      q3_goals: q3,
    });
    setQ1("");
    setQ2("");
    setQ3("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Weekly Check-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="What did you do for recruiting this week?" />
          <Textarea value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="What blockers did you hit?" />
          <Textarea value={q3} onChange={(e) => setQ3(e.target.value)} placeholder="What are your goals for next week?" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
