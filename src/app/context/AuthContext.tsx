import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FinanceTrack, Member } from "../data/mockData";
import { CRIMSON_EMAIL_DOMAIN, CURRENT_COHORT } from "../data/constants";
import { useMembers } from "./MembersContext";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";

const NOT_CONFIGURED_ERROR =
  "Accounts aren't set up yet — the site owner still needs to connect a backend.";

// Registration can't always write the `members` profile row immediately: right after
// `signUp()`, there's no session yet unless the project auto-confirms emails, and RLS
// correctly rejects an unauthenticated insert. Rather than lose the submitted profile,
// stash it here and finish creating the row on the user's first successful login, once a
// real session exists. Keyed by the new auth user's id so it survives a page reload.
const PENDING_PROFILE_PREFIX = "cams_pending_profile_";

function stashPendingProfile(userId: string, member: Member) {
  try {
    localStorage.setItem(PENDING_PROFILE_PREFIX + userId, JSON.stringify(member));
  } catch {
    // Storage unavailable (private browsing, etc.) — nothing more we can do client-side;
    // the "contact an exec" fallback still applies if this was also the auto-confirm path.
  }
}

function peekPendingProfile(userId: string): Member | null {
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_PREFIX + userId);
    return raw ? (JSON.parse(raw) as Member) : null;
  } catch {
    return null;
  }
}

function clearPendingProfile(userId: string) {
  try {
    localStorage.removeItem(PENDING_PROFILE_PREFIX + userId);
  } catch {
    // Best-effort cleanup — a leftover stash just gets retried (harmlessly, via upsert) next login.
  }
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  personalStatement: string;
  resumeFilename: string | null;
  interests: FinanceTrack[];
  committee: string;
  classYear: string;
  quizAnswers: Record<string, string>;
}

interface AuthContextValue {
  currentUser: Member | null;
  isExec: boolean;
  authReady: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => void;
  updateProfile: (updates: Partial<Member>) => Promise<{ success: boolean; error?: string }>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { members, addMember, updateMember } = useMembers();
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const currentUser = useMemo(
    () => (userId ? members.find((m) => m.id === userId) ?? null : null),
    [members, userId],
  );

  // The `role` column can only be changed by an existing exec — enforced server-side
  // by a Postgres trigger — so trusting the live `members` row here is safe.
  const isExec = currentUser?.role === "exec";

  const login = async (email: string, password: string) => {
    if (!supabaseConfigured) return { success: false, error: NOT_CONFIGURED_ERROR };
    if (!email.toLowerCase().endsWith(CRIMSON_EMAIL_DOMAIN))
      return { success: false, error: "Must use a @crimson.ua.edu email address." };

    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    // Finish a registration that couldn't write its profile row immediately (no session existed
    // yet at signup time) — now that we have a real authenticated session, retry it.
    const signedInId = signInData.user?.id;
    if (signedInId) {
      const pending = peekPendingProfile(signedInId);
      if (pending) {
        try {
          // Only write if no row exists yet — an exec may have already approved/edited one
          // in the meantime, and the stashed snapshot must never clobber that.
          const { data: existing } = await supabase.from("members").select("id").eq("id", signedInId).maybeSingle();
          if (!existing) await addMember(pending);
          clearPendingProfile(signedInId);
        } catch {
          // Leave the stash in place — harmless, retried on the next login.
        }
      }
    }

    return { success: true };
  };

  const register = async (data: RegisterPayload) => {
    if (!supabaseConfigured) return { success: false, error: NOT_CONFIGURED_ERROR };
    if (!data.email.toLowerCase().endsWith(CRIMSON_EMAIL_DOMAIN))
      return { success: false, error: "Must use a @crimson.ua.edu email address." };

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (signUpError) return { success: false, error: signUpError.message };
    const newUserId = signUpData.user?.id;
    if (!newUserId) return { success: false, error: "Registration failed — please try again." };

    const map: Record<string, number> = { Freshman: 4, Sophomore: 3, Junior: 2, Senior: 1 };
    const member: Member = {
      id: newUserId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      classYear: data.classYear as Member["classYear"],
      graduationYear: new Date().getFullYear() + (map[data.classYear] ?? 2),
      committee: data.committee as Member["committee"],
      interests: data.interests,
      personalStatement: data.personalStatement,
      resumeFilename: data.resumeFilename,
      linkedin: "",
      role: "member",
      pnlTagged: false,
      active: true,
      approvalStatus: "pending",
      cohort: CURRENT_COHORT,
      joinedAt: new Date().toISOString(),
      pipelineActivityCount: 0,
      pitchesSubmitted: 0,
      coffeeChatsCompleted: 0,
      offers: 0,
    };

    if (signUpData.session) {
      // Auto-confirm is on for this project, so we already have a real session — safe to
      // write the profile row right now.
      try {
        await addMember(member);
      } catch {
        // Rare (network blip, etc.) — stash it so the next login retries automatically
        // instead of leaving the account without a profile row.
        stashPendingProfile(newUserId, member);
      }
    } else {
      // No session yet (email confirmation required) — an insert attempt right now would be
      // unauthenticated and RLS would correctly reject it. Finish creating the row on first
      // login instead, once a real session exists (see login() above).
      stashPendingProfile(newUserId, member);
    }

    return { success: true, needsEmailConfirmation: !signUpData.session };
  };

  const logout = () => {
    void supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Member>) => {
    if (!currentUser) return { success: false, error: "Not signed in." };
    // Strip fields that must never be self-modified — the DB trigger also blocks
    // these server-side, but stripping client-side avoids a rejected request.
    const { id: _id, role: _role, pnlTagged: _pnl, pnlReason: _pnlReason, active: _active, ...safeUpdates } = updates;
    return updateMember(currentUser.id, safeUpdates);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isExec, authReady, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
