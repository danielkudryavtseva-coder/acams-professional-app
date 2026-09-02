import type { FinanceTrack, Committee } from "./mockData";

// Set via Vercel env var (VITE_EXEC_PASSWORD). NOT hardcoded here — if the env var is
// missing, the Exec Tools unlock rejects all attempts.
export const EXEC_PASSWORD = (import.meta.env.VITE_EXEC_PASSWORD as string | undefined) ?? "";
export const CRIMSON_EMAIL_DOMAIN = "@crimson.ua.edu";
export const CURRENT_COHORT = "Spring 2026";
export const FINANCE_TRACKS: FinanceTrack[] = ["IB", "PE", "VC", "ER", "AM", "Consulting"];
// Matches the sector coverage teams on CommitteesPage.tsx — same order they're listed there.
export const COMMITTEES: Committee[] = ["TMT", "Contrarian", "Financials", "Consumer", "Healthcare", "Industrials & Energy"];
export const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior"] as const;

// Derives graduation years from CURRENT_COHORT so RecruitingPage/RosterPage labels stay correct
// as long as CURRENT_COHORT is bumped each semester — instead of separately hardcoded strings
// that silently go stale. Fall-cohort seniors still graduate the following spring.
const [cohortSeason, cohortYearStr] = CURRENT_COHORT.split(" ");
const seniorGradYear = (cohortSeason === "Fall" ? parseInt(cohortYearStr, 10) + 1 : parseInt(cohortYearStr, 10));

export const GRAD_YEAR_BY_CLASS: Record<(typeof CLASS_YEARS)[number], number> = {
  Senior: seniorGradYear,
  Junior: seniorGradYear + 1,
  Sophomore: seniorGradYear + 2,
  Freshman: seniorGradYear + 3,
};

/** e.g. "Class of '27" — kept in sync with CURRENT_COHORT via GRAD_YEAR_BY_CLASS above. */
export const GRAD_YEAR_LABEL: Record<(typeof CLASS_YEARS)[number], string> = Object.fromEntries(
  CLASS_YEARS.map((year) => [year, `Class of '${String(GRAD_YEAR_BY_CLASS[year]).slice(-2)}`]),
) as Record<(typeof CLASS_YEARS)[number], string>;
export const TRACK_COLORS: Record<FinanceTrack, string> = { IB: "bg-blue-100 text-blue-800", PE: "bg-purple-100 text-purple-800", VC: "bg-green-100 text-green-800", ER: "bg-amber-100 text-amber-800", AM: "bg-rose-100 text-rose-800", Consulting: "bg-slate-100 text-slate-800" };
export const COMMITTEE_COLORS: Record<Committee, string> = {
  TMT: "bg-blue-100 text-blue-800",
  Contrarian: "bg-purple-100 text-purple-800",
  Financials: "bg-green-100 text-green-800",
  Consumer: "bg-amber-100 text-amber-800",
  Healthcare: "bg-rose-100 text-rose-800",
  "Industrials & Energy": "bg-slate-100 text-slate-800",
};
export const INTEREST_QUIZ = [
  { id: "q1", question: "Which finance area interests you most?", options: ["Investment Banking", "Private Equity", "Venture Capital", "Equity Research", "Asset Management", "Consulting"] },
  { id: "q2", question: "What kind of work do you prefer?", options: ["Fast-paced deal execution", "Long-term portfolio management", "Early-stage company building", "Research and analysis", "Client advisory", "Cross-functional strategy"] },
  { id: "q3", question: "Which skill do you most want to build?", options: ["Financial modeling / LBO", "Valuation / DCF", "Cap table management", "Equity analysis", "Portfolio construction", "Presentation / deck building"] },
  { id: "q4", question: "Where do you see yourself after graduation?", options: ["Bulge bracket bank", "Mega-fund PE", "Top-tier VC", "Buy-side research", "Large asset manager", "Strategy consulting"] },
  { id: "q5", question: "How do you learn best?", options: ["Live deal experience", "Case studies", "Mentorship from alumni", "Self-study / courses", "Peer collaboration", "Competitions"] },
  { id: "q6", question: "What motivates you most in finance?", options: ["Transaction adrenaline", "Value creation", "Disruption / innovation", "Market insight", "Wealth generation", "Complex problem solving"] },
];
