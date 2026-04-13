/**
 * RON Legality & Acceptance Advisor — Rules Engine
 * 
 * Deterministic risk scoring and analysis based on
 * curated legal data. No AI — pure logic.
 */

import {
  getStateProfile, getOhioDocRule, STATE_MAP,
  type StateProfile, type AcceptanceRating,
  DOCUMENT_CATEGORIES,
} from "./ronStateData";

export interface AdvisorInput {
  notary_state: string; // Always "Ohio" for our platform
  signer_state: string;
  document_use_state: string;
  document_category: string;
  document_subtype: string;
  notarial_act_type: string;
  signer_location_country: "us" | "non_us";
  is_recordable_in_land_records: boolean;
  requires_apostille: boolean;
  intended_recipient_type: string;
  extra_notes?: string;
}

export type RiskLevel = "low" | "medium" | "high";

export interface StateAnalysis {
  state_name: string;
  ron_authorized: boolean;
  acceptance_rating: AcceptanceRating;
  statutory_citation: string | null;
  notes: string[];
}

export interface AdvisorResult {
  status: "eligible" | "conditional" | "not_eligible";
  headline: string;
  notary_state_analysis: StateAnalysis;
  receiving_state_analysis: StateAnalysis;
  risk_level: RiskLevel;
  risk_score: number;
  risk_reasons: string[];
  recommended_actions: string[];
  citations: string[];
  disclaimer: string;
}

const DISCLAIMER = "This tool provides general guidance based on current Ohio RON law (ORC §147.60-.66), the Full Faith and Credit Clause (U.S. Const. Art. IV, §1), and known entity-specific practices. It is not legal advice. Always verify with the specific receiving entity. Laws and policies change — last updated April 2026.";

function getAcceptanceForCategory(profile: StateProfile, category: string): AcceptanceRating {
  const map: Record<string, keyof StateProfile["acceptance"]> = {
    real_estate: "real_estate",
    estate_planning: "estate_planning",
    affidavits: "affidavits",
    financial: "financial",
    business: "business",
    government: "government",
    personal: "affidavits", // map personal to affidavits as closest match
  };
  const key = map[category] || "affidavits";
  return profile.acceptance[key];
}

function acceptanceToRisk(rating: AcceptanceRating): number {
  switch (rating) {
    case "high": return 0;
    case "medium": return 1;
    case "low": return 2;
    case "not_accepted": return 3;
  }
}

export function analyzeScenario(input: AdvisorInput): AdvisorResult {
  const ohioProfile = STATE_MAP.get("Ohio")!;
  const receivingProfile = getStateProfile(input.document_use_state);
  const docRule = getOhioDocRule(input.document_category, input.document_subtype);

  // Build risk score
  let riskScore = 0;
  const riskReasons: string[] = [];
  const citations: string[] = ["ORC §147.60-.66 (Ohio RON Authorization)"];
  const recommendedActions: string[] = [];

  // 1. Ohio doc rule check
  if (docRule) {
    citations.push(docRule.orc_citation);
    if (docRule.status === "not_allowed") {
      return {
        status: "not_eligible",
        headline: `RON Is Not Available for This Document Type`,
        notary_state_analysis: {
          state_name: "Ohio",
          ron_authorized: true,
          acceptance_rating: "not_accepted",
          statutory_citation: docRule.orc_citation,
          notes: [docRule.notes],
        },
        receiving_state_analysis: buildReceivingAnalysis(receivingProfile, input),
        risk_level: "high",
        risk_score: 5,
        risk_reasons: [docRule.notes],
        recommended_actions: ["Book an in-person appointment instead", "Contact us to discuss alternatives"],
        citations,
        disclaimer: DISCLAIMER,
      };
    }
    if (docRule.status === "conditional") {
      riskScore += docRule.risk_modifier;
      riskReasons.push(docRule.notes);
      recommendedActions.push("Review the specific conditions noted above before scheduling");
    }
  }

  // 2. Receiving state acceptance
  if (receivingProfile) {
    const acceptanceRating = getAcceptanceForCategory(receivingProfile, input.document_category);
    const acceptanceRisk = acceptanceToRisk(acceptanceRating);
    if (acceptanceRisk >= 2) {
      riskScore += 2;
      riskReasons.push(`${input.document_use_state} has ${acceptanceRating} acceptance for ${getCategoryLabel(input.document_category)} documents`);
    } else if (acceptanceRisk >= 1) {
      riskScore += 1;
      riskReasons.push(`${input.document_use_state} has medium acceptance — confirm with the receiving entity`);
    }

    if (receivingProfile.statutory_citation) {
      citations.push(receivingProfile.statutory_citation);
    }
    if (!receivingProfile.ron_authorized) {
      riskScore += 1;
      riskReasons.push(`${input.document_use_state} does not have its own RON law — acceptance depends on Full Faith & Credit`);
      citations.push("U.S. Const. Art. IV, §1 (Full Faith and Credit Clause)");
      recommendedActions.push(`Contact the receiving entity in ${input.document_use_state} to confirm they accept RON notarizations`);
    }
  }

  // 3. Recordable in land records
  if (input.is_recordable_in_land_records) {
    riskScore += 1;
    riskReasons.push("Document will be recorded in land records — county recorder acceptance may vary");
    recommendedActions.push("Call the county recorder's office before your session to confirm acceptance");
  }

  // 4. Requires apostille
  if (input.requires_apostille) {
    riskScore += 1;
    riskReasons.push("Document requires an Apostille — additional processing needed after notarization");
    recommendedActions.push("Contact the Ohio Secretary of State for Apostille requirements");
    recommendedActions.push("Verify the receiving country's specific legalization requirements");
  }

  // 5. Signer outside US
  if (input.signer_location_country === "non_us") {
    riskScore += 1;
    riskReasons.push("Signer is located outside the United States — technology and identity verification requirements apply");
    recommendedActions.push("Ensure the signer has a valid US-issued ID for KBA verification");
    recommendedActions.push("Confirm stable internet/video connection from the signer's location");
  }

  // 6. Recipient-specific adjustments
  if (input.intended_recipient_type === "foreign_entity") {
    riskScore += 1;
    riskReasons.push("Receiving entity is a foreign government — they may require specific legalization beyond notarization");
  }
  if (input.intended_recipient_type === "county_recorder" && receivingProfile && !receivingProfile.ron_authorized) {
    riskScore += 1;
    riskReasons.push("County recorders in states without RON law may be unfamiliar with electronic notarizations");
  }

  // Map risk score to level
  const riskLevel: RiskLevel = riskScore <= 1 ? "low" : riskScore <= 3 ? "medium" : "high";

  // Default recommended actions
  if (recommendedActions.length === 0) {
    if (riskLevel === "low") {
      recommendedActions.push("You're all set — schedule your RON session at your convenience");
    } else {
      recommendedActions.push("Verify with the receiving entity before scheduling your session");
    }
  }

  // Build headline
  let headline: string;
  let status: "eligible" | "conditional" | "not_eligible";
  if (riskLevel === "low") {
    headline = "RON Is Widely Accepted for This Scenario";
    status = "eligible";
  } else if (riskLevel === "medium") {
    headline = "RON Should Work — Verify with Receiving Entity First";
    status = "conditional";
  } else {
    headline = "RON May Face Acceptance Challenges — Proceed with Caution";
    status = "conditional";
  }

  return {
    status,
    headline,
    notary_state_analysis: {
      state_name: "Ohio",
      ron_authorized: true,
      acceptance_rating: "high",
      statutory_citation: "ORC §147.60-.66",
      notes: docRule
        ? [docRule.notes]
        : ["Ohio RON is fully authorized for this document type under ORC §147.63"],
    },
    receiving_state_analysis: buildReceivingAnalysis(receivingProfile, input),
    risk_level: riskLevel,
    risk_score: riskScore,
    risk_reasons: riskReasons.length > 0 ? riskReasons : ["No significant risk factors identified"],
    recommended_actions: recommendedActions,
    citations: [...new Set(citations)],
    disclaimer: DISCLAIMER,
  };
}

function buildReceivingAnalysis(profile: StateProfile | null, input: AdvisorInput): StateAnalysis {
  if (!profile) {
    return {
      state_name: input.document_use_state,
      ron_authorized: false,
      acceptance_rating: "medium",
      statutory_citation: null,
      notes: ["State profile not found — Full Faith & Credit Clause should apply"],
    };
  }

  const rating = getAcceptanceForCategory(profile, input.document_category);
  return {
    state_name: profile.name,
    ron_authorized: profile.ron_authorized,
    acceptance_rating: rating,
    statutory_citation: profile.statutory_citation,
    notes: profile.practice_notes,
  };
}

function getCategoryLabel(category: string): string {
  const found = DOCUMENT_CATEGORIES.find(c => c.value === category);
  return found?.label || category;
}

// Simplified analysis for the public-facing widget (5 fields)
export interface SimpleInput {
  signer_state: string;
  document_use_state: string;
  document_category: string;
  document_subtype: string;
  notarial_act_type: string;
}

export function analyzeSimple(input: SimpleInput): AdvisorResult {
  return analyzeScenario({
    notary_state: "Ohio",
    signer_state: input.signer_state,
    document_use_state: input.document_use_state,
    document_category: input.document_category,
    document_subtype: input.document_subtype,
    notarial_act_type: input.notarial_act_type,
    signer_location_country: "us",
    is_recordable_in_land_records: false,
    requires_apostille: false,
    intended_recipient_type: "other",
  });
}
