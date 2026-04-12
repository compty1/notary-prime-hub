/**
 * CO-001: Ohio journal entry validation per ORC §147.04.
 * Validates that journal entries contain all required fields.
 */

export interface JournalValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_FIELDS = [
  { field: "entry_date", label: "Date of notarial act", orc: "§147.04(A)(1)" },
  { field: "entry_time", label: "Time of notarial act", orc: "§147.04(A)(1)" },
  { field: "notarial_act_type", label: "Type of notarial act", orc: "§147.04(A)(2)" },
  { field: "document_type_description", label: "Description of document", orc: "§147.04(A)(3)" },
  { field: "signer_name", label: "Signer's name", orc: "§147.04(A)(4)" },
  { field: "signer_address", label: "Signer's address", orc: "§147.04(A)(4)" },
  { field: "notary_name", label: "Notary name", orc: "§147.04" },
];

const RON_REQUIRED_FIELDS = [
  { field: "communication_technology", label: "Communication technology used", orc: "§147.66(B)" },
  { field: "session_id", label: "RON session reference", orc: "§147.66" },
];

const VALID_ACT_TYPES = [
  "acknowledgment",
  "jurat",
  "oath",
  "affirmation",
  "copy_certification",
  "signature_witnessing",
  "verification_on_oath",
];

/**
 * Validate a journal entry against ORC §147.04 requirements.
 */
export function validateJournalEntry(entry: Record<string, unknown>, isRON = false): JournalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const req of REQUIRED_FIELDS) {
    const value = entry[req.field];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      errors.push(`Missing required field: ${req.label} (ORC ${req.orc})`);
    }
  }

  // RON-specific requirements
  if (isRON) {
    for (const req of RON_REQUIRED_FIELDS) {
      const value = entry[req.field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        errors.push(`Missing RON field: ${req.label} (ORC ${req.orc})`);
      }
    }
  }

  // Validate act type
  const actType = entry.notarial_act_type as string;
  if (actType && !VALID_ACT_TYPES.includes(actType)) {
    warnings.push(`Unrecognized notarial act type: "${actType}". Standard types: ${VALID_ACT_TYPES.join(", ")}`);
  }

  // Validate date format
  const entryDate = entry.entry_date as string;
  if (entryDate && !/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    warnings.push("Date format should be YYYY-MM-DD");
  }

  // Validate time format
  const entryTime = entry.entry_time as string;
  if (entryTime && !/^\d{2}:\d{2}$/.test(entryTime)) {
    warnings.push("Time format should be HH:MM (24-hour)");
  }

  // Check journal number
  if (!entry.journal_number) {
    warnings.push("No journal number assigned — will be auto-generated");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a journal entry meets Ohio 10-year retention requirement.
 */
export function checkRetentionCompliance(createdAt: string): {
  compliant: boolean;
  expiresAt: string;
  daysRemaining: number;
} {
  const created = new Date(createdAt);
  const expiresAt = new Date(created);
  expiresAt.setFullYear(expiresAt.getFullYear() + 10);

  const now = new Date();
  const daysRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    compliant: daysRemaining > 0,
    expiresAt: expiresAt.toISOString(),
    daysRemaining,
  };
}

export { REQUIRED_FIELDS, RON_REQUIRED_FIELDS, VALID_ACT_TYPES };
