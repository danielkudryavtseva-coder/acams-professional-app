import type { Contact, ContactPriority, ContactStage } from "../data/mockData";
import { CONTACT_STAGE_LABEL } from "../data/mockData";

export type ImportedContact = Omit<Contact, "id" | "tags">;

export interface ParseContactsResult {
  /** Rows that parsed successfully and are ready to add. */
  contacts: ImportedContact[];
  /** Human-readable problems for rows that were skipped (1-indexed against the data rows, header excluded). */
  errors: string[];
  /** Blank rows silently skipped (common trailing rows from Excel exports) — not counted as errors. */
  blankRowsSkipped: number;
}

/** Strips everything but lowercase letters/digits so header matching survives spacing/casing/punctuation differences. */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const HEADER_ALIASES: Record<keyof ImportedContact, string[]> = {
  name: ["name", "fullname", "contactname"],
  firm: ["firm", "company", "organization", "employer"],
  role: ["role", "title", "jobtitle", "position"],
  email: ["email", "emailaddress"],
  linkedin: ["linkedin", "linkedinurl", "linkedinprofile"],
  phone: ["phone", "phonenumber", "mobile", "cell"],
  location: ["location", "city"],
  school: ["school", "university"],
  graduationYear: ["graduationyear", "gradyear", "classyear"],
  status: ["status"],
  stage: ["stage"],
  priority: ["priority"],
  lastContacted: ["lastcontacted", "lastcontact"],
  notes: ["notes", "note", "comments"],
};

/** Maps each raw column header in the file to the ImportedContact field it represents, if any. */
function buildColumnMap(rawHeaders: string[]): Partial<Record<keyof ImportedContact, string>> {
  const normalizedToRaw = new Map(rawHeaders.map((h) => [normalizeHeader(h), h]));
  const map: Partial<Record<keyof ImportedContact, string>> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [keyof ImportedContact, string[]][]) {
    for (const alias of aliases) {
      const raw = normalizedToRaw.get(alias);
      if (raw) {
        map[field] = raw;
        break;
      }
    }
  }
  return map;
}

const VALID_STAGES = new Set<ContactStage>(["researching", "reached_out", "replied", "coffee_chat", "interviewing"]);
const VALID_PRIORITIES = new Set<ContactPriority>(["high", "medium", "low"]);
const VALID_STATUSES = new Set<Contact["status"]>(["active", "inactive", "do_not_contact"]);
const STAGE_LABEL_TO_VALUE = new Map(
  (Object.entries(CONTACT_STAGE_LABEL) as [ContactStage, string][]).map(([value, label]) => [label.toLowerCase(), value]),
);

function coerceStage(raw: string | undefined): ContactStage {
  if (!raw) return "researching";
  const v = raw.trim().toLowerCase();
  const asValue = v.replace(/\s+/g, "_") as ContactStage;
  if (VALID_STAGES.has(asValue)) return asValue;
  return STAGE_LABEL_TO_VALUE.get(v) ?? "researching";
}

function coercePriority(raw: string | undefined): ContactPriority {
  const v = (raw ?? "").trim().toLowerCase() as ContactPriority;
  return VALID_PRIORITIES.has(v) ? v : "medium";
}

function coerceStatus(raw: string | undefined): Contact["status"] {
  const v = (raw ?? "").trim().toLowerCase().replace(/\s+/g, "_") as Contact["status"];
  return VALID_STATUSES.has(v) ? v : "active";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parses a CSV or Excel (.xlsx/.xls) file of contacts into validated, ready-to-add rows. */
export async function parseContactsFile(file: File): Promise<ParseContactsResult> {
  // Dynamic import: xlsx is ~370KB and only needed by the exec who clicks Import, not
  // bundled into the main chunk every visitor downloads.
  const XLSX = await import("xlsx");
  const isCsv = /\.csv$/i.test(file.name);
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });

  const result: ParseContactsResult = { contacts: [], errors: [], blankRowsSkipped: 0 };
  if (rows.length === 0) {
    result.errors.push("The file has no data rows.");
    return result;
  }

  const columnMap = buildColumnMap(Object.keys(rows[0]));
  if (!columnMap.name) {
    result.errors.push('No "Name" column found — expected a header like "Name" or "Full Name".');
    return result;
  }

  const get = (row: Record<string, string>, field: keyof ImportedContact) => {
    const col = columnMap[field];
    return col ? String(row[col] ?? "").trim() : "";
  };

  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for 0-index, +1 for the header row
    const name = get(row, "name");
    const firm = get(row, "firm");
    const role = get(row, "role");
    if (!name && !firm && !role && !get(row, "email")) {
      result.blankRowsSkipped += 1;
      return;
    }
    if (!name) {
      result.errors.push(`Row ${rowNum}: skipped — missing a name.`);
      return;
    }

    const emailRaw = get(row, "email");
    const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw : undefined;
    if (emailRaw && !email) {
      result.errors.push(`Row ${rowNum} (${name}): "${emailRaw}" doesn't look like a valid email — imported without it.`);
    }

    const gradYearRaw = get(row, "graduationYear");
    const graduationYear = gradYearRaw && /^\d{4}$/.test(gradYearRaw) ? Number(gradYearRaw) : undefined;

    result.contacts.push({
      name,
      firm,
      role,
      email,
      linkedin: get(row, "linkedin") || undefined,
      phone: get(row, "phone") || undefined,
      location: get(row, "location") || undefined,
      school: get(row, "school") || undefined,
      graduationYear,
      status: coerceStatus(get(row, "status")),
      stage: coerceStage(get(row, "stage")),
      priority: coercePriority(get(row, "priority")),
      lastContacted: get(row, "lastContacted") || undefined,
      notes: get(row, "notes") || undefined,
    });
  });

  return result;
}
