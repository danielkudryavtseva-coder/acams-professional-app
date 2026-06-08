import React, { createContext, useContext, useEffect, useState } from "react";
import { type FinanceTrack, type Member } from "../data/mockData";
import { CLASS_PASSWORD, CRIMSON_EMAIL_DOMAIN, CURRENT_COHORT } from "../data/constants";
import { useMembers } from "./MembersContext";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classPassword: string;
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
  login: (email: string, classPassword: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Member>) => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { members, addMember, updateMember } = useMembers();
  const [currentUser, setCurrentUser] = useState<Member | null>(() => {
    try {
      const v = localStorage.getItem("cams_user");
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });
  const isExec = currentUser?.role === "exec";

  /** Roster (`MembersContext`) is source of truth; keep session user aligned after external edits. */
  useEffect(() => {
    if (!currentUser) return;
    const fromList = members.find((m) => m.id === currentUser.id);
    if (!fromList) return;
    if (fromList !== currentUser) {
      setCurrentUser(fromList);
      localStorage.setItem("cams_user", JSON.stringify(fromList));
    }
  }, [members, currentUser]);

  const login = async (email: string, classPassword: string) => {
    if (!email.endsWith(CRIMSON_EMAIL_DOMAIN)) return { success: false, error: "Must use a @crimson.ua.edu email address." };
    if (classPassword !== CLASS_PASSWORD) return { success: false, error: "Incorrect class password." };
    const user =
      members.find((m) => m.email.toLowerCase() === email.toLowerCase()) ?? members[0] ?? null;
    if (!user) return { success: false, error: "No members roster loaded." };
    setCurrentUser(user);
    localStorage.setItem("cams_user", JSON.stringify(user));
    return { success: true };
  };
  const register = async (data: RegisterPayload) => {
    if (!data.email.endsWith(CRIMSON_EMAIL_DOMAIN)) return { success: false, error: "Must use a @crimson.ua.edu email address." };
    if (data.classPassword !== CLASS_PASSWORD) return { success: false, error: "Incorrect class password." };
    const map: Record<string, number> = { Freshman: 4, Sophomore: 3, Junior: 2, Senior: 1 };
    const member: Member = {
      id: `m${Date.now()}`,
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
      cohort: CURRENT_COHORT,
      joinedAt: new Date().toISOString(),
      pipelineActivityCount: 0,
      pitchesSubmitted: 0,
      coffeeChatsCompleted: 0,
      offers: 0,
    };
    addMember(member);
    setCurrentUser(member);
    localStorage.setItem("cams_user", JSON.stringify(member));
    return { success: true };
  };
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("cams_user");
  };
  const updateProfile = (updates: Partial<Member>) => {
    if (!currentUser) return;
    updateMember(currentUser.id, updates);
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem("cams_user", JSON.stringify(updated));
  };
  return <AuthContext.Provider value={{ currentUser, isExec, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
