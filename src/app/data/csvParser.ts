/**
 * CSV parsing utilities for importing recruiting and portfolio data.
 */

export interface ParseResult<T = Record<string, string>> {
  data: T[];
  errors: string[];
  headers: string[];
}

export function parseCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split("\n");
  if (lines.length === 0) return { data: [], errors: [], headers: [] };

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx].trim();
    });
    data.push(row);
  }

  return { data, errors, headers };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function csvToContacts(csvText: string) {
  const { data, errors } = parseCSV(csvText);
  const contacts = data.map((row, idx) => ({
    id: `import-${idx}`,
    name: row["Name"] || row["name"] || row["Full Name"] || "",
    firm: row["Firm"] || row["firm"] || row["Company"] || "",
    role: row["Role"] || row["role"] || row["Title"] || "",
    email: row["Email"] || row["email"] || undefined,
    linkedin: row["LinkedIn"] || row["linkedin"] || undefined,
    phone: row["Phone"] || row["phone"] || undefined,
    notes: row["Notes"] || row["notes"] || undefined,
    tags: [],
    status: "active" as const,
  }));
  return { contacts, errors };
}
