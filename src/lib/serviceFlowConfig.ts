/**
 * B-001+: Service flow configuration — maps each service to its
 * intake procedure, required tools, document checklists, and routing.
 */

export interface ServiceFlowStep {
  step: number;
  label: string;
  description: string;
  required: boolean;
}

export interface DocumentRequirement {
  name: string;
  description: string;
  required: boolean;
  acceptedFormats?: string[];
}

export interface ServiceFlowConfig {
  serviceId: string;
  /** Route to use for this service's intake */
  intakeRoute: "book" | "request" | "subscribe" | "portal" | "custom";
  /** Custom route path if intakeRoute is "custom" */
  customPath?: string;
  /** Steps in the service flow */
  steps: ServiceFlowStep[];
  /** Documents the client needs to prepare */
  documentChecklist: DocumentRequirement[];
  /** Pre-qualification questions */
  preQualification?: string[];
  /** Post-completion actions */
  postActions: string[];
  /** Turnaround time description */
  turnaroundTime: string;
  /** Whether this service has an admin dashboard */
  hasAdminDashboard: boolean;
  /** Whether status tracking is available */
  hasStatusTracking: boolean;
}

export const SERVICE_FLOWS: Record<string, ServiceFlowConfig> = {
  "ron-session": {
    serviceId: "ron-session",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Select Service", description: "Choose Remote Online Notarization", required: true },
      { step: 2, label: "Upload Documents", description: "Upload documents to be notarized", required: true },
      { step: 3, label: "Identity Verification", description: "Complete KBA and ID verification", required: true },
      { step: 4, label: "Schedule Session", description: "Pick date and time for your RON session", required: true },
      { step: 5, label: "Payment", description: "Pay via Stripe checkout", required: true },
      { step: 6, label: "Join Session", description: "Join audio-video session with notary", required: true },
    ],
    documentChecklist: [
      { name: "Government-issued ID", description: "Valid driver's license, passport, or state ID", required: true, acceptedFormats: ["jpg", "png", "pdf"] },
      { name: "Document to Notarize", description: "The document requiring notarization", required: true, acceptedFormats: ["pdf", "doc", "docx"] },
      { name: "Secondary ID", description: "Second form of identification if required", required: false, acceptedFormats: ["jpg", "png", "pdf"] },
    ],
    preQualification: [
      "Are you physically located in an authorized state?",
      "Do you have a valid government-issued photo ID?",
      "Do you have a webcam and microphone available?",
    ],
    postActions: ["Send confirmation email", "Generate journal entry", "Store recording (10yr)", "Send review request"],
    turnaroundTime: "Same day — typically within 30 minutes of scheduled time",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "in-person-notarization": {
    serviceId: "in-person-notarization",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Select Service", description: "Choose in-person notarization", required: true },
      { step: 2, label: "Schedule", description: "Pick date, time, and location", required: true },
      { step: 3, label: "Payment", description: "Pay or pay at appointment", required: false },
      { step: 4, label: "Attend Appointment", description: "Bring documents and valid ID", required: true },
    ],
    documentChecklist: [
      { name: "Government-issued ID", description: "Valid driver's license, passport, or state ID", required: true },
      { name: "Document to Notarize", description: "The document requiring notarization", required: true },
    ],
    postActions: ["Send confirmation email", "Generate journal entry", "Send review request"],
    turnaroundTime: "Same day",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "mobile-notarization": {
    serviceId: "mobile-notarization",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Select Service", description: "Choose mobile notarization", required: true },
      { step: 2, label: "Enter Location", description: "Provide address for notary travel", required: true },
      { step: 3, label: "Schedule", description: "Pick date and time", required: true },
      { step: 4, label: "Travel Fee", description: "Review travel fee estimate", required: true },
      { step: 5, label: "Payment", description: "Pay via Stripe", required: true },
    ],
    documentChecklist: [
      { name: "Government-issued ID", description: "Valid photo ID for each signer", required: true },
      { name: "Document to Notarize", description: "Document(s) requiring notarization", required: true },
    ],
    postActions: ["Send confirmation email", "Calculate travel fee", "Generate journal entry", "Send review request"],
    turnaroundTime: "Same day or next day",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "loan-signing": {
    serviceId: "loan-signing",
    intakeRoute: "custom",
    customPath: "/loan-signing",
    steps: [
      { step: 1, label: "Lender Details", description: "Provide lender name and loan type", required: true },
      { step: 2, label: "Document Package", description: "Upload or receive loan docs (page count)", required: true },
      { step: 3, label: "Schedule", description: "Pick signing date and time", required: true },
      { step: 4, label: "Signing", description: "Conduct loan signing at agreed location", required: true },
      { step: 5, label: "Return Package", description: "Ship completed package back to lender/title", required: true },
    ],
    documentChecklist: [
      { name: "Loan Document Package", description: "Complete loan document set from lender/title company", required: true },
      { name: "Government-issued ID", description: "Valid photo ID for all borrowers", required: true },
      { name: "Lender Instructions", description: "Signing instructions from lender", required: true },
    ],
    postActions: ["Send confirmation", "Track return shipping", "Invoice lender", "Generate journal entries"],
    turnaroundTime: "Same day or next business day",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "i9-verification": {
    serviceId: "i9-verification",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Employer Info", description: "Provide employer name and contact", required: true },
      { step: 2, label: "Schedule", description: "Pick date and time for verification", required: true },
      { step: 3, label: "Verification", description: "Review documents in person", required: true },
      { step: 4, label: "Completion", description: "Submit completed I-9 to employer", required: true },
    ],
    documentChecklist: [
      { name: "List A, B, or C Documents", description: "Acceptable I-9 identity and employment authorization documents", required: true },
      { name: "Partially Completed I-9", description: "Section 1 completed by employee", required: true },
    ],
    postActions: ["Send completed I-9 to employer", "Send confirmation email"],
    turnaroundTime: "Same day",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "apostille": {
    serviceId: "apostille",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Request", description: "Describe document and destination country", required: true },
      { step: 2, label: "Document Review", description: "We review document eligibility", required: true },
      { step: 3, label: "Notarize if Needed", description: "Notarize document if required", required: false },
      { step: 4, label: "Submit to SOS", description: "Submit to Ohio Secretary of State", required: true },
      { step: 5, label: "Return Document", description: "Receive apostilled document", required: true },
    ],
    documentChecklist: [
      { name: "Original Document", description: "Original or certified copy of document to apostille", required: true },
      { name: "Destination Info", description: "Country where document will be used", required: true },
    ],
    preQualification: [
      "Is the destination country a Hague Convention member?",
      "Is the document issued by a government or notarized?",
    ],
    postActions: ["Track with SOS", "Send status updates", "Ship completed document"],
    turnaroundTime: "5–10 business days (rush available)",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "divorce-filing": {
    serviceId: "divorce-filing",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Info", description: "Provide county, case type, and basic info", required: true },
      { step: 2, label: "Document Prep", description: "We prepare court forms", required: true },
      { step: 3, label: "Review", description: "Review prepared documents", required: true },
      { step: 4, label: "Filing Instructions", description: "Receive instructions for filing", required: true },
    ],
    documentChecklist: [
      { name: "Marriage Certificate", description: "Copy of marriage certificate", required: false },
      { name: "Children Info", description: "Names and dates of birth of children if applicable", required: false },
    ],
    postActions: ["Send completed forms", "Provide filing instructions"],
    turnaroundTime: "3–5 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "custody-package": {
    serviceId: "custody-package",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Info", description: "Provide county and case details", required: true },
      { step: 2, label: "Document Prep", description: "We prepare custody/visitation forms", required: true },
      { step: 3, label: "Review", description: "Review prepared documents", required: true },
      { step: 4, label: "Filing Instructions", description: "Receive instructions for filing", required: true },
    ],
    documentChecklist: [
      { name: "Existing Court Orders", description: "Any existing custody or court orders", required: false },
      { name: "Children Info", description: "Names and dates of birth of children", required: true },
    ],
    postActions: ["Send completed forms", "Provide filing instructions"],
    turnaroundTime: "3–5 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "business-formation": {
    serviceId: "business-formation",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Entity Type", description: "Select LLC, Corporation, or DBA", required: true },
      { step: 2, label: "Business Details", description: "Provide business name, members, address", required: true },
      { step: 3, label: "Document Prep", description: "We prepare formation documents", required: true },
      { step: 4, label: "Filing", description: "File with Ohio Secretary of State", required: true },
      { step: 5, label: "Delivery", description: "Receive filed documents and EIN info", required: true },
    ],
    documentChecklist: [
      { name: "Preferred Business Name", description: "Name for the business entity (we check availability)", required: true },
      { name: "Member/Officer Info", description: "Names and addresses of members/officers", required: true },
    ],
    postActions: ["File with SOS", "Send status updates", "Deliver completed documents"],
    turnaroundTime: "5–7 business days (rush available)",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "document-vault": {
    serviceId: "document-vault",
    intakeRoute: "portal",
    steps: [
      { step: 1, label: "Sign Up", description: "Create account or log in", required: true },
      { step: 2, label: "Upload", description: "Upload documents to encrypted vault", required: true },
      { step: 3, label: "Organize", description: "Tag and organize documents", required: false },
    ],
    documentChecklist: [],
    postActions: ["Welcome email", "Storage usage notification"],
    turnaroundTime: "Instant access",
    hasAdminDashboard: false,
    hasStatusTracking: false,
  },

  "estate-plan-bundle": {
    serviceId: "estate-plan-bundle",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Select Bundle", description: "Choose estate planning documents needed", required: true },
      { step: 2, label: "Provide Details", description: "Enter beneficiary and agent information", required: true },
      { step: 3, label: "Document Prep", description: "We prepare Will, POA, healthcare directive", required: true },
      { step: 4, label: "Review", description: "Review prepared documents", required: true },
      { step: 5, label: "Schedule Notarization", description: "Schedule RON or in-person session", required: true },
      { step: 6, label: "Sign & Notarize", description: "Execute documents with notary", required: true },
    ],
    documentChecklist: [
      { name: "Government-issued ID", description: "Valid photo ID for all signers", required: true },
      { name: "Beneficiary Info", description: "Names and addresses of beneficiaries", required: true },
      { name: "Agent/Executor Info", description: "Name of designated agents and executors", required: true },
    ],
    postActions: ["Generate journal entries", "Send executed documents", "Send review request", "Storage in vault"],
    turnaroundTime: "3–5 business days prep, same-day notarization",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "document-prep": {
    serviceId: "document-prep",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Describe Document", description: "Tell us what you need prepared", required: true },
      { step: 2, label: "Upload Reference", description: "Upload any reference materials", required: false },
      { step: 3, label: "Preparation", description: "We prepare the document", required: true },
      { step: 4, label: "Review & Revisions", description: "Review and request changes", required: true },
    ],
    documentChecklist: [
      { name: "Reference Materials", description: "Any existing documents or notes", required: false },
    ],
    postActions: ["Send completed document", "Offer notarization if needed"],
    turnaroundTime: "24–48 hours (rush available)",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "document-digitization": {
    serviceId: "document-digitization",
    intakeRoute: "custom",
    customPath: "/digitize",
    steps: [
      { step: 1, label: "Upload Scans", description: "Upload scanned documents or photos", required: true },
      { step: 2, label: "OCR Processing", description: "AI extracts text from images", required: true },
      { step: 3, label: "Review", description: "Review and edit extracted text", required: true },
      { step: 4, label: "Download", description: "Download searchable digital documents", required: true },
    ],
    documentChecklist: [
      { name: "Scanned Documents", description: "Photos or scans of documents to digitize", required: true, acceptedFormats: ["jpg", "png", "pdf", "tiff"] },
    ],
    postActions: ["Send digital copies", "Store in vault if requested"],
    turnaroundTime: "Instant for AI-powered, 24hrs for manual",
    hasAdminDashboard: false,
    hasStatusTracking: false,
  },

  "identity-certificate": {
    serviceId: "identity-certificate",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Schedule", description: "Book an appointment", required: true },
      { step: 2, label: "Verify Identity", description: "Present ID documents in person", required: true },
      { step: 3, label: "Certificate Issued", description: "Receive certified identity document", required: true },
    ],
    documentChecklist: [
      { name: "Government-issued ID", description: "Valid photo ID", required: true },
      { name: "Secondary ID", description: "Second form of identification", required: true },
    ],
    postActions: ["Generate certificate", "Send confirmation", "Log in journal"],
    turnaroundTime: "Same day",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },
};

/** Get flow config for a service */
export function getServiceFlow(serviceId: string): ServiceFlowConfig | undefined {
  return SERVICE_FLOWS[serviceId];
}

/** Get document checklist for a service */
export function getDocumentChecklist(serviceId: string): DocumentRequirement[] {
  return SERVICE_FLOWS[serviceId]?.documentChecklist ?? [];
}

/** Get estimated turnaround for a service */
export function getServiceTurnaround(serviceId: string): string {
  return SERVICE_FLOWS[serviceId]?.turnaroundTime ?? "Contact us for estimate";
}

/** Check if service has proper flow configuration */
export function isServiceFlowComplete(serviceId: string): boolean {
  const flow = SERVICE_FLOWS[serviceId];
  if (!flow) return false;
  return flow.steps.length > 0 && flow.postActions.length > 0;
}
