/**
 * Member tagging system data model.
 *
 * Tags are an additive layer on top of `Member`. They never replace existing
 * fields like `classYear`, `interests`, `committee`, or `pnlTagged`; instead
 * they normalize them into a uniform `Tag`/`MemberTagAssignment` structure
 * that we can hang approval workflows, filtering, and decision attribution
 * off of.
 *
 * Persistence keys (set by `TagsContext`):
 *   - `cams.tags.v1`             — the tag catalog
 *   - `cams.tagAssignments.v1`   — every member↔tag assignment, incl. status
 */

import type { Committee, FinanceTrack, Member } from "./mockData";

export type TagCategory =
  | "grade" // Freshman, Sophomore, Junior, Senior
  | "career" // IB, PE, ER, VC, AM, Consulting, Other
  | "alumni" // Alumni — REQUIRES exec approval
  | "committee" // Investment, Recruiting, Operations, Marketing
  | "custom"; // free-form, exec-created

export type TagApprovalStatus = "approved" | "pending" | "rejected";

export interface Tag {
  /** Stable slug — e.g. "grade-senior", "career-ib", "alumni". */
  id: string;
  category: TagCategory;
  /** Human label shown on chip. */
  label: string;
  description?: string;
  /** Tailwind class string preferred; falls back to the category default. */
  color?: string;
  /** True for tags that require exec approval before they appear on a profile. */
  requiresApproval: boolean;
  /** Only execs can create or delete tags with this true. */
  execOnly: boolean;
}

export interface MemberTagAssignment {
  /** Unique assignment id — `${memberId}:${tagId}` or a uuid for re-requests. */
  id: string;
  tagId: string;
  memberId: string;
  status: TagApprovalStatus;
  /** Member id of the requester (self-request or exec-on-behalf-of). */
  requestedBy: string;
  /** ISO timestamp. */
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  /** Optional justification (used for alumni requests). */
  reason?: string;
}

/** Default Tailwind class fallback per category. Stays inside existing palette. */
export const TAG_CATEGORY_COLORS: Record<TagCategory, string> = {
  grade: "bg-slate-100 text-slate-800",
  career: "bg-blue-100 text-blue-800",
  alumni: "bg-amber-100 text-amber-800",
  committee: "bg-purple-100 text-purple-800",
  custom: "bg-rose-100 text-rose-800",
};

export const TAG_CATEGORY_LABELS: Record<TagCategory, string> = {
  grade: "Grade",
  career: "Career",
  alumni: "Alumni",
  committee: "Committee",
  custom: "Custom",
};

/* -------------------------------------------------------------------------- */
/* Default tag catalog                                                        */
/* -------------------------------------------------------------------------- */

const GRADE_TAGS: Tag[] = (
  ["Freshman", "Sophomore", "Junior", "Senior"] as Member["classYear"][]
).map((g) => ({
  id: `grade-${g.toLowerCase()}`,
  category: "grade" as const,
  label: g,
  requiresApproval: false,
  execOnly: false,
}));

const CAREER_TAGS: Tag[] = (
  ["IB", "PE", "ER", "VC", "AM", "Consulting"] as FinanceTrack[]
).map((t) => ({
  id: `career-${t.toLowerCase()}`,
  category: "career" as const,
  label: t,
  requiresApproval: false,
  execOnly: false,
}));

const COMMITTEE_TAGS: Tag[] = (
  ["Investment", "Recruiting", "Operations", "Marketing"] as Committee[]
).map((c) => ({
  id: `committee-${c.toLowerCase()}`,
  category: "committee" as const,
  label: c,
  requiresApproval: false,
  execOnly: false,
}));

export const ALUMNI_TAG: Tag = {
  id: "alumni",
  category: "alumni",
  label: "Alumni",
  description: "Verified post-graduation member. Requires exec approval.",
  requiresApproval: true,
  execOnly: false,
};

export const DEFAULT_TAG_CATALOG: Tag[] = [
  ...GRADE_TAGS,
  ...CAREER_TAGS,
  ...COMMITTEE_TAGS,
  ALUMNI_TAG,
];

/** Stable id helpers so backfill and UI agree on slugs. */
export const tagIdForClassYear = (cy: Member["classYear"]) =>
  `grade-${cy.toLowerCase()}`;
export const tagIdForCareer = (t: FinanceTrack) => `career-${t.toLowerCase()}`;
export const tagIdForCommittee = (c: Committee) =>
  `committee-${c.toLowerCase()}`;
