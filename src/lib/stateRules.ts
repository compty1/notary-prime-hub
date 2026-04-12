/**
 * SVC-462/524/516: Centralized Ohio state rules module
 * Per-state validations, disclaimers, and compliance requirements.
 */

export interface StateRule {
  stateCode: string;
  stateName: string;
  ronAllowed: boolean;
  maxNotarialFee: number;
  kbaAttemptsMax: number;
  journalRequired: boolean;
  recordingRequired: boolean;
  recordingRetentionYears: number;
  suretyBondAmount: number;
  commissionTermYears: number;
  orcReferences: string[];
  disclaimers: string[];
  specialRequirements: string[];
}

export const OHIO_RULES: StateRule = {
  stateCode: "OH",
  stateName: "Ohio",
  ronAllowed: true,
  maxNotarialFee: 5.00,
  kbaAttemptsMax: 2,
  journalRequired: true,
  recordingRequired: true,
  recordingRetentionYears: 10,
  suretyBondAmount: 10000,
  commissionTermYears: 5,
  orcReferences: [
    "ORC §147.01 - §147.99 (General Notary Law)",
    "ORC §147.53 (Acknowledgments & Jurats)",
    "ORC §147.542 (Certificate of Notarial Act)",
    "ORC §147.63 (Recording Consent)",
    "ORC §147.66 (Remote Online Notarization)",
    "ORC §147.141 (Electronic Journal Requirements)",
    "ORC §1337.12 (Healthcare POA)",
  ],
  disclaimers: [
    "Ohio law limits notarial fees to $5.00 per notarial act (ORC §147.08).",
    "Remote Online Notarization sessions are recorded per ORC §147.63. Consent is required.",
    "Knowledge-Based Authentication (KBA) is limited to 2 attempts per session (ORC §147.66).",
    "Electronic journal entries and recordings must be retained for 10 years (ORC §147.141).",
    "This service provides document preparation only. We do not provide legal advice.",
  ],
  specialRequirements: [
    "Signers must be 18 years or older",
    "Valid government-issued photo ID required for all notarizations",
    "Notary must be physically located in Ohio during RON sessions",
    "Two credible witnesses may substitute for ID if signer lacks valid identification",
    "Vital record documents (birth/death certificates) cannot be notarized",
  ],
};

/** State rules lookup - currently Ohio only, extensible */
const STATE_RULES: Record<string, StateRule> = {
  OH: OHIO_RULES,
};

export function getStateRules(stateCode: string): StateRule | undefined {
  return STATE_RULES[stateCode.toUpperCase()];
}

export function getStateDisclaimers(stateCode: string): string[] {
  return getStateRules(stateCode)?.disclaimers || [];
}

export function validateBookingForState(
  stateCode: string,
  params: { isRON?: boolean; signerAge?: number; feeAmount?: number }
): { valid: boolean; errors: string[] } {
  const rules = getStateRules(stateCode);
  if (!rules) return { valid: true, errors: [] };

  const errors: string[] = [];

  if (params.isRON && !rules.ronAllowed) {
    errors.push(`Remote Online Notarization is not available in ${rules.stateName}`);
  }

  if (params.signerAge !== undefined && params.signerAge < 18) {
    errors.push("Signer must be 18 years or older");
  }

  if (params.feeAmount !== undefined && params.feeAmount > rules.maxNotarialFee) {
    errors.push(`Fee exceeds state maximum of $${rules.maxNotarialFee.toFixed(2)} per notarial act`);
  }

  return { valid: errors.length === 0, errors };
}

/** Get the "What You Need" checklist per service type (SVC-751) */
export function getWhatYouNeedChecklist(serviceType: string): string[] {
  const lower = serviceType.toLowerCase();
  const base = ["Valid government-issued photo ID (driver's license, passport, or state ID)"];

  if (lower.includes("ron") || lower.includes("remote")) {
    return [
      ...base,
      "Computer or tablet with webcam and microphone",
      "Stable internet connection (minimum 5 Mbps)",
      "Quiet, well-lit environment",
      "Digital copy of document(s) to be notarized (PDF preferred)",
      "Consent to audio-video recording (Ohio ORC §147.63)",
    ];
  }

  if (lower.includes("mobile")) {
    return [
      ...base,
      "Physical copies of all documents requiring notarization",
      "Accessible meeting location with adequate lighting",
      "All signers present at the same location",
    ];
  }

  if (lower.includes("loan") || lower.includes("closing")) {
    return [
      ...base,
      "Loan documents from lender/title company",
      "Blue ink pen (provided if needed)",
      "All borrowers present",
      "Cashier's check for closing costs (if applicable)",
    ];
  }

  if (lower.includes("i-9") || lower.includes("i9")) {
    return [
      ...base,
      "Employment authorization documents (List A, or List B + List C)",
      "Completed Section 1 of Form I-9",
      "Employer information and start date",
    ];
  }

  if (lower.includes("apostille")) {
    return [
      "Original notarized document(s)",
      "Completed cover letter with destination country",
      "Filing fee (check or money order to Ohio Secretary of State)",
    ];
  }

  return [...base, "Original document(s) requiring notarization or preparation"];
}
