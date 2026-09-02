import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FinanceTrack, Member } from "../data/mockData";
import { CRIMSON_EMAIL_DOMAIN, CURRENT_COHORT } from "../data/constants";
import { useMembers } from "./MembersContext";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";

const NOT_CONFIGURED_ERROR =
  "Accounts aren't set up yet — the site owner still needs to connect a backend.";

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
  updateProfile: (updates: Partial<Member>) => void;
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

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
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

    try {
      await addMember(member);
    } catch {
      return { success: false, error: "Account created, but saving your profile failed. Contact an exec." };
    }

    // If email confirmation is required, signUp() returns no session yet.
    return { success: true, needsEmailConfirmation: !signUpData.session };
  };

  const logout = () => {
    void supabase.auth.signOut();
  };

  const updateProfile = (updates: Partial<Member>) => {
    if (!currentUser) return;
    // Strip fields that must never be self-modified — the DB trigger also blocks
    // these server-side, but stripping client-side avoids a rejected request.
    const { id: _id, role: _role, pnlTagged: _pnl, pnlReason: _pnlReason, active: _active, ...safeUpdates } = updates;
    updateMember(currentUser.id, safeUpdates);
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
