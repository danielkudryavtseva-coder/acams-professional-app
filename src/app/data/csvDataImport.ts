/**
 * Higher-level CSV import utilities that handle file reading and batch processing.
 */

import { parseCSV, csvToContacts } from "./csvParser";

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importCSVFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve({ success: false, imported: 0, skipped: 0, errors: ["Failed to read file"] });
        return;
      }
      const { contacts, errors } = csvToContacts(text);
      resolve({
        success: errors.length === 0,
        imported: contacts.length,
        skipped: errors.length,
        errors,
      });
    };
    reader.onerror = () => {
      resolve({ success: false, imported: 0, skipped: 0, errors: ["File read error"] });
    };
    reader.readAsText(file);
  });
}

export function validateCSVStructure(csvText: string, requiredColumns: string[]): string[] {
  const { headers, errors } = parseCSV(csvText);
  const missing = requiredColumns.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(", ")}`);
  }
  return errors;
}
