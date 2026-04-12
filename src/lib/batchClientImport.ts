/**
 * Batch client import helpers.
 * Parse CSV data and validate for bulk client creation.
 */

export interface ImportedClient {
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export interface ImportValidationResult {
  valid: ImportedClient[];
  errors: Array<{ row: number; field: string; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  totalRows: number;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[\d\s()+-]{7,20}$/;

/**
 * Parse CSV text into client objects.
 */
export function parseClientCSV(csvText: string): ImportValidationResult {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    return { valid: [], errors: [{ row: 0, field: "file", message: "CSV must have header row and at least one data row" }], warnings: [], totalRows: 0 };
  }

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  const nameIdx = findColumnIndex(headers, ["full_name", "name", "fullname", "full name"]);
  const emailIdx = findColumnIndex(headers, ["email", "email_address", "emailaddress"]);
  const phoneIdx = findColumnIndex(headers, ["phone", "phone_number", "phonenumber", "tel"]);
  const addressIdx = findColumnIndex(headers, ["address", "street", "street_address"]);
  const cityIdx = findColumnIndex(headers, ["city"]);
  const stateIdx = findColumnIndex(headers, ["state", "st"]);
  const zipIdx = findColumnIndex(headers, ["zip", "zipcode", "zip_code", "postal"]);
  const notesIdx = findColumnIndex(headers, ["notes", "note", "comments"]);

  if (nameIdx === -1) {
    return { valid: [], errors: [{ row: 0, field: "header", message: "Missing required column: name/full_name" }], warnings: [], totalRows: lines.length - 1 };
  }
  if (emailIdx === -1) {
    return { valid: [], errors: [{ row: 0, field: "header", message: "Missing required column: email" }], warnings: [], totalRows: lines.length - 1 };
  }

  const valid: ImportedClient[] = [];
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: Array<{ row: number; message: string }> = [];
  const seenEmails = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const name = cols[nameIdx]?.trim();
    const email = cols[emailIdx]?.trim().toLowerCase();

    if (!name) { errors.push({ row: i + 1, field: "name", message: "Name is required" }); continue; }
    if (!email) { errors.push({ row: i + 1, field: "email", message: "Email is required" }); continue; }
    if (!EMAIL_REGEX.test(email)) { errors.push({ row: i + 1, field: "email", message: `Invalid email: ${email}` }); continue; }
    if (seenEmails.has(email)) { warnings.push({ row: i + 1, message: `Duplicate email: ${email}` }); continue; }

    const phone = phoneIdx >= 0 ? cols[phoneIdx]?.trim() : undefined;
    if (phone && !PHONE_REGEX.test(phone)) {
      warnings.push({ row: i + 1, message: `Invalid phone format: ${phone}` });
    }

    seenEmails.add(email);
    valid.push({
      full_name: name,
      email,
      phone: phone || undefined,
      address: addressIdx >= 0 ? cols[addressIdx]?.trim() : undefined,
      city: cityIdx >= 0 ? cols[cityIdx]?.trim() : undefined,
      state: stateIdx >= 0 ? cols[stateIdx]?.trim() : undefined,
      zip: zipIdx >= 0 ? cols[zipIdx]?.trim() : undefined,
      notes: notesIdx >= 0 ? cols[notesIdx]?.trim() : undefined,
    });
  }

  return { valid, errors, warnings, totalRows: lines.length - 1 };
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.indexOf(c);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Generate a sample CSV template for client import.
 */
export function generateClientCSVTemplate(): string {
  return [
    "full_name,email,phone,address,city,state,zip,notes",
    "John Smith,john@example.com,(555) 123-4567,123 Main St,Columbus,OH,43215,Existing client",
    "Jane Doe,jane@example.com,(555) 987-6543,456 Oak Ave,West Jefferson,OH,43162,New referral",
  ].join("\n");
}
