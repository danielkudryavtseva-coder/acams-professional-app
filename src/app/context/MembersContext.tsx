import React, { createContext, useContext, useEffect, useState } from "react";
import type { Member } from "../data/mockData";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";

interface MembersContextValue {
  members: Member[];
  loading: boolean;
  updateMember: (id: string, updates: Partial<Member>) => Promise<{ success: boolean; error?: string }>;
  setPnlTag: (memberId: string, tagged: boolean, reason?: string) => void;
  addMember: (member: Member) => Promise<void>;
  /** Mark a member as inactive — they're hidden from public surfaces (Roster, Scoreboard) but still visible to execs. */
  deactivateMember: (memberId: string) => void;
  /** Restore a previously deactivated member. */
  reactivateMember: (memberId: string) => void;
}
const MembersContext = createContext<MembersContextValue | null>(null);

/** Member fields stored as first-class columns (privilege-gated server-side); everything else lives in the `profile` jsonb blob. */
const TOP_LEVEL_KEYS = new Set(["id", "email", "role", "active", "approvalStatus", "pnlTagged", "pnlReason"]);

interface MemberRow {
  id: string;
  email: string;
  role: string;
  active: boolean;
  approval_status: string;
  pnl_tagged: boolean;
  pnl_reason: string | null;
  profile: Record<string, unknown>;
}

function rowToMember(row: MemberRow): Member {
  return {
    ...(row.profile as object),
    id: row.id,
    email: row.email,
    role: row.role as Member["role"],
    active: row.active,
    approvalStatus: row.approval_status as Member["approvalStatus"],
    pnlTagged: row.pnl_tagged,
    pnlReason: row.pnl_reason ?? undefined,
  } as Member;
}

/** Splits a Member(-ish) object into the privileged top-level columns and the free-form profile blob. */
function splitMember(data: Partial<Member>) {
  const top: Record<string, unknown> = {};
  const profile: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "password") continue; // Supabase Auth owns credentials now.
    if (key === "id") continue; // never updated after insert.
    if (TOP_LEVEL_KEYS.has(key)) {
      const column =
        key === "pnlTagged" ? "pnl_tagged" : key === "pnlReason" ? "pnl_reason" : key === "approvalStatus" ? "approval_status" : key;
      top[column] = value;
    } else {
      profile[key] = value;
    }
  }
  return { top, profile };
}

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;

    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.from("members").select("*");
      if (cancelled) return;
      if (!error && data) setMembers((data as MemberRow[]).map(rowToMember));
      setLoading(false);
    }
    load();

    // RLS only lets `authenticated` requests see rows at all — the initial load() above can
    // run while the auth session is still resolving (or before a login happens later in the
    // same tab), leaving `members` permanently empty/stale for that whole session. Reload
    // whenever auth state changes (login, logout, token refresh) so it always reflects who's
    // actually signed in right now.
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    const channel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        (payload) => {
          setMembers((prev) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id: string }).id;
              return prev.filter((m) => m.id !== oldId);
            }
            const next = rowToMember(payload.new as MemberRow);
            const exists = prev.some((m) => m.id === next.id);
            return exists ? prev.map((m) => (m.id === next.id ? next : m)) : [...prev, next];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      authSubscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const current = members.find((m) => m.id === id);
    if (!current) return { success: false, error: "Member not loaded yet — try again in a moment." };
    const { top, profile } = splitMember(updates);
    const mergedProfile = { ...splitMember(current).profile, ...profile };
    const { error } = await supabase
      .from("members")
      .update({ ...top, profile: mergedProfile })
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    // Apply locally only once the write is confirmed — the realtime subscription will also
    // reconcile shortly after, but callers (e.g. a Save button) need to know NOW whether it
    // actually persisted, not just that the optimistic UI looks right until the next refresh.
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    return { success: true };
  };

  const setPnlTag = (memberId: string, tagged: boolean, reason?: string) =>
    void updateMember(memberId, { pnlTagged: tagged, pnlReason: reason });

  const addMember = async (member: Member) => {
    const { top, profile } = splitMember(member);
    // Upsert, not insert: registration can retry this same call (once at signup, again on
    // first login if signup couldn't write it yet — see AuthContext's pending-profile stash),
    // so it must be safe to call twice for the same id without erroring on the second attempt.
    const { error } = await supabase.from("members").upsert({ id: member.id, ...top, profile }, { onConflict: "id" });
    if (error) throw error;
    setMembers((prev) => [...prev, member]);
  };

  const deactivateMember = (memberId: string) => void updateMember(memberId, { active: false });
  const reactivateMember = (memberId: string) => void updateMember(memberId, { active: true });

  return (
    <MembersContext.Provider
      value={{ members, loading, updateMember, setPnlTag, addMember, deactivateMember, reactivateMember }}
    >
      {children}
    </MembersContext.Provider>
  );
}
export function useMembers() {
  const c = useContext(MembersContext);
  if (!c) throw new Error("useMembers must be used inside MembersProvider");
  return c;
}
