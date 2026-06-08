/**
 * Mock data for development and demo purposes.
 */

import alumniRolodexData from "./alumniRolodexData.json";
import type { Tag } from "./tags";
import { DEFAULT_TAG_CATALOG } from "./tags";

/** Frozen tag rows for pitch/decision records (mirrors `freezeTagSnapshot` output). */
function snapshotTags(tagIds: string[]): Tag[] {
  return DEFAULT_TAG_CATALOG.filter((t) => tagIds.includes(t.id)).map((t) => ({ ...t }));
}

export interface Contact {
  id: string;
  name: string;
  firm: string;
  role: string;
  email?: string;
  linkedin?: string;
  phone?: string;
  location?: string;
  school?: string;
  graduationYear?: number;
  status: "active" | "inactive" | "do_not_contact";
  lastContacted?: string;
  notes?: string;
  tags: string[];
}

export type ProgramTrack =
  | "IB"
  | "PE"
  | "HF"
  | "AM"
  | "VC"
  | "consulting"
  | "ER"
  | "ST"
  | "RX"
  | "Multi";

export type ProgramCategory =
  | "SA"
  | "FT"
  | "Sophomore"
  | "Freshman"
  | "Insight"
  | "Discovery"
  | "Fellowship"
  | "OffCycle";

export type DiversityType =
  | "Women"
  | "Black"
  | "Hispanic/Latinx"
  | "LGBTQ+"
  | "Veterans"
  | "HBCU"
  | "FirstGen"
  | "DiverseAbilities"
  | "General";

export type ProgramClassYear = "Freshman" | "Sophomore" | "Junior" | "Senior";

export interface Program {
  id: string;
  firm: string;
  role: string;
  type: ProgramTrack;
  deadline?: string;
  status: "open" | "closed" | "applied" | "interviewing" | "offer" | "rejected";
  location: string;
  description?: string;
  applicationLink?: string;
  /** Specific business unit, e.g. "Investment Banking", "Global Markets", "Restructuring". */
  division?: string;
  /** Branded program name as marketed by the firm. */
  programName?: string;
  /** "Application Open" date in ISO form. */
  openDate?: string;
  /** Class years targeted by the program. */
  classYears?: ProgramClassYear[];
  /** Functional category (Summer Analyst, Full-Time, sophomore-only, etc.). */
  category?: ProgramCategory;
  /** Recruiting cycle year (e.g., 2027 for "Summer Analyst 2027"). */
  cycleYear?: number;
  /** Whether the deadline is rolling rather than a hard close. */
  rolling?: boolean;
  /** True if the program is part of a diversity / affinity pipeline. */
  diversity?: boolean;
  /** Specific diversity tracks this program targets. */
  diversityTypes?: DiversityType[];
  /** Free-form notes (rolling cycle, regional caveats, source quality). */
  notes?: string;
  /** URL or short citation for where the dates were sourced. */
  source?: string;
}

export interface StockHolding {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
  marketCap: "large" | "mid" | "small";
}

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "James Liu",
    firm: "Goldman Sachs",
    role: "VP, Investment Banking",
    email: "j.liu@gs.com",
    location: "New York, NY",
    status: "active",
    lastContacted: "2026-03-15",
    tags: ["IB", "mentor", "alumni"],
  },
  {
    id: "c2",
    name: "Rachel Kim",
    firm: "Blackstone",
    role: "Associate, Private Equity",
    email: "r.kim@blackstone.com",
    location: "New York, NY",
    status: "active",
    lastContacted: "2026-04-01",
    tags: ["PE", "networking"],
  },
  {
    id: "c3",
    name: "David Torres",
    firm: "Citadel",
    role: "Portfolio Manager",
    email: "d.torres@citadel.com",
    location: "Chicago, IL",
    status: "active",
    lastContacted: "2026-02-20",
    tags: ["HF", "quant"],
  },
  {
    id: "c4",
    name: "Emily Zhang",
    firm: "Morgan Stanley",
    role: "Senior Recruiter",
    email: "e.zhang@ms.com",
    location: "New York, NY",
    status: "active",
    lastContacted: "2026-04-10",
    tags: ["recruiter", "IB"],
  },
  {
    id: "c5",
    name: "Michael Brown",
    firm: "KKR",
    role: "Director",
    email: "m.brown@kkr.com",
    location: "New York, NY",
    status: "active",
    tags: ["PE"],
  },
];

/**
 * The full 2026–2027 recruiting calendar lives in `recruitingPrograms.ts`. We
 * re-export it here so existing consumers (DashboardHome, ProgramsGrid,
 * RecruitingPage, etc.) keep working with no import changes.
 */
import { RECRUITING_PROGRAMS } from "./recruitingPrograms";

export const MOCK_PROGRAMS: Program[] = RECRUITING_PROGRAMS;

export const MOCK_STOCK_HOLDINGS: StockHolding[] = [
  { ticker: "AAPL", name: "Apple Inc.", shares: 50, avgCost: 155.0, currentPrice: 189.3, sector: "Technology", marketCap: "large" },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: 30, avgCost: 290.0, currentPrice: 378.8, sector: "Technology", marketCap: "large" },
  { ticker: "JPM", name: "JPMorgan Chase", shares: 25, avgCost: 148.0, currentPrice: 197.5, sector: "Financials", marketCap: "large" },
  { ticker: "GS", name: "Goldman Sachs", shares: 10, avgCost: 325.0, currentPrice: 412.2, sector: "Financials", marketCap: "large" },
  { ticker: "BRK.B", name: "Berkshire Hathaway B", shares: 40, avgCost: 288.0, currentPrice: 360.1, sector: "Financials", marketCap: "large" },
  { ticker: "NVDA", name: "NVIDIA Corp.", shares: 20, avgCost: 220.0, currentPrice: 875.4, sector: "Technology", marketCap: "large" },
];

export const DASHBOARD_STATS = {
  totalContacts: 247,
  activeApplications: 12,
  interviewsScheduled: 3,
  offersReceived: 1,
  networkingCalls: 28,
  responseRate: "34%",
  portfolioValue: "$47,832",
  portfolioReturn: "+12.4%",
};

export const RECRUITING_TIMELINE = [
  { month: "Jun", applications: 2, contacts: 5 },
  { month: "Jul", applications: 4, contacts: 12 },
  { month: "Aug", applications: 8, contacts: 18 },
  { month: "Sep", applications: 15, contacts: 32 },
  { month: "Oct", applications: 12, contacts: 28 },
  { month: "Nov", applications: 6, contacts: 15 },
  { month: "Dec", applications: 3, contacts: 8 },
  { month: "Jan", applications: 5, contacts: 20 },
  { month: "Feb", applications: 8, contacts: 25 },
  { month: "Mar", applications: 10, contacts: 30 },
  { month: "Apr", applications: 7, contacts: 18 },
];

// CAMS platform expansion models
export type FinanceTrack = "IB" | "PE" | "VC" | "ER" | "AM" | "Consulting";
export type Committee = "Investment" | "Recruiting" | "Operations" | "Marketing";
export type MemberRole = "member" | "exec";
export type RsvpStatus = "confirmed" | "denied" | "pending";
export type ResourceCategory = "pitches" | "resumes" | "tools" | "links";
export type NewsCategory =
  | "announcement"
  | "portfolio"
  | "speaker"
  | "market"
  | "other";

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  announcement: "Announcement",
  portfolio: "Portfolio",
  speaker: "Speaker",
  market: "Market",
  other: "Other",
};

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classYear: "Freshman" | "Sophomore" | "Junior" | "Senior";
  graduationYear: number;
  committee: Committee;
  interests: FinanceTrack[];
  personalStatement: string;
  resumeFilename: string | null;
  linkedin: string;
  role: MemberRole;
  gpa?: string;
  /** Optional profile photo URL. When omitted, the roster shows initials. */
  avatarUrl?: string;
  pnlTagged: boolean;
  pnlReason?: string;
  /**
   * Whether this member is currently active (visible on public surfaces like
   * the Roster and Scoreboard). Execs can toggle this from the Member Reports
   * page to temporarily hide a member without removing their record.
   * Defaults to `true` for any seeded or newly-registered member; legacy
   * persisted records without the field are treated as active by consumers.
   */
  active: boolean;
  cohort: string;
  joinedAt: string;
  pipelineActivityCount: number;
  pitchesSubmitted: number;
  coffeeChatsCompleted: number;
  /** Number of full-time / internship offers received. Defaults to 0 for new sign-ups. */
  offers: number;
}

export interface AlumniProfile {
  id: string;
  firstName: string;
  lastName: string;
  graduationYear: number;
  firm: string;
  role: string;
  track: FinanceTrack;
  linkedin: string;
  email?: string;
  phone?: string;
  bio: string;
  availableForChat: boolean;
  /** Work location for map pins (same idea as geocoordinates in Obsidian Map View). */
  mapCity: string;
  mapLat: number;
  mapLng: number;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  mandatory: boolean;
}

export interface AttendanceRecord {
  memberId: string;
  eventId: string;
  rsvp: RsvpStatus;
  attended: boolean | null;
  missReason?: string;
}

export interface JobPosting {
  id: string;
  firm: string;
  role: string;
  track: FinanceTrack;
  deadline: string;
  applicationLink: string;
  alumniReferralId?: string;
  description: string;
  postedBy: "cams" | "alumni";
}

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  filename?: string;
  url?: string;
  uploadedBy: string;
  uploadedAt: string;
  /**
   * Members who drove this resource (e.g. authors of a pitch). Foundation for
   * future P&L attribution.
   */
  taggedMemberIds?: string[];
  /**
   * Frozen copy of the approved tags those members held at the time the
   * resource was created. NEVER mutate this once set — see
   * `freezeTagSnapshot` in `lib/tags.ts`.
   */
  tagSnapshot?: Tag[];
}

/**
 * Lightweight schema for an investment decision (pitch outcome, position open,
 * position close, etc.). The realized/unrealized P&L numbers are intentionally
 * left undefined for now — the schema is the foundation for the future
 * tag→trade attribution layer.
 */
export interface PortfolioDecision {
  id: string;
  /** Trading symbol or pitch title. */
  ticker: string;
  /** Display title shown on the member profile decisions list. */
  title: string;
  /** ISO date the decision was made (committee vote / pitch approval). */
  decidedAt: string;
  decisionType: "open" | "close" | "trim" | "add" | "pitch";
  /** Members responsible for the decision. */
  taggedMemberIds: string[];
  /** Snapshot of the approved tags those members held at decision time. */
  tagSnapshot?: Tag[];
  /**
   * Optional notes (sector, thesis tag, etc.). Free-form so this model can
   * hold both committee pitches and ad-hoc trades.
   */
  notes?: string;
  // TODO(pnl): wire to portfolioHoldings.ts realized/unrealized once tag→trade
  // attribution is signed off by execs. Until then these stay undefined and
  // the UI shows a `--` placeholder.
  realizedPnl?: number;
  unrealizedPnl?: number;
}

export interface NewsPost {
  id: string;
  title: string;
  body: string;
  /** Short preview for cards and list; falls back to truncated body when omitted. */
  excerpt?: string;
  category: NewsCategory;
  author: string;
  publishedAt: string;
  pinned: boolean;
}

export interface WeeklyCheckin {
  id: string;
  memberId: string;
  weekOf: string;
  q1_recruiting: string;
  q2_blockers: string;
  q3_goals: string;
  submittedAt: string;
}

export interface CoffeeChatBooking {
  id: string;
  memberId: string;
  alumniId: string;
  requestedDate: string;
  message: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface FirmCard {
  firmName: string;
  track: FinanceTrack;
  recentDeals: string[];
  camsAlumniIds: string[];
  historicalPlacements: number;
  notes: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  audience: "all" | "spring2026" | "alumni" | "exec";
  sentAt: string;
  sentBy: string;
}

export const MOCK_MEMBERS: Member[] = [
  { id: "m1", firstName: "Drew", lastName: "Whitfield", email: "dkwhitfield@crimson.ua.edu", phone: "205-555-0101", classYear: "Junior", graduationYear: 2027, committee: "Investment", interests: ["IB", "PE"], personalStatement: "Passionate about leveraged buyouts and capital structure optimization.", resumeFilename: "whitfield_resume.pdf", linkedin: "linkedin.com/in/drewwhitfield", role: "exec", gpa: "3.91", pnlTagged: false, active: true, cohort: "Spring 2026", joinedAt: "2025-01-15", pipelineActivityCount: 12, pitchesSubmitted: 3, coffeeChatsCompleted: 5, offers: 2 },
  { id: "m2", firstName: "Jordan", lastName: "Hayes", email: "jhayes@crimson.ua.edu", phone: "205-555-0102", classYear: "Junior", graduationYear: 2027, committee: "Recruiting", interests: ["VC", "Consulting"], personalStatement: "Interested in early-stage venture and strategic advisory work.", resumeFilename: "hayes_resume.pdf", linkedin: "linkedin.com/in/jordanhayes", role: "member", gpa: "3.75", pnlTagged: false, active: true, cohort: "Spring 2026", joinedAt: "2025-01-15", pipelineActivityCount: 8, pitchesSubmitted: 2, coffeeChatsCompleted: 3, offers: 1 },
  { id: "m3", firstName: "Priya", lastName: "Sharma", email: "psharma@crimson.ua.edu", phone: "205-555-0103", classYear: "Sophomore", graduationYear: 2028, committee: "Investment", interests: ["ER", "AM"], personalStatement: "Equity research enthusiast with a focus on healthcare and biotech.", resumeFilename: "sharma_resume.pdf", linkedin: "linkedin.com/in/priyasharma", role: "member", gpa: "3.88", pnlTagged: false, active: true, cohort: "Spring 2026", joinedAt: "2025-01-15", pipelineActivityCount: 6, pitchesSubmitted: 2, coffeeChatsCompleted: 2, offers: 1 },
  { id: "m4", firstName: "Marcus", lastName: "Davis", email: "mdavis@crimson.ua.edu", phone: "205-555-0104", classYear: "Senior", graduationYear: 2026, committee: "Operations", interests: ["IB", "Consulting"], personalStatement: "Focused on M&A and strategic advisory.", resumeFilename: "davis_resume.pdf", linkedin: "linkedin.com/in/marcusdavis", role: "exec", gpa: "3.62", pnlTagged: false, active: true, cohort: "Spring 2026", joinedAt: "2025-01-15", pipelineActivityCount: 15, pitchesSubmitted: 4, coffeeChatsCompleted: 7, offers: 3 },
  { id: "m5", firstName: "Chloe", lastName: "Park", email: "cpark@crimson.ua.edu", phone: "205-555-0105", classYear: "Junior", graduationYear: 2027, committee: "Marketing", interests: ["PE", "VC"], personalStatement: "Growth equity focus.", resumeFilename: null, linkedin: "linkedin.com/in/chloepark", role: "member", gpa: "3.55", pnlTagged: true, pnlReason: "3 consecutive mandatory event misses + no pitches submitted Q1", active: true, cohort: "Spring 2026", joinedAt: "2025-01-15", pipelineActivityCount: 2, pitchesSubmitted: 0, coffeeChatsCompleted: 1, offers: 0 },
];

/** Sourced from CAMS Alumni Rolodex spreadsheet; regenerate via `py -3 scripts/generate_alumni_rolodex.py`. */
export const MOCK_ALUMNI: AlumniProfile[] = alumniRolodexData as AlumniProfile[];

export const MOCK_EVENTS: ClubEvent[] = [
  { id: "e1", title: "Spring 2026 Kickoff Meeting", description: "Introductions and semester goals.", date: "2026-01-20T18:00:00", location: "Bidgood Hall 130", mandatory: true },
  { id: "e2", title: "Goldman Sachs Info Session", description: "GS IBD and S&T recruiting overview.", date: "2026-02-05T17:30:00", location: "Bidgood Hall 200", mandatory: true },
  { id: "e3", title: "Mock Interview Workshop", description: "Behavioral and technical prep.", date: "2026-02-19T18:00:00", location: "Bidgood Hall 130", mandatory: false },
  { id: "e4", title: "Investment Pitch — Q1", description: "Committee pitch presentations.", date: "2026-03-10T17:00:00", location: "Bidgood Hall 130", mandatory: true },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { memberId: "m1", eventId: "e1", rsvp: "confirmed", attended: true },
  { memberId: "m1", eventId: "e2", rsvp: "confirmed", attended: true },
  { memberId: "m1", eventId: "e4", rsvp: "confirmed", attended: true },
  { memberId: "m5", eventId: "e1", rsvp: "denied", attended: false, missReason: "Personal" },
  { memberId: "m5", eventId: "e2", rsvp: "denied", attended: false, missReason: "Travel" },
  { memberId: "m5", eventId: "e4", rsvp: "pending", attended: false },
];

export const MOCK_JOB_POSTINGS: JobPosting[] = [
  { id: "j1", firm: "Goldman Sachs", role: "Summer Analyst — IBD", track: "IB", deadline: "2026-09-01", applicationLink: "https://goldmansachs.com/careers", alumniReferralId: "alum-033", description: "10-week IBD program.", postedBy: "cams" },
  { id: "j2", firm: "BlackRock", role: "Summer Analyst — AM", track: "AM", deadline: "2026-08-15", applicationLink: "https://blackrock.com/careers", alumniReferralId: "alum-015", description: "Asset management summer program.", postedBy: "alumni" },
  { id: "j3", firm: "Leerink Partners", role: "Summer Analyst — IB", track: "IB", deadline: "2026-06-01", applicationLink: "https://leerink.com", alumniReferralId: "alum-042", description: "Healthcare-focused investment banking.", postedBy: "cams" },
];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: "r1",
    title: "Q4 2025 — Apple Pitch Deck",
    category: "pitches",
    description: "Investment committee bull thesis on AAPL.",
    filename: "apple_pitch_q4_2025.pdf",
    uploadedBy: "m1",
    uploadedAt: "2026-01-10",
    taggedMemberIds: ["m1", "m3"],
    tagSnapshot: snapshotTags([
      "grade-junior",
      "grade-sophomore",
      "committee-investment",
      "career-ib",
      "career-pe",
      "career-er",
      "career-am",
    ]),
  },
  { id: "r2", title: "IB Resume Template", category: "resumes", description: "Successful GS IBD applicant format.", filename: "ib_resume_template.pdf", uploadedBy: "m1", uploadedAt: "2026-01-12" },
  { id: "r3", title: "Wall Street Prep — Group Access", category: "tools", description: "CAMS group account for WSP.", url: "https://wallstreetprep.com", uploadedBy: "m1", uploadedAt: "2026-01-15" },
  { id: "r4", title: "Pitchbook Free Trial", category: "links", description: "UA student access link.", url: "https://pitchbook.com", uploadedBy: "m4", uploadedAt: "2026-02-10" },
];

/**
 * Seed list of investment decisions tagged to specific members. Used by the
 * member profile "Decisions" subsection. Real P&L numbers are intentionally
 * absent — see TODO(pnl) on `PortfolioDecision`.
 */
export const MOCK_PORTFOLIO_DECISIONS: PortfolioDecision[] = [
  {
    id: "d1",
    ticker: "AAPL",
    title: "Initiate AAPL long",
    decidedAt: "2026-01-12",
    decisionType: "open",
    taggedMemberIds: ["m1", "m3"],
    tagSnapshot: snapshotTags([
      "grade-junior",
      "grade-sophomore",
      "committee-investment",
      "career-ib",
      "career-pe",
      "career-er",
      "career-am",
    ]),
    notes: "Pitch led by Drew; Priya covered healthcare-adjacent supply chain.",
  },
  {
    id: "d2",
    ticker: "VRTX",
    title: "Add to VRTX position",
    decidedAt: "2026-02-18",
    decisionType: "add",
    taggedMemberIds: ["m3"],
    tagSnapshot: snapshotTags([
      "grade-sophomore",
      "committee-investment",
      "career-er",
      "career-am",
    ]),
    notes: "Healthcare conviction add.",
  },
  {
    id: "d3",
    ticker: "SG",
    title: "Close Sweetgreen",
    decidedAt: "2026-03-04",
    decisionType: "close",
    taggedMemberIds: ["m4"],
    tagSnapshot: snapshotTags([
      "grade-senior",
      "committee-operations",
      "career-ib",
      "career-consulting",
    ]),
    notes: "Thesis broken; cut position.",
  },
];

export const MOCK_NEWS: NewsPost[] = [
  { id: "n1", title: "Welcome, Spring 2026 Class!", body: "We are thrilled to welcome a strong new CAMS class.", category: "announcement", author: "CAMS Executive Board", publishedAt: "2026-01-15T12:00:00", pinned: true },
  { id: "n2", title: "Portfolio Update — Q1 2026", body: "The student-managed portfolio returned +3.2% in Q1.", category: "portfolio", author: "Investment Committee", publishedAt: "2026-04-01T09:00:00", pinned: false },
  { id: "n3", title: "Fed Holds Rates", body: "Hiring remains cautious but stable across finance.", category: "market", author: "Research Team", publishedAt: "2026-03-20T14:00:00", pinned: false },
];

export const MOCK_FIRM_CARDS: FirmCard[] = [
  {
    firmName: "Goldman Sachs",
    track: "IB",
    recentDeals: ["Advisored on $4.2B DataCo acquisition"],
    camsAlumniIds: ["alum-033", "alum-045", "alum-071", "alum-103", "alum-125", "alum-133", "alum-141"],
    historicalPlacements: 7,
    notes: "Behavioral + technical heavy.",
  },
  {
    firmName: "Ducat Capital Partners",
    track: "PE",
    recentDeals: ["Regional lower-middle-market platform builds"],
    camsAlumniIds: ["alum-144", "alum-095"],
    historicalPlacements: 2,
    notes: "Warm intro via CAMS alumni.",
  },
  {
    firmName: "Leerink Partners",
    track: "IB",
    recentDeals: ["Healthcare ECM and advisory"],
    camsAlumniIds: ["alum-042"],
    historicalPlacements: 1,
    notes: "Healthcare coverage focus.",
  },
];
