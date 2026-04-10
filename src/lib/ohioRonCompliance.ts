/**
 * Ohio RON compliance validators (Items 1-50, ORC §147)
 * Centralized compliance checks for all RON session operations.
 */

/** Ohio-prohibited document types for RON (ORC §147.65) */
export const PROHIBITED_DOCUMENTS = new Set([
  "will",
  "last_will_and_testament", 
  "codicil",
  "testamentary_trust",
  "birth_certificate",
  "death_certificate",
  "marriage_certificate",
  "divorce_decree",
]);

/** Maximum KBA attempts per Ohio law (ORC §147.66) */
export const MAX_KBA_ATTEMPTS = 2;

/** Ohio statutory fee cap per notarial act (ORC §147.08) */
export const OHIO_FEE_CAP_PER_ACT = 5.00;

/** Minimum recording retention period in years (ORC §147.66) */
export const MIN_RETENTION_YEARS = 10;

/** Required fields for Ohio journal entry (ORC §147.542) */
export const REQUIRED_JOURNAL_FIELDS = [
  "entry_date",
  "entry_time", 
  "notarial_act_type",
  "document_type_description",
  "signer_name",
  "signer_address",
  "id_type",
  "id_number",
  "communication_technology",
  "notary_name",
  "notary_commission_number",
] as const;

/** Check if a document type is prohibited for RON in Ohio */
export function isProhibitedForRon(documentType: string): boolean {
  return PROHIBITED_DOCUMENTS.has(documentType.toLowerCase().replace(/\s+/g, "_"));
}

/** Validate KBA attempt count */
export function isKbaLimitExceeded(attempts: number): boolean {
  return attempts > MAX_KBA_ATTEMPTS;
}

/** Validate notarial fee against Ohio cap */
export function validateOhioFeeCap(totalFee: number, actCount: number): { valid: boolean; maxAllowed: number } {
  const maxAllowed = actCount * OHIO_FEE_CAP_PER_ACT;
  return { valid: totalFee <= maxAllowed, maxAllowed };
}

/** Check if a notary commission is currently valid */
export function isCommissionValid(expirationDate: string): boolean {
  return new Date(expirationDate) > new Date();
}

/** Calculate retention expiry date (10 years from session date) */
export function calculateRetentionExpiry(sessionDate: Date): Date {
  const expiry = new Date(sessionDate);
  expiry.setFullYear(expiry.getFullYear() + MIN_RETENTION_YEARS);
  return expiry;
}

/** Validate required signer information for RON */
export function validateSignerInfo(signer: {
  name?: string;
  address?: string;
  idType?: string;
  idNumber?: string;
  dateOfBirth?: string;
}): string[] {
  const errors: string[] = [];
  if (!signer.name?.trim()) errors.push("Signer name is required");
  if (!signer.address?.trim()) errors.push("Signer address is required");
  if (!signer.idType?.trim()) errors.push("ID type is required");
  if (!signer.idNumber?.trim()) errors.push("ID number is required");
  if (signer.dateOfBirth) {
    const dob = new Date(signer.dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) errors.push("Signer must be at least 18 years old");
  }
  return errors;
}

/** Validate RON session prerequisites */
export function validateSessionPrerequisites(session: {
  recordingConsent?: boolean;
  esignConsent?: boolean;
  kbaCompleted?: boolean;
  kbaAttempts?: number;
  documentType?: string;
  commissionExpiration?: string;
}): string[] {
  const errors: string[] = [];
  
  if (!session.recordingConsent) {
    errors.push("Recording consent is required per ORC §147.63");
  }
  if (!session.esignConsent) {
    errors.push("E-sign consent is required per UETA/ESIGN Act");
  }
  if (!session.kbaCompleted) {
    errors.push("KBA verification must be completed");
  }
  if (session.kbaAttempts && isKbaLimitExceeded(session.kbaAttempts)) {
    errors.push("Maximum KBA attempts exceeded (ORC §147.66)");
  }
  if (session.documentType && isProhibitedForRon(session.documentType)) {
    errors.push(`${session.documentType} cannot be notarized via RON in Ohio`);
  }
  if (session.commissionExpiration && !isCommissionValid(session.commissionExpiration)) {
    errors.push("Notary commission has expired");
  }
  
  return errors;
}
