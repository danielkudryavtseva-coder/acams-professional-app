import * as React from "react";

export type PipelineStage =
  | "wishlist"
  | "networking"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "accepted";

export interface PipelineContact {
  id: string;
  name: string;
  firm: string;
  role: string;
  stage: PipelineStage;
  lastContact?: string;
  notes?: string;
  email?: string;
  linkedin?: string;
  priority: "high" | "medium" | "low";
  addedAt: string;
}

interface PipelineContextValue {
  contacts: PipelineContact[];
  addContact: (contact: Omit<PipelineContact, "id" | "addedAt">) => void;
  updateContact: (id: string, updates: Partial<PipelineContact>) => void;
  removeContact: (id: string) => void;
  moveStage: (id: string, stage: PipelineStage) => void;
}

const PipelineContext = React.createContext<PipelineContextValue | undefined>(undefined);

const INITIAL_CONTACTS: PipelineContact[] = [
  {
    id: "1",
    name: "Alex Chen",
    firm: "Goldman Sachs",
    role: "Investment Banking Analyst",
    stage: "networking",
    priority: "high",
    addedAt: new Date().toISOString(),
    email: "achen@gs.com",
  },
  {
    id: "2",
    name: "Sarah Park",
    firm: "Blackstone",
    role: "Private Equity Associate",
    stage: "phone_screen",
    priority: "high",
    addedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Marcus Johnson",
    firm: "KKR",
    role: "PE Analyst",
    stage: "applied",
    priority: "medium",
    addedAt: new Date().toISOString(),
  },
];

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = React.useState<PipelineContact[]>(INITIAL_CONTACTS);

  const addContact = React.useCallback((contact: Omit<PipelineContact, "id" | "addedAt">) => {
    setContacts((prev) => [
      ...prev,
      { ...contact, id: crypto.randomUUID(), addedAt: new Date().toISOString() },
    ]);
  }, []);

  const updateContact = React.useCallback((id: string, updates: Partial<PipelineContact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const removeContact = React.useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const moveStage = React.useCallback((id: string, stage: PipelineStage) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
  }, []);

  return (
    <PipelineContext.Provider value={{ contacts, addContact, updateContact, removeContact, moveStage }}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = React.useContext(PipelineContext);
  if (!context) throw new Error("usePipeline must be used within PipelineProvider");
  return context;
}
