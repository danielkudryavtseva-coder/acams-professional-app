# Cursor Prompt — Member Tagging System

## Goal
Add a tag system to member profiles in the professional-app so we can attach metadata to each roster member, link tags to pitches and other activity records, and ultimately track which member drove which decisions and roll that up into a 4-year P&L per member.

This is a React + TypeScript + Vite + Tailwind + shadcn project. Roster/profile data currently lives in `src/app/data/mockData.ts` (no real backend yet — keep persistence in the existing Zustand/Context + localStorage pattern already used by the app; do not introduce a server).

---

## Existing types to extend
File: `src/app/data/mockData.ts`

Currently:
```ts
export type FinanceTrack = "IB" | "PE" | "VC" | "ER" | "AM" | "Consulting";
export type MemberRole = "member" | "exec";

export interface Member {
  id: string;
  firstName: string;
  // ...
  classYear: "Freshman" | "Sophomore" | "Junior" | "Senior";
  graduationYear: number;
  committee: Committee;
  interests: FinanceTrack[];
  pnlTagged: boolean;
  // ...
}
```

We need to layer a generic `Tag` system on top of these without removing existing fields (the existing `classYear`, `interests`, `pnlTagged` columns stay; tags are an additive richer model).

---

## 1. Tag data model
Add to `src/app/data/mockData.ts` (or a new `src/app/data/tags.ts` if cleaner — pick one and be consistent):

```ts
export type TagCategory =
  | "grade"            // Freshman, Sophomore, Junior, Senior
  | "career"           // IB, PE, ER, VC, AM, Consulting, Other
  | "alumni"           // Alumni — REQUIRES exec approval
  | "committee"        // Investment, Recruiting, Operations, Marketing
  | "custom";          // free-form, exec-created

export type TagApprovalStatus = "approved" | "pending" | "rejected";

export interface Tag {
  id: string;                         // stable slug, e.g. "grade-senior", "career-ib", "alumni"
  category: TagCategory;
  label: string;                      // human label shown on chip
  description?: string;
  color?: string;                     // tailwind class or hex; falls back to category default
  /** True for tags that require exec approval before they appear on a member profile. */
  requiresApproval: boolean;
  /** Only execs can create/delete tags with this true. */
  execOnly: boolean;
}

export interface MemberTagAssignment {
  tagId: string;
  memberId: string;
  status: TagApprovalStatus;
  requestedBy: string;                // member id
  requestedAt: string;                // ISO
  approvedBy?: string;                // exec member id
  approvedAt?: string;
  reason?: string;                    // optional justification (used for alumni requests)
}
```

Seed a default tag catalog covering:
- Grade: `grade-freshman`, `grade-sophomore`, `grade-junior`, `grade-senior` (auto-derived from `Member.classYear`, but stored as tags so the rest of the system is uniform).
- Career: `career-ib`, `career-pe`, `career-er`, `career-vc`, `career-am`, `career-consulting`. Multiple allowed per member (mirrors `interests`).
- Alumni: `alumni` — `requiresApproval: true`, `execOnly: false` (any member can request, only exec can approve).
- Committee: derived from `Member.committee`.

Backfill: on first load, if a member has no tag assignments, generate them from their existing `classYear`, `interests`, and `committee` fields with `status: "approved"`. Persist to localStorage so we don't regenerate every reload.

---

## 2. State + persistence
Use the existing pattern (look for `src/app/context/` and any Zustand stores in `src/app/lib` or `src/app/hooks`). Add a `useTagsStore` (or context) exposing:

```ts
{
  tags: Tag[];
  assignments: MemberTagAssignment[];
  getTagsForMember(memberId: string): Tag[];          // approved only
  getPendingForMember(memberId: string): MemberTagAssignment[];
  requestTag(memberId: string, tagId: string, reason?: string): void;
  approveTag(assignmentId: string, execId: string): void;   // exec-only
  rejectTag(assignmentId: string, execId: string): void;    // exec-only
  createCustomTag(input: Omit<Tag, "id">, execId: string): Tag; // exec-only
  removeTagFromMember(memberId: string, tagId: string): void;
}
```

Persist `tags` and `assignments` to `localStorage` under keys `cams.tags.v1` and `cams.tagAssignments.v1`. Hydrate on mount.

Auth/role gate: existing role check is `member.role === "exec"`. Reuse that — do not invent a new auth surface. Any approval/exec-only mutation must throw if called by a non-exec.

---

## 3. UI — Profile page
File: `src/app/pages/Profile.tsx`

Add a **Tags** card on the individual profile (between the existing bio/personal-statement section and the activity stats). Use shadcn `<Card>` + `<Badge>`.

Required behavior:
1. Show approved tags as colored chips grouped by category (Grade, Career, Committee, Alumni, Custom).
2. Show pending tag requests in a muted variant with a "Pending exec approval" tooltip.
3. **Add tag** button opens a `<Dialog>` with:
   - Category select.
   - Tag select (filtered to that category, excluding ones already assigned).
   - For `alumni`: required `reason` textarea ("Where do you work, when did you graduate, why should this be approved?").
   - Submit calls `requestTag`. If the chosen tag has `requiresApproval`, status starts as `pending`; otherwise `approved` immediately.
4. Each chip on your own profile has an `x` to remove (but only if you assigned it yourself or you're an exec). Removing an `alumni` tag requires exec confirmation.
5. If the viewer is an exec viewing someone else's profile, they additionally see Approve/Reject buttons next to any pending assignment.

Match the visual language already used on this page — consistent spacing, the same `Card` header pattern, and Tailwind colors used elsewhere (look at how `interests` and `committee` are rendered today and stay close to that).

---

## 4. UI — Roster page
File: `src/app/pages/RosterPage.tsx`

1. Show up to 3 tag chips on each member card (priority: alumni > career > grade). If more, show a `+N` chip.
2. Add a tag filter row above the roster grid: category dropdown + tag multiselect. Filter combines AND across categories, OR within a category. Preserve any existing filters on the page.

---

## 5. UI — Exec approval queue
File: `src/app/pages/ExecToolsPage.tsx`

Add an **Alumni & Tag Approvals** section listing all `assignments` with `status === "pending"`:
- Member name (link to profile), tag label, reason, requestedAt.
- Approve / Reject buttons (calls `approveTag` / `rejectTag`).
- Empty state: "No pending tag approvals."

Also add a small **Tag Catalog** subsection where execs can `createCustomTag` (label, category, color, requiresApproval).

Restrict the entire section to `member.role === "exec"`.

---

## 6. Pitch / decision linkage (foundation for P&L)
This is the whole point — tags must be attachable to pitches so we can attribute decisions later.

Find the pitch / resource model (`mockData.ts` has `resources` with `category: "pitches"` and there is a Pipeline/Portfolio concept). For both:

1. Add `taggedMemberIds: string[]` on the pitch / portfolio decision record (members responsible).
2. Add `tagSnapshot?: Tag[]` capturing the tags those members held **at the time of the pitch** (so future demotions/changes don't rewrite history). Snapshot on creation only.
3. On the pitch detail / Portfolio detail view, show the tagged members as chips with their snapshot tags; clicking a member chip routes to their profile.
4. On the member's profile, add a **Decisions** subsection listing every pitch/portfolio entry where they are tagged, with date, ticker/title, and (placeholder) realized / unrealized P&L column. P&L numbers can be `--` for now; the schema needs to be ready.

Add a TODO comment near the P&L column reading:
```ts
// TODO(pnl): wire to portfolioHoldings.ts realized/unrealized once tag→trade attribution is signed off by execs.
```

---

## 7. Tests
- Unit: `src/app/lib/__tests__/tags.test.ts` covering: backfill from existing member fields, approval flow (request → approve → reject), exec-only guard rails, and snapshot immutability.
- E2E (`e2e/`): a Playwright spec that logs in as a member, requests the alumni tag, switches to an exec account, approves it, and confirms the chip is now visible on the public roster.

Match the existing test setup — don't introduce Jest if the repo uses Vitest, etc. Inspect `package.json` and `playwright.config.ts` first.

---

## 8. Acceptance criteria
- [ ] `Tag`, `TagCategory`, `TagApprovalStatus`, `MemberTagAssignment` types added and exported.
- [ ] Default tag catalog seeded; existing members backfilled into the new model on first run.
- [ ] Profile page renders grouped tag chips with add/remove dialog.
- [ ] Alumni tag goes through pending → approved/rejected; non-execs cannot approve.
- [ ] Roster page shows tag chips and supports filtering by tag.
- [ ] Exec Tools page shows the approval queue and a tag catalog editor.
- [ ] Pitches / portfolio decisions can be tagged with member IDs and snapshot the tags those members held at decision time.
- [ ] Member profile lists every decision they're tagged on with a placeholder P&L column.
- [ ] Tests cover backfill, approval flow, exec gating, and snapshot immutability.
- [ ] Existing pages (Login, Register, Landing, Scoreboard, AttendancePage, etc.) still build and pass type-check (`tsc --noEmit`) and lint with no new errors.

---

## Constraints
- No new backend. Persist via localStorage following the existing pattern.
- Do not break any current Member/Profile field — tags are additive.
- Keep the bundle lean: no new heavyweight deps. Reuse shadcn primitives already installed (`Badge`, `Dialog`, `Select`, `Card`, `Button`).
- Keep Tailwind class usage consistent with the rest of the app; prefer existing color tokens over new ones.
- Comment any non-obvious decision (esp. the snapshot immutability rule) so the next contributor doesn't undo it.

When finished, output a one-paragraph summary of what changed, the new files added, and any follow-ups left for the P&L wiring step.
