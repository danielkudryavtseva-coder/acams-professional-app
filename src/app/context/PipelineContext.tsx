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

const PIPELINE_KEY = "cams.pipeline.v1";

function loadPipeline(): PipelineContact[] {
  try {
    const v = localStorage.getItem(PIPELINE_KEY);
    if (!v) return [];
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function savePipeline(contacts: PipelineContact[]) {
  try { localStorage.setItem(PIPELINE_KEY, JSON.stringify(contacts)); } catch {}
}

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = React.useState<PipelineContact[]>(loadPipeline);

  const addContact = React.useCallback((contact: Omit<PipelineContact, "id" | "addedAt">) => {
    setContacts((prev) => {
      const next = [...prev, { ...contact, id: crypto.randomUUID(), addedAt: new Date().toISOString() }];
      savePipeline(next);
      return next;
    });
  }, []);

  const updateContact = React.useCallback((id: string, updates: Partial<PipelineContact>) => {
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      savePipeline(next);
      return next;
    });
  }, []);

  const removeContact = React.useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      savePipeline(next);
      return next;
    });
  }, []);

  const moveStage = React.useCallback((id: string, stage: PipelineStage) => {
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, stage } : c));
      savePipeline(next);
      return next;
    });
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
