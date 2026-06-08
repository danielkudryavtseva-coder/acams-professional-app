import { describe, it, expect } from "vitest";
import {
  deriveAssignmentsForMember,
  buildAssignmentForRequest,
  approveAssignment,
  rejectAssignment,
  freezeTagSnapshot,
  getApprovedTagsForMember,
} from "../tags";
import {
  ALUMNI_TAG,
  DEFAULT_TAG_CATALOG,
  type MemberTagAssignment,
} from "../../data/tags";
import { MOCK_MEMBERS } from "../../data/mockData";

describe("deriveAssignmentsForMember", () => {
  it("creates approved assignments for class year, committee, and interests", () => {
    const m = MOCK_MEMBERS[0]!;
    const rows = deriveAssignmentsForMember(m, "2026-05-01T12:00:00.000Z");
    const ids = new Set(rows.map((r) => r.tagId));
    expect(ids.has("grade-junior")).toBe(true);
    expect(ids.has("committee-investment")).toBe(true);
    expect(ids.has("career-ib")).toBe(true);
    expect(ids.has("career-pe")).toBe(true);
    expect(rows.every((r) => r.status === "approved")).toBe(true);
  });
});

describe("buildAssignmentForRequest", () => {
  it("starts pending when tag requires approval", () => {
    const row = buildAssignmentForRequest({
      memberId: "mx",
      tag: ALUMNI_TAG,
      requestedBy: "mx",
      reason: "Graduated 2025; work at boutique IB.",
      now: "2026-05-01T00:00:00.000Z",
    });
    expect(row.status).toBe("pending");
    expect(row.approvedAt).toBeUndefined();
  });

  it("auto-approves tags that do not require approval", () => {
    const tag = DEFAULT_TAG_CATALOG.find((t) => t.id === "career-vc")!;
    const row = buildAssignmentForRequest({
      memberId: "mx",
      tag,
      requestedBy: "mx",
      now: "2026-05-01T00:00:00.000Z",
    });
    expect(row.status).toBe("approved");
    expect(row.approvedAt).toBeDefined();
  });
});

describe("approval flow", () => {
  it("exec approve promotes pending alumni to approved roster tags", () => {
    const pending = buildAssignmentForRequest({
      memberId: "m2",
      tag: ALUMNI_TAG,
      requestedBy: "m2",
      reason: "Test alumni path",
      now: "2026-05-01T00:00:00.000Z",
    });
    expect(pending.status).toBe("pending");
    const afterExec = approveAssignment([pending], pending.id, {
      id: "m1",
      role: "exec",
    });
    const tags = getApprovedTagsForMember("m2", afterExec, DEFAULT_TAG_CATALOG);
    expect(tags.some((t) => t.id === "alumni")).toBe(true);
  });

  it("exec reject leaves alumni off approved set", () => {
    const pending = buildAssignmentForRequest({
      memberId: "m2",
      tag: ALUMNI_TAG,
      requestedBy: "m2",
      reason: "Reject me",
      now: "2026-05-02T00:00:00.000Z",
    });
    const after = rejectAssignment([pending], pending.id, {
      id: "m1",
      role: "exec",
    });
    const tags = getApprovedTagsForMember("m2", after, DEFAULT_TAG_CATALOG);
    expect(tags.some((t) => t.id === "alumni")).toBe(false);
  });
});

describe("exec gating", () => {
  it("approveAssignment throws for members", () => {
    const pending = buildAssignmentForRequest({
      memberId: "m1",
      tag: ALUMNI_TAG,
      requestedBy: "m2",
      reason: "test",
      now: "2026-05-01T00:00:00.000Z",
    });
    expect(() =>
      approveAssignment([pending], pending.id, { id: "m2", role: "member" }),
    ).toThrow(/Only execs can approve/);
  });

  it("rejectAssignment throws for members", () => {
    const pending = buildAssignmentForRequest({
      memberId: "m1",
      tag: ALUMNI_TAG,
      requestedBy: "m2",
      reason: "test",
      now: "2026-05-01T00:00:00.000Z",
    });
    expect(() =>
      rejectAssignment([pending], pending.id, { id: "m2", role: "member" }),
    ).toThrow(/Only execs can reject/);
  });
});

describe("freezeTagSnapshot", () => {
  it("returns defensive copies that do not alias catalog entries", () => {
    const catalog = DEFAULT_TAG_CATALOG;
    const assignments: MemberTagAssignment[] = [
      {
        id: "m1:grade-junior",
        memberId: "m1",
        tagId: "grade-junior",
        status: "approved",
        requestedBy: "m1",
        requestedAt: "2026-01-01",
      },
    ];
    const snap = freezeTagSnapshot(["m1"], assignments, catalog);
    const junior = snap.find((t) => t.id === "grade-junior");
    expect(junior).toBeDefined();
    junior!.label = "MUTATED";
    const orig = catalog.find((t) => t.id === "grade-junior");
    expect(orig?.label).toBe("Junior");
  });
});
