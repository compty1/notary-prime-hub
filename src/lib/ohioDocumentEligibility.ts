/**
 * Ohio-Specific Document Eligibility Logic
 * Based on Ohio Revised Code (ORC) §147.01–147.66
 * Phase 5: Ohio Compliance
 */

/** Documents that cannot be notarized under Ohio law */
const PROHIBITED_DOCUMENTS = [
  { pattern: /birth\s*certificate/i, reason: "Birth certificates are vital records and cannot be notarized under Ohio law (ORC §3705)." },
  { pattern: /death\s*certificate/i, reason: "Death certificates are vital records and cannot be notarized under Ohio law (ORC §3705)." },
  { pattern: /marriage\s*certificate/i, reason: "Marriage certificates issued by the court cannot be notarized. However, a marriage affidavit or declaration can be." },
  { pattern: /court\s*order/i, reason: "Court orders and judicial decrees cannot be notarized. Only accompanying affidavits or declarations may be." },
  { pattern: /divorce\s*decree/i, reason: "Divorce decrees are court orders and cannot be notarized directly." },
  { pattern: /adoption\s*decree/i, reason: "Adoption decrees are sealed court orders and cannot be notarized." },
];

/** Documents requiring specific witness thresholds in Ohio */
const WITNESS_REQUIREMENTS: Record<string, { count: number; notes: string }> = {
  "will": { count: 2, notes: "Ohio law (ORC §2107.03) requires two competent witnesses for wills." },
  "last will and testament": { count: 2, notes: "Ohio law (ORC §2107.03) requires two competent witnesses for wills." },
  "living will": { count: 2, notes: "Ohio living wills require two adult witnesses (ORC §2133.02)." },
  "healthcare power of attorney": { count: 1, notes: "Ohio healthcare POA requires at least one witness (ORC §1337.12)." },
  "advance directive": { count: 2, notes: "Advance directives in Ohio require two witnesses." },
  "self-proving affidavit": { count: 2, notes: "Self-proving affidavits for wills require two witnesses." },
};

/** Documents that cannot use RON and must be in-person */
const IN_PERSON_ONLY: RegExp[] = [
  /^(?:.*\s)?will(?:\s.*)?$/i, // Some jurisdictions restrict RON for wills
];

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  warnings: string[];
  witnessCount: number;
  witnessNotes?: string;
  ronEligible: boolean;
  ronWarning?: string;
  oathType: "acknowledgment" | "jurat" | "oath" | "affirmation";
}

/**
 * Check document eligibility for notarization under Ohio law
 */
export function checkDocumentEligibility(documentType: string, serviceType?: string): EligibilityResult {
  const input = (documentType || serviceType || "").trim().toLowerCase();
  const warnings: string[] = [];
  
  // Check prohibited documents
  for (const prohibited of PROHIBITED_DOCUMENTS) {
    if (prohibited.pattern.test(input)) {
      return {
        eligible: false,
        reason: prohibited.reason,
        warnings: [],
        witnessCount: 0,
        ronEligible: false,
        oathType: "acknowledgment",
      };
    }
  }

  // Determine witness requirements
  let witnessCount = 0;
  let witnessNotes: string | undefined;
  for (const [docKey, req] of Object.entries(WITNESS_REQUIREMENTS)) {
    if (input.includes(docKey)) {
      witnessCount = req.count;
      witnessNotes = req.notes;
      warnings.push(req.notes);
      break;
    }
  }

  // Check RON eligibility
  let ronEligible = true;
  let ronWarning: string | undefined;
  for (const pattern of IN_PERSON_ONLY) {
    if (pattern.test(input)) {
      ronEligible = false;
      ronWarning = "This document type may have restrictions for Remote Online Notarization in some jurisdictions. Consider in-person notarization.";
      warnings.push(ronWarning);
      break;
    }
  }

  // Determine oath type
  let oathType: EligibilityResult["oathType"] = "acknowledgment";
  if (/affidavit|sworn|jurat|statement under oath/i.test(input)) {
    oathType = "jurat";
  } else if (/oath|swear/i.test(input)) {
    oathType = "oath";
  } else if (/affirm/i.test(input)) {
    oathType = "affirmation";
  }

  // Add general Ohio compliance warnings
  if (/power of attorney/i.test(input)) {
    warnings.push("Ohio POA documents must be signed in the presence of a notary. The principal must demonstrate understanding of the document.");
  }

  return {
    eligible: true,
    warnings,
    witnessCount,
    witnessNotes,
    ronEligible,
    ronWarning,
    oathType,
  };
}

/**
 * Get notary guide instructions for a specific session context
 * Phase 2: RON Session Notary Guide
 */
export function getSessionGuide(params: {
  documentType: string;
  notarizationType: "ron" | "in_person";
  signerCount: number;
  signingCapacity?: string;
  hasWitnesses: boolean;
  witnessCount: number;
}): { steps: { label: string; instruction: string; critical?: boolean }[]; oathType: string; warnings: string[] } {
  const { documentType, notarizationType, signerCount, signingCapacity, hasWitnesses, witnessCount } = params;
  const eligibility = checkDocumentEligibility(documentType);
  const steps: { label: string; instruction: string; critical?: boolean }[] = [];
  const warnings: string[] = [...eligibility.warnings];

  // Step 1: Pre-session verification
  steps.push({
    label: "Verify Commission Status",
    instruction: "Confirm your Ohio notary commission is current and valid before proceeding.",
    critical: true,
  });

  // Step 2: Recording disclosure (RON only)
  if (notarizationType === "ron") {
    steps.push({
      label: "Recording Disclosure",
      instruction: "Inform all parties: 'This session is being audio and video recorded as required by Ohio Revised Code §147.66. Do you consent to this recording?'",
      critical: true,
    });
  }

  // Step 3: Identity verification
  steps.push({
    label: "Verify Signer Identity",
    instruction: notarizationType === "ron"
      ? "Verify government-issued photo ID via video. Confirm name, photo, and expiration date match. Complete MISMO-compliant KBA (5 questions, 4/5 correct, 2-minute time limit, max 2 attempts per ORC §147.66)."
      : "Examine government-issued photo ID in person. Verify name, photo, signature, and expiration date. Record ID type and last 4 digits.",
    critical: true,
  });

  // Step 4: Multi-signer handling
  if (signerCount > 1) {
    steps.push({
      label: `Verify All ${signerCount} Signers`,
      instruction: `Each of the ${signerCount} signers must be individually identified and verified. Complete ID check and KBA (if RON) for each signer separately. Each signer requires a separate journal entry.`,
      critical: true,
    });
    warnings.push(`Multi-signer session: ${signerCount} separate journal entries and notarial acts required.`);
  }

  // Step 5: Capacity verification
  if (signingCapacity && signingCapacity !== "individual") {
    const capacityInstructions: Record<string, string> = {
      attorney_in_fact: "Signer is acting as Attorney-in-Fact. Verify the POA document is valid and not revoked. The signer signs as '[Principal Name] by [Signer Name], Attorney-in-Fact.'",
      trustee: "Signer is acting as Trustee. Verify the trust agreement authorizes this action. The signer signs as '[Signer Name], Trustee of [Trust Name].'",
      corporate_officer: "Signer is acting as a Corporate Officer. Verify corporate authority (resolution, operating agreement, or articles). Include title in signature block.",
      guardian: "Signer is acting as Legal Guardian. Verify court-appointed guardianship documentation. The ward's interests must be protected.",
      representative: "Signer is acting as an Authorized Representative. Verify authorization documentation.",
    };
    steps.push({
      label: `Verify Signing Capacity: ${signingCapacity.replace(/_/g, " ")}`,
      instruction: capacityInstructions[signingCapacity] || "Verify the signer's authority to act in this capacity.",
    });
  }

  // Step 6: Witness coordination
  if (hasWitnesses || eligibility.witnessCount > 0) {
    const requiredWitnesses = Math.max(witnessCount, eligibility.witnessCount);
    steps.push({
      label: `Coordinate ${requiredWitnesses} Witness${requiredWitnesses > 1 ? "es" : ""}`,
      instruction: notarizationType === "ron"
        ? `Ensure ${requiredWitnesses} witness${requiredWitnesses > 1 ? "es are" : " is"} present on the video call. Each witness must be visible on camera and identified. ${eligibility.witnessNotes || ""}`
        : `Ensure ${requiredWitnesses} witness${requiredWitnesses > 1 ? "es are" : " is"} physically present. Each witness must sign in the notary's presence. ${eligibility.witnessNotes || ""}`,
      critical: true,
    });
  }

  // Step 7: Document review
  steps.push({
    label: "Review Document Completeness",
    instruction: "Verify the document is complete — no blank signature lines, dates, or essential terms. Confirm the signer understands the document (do NOT explain legal content — UPL restriction per ORC §147.01).",
  });

  // Step 8: Administer oath/affirmation
  const oathType = eligibility.oathType;
  if (oathType === "jurat" || oathType === "oath" || oathType === "affirmation") {
    steps.push({
      label: `Administer ${oathType === "jurat" ? "Jurat Oath" : oathType === "oath" ? "Oath" : "Affirmation"}`,
      instruction: oathType === "jurat"
        ? "Ask: 'Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief?' Wait for verbal 'I do' or 'Yes.'"
        : oathType === "oath"
          ? "Ask: 'Do you solemnly swear that the testimony you are about to give is the truth, the whole truth, and nothing but the truth?' Wait for verbal confirmation."
          : "Ask: 'Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct?' Wait for verbal confirmation.",
      critical: true,
    });
  } else {
    steps.push({
      label: "Acknowledgment",
      instruction: "Confirm: 'Are you voluntarily signing this document for the purposes stated therein?' No verbal oath is required for acknowledgments (ORC §147.55).",
    });
  }

  // Step 9: Witness signing
  steps.push({
    label: "Witness Signing",
    instruction: "Have the signer sign the document. If witnesses are required, have them sign immediately after the principal signer.",
  });

  // Step 10: Complete notarial certificate
  steps.push({
    label: "Complete Notarial Certificate",
    instruction: "Attach or complete the notarial certificate. Include: date, county/state, signer name, notary name, commission number, commission expiration, and seal. For RON: include technology vendor name.",
  });

  // Step 11: Apply seal
  steps.push({
    label: "Apply Notary Seal",
    instruction: notarizationType === "ron"
      ? "Apply the electronic notary seal (tamper-evident) per ORC §147.542. The e-seal must include: notary name, commission number, commission expiration, 'State of Ohio', and 'Electronic Notary Seal.'"
      : "Apply your physical notary seal/stamp. Must include: notary name, commission number, commission expiration, and 'State of Ohio.' Seal must be legible.",
  });

  // Step 12: Journal entry
  steps.push({
    label: "Complete Journal Entry",
    instruction: "Record in your notary journal: date, time, signer name, signer address, ID type/number/expiration, document type, notarial act performed, fees charged, and any witnesses present.",
  });

  return { steps, oathType, warnings };
}
