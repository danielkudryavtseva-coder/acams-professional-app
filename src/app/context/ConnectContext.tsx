import React, { createContext, useContext, useState } from "react";
import type { CoffeeChatBooking } from "../data/mockData";

interface ConnectContextValue {
  bookings: CoffeeChatBooking[];
  addBooking: (booking: Omit<CoffeeChatBooking, "id" | "createdAt">) => void;
  updateBookingStatus: (id: string, status: CoffeeChatBooking["status"]) => void;
}
const ConnectContext = createContext<ConnectContextValue | null>(null);
export function ConnectProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<CoffeeChatBooking[]>([]);
  const addBooking = (data: Omit<CoffeeChatBooking, "id" | "createdAt">) => setBookings((p) => [...p, { ...data, id: `b${Date.now()}`, createdAt: new Date().toISOString() }]);
  const updateBookingStatus = (id: string, status: CoffeeChatBooking["status"]) => setBookings((p) => p.map((b) => (b.id === id ? { ...b, status } : b)));
  return <ConnectContext.Provider value={{ bookings, addBooking, updateBookingStatus }}>{children}</ConnectContext.Provider>;
}
export function useConnect() { const c = useContext(ConnectContext); if (!c) throw new Error("useConnect must be used inside ConnectProvider"); return c; }
