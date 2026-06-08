import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TAG_CATALOG,
  type MemberTagAssignment,
  type Tag,
} from "../data/tags";
import {
  approveAssignment as approveAssignmentPure,
  buildAssignmentForRequest,
  deriveAssignmentsForAllMembers,
  freezeTagSnapshot,
  getApprovedTagsForMember,
  getPendingForMember,
  rejectAssignment as rejectAssignmentPure,
} from "../lib/tags";
import type { Member } from "../data/mockData";
import { useMembers } from "./MembersContext";
import { useAuth } from "./AuthContext";

/* Persistence keys are dictated by the tagging spec; do not rename. */
const TAGS_KEY = "cams.tags.v1";
const ASSIGNMENTS_KEY = "cams.tagAssignments.v1";

interface TagsContextValue {
  tags: Tag[];
  assignments: MemberTagAssignment[];
  getTagsForMember: (memberId: string) => Tag[];
  getPendingForMember: (memberId: string) => MemberTagAssignment[];
  /** Anyone can call. If the tag requires approval, status starts pending. */
  requestTag: (memberId: string, tagId: string, reason?: string) => void;
  /** Exec-only. Throws if the current user is not an exec. */
  approveTag: (assignmentId: string, execId: string) => void;
  rejectTag: (assignmentId: string, execId: string) => void;
  /** Exec-only. Adds a new tag to the catalog. */
  createCustomTag: (input: Omit<Tag, "id">, execId: string) => Tag;
  removeTagFromMember: (memberId: string, tagId: string) => void;
  /** Capture an immutable Tag[] snapshot for a set of members. */
  freezeSnapshot: (memberIds: string[]) => Tag[];
}

const TagsContext = createContext<TagsContextValue | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (!v) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage may be unavailable in some test contexts; swallow. */
  }
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TagsProvider({ children }: { children: React.ReactNode }) {
  const { members } = useMembers();
  const { currentUser } = useAuth();

  const [tags, setTags] = useState<Tag[]>(() =>
    loadJson<Tag[]>(TAGS_KEY, DEFAULT_TAG_CATALOG),
  );
  const [assignments, setAssignments] = useState<MemberTagAssignment[]>(() =>
    loadJson<MemberTagAssignment[]>(ASSIGNMENTS_KEY, []),
  );

  /* On first load (no assignments persisted yet), backfill from existing
   * Member.classYear / interests / committee so the system isn't empty. */
  useEffect(() => {
    if (assignments.length === 0 && members.length > 0) {
      const seeded = deriveAssignmentsForAllMembers(members);
      setAssignments(seeded);
      save(ASSIGNMENTS_KEY, seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Persist whenever tags or assignments change. */
  useEffect(() => save(TAGS_KEY, tags), [tags]);
  useEffect(() => save(ASSIGNMENTS_KEY, assignments), [assignments]);

  const value = useMemo<TagsContextValue>(() => {
    const requireExec = (id: string): Member => {
      const exec = members.find((m) => m.id === id);
      if (!exec || exec.role !== "exec") {
        throw new Error("Exec role required for this action.");
      }
      return exec;
    };

    return {
      tags,
      assignments,
      getTagsForMember: (memberId) =>
        getApprovedTagsForMember(memberId, assignments, tags),
      getPendingForMember: (memberId) =>
        getPendingForMember(memberId, assignments),
      requestTag: (memberId, tagId, reason) => {
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return;
        // Block duplicate non-rejected assignments for the same member↔tag.
        const existing = assignments.find(
          (a) =>
            a.memberId === memberId &&
            a.tagId === tagId &&
            a.status !== "rejected",
        );
        if (existing) return;
        const next = buildAssignmentForRequest({
          memberId,
          tag,
          requestedBy: currentUser?.id ?? memberId,
          reason,
        });
        setAssignments((prev) => [...prev, next]);
      },
      approveTag: (assignmentId, execId) => {
        const exec = requireExec(execId);
        setAssignments((prev) =>
          approveAssignmentPure(prev, assignmentId, exec),
        );
      },
      rejectTag: (assignmentId, execId) => {
        const exec = requireExec(execId);
        setAssignments((prev) =>
          rejectAssignmentPure(prev, assignmentId, exec),
        );
      },
      createCustomTag: (input, execId) => {
        requireExec(execId);
        const id = `custom-${slugify(input.label)}`;
        const next: Tag = { ...input, id };
        setTags((prev) => (prev.find((t) => t.id === id) ? prev : [...prev, next]));
        return next;
      },
      removeTagFromMember: (memberId, tagId) => {
        setAssignments((prev) =>
          prev.filter((a) => !(a.memberId === memberId && a.tagId === tagId)),
        );
      },
      freezeSnapshot: (memberIds) => freezeTagSnapshot(memberIds, assignments, tags),
    };
  }, [tags, assignments, members, currentUser?.id]);

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTags() {
  const c = useContext(TagsContext);
  if (!c) throw new Error("useTags must be used inside TagsProvider");
  return c;
}
