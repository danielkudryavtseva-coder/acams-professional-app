import React, { createContext, useContext, useState } from "react";
import { MOCK_ATTENDANCE, MOCK_EVENTS, type AttendanceRecord, type ClubEvent, type RsvpStatus } from "../data/mockData";

interface EventsContextValue {
  events: ClubEvent[];
  attendance: AttendanceRecord[];
  addEvent: (event: Omit<ClubEvent, "id">) => void;
  rsvp: (memberId: string, eventId: string, status: RsvpStatus, reason?: string) => void;
  markAttended: (memberId: string, eventId: string, attended: boolean) => void;
  getConsecutiveMisses: (memberId: string) => number;
  getMemberAttendance: (memberId: string) => AttendanceRecord[];
}
const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<ClubEvent[]>(MOCK_EVENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const save = (next: AttendanceRecord[]) => { setAttendance(next); localStorage.setItem("cams_attendance", JSON.stringify(next)); };
  const addEvent = (event: Omit<ClubEvent, "id">) => setEvents((p) => [...p, { ...event, id: `e${Date.now()}` }]);
  const rsvp = (memberId: string, eventId: string, status: RsvpStatus, reason?: string) => {
    const ex = attendance.find((r) => r.memberId === memberId && r.eventId === eventId);
    save(ex ? attendance.map((r) => (r.memberId === memberId && r.eventId === eventId ? { ...r, rsvp: status, missReason: reason } : r)) : [...attendance, { memberId, eventId, rsvp: status, attended: null, missReason: reason }]);
  };
  const markAttended = (memberId: string, eventId: string, attended: boolean) => {
    const ex = attendance.find((r) => r.memberId === memberId && r.eventId === eventId);
    save(ex ? attendance.map((r) => (r.memberId === memberId && r.eventId === eventId ? { ...r, attended } : r)) : [...attendance, { memberId, eventId, rsvp: "confirmed", attended }]);
  };
  const getConsecutiveMisses = (memberId: string) => {
    const mandatory = events.filter((e) => e.mandatory && new Date(e.date) < new Date()).sort((a, b) => +new Date(b.date) - +new Date(a.date));
    let misses = 0; for (const e of mandatory) { const r = attendance.find((a) => a.memberId === memberId && a.eventId === e.id); if (!r || r.attended === false) misses++; else break; }
    return misses;
  };
  const getMemberAttendance = (memberId: string) => attendance.filter((a) => a.memberId === memberId);
  return <EventsContext.Provider value={{ events, attendance, addEvent, rsvp, markAttended, getConsecutiveMisses, getMemberAttendance }}>{children}</EventsContext.Provider>;
}
export function useEvents() { const c = useContext(EventsContext); if (!c) throw new Error("useEvents must be used inside EventsProvider"); return c; }
