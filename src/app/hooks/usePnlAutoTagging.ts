import * as React from "react";
import { useEvents } from "../context/EventsContext";
import { useMembers } from "../context/MembersContext";

/**
 * Auto-tags any member who's hit 3 consecutive mandatory-event misses as PNL.
 * Was previously copy-pasted verbatim into both ExecToolsPage.tsx and
 * AttendancePage.tsx — whichever exec page happened to be mounted ran this rule
 * independently. Call this once from a shared ancestor of exec pages instead so
 * there's one place that owns the tagging rule.
 */
export function usePnlAutoTagging() {
  const { attendance, getConsecutiveMisses } = useEvents();
  const { members, setPnlTag } = useMembers();

  React.useEffect(() => {
    // Skip already-tagged members; otherwise `setPnlTag` always returns a fresh
    // members array (see MembersContext.updateMember), which retriggers this
    // effect -> "Maximum update depth exceeded".
    members.forEach((m) => {
      if (m.pnlTagged) return;
      if (getConsecutiveMisses(m.id) >= 3) setPnlTag(m.id, true, "3 consecutive mandatory event misses");
    });
  }, [attendance, members, getConsecutiveMisses, setPnlTag]);
}
