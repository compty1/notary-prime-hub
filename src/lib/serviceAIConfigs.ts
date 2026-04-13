/**
 * Sprint 8: Per-category AI prompt configs, quality checklists, and output templates.
 */

export type ServiceAICategory =
  | "notarization" | "legal" | "translation" | "content" | "business"
  | "immigration" | "research" | "verification" | "real-estate"
  | "court-forms" | "process-serving" | "default";

export interface ServiceAIConfig {
  category: ServiceAICategory;
  label: string;
  qualityChecklist: string[];
  toneOptions: string[];
  lengthOptions: string[];
  suggestedFields: { key: string; label: string; placeholder: string }[];
}

export const SERVICE_AI_CONFIGS: Record<ServiceAICategory, ServiceAIConfig> = {
  notarization: {
    category: "notarization",
    label: "Notarization",
    qualityChecklist: [
      "ORC section references included",
      "Proper notarial act type identified",
      "Identity verification method specified",
      "Journal entry requirements met",
      "Seal requirements documented",
      "Venue (State/County) included",
    ],
    toneOptions: ["Professional/Legal", "Formal", "Instructional"],
    lengthOptions: ["Concise", "Standard", "Comprehensive"],
    suggestedFields: [
      { key: "document_type", label: "Document Type", placeholder: "e.g., Acknowledgment, Jurat, Copy Certification" },
      { key: "signer_name", label: "Signer Name", placeholder: "Full legal name" },
      { key: "notarial_act", label: "Notarial Act Type", placeholder: "e.g., Acknowledgment, Oath, Affirmation" },
      { key: "county", label: "County", placeholder: "Ohio county" },
    ],
  },
  legal: {
    category: "legal",
    label: "Legal Documents",
    qualityChecklist: [
      "Proper legal formatting with numbered paragraphs",
      "Defined terms section included",
      "Signature blocks present",
      "Witness lines where required",
      "Governing law clause included",
      "Date and venue specified",
    ],
    toneOptions: ["Formal Legal", "Plain Language", "Corporate"],
    lengthOptions: ["Brief", "Standard", "Detailed"],
    suggestedFields: [
      { key: "document_type", label: "Document Type", placeholder: "e.g., Power of Attorney, Affidavit" },
      { key: "parties", label: "Parties Involved", placeholder: "Names and roles" },
      { key: "purpose", label: "Purpose", placeholder: "Brief description" },
      { key: "jurisdiction", label: "Jurisdiction", placeholder: "State/County" },
    ],
  },
  translation: {
    category: "translation",
    label: "Translation Services",
    qualityChecklist: [
      "Certification statement included",
      "Translator credentials block present",
      "Source and target languages identified",
      "Consistent terminology throughout",
      "Cultural context preserved",
      "USCIS format compliance (if applicable)",
    ],
    toneOptions: ["Formal", "Technical", "Conversational"],
    lengthOptions: ["Exact Match", "Standard", "Expanded"],
    suggestedFields: [
      { key: "source_language", label: "Source Language", placeholder: "e.g., Spanish" },
      { key: "target_language", label: "Target Language", placeholder: "e.g., English" },
      { key: "document_type", label: "Document Type", placeholder: "e.g., Birth Certificate, Diploma" },
      { key: "purpose", label: "Purpose", placeholder: "e.g., USCIS submission, court filing" },
    ],
  },
  content: {
    category: "content",
    label: "Content Creation",
    qualityChecklist: [
      "SEO keywords naturally integrated",
      "Meta description included",
      "Proper heading hierarchy (H1-H4)",
      "Call-to-action present",
      "Readability appropriate for audience",
      "Brand voice consistent",
    ],
    toneOptions: ["Professional", "Conversational", "Authoritative", "Friendly", "Technical"],
    lengthOptions: ["Short (300-500 words)", "Medium (500-1000 words)", "Long (1000-2000 words)", "Comprehensive (2000+)"],
    suggestedFields: [
      { key: "topic", label: "Topic", placeholder: "Main subject" },
      { key: "audience", label: "Target Audience", placeholder: "Who is this for?" },
      { key: "keywords", label: "SEO Keywords", placeholder: "Comma-separated keywords" },
      { key: "content_type", label: "Content Type", placeholder: "e.g., Blog Post, Newsletter, Social Media" },
    ],
  },
  business: {
    category: "business",
    label: "Business Documents",
    qualityChecklist: [
      "Corporate formatting standards met",
      "Section numbering consistent",
      "Executive summary included",
      "Financial data properly formatted",
      "Legal compliance noted",
      "Signature/approval blocks present",
    ],
    toneOptions: ["Corporate Formal", "Executive Summary", "Startup Casual", "Investor-Ready"],
    lengthOptions: ["Brief", "Standard", "Comprehensive"],
    suggestedFields: [
      { key: "business_name", label: "Business Name", placeholder: "Company name" },
      { key: "document_type", label: "Document Type", placeholder: "e.g., Business Plan, Operating Agreement" },
      { key: "industry", label: "Industry", placeholder: "Business sector" },
      { key: "entity_type", label: "Entity Type", placeholder: "e.g., LLC, Corporation, Nonprofit" },
    ],
  },
  immigration: {
    category: "immigration",
    label: "Immigration Services",
    qualityChecklist: [
      "USCIS form numbers referenced",
      "Required evidence listed",
      "Processing timeline included",
      "Fee schedule current",
      "Country-specific requirements noted",
      "Document checklist complete",
    ],
    toneOptions: ["Professional", "Instructional", "Reassuring"],
    lengthOptions: ["Summary", "Standard", "Comprehensive Guide"],
    suggestedFields: [
      { key: "visa_category", label: "Visa Category", placeholder: "e.g., F-1, H-1B, K-1, Green Card" },
      { key: "country_of_origin", label: "Country of Origin", placeholder: "Applicant's country" },
      { key: "form_number", label: "USCIS Form", placeholder: "e.g., I-130, I-485, N-400" },
      { key: "case_details", label: "Case Details", placeholder: "Brief case description" },
    ],
  },
  research: {
    category: "research",
    label: "Research & Analysis",
    qualityChecklist: [
      "Methodology section included",
      "Data sources cited",
      "Charts/tables recommended",
      "Executive summary present",
      "Actionable recommendations included",
      "Limitations acknowledged",
    ],
    toneOptions: ["Academic", "Executive", "Analytical", "Data-Driven"],
    lengthOptions: ["Brief", "Standard Report", "Comprehensive Study"],
    suggestedFields: [
      { key: "research_topic", label: "Research Topic", placeholder: "What to analyze" },
      { key: "scope", label: "Scope", placeholder: "Market, competitors, industry" },
      { key: "data_sources", label: "Data Sources", placeholder: "Available data" },
      { key: "objectives", label: "Objectives", placeholder: "Research goals" },
    ],
  },
  verification: {
    category: "verification",
    label: "Verification Services",
    qualityChecklist: [
      "ID verification method specified",
      "Compliance requirements met",
      "Documentation complete",
      "Chain of custody maintained",
      "Results properly recorded",
      "Applicable regulations referenced",
    ],
    toneOptions: ["Professional", "Formal/Compliance", "Instructional"],
    lengthOptions: ["Checklist", "Standard", "Detailed Report"],
    suggestedFields: [
      { key: "verification_type", label: "Verification Type", placeholder: "e.g., I-9, Background Check, Identity" },
      { key: "subject_name", label: "Subject Name", placeholder: "Person being verified" },
      { key: "purpose", label: "Purpose", placeholder: "Why verification is needed" },
    ],
  },
  "real-estate": {
    category: "real-estate",
    label: "Real Estate",
    qualityChecklist: [
      "Property details complete",
      "Required disclosures included",
      "Signing instructions clear",
      "Notarization requirements specified",
      "Recording information present",
      "All parties identified",
    ],
    toneOptions: ["Professional", "Formal Legal", "Client-Friendly"],
    lengthOptions: ["Summary", "Standard", "Comprehensive Package"],
    suggestedFields: [
      { key: "property_address", label: "Property Address", placeholder: "Full property address" },
      { key: "transaction_type", label: "Transaction Type", placeholder: "e.g., Purchase, Refinance, HELOC" },
      { key: "parties", label: "Parties", placeholder: "Buyer/Seller or Borrower/Lender" },
      { key: "document_type", label: "Document Type", placeholder: "e.g., Deed, Mortgage, Title" },
    ],
  },
  "court-forms": {
    category: "court-forms",
    label: "Court Forms",
    qualityChecklist: [
      "Court name and case number present",
      "Correct form used for case type",
      "Filing deadlines noted",
      "Required attachments listed",
      "Service requirements specified",
      "Signature lines present",
    ],
    toneOptions: ["Formal Legal", "Plain Language"],
    lengthOptions: ["Form Only", "With Instructions", "Comprehensive"],
    suggestedFields: [
      { key: "court_name", label: "Court", placeholder: "e.g., Franklin County Common Pleas" },
      { key: "case_type", label: "Case Type", placeholder: "e.g., Civil, Domestic, Probate" },
      { key: "form_name", label: "Form Name", placeholder: "Specific form needed" },
      { key: "county", label: "County", placeholder: "Ohio county" },
    ],
  },
  "process-serving": {
    category: "process-serving",
    label: "Process Serving",
    qualityChecklist: [
      "Service method documented",
      "Attempt details complete",
      "Address and timestamps included",
      "Ohio Civ.R. 4 compliance",
      "Affidavit of service prepared",
      "Due diligence documented",
    ],
    toneOptions: ["Formal Legal", "Report Style"],
    lengthOptions: ["Affidavit Only", "Standard Report", "Full Documentation"],
    suggestedFields: [
      { key: "case_number", label: "Case Number", placeholder: "Court case number" },
      { key: "party_to_serve", label: "Party to Serve", placeholder: "Name of person" },
      { key: "address", label: "Service Address", placeholder: "Where to serve" },
      { key: "document_type", label: "Documents", placeholder: "What is being served" },
    ],
  },
  default: {
    category: "default",
    label: "General",
    qualityChecklist: [
      "Professional formatting",
      "Complete and accurate content",
      "Clear structure and flow",
      "Proper grammar and spelling",
      "Actionable output",
    ],
    toneOptions: ["Professional", "Casual", "Formal", "Technical"],
    lengthOptions: ["Brief", "Standard", "Detailed"],
    suggestedFields: [
      { key: "description", label: "Description", placeholder: "What do you need?" },
      { key: "context", label: "Context", placeholder: "Background information" },
    ],
  },
};

export function getServiceAIConfig(category: string): ServiceAIConfig {
  return SERVICE_AI_CONFIGS[category as ServiceAICategory] || SERVICE_AI_CONFIGS.default;
}

/** Map service registry categories to AI categories */
export function mapServiceCategoryToAI(serviceCategory: string): ServiceAICategory {
  const map: Record<string, ServiceAICategory> = {
    "Notarization": "notarization",
    "Legal": "legal",
    "Translation": "translation",
    "Content": "content",
    "Business": "business",
    "Immigration": "immigration",
    "Research": "research",
    "Verification": "verification",
    "Real Estate": "real-estate",
    "Court Forms": "court-forms",
    "Process Serving": "process-serving",
    "Administrative": "business",
    "Customer Service": "default",
    "Technical": "default",
    "UX": "research",
  };
  return map[serviceCategory] || "default";
}
