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

  "standard-translation": {
    serviceId: "standard-translation",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Upload Document", description: "Upload document for translation", required: true },
      { step: 2, label: "Language Pair", description: "Select source and target languages", required: true },
      { step: 3, label: "Translation", description: "Professional translator completes work", required: true },
      { step: 4, label: "Review & Deliver", description: "Quality review and delivery", required: true },
    ],
    documentChecklist: [
      { name: "Source Document", description: "Document to be translated", required: true, acceptedFormats: ["pdf", "doc", "docx", "jpg", "png"] },
    ],
    postActions: ["Deliver translated document", "Offer certification add-on"],
    turnaroundTime: "3–5 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "certified-translation": {
    serviceId: "certified-translation",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Upload Document", description: "Upload document for certified translation", required: true },
      { step: 2, label: "Language & Purpose", description: "Specify languages and intended use", required: true },
      { step: 3, label: "Translation", description: "ATA-certified translator completes work", required: true },
      { step: 4, label: "Certification", description: "Certificate of accuracy attached", required: true },
      { step: 5, label: "Deliver", description: "Digital and optional hard copy delivery", required: true },
    ],
    documentChecklist: [
      { name: "Source Document", description: "Original document to translate", required: true },
      { name: "Purpose Statement", description: "Where the translation will be submitted (USCIS, court, etc.)", required: true },
    ],
    postActions: ["Deliver with certification", "Offer apostille/notarization"],
    turnaroundTime: "3–7 business days (rush available)",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "court-certified-translation": {
    serviceId: "court-certified-translation",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Document", description: "Upload document and specify court/county", required: true },
      { step: 2, label: "Translation", description: "Court-qualified translator completes work", required: true },
      { step: 3, label: "Court Certification", description: "Affidavit of accuracy prepared", required: true },
      { step: 4, label: "Notarize", description: "Translator affidavit notarized", required: true },
      { step: 5, label: "Deliver", description: "Deliver court-ready package", required: true },
    ],
    documentChecklist: [
      { name: "Source Document", description: "Document requiring court-certified translation", required: true },
      { name: "Court Info", description: "Court name, case number, county", required: true },
    ],
    postActions: ["Deliver certified package", "Offer filing assistance"],
    turnaroundTime: "5–10 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "credential-evaluation": {
    serviceId: "credential-evaluation",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Credentials", description: "Upload transcripts and diplomas", required: true },
      { step: 2, label: "Review", description: "Evaluator reviews foreign credentials", required: true },
      { step: 3, label: "Evaluation Report", description: "US equivalency report generated", required: true },
      { step: 4, label: "Deliver", description: "Report delivered digitally and by mail", required: true },
    ],
    documentChecklist: [
      { name: "Foreign Transcripts", description: "Official academic transcripts", required: true },
      { name: "Diplomas/Degrees", description: "Copies of diplomas or degree certificates", required: true },
      { name: "Certified Translation", description: "If documents not in English", required: false },
    ],
    postActions: ["Deliver evaluation report", "Offer translation services"],
    turnaroundTime: "7–15 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "fingerprinting": {
    serviceId: "fingerprinting",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Select Type", description: "Choose fingerprint card type (FD-258, BCI, etc.)", required: true },
      { step: 2, label: "Schedule", description: "Book appointment", required: true },
      { step: 3, label: "Capture", description: "Live scan or ink fingerprinting", required: true },
      { step: 4, label: "Submit", description: "Cards submitted to requesting agency", required: true },
    ],
    documentChecklist: [
      { name: "Government-issued ID", description: "Valid photo ID", required: true },
      { name: "Agency ORI Number", description: "If required by requesting agency", required: false },
      { name: "Reason for Fingerprinting", description: "Employment, licensing, background check, etc.", required: true },
    ],
    postActions: ["Submit to agency", "Provide receipt", "Send confirmation"],
    turnaroundTime: "Same day (walk-in available)",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "process-serving": {
    serviceId: "process-serving",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Documents", description: "Upload legal documents to be served", required: true },
      { step: 2, label: "Recipient Details", description: "Provide recipient name and address", required: true },
      { step: 3, label: "Service Attempts", description: "Process server makes service attempts", required: true },
      { step: 4, label: "Proof of Service", description: "Affidavit of service provided", required: true },
    ],
    documentChecklist: [
      { name: "Documents to Serve", description: "Legal documents requiring service", required: true, acceptedFormats: ["pdf"] },
      { name: "Case Number", description: "Court case number if available", required: false },
      { name: "Recipient Photo", description: "Photo of recipient if available", required: false },
    ],
    postActions: ["File proof of service", "Send status updates", "Invoice client"],
    turnaroundTime: "1–5 business days per attempt",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "courier": {
    serviceId: "courier",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Pickup Details", description: "Provide pickup address and time", required: true },
      { step: 2, label: "Delivery Details", description: "Provide delivery address", required: true },
      { step: 3, label: "Pickup", description: "Courier picks up package", required: true },
      { step: 4, label: "Delivery", description: "Package delivered with signature if required", required: true },
    ],
    documentChecklist: [
      { name: "Package Description", description: "Description of items being couriered", required: true },
    ],
    postActions: ["Delivery confirmation", "Photo proof", "Chain of custody log"],
    turnaroundTime: "Same day (rush available)",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "background-check": {
    serviceId: "background-check",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Request", description: "Provide subject information and check type", required: true },
      { step: 2, label: "Consent", description: "Subject authorization obtained", required: true },
      { step: 3, label: "Processing", description: "Background check conducted", required: true },
      { step: 4, label: "Results", description: "Report delivered securely", required: true },
    ],
    documentChecklist: [
      { name: "Subject Consent Form", description: "Signed authorization from the subject", required: true },
      { name: "Subject ID", description: "Government-issued ID of subject", required: true },
    ],
    postActions: ["Deliver report securely", "Offer fingerprinting add-on"],
    turnaroundTime: "3–7 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "passport-photo": {
    serviceId: "passport-photo",
    intakeRoute: "book",
    steps: [
      { step: 1, label: "Schedule", description: "Book appointment or walk in", required: true },
      { step: 2, label: "Photo Session", description: "Professional photo taken to specifications", required: true },
      { step: 3, label: "Deliver", description: "Printed and/or digital photos provided", required: true },
    ],
    documentChecklist: [],
    postActions: ["Provide printed photos", "Send digital copy"],
    turnaroundTime: "Same day (walk-in available)",
    hasAdminDashboard: false,
    hasStatusTracking: false,
  },

  "kyc-verification": {
    serviceId: "kyc-verification",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Info", description: "Provide entity and individual details", required: true },
      { step: 2, label: "Document Collection", description: "Upload identity and business documents", required: true },
      { step: 3, label: "Verification", description: "KYC/AML screening conducted", required: true },
      { step: 4, label: "Report", description: "Compliance report delivered", required: true },
    ],
    documentChecklist: [
      { name: "Government ID", description: "Valid photo ID for each individual", required: true },
      { name: "Proof of Address", description: "Utility bill or bank statement", required: true },
      { name: "Business Documents", description: "Articles of incorporation if applicable", required: false },
    ],
    postActions: ["Deliver KYC report", "Schedule periodic re-verification"],
    turnaroundTime: "1–3 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "registered-agent": {
    serviceId: "registered-agent",
    intakeRoute: "subscribe",
    steps: [
      { step: 1, label: "Entity Details", description: "Provide business name and entity type", required: true },
      { step: 2, label: "Designate Agent", description: "We become your registered agent", required: true },
      { step: 3, label: "File Change", description: "File agent change with Ohio SOS", required: true },
      { step: 4, label: "Active Service", description: "Receive and forward legal documents", required: true },
    ],
    documentChecklist: [
      { name: "Current Filing", description: "Most recent annual report or articles", required: false },
    ],
    postActions: ["File agent change with SOS", "Set up mail forwarding", "Annual renewal reminder"],
    turnaroundTime: "3–5 business days for initial filing",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "business-subscriptions": {
    serviceId: "business-subscriptions",
    intakeRoute: "subscribe",
    steps: [
      { step: 1, label: "Select Plan", description: "Choose subscription tier", required: true },
      { step: 2, label: "Business Info", description: "Provide business details", required: true },
      { step: 3, label: "Payment", description: "Set up recurring payment", required: true },
      { step: 4, label: "Onboarding", description: "Access platform features", required: true },
    ],
    documentChecklist: [],
    postActions: ["Welcome email", "Account setup", "Schedule onboarding call"],
    turnaroundTime: "Instant activation",
    hasAdminDashboard: true,
    hasStatusTracking: false,
  },

  "ron-onboarding-consulting": {
    serviceId: "ron-onboarding-consulting",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Assessment", description: "Evaluate current notary setup", required: true },
      { step: 2, label: "Platform Selection", description: "Recommend RON platform", required: true },
      { step: 3, label: "Setup", description: "Configure accounts and technology", required: true },
      { step: 4, label: "Training", description: "Hands-on RON session training", required: true },
      { step: 5, label: "Launch", description: "Go live with ongoing support", required: true },
    ],
    documentChecklist: [
      { name: "Notary Commission", description: "Current notary commission certificate", required: true },
      { name: "E&O Insurance", description: "Proof of errors & omissions insurance", required: true },
    ],
    postActions: ["Deliver setup guide", "Schedule follow-up", "Provide resource library"],
    turnaroundTime: "1–2 weeks",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "workflow-audit": {
    serviceId: "workflow-audit",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Discovery", description: "Review current tools and processes", required: true },
      { step: 2, label: "Analysis", description: "Identify inefficiencies and gaps", required: true },
      { step: 3, label: "Report", description: "Deliver actionable recommendations", required: true },
      { step: 4, label: "Implementation", description: "Optional guided implementation", required: false },
    ],
    documentChecklist: [
      { name: "Current Tool List", description: "Software and platforms currently used", required: true },
    ],
    postActions: ["Deliver audit report", "Schedule implementation call"],
    turnaroundTime: "5–10 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "email-management": {
    serviceId: "email-management",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Inbox Audit", description: "Review current email volume and patterns", required: true },
      { step: 2, label: "Setup", description: "Configure filters, labels, and templates", required: true },
      { step: 3, label: "Delegation", description: "Begin managed inbox handling", required: true },
    ],
    documentChecklist: [
      { name: "Email Access", description: "Shared inbox or delegated access credentials", required: true },
    ],
    postActions: ["Daily summary reports", "Escalation protocols"],
    turnaroundTime: "Ongoing service (setup in 2–3 days)",
    hasAdminDashboard: true,
    hasStatusTracking: false,
  },

  "data-entry": {
    serviceId: "data-entry",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Data", description: "Upload documents or spreadsheets", required: true },
      { step: 2, label: "Processing", description: "Data entered into target system", required: true },
      { step: 3, label: "QA Review", description: "Quality check and verification", required: true },
      { step: 4, label: "Deliver", description: "Completed data delivered", required: true },
    ],
    documentChecklist: [
      { name: "Source Data", description: "Documents, forms, or files to be entered", required: true },
      { name: "Target Format", description: "Spreadsheet template or system access", required: true },
    ],
    postActions: ["Deliver completed data", "Provide accuracy report"],
    turnaroundTime: "1–3 business days per batch",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "blog-writing": {
    serviceId: "blog-writing",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Brief", description: "Provide topic, keywords, and tone", required: true },
      { step: 2, label: "Draft", description: "Writer produces first draft", required: true },
      { step: 3, label: "Review", description: "Review and request revisions", required: true },
      { step: 4, label: "Publish", description: "Final version delivered or published", required: true },
    ],
    documentChecklist: [
      { name: "Content Brief", description: "Topic, target audience, keywords", required: true },
    ],
    postActions: ["Deliver final content", "Offer SEO optimization add-on"],
    turnaroundTime: "3–5 business days per article",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "social-media-content": {
    serviceId: "social-media-content",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Strategy", description: "Define platforms, frequency, and themes", required: true },
      { step: 2, label: "Content Creation", description: "Create posts, graphics, and captions", required: true },
      { step: 3, label: "Approval", description: "Review content calendar", required: true },
      { step: 4, label: "Scheduling", description: "Schedule or publish content", required: true },
    ],
    documentChecklist: [
      { name: "Brand Guidelines", description: "Logo, colors, voice guidelines", required: false },
    ],
    postActions: ["Deliver content calendar", "Monthly analytics report"],
    turnaroundTime: "Weekly batches",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "newsletter-design": {
    serviceId: "newsletter-design",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Brief", description: "Provide audience, topics, and brand assets", required: true },
      { step: 2, label: "Design", description: "Template and content created", required: true },
      { step: 3, label: "Review", description: "Review and approve design", required: true },
      { step: 4, label: "Deliver", description: "HTML template or platform-ready file", required: true },
    ],
    documentChecklist: [
      { name: "Brand Assets", description: "Logo, colors, existing newsletter examples", required: false },
    ],
    postActions: ["Deliver template", "Offer ongoing content service"],
    turnaroundTime: "5–7 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "market-research": {
    serviceId: "market-research",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Scope", description: "Define research questions and market", required: true },
      { step: 2, label: "Research", description: "Data collection and analysis", required: true },
      { step: 3, label: "Report", description: "Comprehensive report prepared", required: true },
      { step: 4, label: "Presentation", description: "Findings presented and discussed", required: false },
    ],
    documentChecklist: [
      { name: "Research Brief", description: "Industry, competitors, specific questions", required: true },
    ],
    postActions: ["Deliver research report", "Schedule review call"],
    turnaroundTime: "7–14 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "lead-generation": {
    serviceId: "lead-generation",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Define ICP", description: "Identify ideal customer profile", required: true },
      { step: 2, label: "List Building", description: "Compile targeted prospect lists", required: true },
      { step: 3, label: "Outreach", description: "Execute outreach campaigns", required: true },
      { step: 4, label: "Qualify", description: "Qualify and deliver warm leads", required: true },
    ],
    documentChecklist: [
      { name: "Target Criteria", description: "Industry, company size, geography, role titles", required: true },
    ],
    postActions: ["Deliver qualified leads", "Weekly pipeline report"],
    turnaroundTime: "Ongoing (first results in 1–2 weeks)",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "email-support": {
    serviceId: "email-support",
    intakeRoute: "subscribe",
    steps: [
      { step: 1, label: "Setup", description: "Configure support inbox and templates", required: true },
      { step: 2, label: "Training", description: "Learn your products and policies", required: true },
      { step: 3, label: "Go Live", description: "Begin handling customer emails", required: true },
    ],
    documentChecklist: [
      { name: "Product/Service Info", description: "Documentation about your offerings", required: true },
      { name: "FAQ Document", description: "Common questions and answers", required: false },
    ],
    postActions: ["Daily handling reports", "Escalation alerts", "Monthly performance review"],
    turnaroundTime: "Setup in 3–5 days, then ongoing",
    hasAdminDashboard: true,
    hasStatusTracking: false,
  },

  "live-chat-support": {
    serviceId: "live-chat-support",
    intakeRoute: "subscribe",
    steps: [
      { step: 1, label: "Integration", description: "Set up live chat widget on your site", required: true },
      { step: 2, label: "Training", description: "Learn your products and policies", required: true },
      { step: 3, label: "Go Live", description: "Agents begin handling chats", required: true },
    ],
    documentChecklist: [
      { name: "Website Access", description: "Access to install chat widget", required: true },
    ],
    postActions: ["Daily chat reports", "Customer satisfaction scoring"],
    turnaroundTime: "Setup in 3–5 days, then ongoing",
    hasAdminDashboard: true,
    hasStatusTracking: false,
  },

  "website-content-updates": {
    serviceId: "website-content-updates",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Submit Request", description: "Describe changes needed", required: true },
      { step: 2, label: "Implementation", description: "Developer makes updates", required: true },
      { step: 3, label: "Review", description: "Review changes on staging", required: true },
      { step: 4, label: "Publish", description: "Deploy to production", required: true },
    ],
    documentChecklist: [
      { name: "Content/Assets", description: "New text, images, or files", required: true },
      { name: "CMS Access", description: "Login credentials or access to CMS", required: false },
    ],
    postActions: ["Deploy changes", "Send confirmation"],
    turnaroundTime: "1–3 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "ux-audit": {
    serviceId: "ux-audit",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Access", description: "Provide site URL and any test accounts", required: true },
      { step: 2, label: "Heuristic Review", description: "UX expert evaluates usability", required: true },
      { step: 3, label: "Report", description: "Detailed findings with screenshots", required: true },
      { step: 4, label: "Recommendations", description: "Prioritized improvement plan", required: true },
    ],
    documentChecklist: [
      { name: "Site URL", description: "URL of site to audit", required: true },
      { name: "Analytics Access", description: "Google Analytics or similar (optional)", required: false },
    ],
    postActions: ["Deliver audit report", "Schedule review call"],
    turnaroundTime: "5–10 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "travel-arrangements": {
    serviceId: "travel-arrangements",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Trip Details", description: "Provide dates, destinations, preferences", required: true },
      { step: 2, label: "Research", description: "Find best options and deals", required: true },
      { step: 3, label: "Booking", description: "Book approved arrangements", required: true },
      { step: 4, label: "Itinerary", description: "Deliver complete itinerary", required: true },
    ],
    documentChecklist: [
      { name: "Travel Preferences", description: "Airlines, hotels, budget range", required: true },
    ],
    postActions: ["Deliver itinerary", "Provide emergency contact info"],
    turnaroundTime: "2–5 business days",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "api-integration": {
    serviceId: "api-integration",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Requirements", description: "Define integration needs and API specs", required: true },
      { step: 2, label: "Development", description: "Build and test integration", required: true },
      { step: 3, label: "Testing", description: "End-to-end testing", required: true },
      { step: 4, label: "Deploy", description: "Deploy and monitor", required: true },
    ],
    documentChecklist: [
      { name: "API Documentation", description: "API docs or endpoints to integrate", required: true },
      { name: "Credentials", description: "API keys or OAuth details", required: true },
    ],
    postActions: ["Deploy integration", "Provide documentation", "Monitor for errors"],
    turnaroundTime: "1–3 weeks depending on complexity",
    hasAdminDashboard: true,
    hasStatusTracking: true,
  },

  "white-label-partner": {
    serviceId: "white-label-partner",
    intakeRoute: "request",
    steps: [
      { step: 1, label: "Application", description: "Submit partnership application", required: true },
      { step: 2, label: "Review", description: "Partnership review and approval", required: true },
      { step: 3, label: "Setup", description: "Configure white-label branding", required: true },
      { step: 4, label: "Launch", description: "Go live with branded platform", required: true },
    ],
    documentChecklist: [
      { name: "Business License", description: "Valid business license or registration", required: true },
      { name: "Brand Assets", description: "Logo, colors, domain for white-labeling", required: true },
    ],
    postActions: ["Configure branding", "Training session", "Ongoing support"],
    turnaroundTime: "2–4 weeks for setup",
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
