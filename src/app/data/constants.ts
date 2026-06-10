import type { FinanceTrack, Committee } from "./mockData";

// Passwords are set via Vercel env vars (VITE_CLASS_PASSWORD, VITE_EXEC_PASSWORD).
// They are NOT hardcoded here — if the env var is missing, auth rejects all attempts.
export const CLASS_PASSWORD = (import.meta.env.VITE_CLASS_PASSWORD as string | undefined) ?? "";
export const EXEC_PASSWORD = (import.meta.env.VITE_EXEC_PASSWORD as string | undefined) ?? "";
export const CRIMSON_EMAIL_DOMAIN = "@crimson.ua.edu";
export const CURRENT_COHORT = "Spring 2026";
export const FINANCE_TRACKS: FinanceTrack[] = ["IB", "PE", "VC", "ER", "AM", "Consulting"];
export const COMMITTEES: Committee[] = ["Investment", "Recruiting", "Operations", "Marketing"];
export const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;
export const TRACK_COLORS: Record<FinanceTrack, string> = { IB: "bg-blue-100 text-blue-800", PE: "bg-purple-100 text-purple-800", VC: "bg-green-100 text-green-800", ER: "bg-amber-100 text-amber-800", AM: "bg-rose-100 text-rose-800", Consulting: "bg-slate-100 text-slate-800" };
export const COMMITTEE_COLORS: Record<Committee, string> = { Investment: "bg-blue-100 text-blue-800", Recruiting: "bg-green-100 text-green-800", Operations: "bg-amber-100 text-amber-800", Marketing: "bg-purple-100 text-purple-800" };
export const INTEREST_QUIZ = [
  { id: "q1", question: "Which finance area interests you most?", options: ["Investment Banking", "Private Equity", "Venture Capital", "Equity Research", "Asset Management", "Consulting"] },
  { id: "q2", question: "What kind of work do you prefer?", options: ["Fast-paced deal execution", "Long-term portfolio management", "Early-stage company building", "Research and analysis", "Client advisory", "Cross-functional strategy"] },
  { id: "q3", question: "Which skill do you most want to build?", options: ["Financial modeling / LBO", "Valuation / DCF", "Cap table management", "Equity analysis", "Portfolio construction", "Presentation / deck building"] },
  { id: "q4", question: "Where do you see yourself after graduation?", options: ["Bulge bracket bank", "Mega-fund PE", "Top-tier VC", "Buy-side research", "Large asset manager", "Strategy consulting"] },
  { id: "q5", question: "How do you learn best?", options: ["Live deal experience", "Case studies", "Mentorship from alumni", "Self-study / courses", "Peer collaboration", "Competitions"] },
  { id: "q6", question: "What motivates you most in finance?", options: ["Transaction adrenaline", "Value creation", "Disruption / innovation", "Market insight", "Wealth generation", "Complex problem solving"] },
];
