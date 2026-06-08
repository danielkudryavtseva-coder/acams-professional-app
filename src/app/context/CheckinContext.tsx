import React, { createContext, useContext, useState } from "react";
import { startOfWeek } from "date-fns";
import type { WeeklyCheckin } from "../data/mockData";

interface CheckinContextValue {
  checkins: WeeklyCheckin[];
  submitCheckin: (data: Omit<WeeklyCheckin, "id" | "submittedAt">) => void;
  hasCheckedInThisWeek: (memberId: string) => boolean;
}
const CheckinContext = createContext<CheckinContextValue | null>(null);

export function CheckinProvider({ children }: { children: React.ReactNode }) {
  const [checkins, setCheckins] = useState<WeeklyCheckin[]>([]);
  const submitCheckin = (data: Omit<WeeklyCheckin, "id" | "submittedAt">) => setCheckins((p) => [...p, { ...data, id: `c${Date.now()}`, submittedAt: new Date().toISOString() }]);
  const hasCheckedInThisWeek = (memberId: string) => {
    const week = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];
    return checkins.some((c) => c.memberId === memberId && c.weekOf.startsWith(week));
  };
  return <CheckinContext.Provider value={{ checkins, submitCheckin, hasCheckedInThisWeek }}>{children}</CheckinContext.Provider>;
}
export function useCheckin() { const c = useContext(CheckinContext); if (!c) throw new Error("useCheckin must be used inside CheckinProvider"); return c; }
