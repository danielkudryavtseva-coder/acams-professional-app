import React, { createContext, useContext, useState } from "react";
import { MOCK_MEMBERS, type Member } from "../data/mockData";

interface MembersContextValue {
  members: Member[];
  updateMember: (id: string, updates: Partial<Member>) => void;
  setPnlTag: (memberId: string, tagged: boolean, reason?: string) => void;
  addMember: (member: Member) => void;
  /** Mark a member as inactive — they're hidden from public surfaces (Roster, Scoreboard) but still visible to execs. */
  deactivateMember: (memberId: string) => void;
  /** Restore a previously deactivated member. */
  reactivateMember: (memberId: string) => void;
}
const MembersContext = createContext<MembersContextValue | null>(null);

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>(() => {
    try { const v = localStorage.getItem("cams_members.v2"); return v ? JSON.parse(v) : MOCK_MEMBERS; } catch { return MOCK_MEMBERS; }
  });
  const save = (next: Member[]) => { setMembers(next); localStorage.setItem("cams_members.v2", JSON.stringify(next)); };
  const updateMember = (id: string, updates: Partial<Member>) => save(members.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  const setPnlTag = (memberId: string, tagged: boolean, reason?: string) => save(members.map((m) => (m.id === memberId ? { ...m, pnlTagged: tagged, pnlReason: reason } : m)));
  const addMember = (member: Member) => save([...members, member]);
  const deactivateMember = (memberId: string) => save(members.map((m) => (m.id === memberId ? { ...m, active: false } : m)));
  const reactivateMember = (memberId: string) => save(members.map((m) => (m.id === memberId ? { ...m, active: true } : m)));
  return (
    <MembersContext.Provider value={{ members, updateMember, setPnlTag, addMember, deactivateMember, reactivateMember }}>
      {children}
    </MembersContext.Provider>
  );
}
export function useMembers() { const c = useContext(MembersContext); if (!c) throw new Error("useMembers must be used inside MembersProvider"); return c; }
