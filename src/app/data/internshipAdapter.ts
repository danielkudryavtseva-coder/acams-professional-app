/**
 * Adapts the 522-entry internships.ts dataset (originally built for the
 * standalone recruiting tracker) into the Program interface used by
 * RecruitingPage so all data lives in a single source of truth.
 */

import { internships, type Internship, type Sector, type Status } from "./internships";
import type { Program, ProgramCategory, ProgramClassYear, ProgramTrack } from "./mockData";

function sectorToTrack(sector: Sector): ProgramTrack {
  switch (sector) {
    case "IB":        return "IB";
    case "PE":
    case "REPE":      return "PE";
    case "HF":        return "HF";
    case "AM":
    case "PB":        return "AM";
    case "VC":        return "VC";
    case "Consulting":
    case "Big4":      return "consulting";
    case "S&T":       return "ST";
    case "Insight":   return "Multi";
    default:          return "Multi";
  }
}

function typeToCategory(t: Internship["type"]): ProgramCategory {
  switch (t) {
    case "Summer Analyst":    return "SA";
    case "Exploration Event": return "Insight";
    case "Diversity Program": return "Freshman";
    case "Off-cycle":
    case "Co-op":             return "OffCycle";
    default:                  return "SA";
  }
}

function mapStatus(s: Status): Program["status"] {
  return s === "closed" ? "closed" : "open";
}

function mapClassYears(years: Internship["targetYears"]): ProgramClassYear[] {
  return years.filter((y): y is ProgramClassYear =>
    ["Freshman", "Sophomore", "Junior", "Senior"].includes(y)
  );
}

export function adaptInternships(): Program[] {
  return internships.map((i): Program => ({
    id:              `int-${i.id}`,
    firm:            i.firm,
    role:            i.programName,
    programName:     i.programName,
    division:        i.division,
    type:            sectorToTrack(i.sector),
    category:        typeToCategory(i.type),
    cycleYear:       typeof i.targetSummer === "number" ? i.targetSummer : undefined,
    openDate:        i.appOpenDate !== "TBD" ? i.appOpenDate : undefined,
    deadline:        i.deadlineISO ?? undefined,
    rolling:         i.status === "rolling",
    status:          mapStatus(i.status),
    location:        i.locations[0] ?? "Multiple",
    classYears:      mapClassYears(i.targetYears),
    applicationLink: i.appLink && i.appLink !== "#" ? i.appLink : undefined,
    notes:           [
                       i.gpa !== "None required" && i.gpa !== "Not specified" ? `GPA: ${i.gpa}` : "",
                       i.requirements && i.requirements !== "Open to all majors" ? i.requirements : "",
                       i.tips[0] ?? "",
                     ].filter(Boolean).join(" · ") || undefined,
    source:          "internships.ts",
  }));
}
