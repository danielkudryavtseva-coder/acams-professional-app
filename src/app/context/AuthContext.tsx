import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MOCK_MEMBERS, type FinanceTrack, type Member } from "../data/mockData";
import { CRIMSON_EMAIL_DOMAIN, CURRENT_COHORT } from "../data/constants";
import { useMembers } from "./MembersContext";

const SESSION_KEY = "cams_user";

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt.toLowerCase()}:${password}`);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function saveSession(user: Member, remember: boolean) {
  const json = JSON.stringify(user);
  if (remember) {
    localStorage.setItem(SESSION_KEY, json);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, json);
    localStorage.removeItem(SESSION_KEY);
  }
}

function loadSession(): Member | null {
  try {
    const v = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return v ? (JSON.parse(v) as Member) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Member>) => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { members, addMember, updateMember } = useMembers();
  const [currentUser, setCurrentUser] = useState<Member | null>(loadSession);
  // Track whether the current session is persistent so sync writes go to the right store.
  const rememberRef = useRef<boolean>(localStorage.getItem(SESSION_KEY) !== null);

  // Derive exec status from the bundle-compiled MOCK_MEMBERS roster, NOT from
  // the mutable session store. Prevents privilege escalation via DevTools tampering.
  const isExec = useMemo(() => {
    if (!currentUser) return false;
    const canonical = MOCK_MEMBERS.find((m) => m.id === currentUser.id);
    return canonical?.role === "exec";
  }, [currentUser]);

  /** MembersContext is source of truth — keep session user aligned after external edits. */
  useEffect(() => {
    if (!currentUser) return;
    const fromList = members.find((m) => m.id === currentUser.id);
    if (!fromList || fromList === currentUser) return;
    setCurrentUser(fromList);
    saveSession(fromList, rememberRef.current);
  }, [members, currentUser]);

  const login = async (email: string, password: string, rememberMe = true) => {
    if (!email.endsWith(CRIMSON_EMAIL_DOMAIN))
      return { success: false, error: "Must use a @crimson.ua.edu email address." };
    const user = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: "No account found with that email. Register first." };

    if (user.password) {
      const hash = await hashPassword(password, email);
      if (user.password !== hash) return { success: false, error: "Incorrect password." };
    }
    // Seeded/demo members without a stored password hash bypass the check.

    rememberRef.current = rememberMe;
    setCurrentUser(user);
    saveSession(user, rememberMe);
    return { success: true };
  };

  const register = async (data: RegisterPayload) => {
    if (!data.email.endsWith(CRIMSON_EMAIL_DOMAIN))
      return { success: false, error: "Must use a @crimson.ua.edu email address." };
    const existing = members.find((m) => m.email.toLowerCase() === data.email.toLowerCase());
    if (existing) return { success: false, error: "An account with that email already exists. Try logging in." };

    const passwordHash = await hashPassword(data.password, data.email);
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
      password: passwordHash,
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
    rememberRef.current = true;
    setCurrentUser(member);
    saveSession(member, true);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    clearSession();
  };

  const updateProfile = (updates: Partial<Member>) => {
    if (!currentUser) return;
    updateMember(currentUser.id, updates);
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    saveSession(updated, rememberRef.current);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isExec, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
