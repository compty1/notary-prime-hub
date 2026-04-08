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

// ORC §147.56: Jurat certificate template (updated with signer name per HB 315)
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

// ORC §147.542: Required journal fields (expanded to 14 per audit item 205/950)
export const REQUIRED_JOURNAL_FIELDS = [
  "date_of_notarization",
  "time_of_notarization",
  "type_of_notarial_act",
  "type_of_document",
  "document_date",
  "signer_name",
  "signer_address",
  "id_type",
  "id_serial_number",
  "id_expiration",
  "fees_charged",
  "notary_commission_number",
  "communication_technology",
  "credential_analysis_method",
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

// Witness requirements by service type (item 611: signature by mark enforcement)
export function getWitnessRequirements(serviceType: string): { required: boolean; count: number; reason: string } {
  const lower = serviceType.toLowerCase();
  if (lower.includes("will") || lower.includes("estate planning") || lower.includes("testament")) {
    return { required: true, count: 2, reason: "Ohio law requires two disinterested witnesses for wills" };
  }
  if (lower.includes("self-proving affidavit")) {
    return { required: true, count: 2, reason: "Self-proving affidavits require two witnesses" };
  }
  if (lower.includes("signature by mark") || lower.includes("mark signature")) {
    return { required: true, count: 2, reason: "Signature by mark requires two disinterested witnesses (ORC §147.542)" };
  }
  return { required: false, count: 0, reason: "" };
}

// Ohio fee cap validation (item 610)
export function validateOhioFeeCap(feeCharged: number, notarialActCount: number): { valid: boolean; maxAllowed: number; issue?: string } {
  const maxAllowed = notarialActCount * OHIO_MAX_FEE_PER_ACT;
  if (feeCharged > maxAllowed) {
    return { valid: false, maxAllowed, issue: `Fee of $${feeCharged.toFixed(2)} exceeds Ohio statutory cap of $${maxAllowed.toFixed(2)} for ${notarialActCount} act(s) (ORC §147.08)` };
  }
  return { valid: true, maxAllowed };
}

// Multi-document journal entry generator (item 609: ORC §147.141)
export function generateMultiDocJournalEntries(
  baseEntry: Record<string, any>,
  documents: Array<{ name: string; type: string; date?: string }>
): Record<string, any>[] {
  return documents.map((doc, idx) => ({
    ...baseEntry,
    document_type_description: doc.type || doc.name,
    document_date: doc.date || baseEntry.document_date,
    journal_number: (baseEntry.journal_number_start || 0) + idx,
    notes: documents.length > 1 
      ? `Document ${idx + 1} of ${documents.length}: ${doc.name}`
      : baseEntry.notes,
  }));
}

// Prohibited document types for notarization (Ohio vital records)
export const PROHIBITED_DOCUMENTS = [
  "birth certificate",
  "death certificate",
  "marriage certificate",
  "divorce decree",
  "adoption decree",
] as const;

export function isProhibitedDocument(documentType: string): boolean {
  const lower = documentType.toLowerCase().trim();
  return PROHIBITED_DOCUMENTS.some(p => lower.includes(p));
}

// Signer age verification (18+ required)
export function validateSignerAge(dateOfBirth: string): { valid: boolean; issue?: string } {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
  
  if (actualAge < 18) {
    return { valid: false, issue: "Signer must be at least 18 years of age" };
  }
  return { valid: true };
}

// Ohio HB 315: Motor vehicle dealer title exception
export function isVehicleDealerTitleException(transactionType: string, isDealerInvolved: boolean): boolean {
  if (!isDealerInvolved) return false;
  const lower = transactionType.toLowerCase();
  return lower.includes("vehicle title") || lower.includes("motor vehicle") || lower.includes("auto title");
}
