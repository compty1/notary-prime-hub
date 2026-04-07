/**
 * Ohio Notary Compliance Utilities
 * Addresses ORC §147.03–§147.66 compliance requirements from the service flow audit.
 */

// ORC §147.53: Ohio-accepted ID types for identification
export const OHIO_ACCEPTED_ID_TYPES = [
  "US Passport",
  "US Passport Card",
  "State Driver's License",
  "State Identification Card",
  "US Military ID",
  "Foreign Passport",
  "Permanent Resident Card (Green Card)",
  "Employment Authorization Document",
  "NEXUS Card",
  "SENTRI Card",
  "Global Entry Card",
  "Tribal ID",
] as const;

// ORC §147.08: Ohio fee schedule
export const OHIO_MAX_FEE_PER_ACT = 5; // $5 per notarial act (ORC §147.08)
export const OHIO_MAX_RON_TECH_FEE = 25; // Technology fee for RON (Ohio SOS guidance)

// ORC §147.55: Acknowledgment certificate template
export const ACKNOWLEDGMENT_CERTIFICATE = `STATE OF OHIO
COUNTY OF __________

On this _____ day of ____________, 20___, before me, the undersigned notary public,
personally appeared _________________________, known to me (or proved to me on the
basis of satisfactory evidence) to be the person(s) whose name(s) is/are subscribed
to the within instrument and acknowledged to me that he/she/they executed the same
in his/her/their authorized capacity(ies), and that by his/her/their signature(s) on
the instrument the person(s), or the entity upon behalf of which the person(s) acted,
executed the instrument.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.

_______________________________
Notary Public, State of Ohio
My Commission Expires: ________`;

// ORC §147.56: Jurat certificate template
export const JURAT_CERTIFICATE = `STATE OF OHIO
COUNTY OF __________

Subscribed and sworn to (or affirmed) before me on this _____ day of ____________, 20___,
by _________________________, proved to me on the basis of satisfactory evidence to be
the person(s) who appeared before me.

_______________________________
Notary Public, State of Ohio
My Commission Expires: ________`;

// ORC §147.57: Copy certification template
export const COPY_CERTIFICATION = `STATE OF OHIO
COUNTY OF __________

I certify that this is a true, exact, complete, and unaltered photocopy of the original
document presented to me by the document's custodian, _________________________.

Date: _______________

_______________________________
Notary Public, State of Ohio
My Commission Expires: ________`;

// ORC §147.542: Required journal fields
export const REQUIRED_JOURNAL_FIELDS = [
  "date_of_notarization",
  "type_of_notarial_act",
  "type_of_document",
  "signer_name",
  "signer_address",
  "id_type",
  "id_serial_number",
  "fees_charged",
] as const;

// ORC §147.60: RON authorization checks
export interface RONAuthorizationCheck {
  hasCommission: boolean;
  commissionExpired: boolean;
  hasRONEndorsement: boolean;
  hasTechnologyProvider: boolean;
  meetsRecordingRequirements: boolean;
}

export function validateRONAuthorization(checks: RONAuthorizationCheck): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!checks.hasCommission) issues.push("Active Ohio notary commission required (ORC §147.03)");
  if (checks.commissionExpired) issues.push("Commission has expired — renew before performing notarial acts (ORC §147.03)");
  if (!checks.hasRONEndorsement) issues.push("RON endorsement required from Ohio Secretary of State (ORC §147.60)");
  if (!checks.hasTechnologyProvider) issues.push("Approved technology provider required for RON (ORC §147.61)");
  if (!checks.meetsRecordingRequirements) issues.push("Session recording capability required (ORC §147.62)");
  return { valid: issues.length === 0, issues };
}

// ORC §147.54: Satisfactory evidence standard
export function validateSatisfactoryEvidence(idType: string, idExpiration?: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!idType) {
    issues.push("ID type is required for satisfactory evidence (ORC §147.54)");
  } else if (!OHIO_ACCEPTED_ID_TYPES.includes(idType as any)) {
    issues.push(`"${idType}" may not meet Ohio's satisfactory evidence standard (ORC §147.54)`);
  }
  if (idExpiration) {
    const expDate = new Date(idExpiration);
    if (expDate < new Date()) {
      issues.push("Expired identification does not meet satisfactory evidence standard (ORC §147.54)");
    }
  }
  return { valid: issues.length === 0, issues };
}

// ORC §147.542: Validate journal entry completeness
export function validateJournalEntry(entry: Record<string, any>): { complete: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const field of REQUIRED_JOURNAL_FIELDS) {
    if (!entry[field] && entry[field] !== 0) {
      missing.push(field.replace(/_/g, " "));
    }
  }
  return { complete: missing.length === 0, missing };
}

// ORC §147.63: Signer location disclosure for out-of-state
export function requiresOutOfStateDisclosure(signerState: string | null): boolean {
  if (!signerState) return false;
  return signerState.toUpperCase() !== "OH" && signerState.toUpperCase() !== "OHIO";
}

// ORC §147.66: 10-year retention calculation
export function calculateRetentionExpiry(notarizationDate: Date): Date {
  const expiry = new Date(notarizationDate);
  expiry.setFullYear(expiry.getFullYear() + 10);
  return expiry;
}

// ORC §147.65: ESIGN Act compliance check
export function validateESIGNCompliance(session: {
  signerConsented: boolean;
  signerCanAccessRecords: boolean;
  recordsRetained: boolean;
}): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!session.signerConsented) issues.push("Signer must consent to electronic signatures (ESIGN Act / ORC §147.65)");
  if (!session.signerCanAccessRecords) issues.push("Signer must have access to electronic records");
  if (!session.recordsRetained) issues.push("Electronic records must be retained per retention requirements");
  return { compliant: issues.length === 0, issues };
}

// Notarial act type auto-detection from service name
export function detectNotarialActType(serviceName: string): "acknowledgment" | "jurat" | "oath" | "copy_certification" | "unknown" {
  const lower = serviceName.toLowerCase();
  if (lower.includes("acknowledgment") || lower.includes("power of attorney") || lower.includes("real estate") || lower.includes("deed") || lower.includes("loan")) return "acknowledgment";
  if (lower.includes("jurat") || lower.includes("affidavit") || lower.includes("sworn")) return "jurat";
  if (lower.includes("oath") || lower.includes("affirmation")) return "oath";
  if (lower.includes("certified copy") || lower.includes("copy certification")) return "copy_certification";
  return "unknown";
}

// Valid appointment status transitions (prevents skipping steps)
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["id_verification", "cancelled"],
  id_verification: ["kba_pending", "cancelled"],
  kba_pending: ["in_session", "cancelled"],
  in_session: ["completed", "cancelled"],
  completed: [], // terminal state
  cancelled: ["scheduled"], // can reschedule
  no_show: ["scheduled"], // can reschedule
};

export function isValidStatusTransition(from: string, to: string): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// Witness requirements by service type
export function getWitnessRequirements(serviceType: string): { required: boolean; count: number; reason: string } {
  const lower = serviceType.toLowerCase();
  if (lower.includes("will") || lower.includes("estate planning") || lower.includes("testament")) {
    return { required: true, count: 2, reason: "Ohio law requires two disinterested witnesses for wills" };
  }
  if (lower.includes("self-proving affidavit")) {
    return { required: true, count: 2, reason: "Self-proving affidavits require two witnesses" };
  }
  return { required: false, count: 0, reason: "" };
}
