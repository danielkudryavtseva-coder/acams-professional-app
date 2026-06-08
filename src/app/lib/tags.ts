/**
 * Pure helpers for the member tagging system. The React context wraps these;
 * they are factored out so unit tests can run without React/DOM.
 *
 * IMPORTANT — snapshot immutability rule:
 *   Once a `Tag[]` snapshot is attached to a pitch / portfolio decision via
 *   `tagSnapshot`, downstream changes to a member's tag assignments must NOT
 *   rewrite that snapshot. The snapshot is the historical record used for
 *   future P&L attribution. See `freezeTagSnapshot`.
 */

import type { Member } from "../data/mockData";
import {
  type MemberTagAssignment,
  type Tag,
  tagIdForCareer,
  tagIdForClassYear,
  tagIdForCommittee,
} from "../data/tags";

/* -------------------------------------------------------------------------- */
/* Backfill                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Given a member, return the assignment records derived from their existing
 * `classYear`, `interests`, and `committee` fields. Used on first run when
 * `cams.tagAssignments.v1` is empty so the system isn't blank.
 *
 * All derived assignments are `status: "approved"` — the existing fields are
 * already considered approved facts about the member.
 */
export function deriveAssignmentsForMember(
  member: Member,
  now: string = new Date().toISOString(),
): MemberTagAssignment[] {
  const out: MemberTagAssignment[] = [];
  const push = (tagId: string) => {
    out.push({
      id: `${member.id}:${tagId}`,
      memberId: member.id,
      tagId,
      status: "approved",
      requestedBy: member.id,
      requestedAt: now,
      approvedBy: member.id,
      approvedAt: now,
    });
  };
  push(tagIdForClassYear(member.classYear));
  push(tagIdForCommittee(member.committee));
  for (const interest of member.interests) push(tagIdForCareer(interest));
  return out;
}

/** Backfill across an entire roster — used on first hydration. */
export function deriveAssignmentsForAllMembers(
  members: Member[],
  now?: string,
): MemberTagAssignment[] {
  return members.flatMap((m) => deriveAssignmentsForMember(m, now));
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Build a new assignment record for a request. If the tag's `requiresApproval`
 * is true, the resulting status is `pending`; otherwise it auto-approves.
 */
export function buildAssignmentForRequest(args: {
  memberId: string;
  tag: Tag;
  requestedBy: string;
  reason?: string;
  now?: string;
}): MemberTagAssignment {
  const now = args.now ?? new Date().toISOString();
  const status: MemberTagAssignment["status"] = args.tag.requiresApproval
    ? "pending"
    : "approved";
  return {
    id: `${args.memberId}:${args.tag.id}:${now}`,
    memberId: args.memberId,
    tagId: args.tag.id,
    status,
    requestedBy: args.requestedBy,
    requestedAt: now,
    approvedBy: status === "approved" ? args.requestedBy : undefined,
    approvedAt: status === "approved" ? now : undefined,
    reason: args.reason,
  };
}

/**
 * Apply an exec approval to a pending assignment. Throws if the actor is not
 * an exec, mirroring the prompt's "must throw if called by a non-exec" rule.
 */
export function approveAssignment(
  assignments: MemberTagAssignment[],
  assignmentId: string,
  exec: { id: string; role: Member["role"] },
  now: string = new Date().toISOString(),
): MemberTagAssignment[] {
  if (exec.role !== "exec") {
    throw new Error("Only execs can approve tag assignments.");
  }
  return assignments.map((a) =>
    a.id === assignmentId
      ? { ...a, status: "approved", approvedBy: exec.id, approvedAt: now }
      : a,
  );
}

export function rejectAssignment(
  assignments: MemberTagAssignment[],
  assignmentId: string,
  exec: { id: string; role: Member["role"] },
  now: string = new Date().toISOString(),
): MemberTagAssignment[] {
  if (exec.role !== "exec") {
    throw new Error("Only execs can reject tag assignments.");
  }
  return assignments.map((a) =>
    a.id === assignmentId
      ? { ...a, status: "rejected", approvedBy: exec.id, approvedAt: now }
      : a,
  );
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function getApprovedTagsForMember(
  memberId: string,
  assignments: MemberTagAssignment[],
  catalog: Tag[],
): Tag[] {
  const approvedIds = new Set(
    assignments
      .filter((a) => a.memberId === memberId && a.status === "approved")
      .map((a) => a.tagId),
  );
  return catalog.filter((t) => approvedIds.has(t.id));
}

export function getPendingForMember(
  memberId: string,
  assignments: MemberTagAssignment[],
): MemberTagAssignment[] {
  return assignments.filter(
    (a) => a.memberId === memberId && a.status === "pending",
  );
}

/* -------------------------------------------------------------------------- */
/* Decision snapshots                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Capture the approved tags for the given member ids at a single point in time.
 *
 * The returned array is a deep clone — callers should attach it to the
 * pitch/decision record AS-IS and never mutate it again. Consumers reading the
 * snapshot must treat it as historical record (see "snapshot immutability rule"
 * at the top of this file).
 */
export function freezeTagSnapshot(
  memberIds: string[],
  assignments: MemberTagAssignment[],
  catalog: Tag[],
): Tag[] {
  const approvedIds = new Set(
    assignments
      .filter(
        (a) => memberIds.includes(a.memberId) && a.status === "approved",
      )
      .map((a) => a.tagId),
  );
  return catalog
    .filter((t) => approvedIds.has(t.id))
    .map((t) => ({ ...t }));
}
