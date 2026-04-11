/**
 * NotarDex Pricing Menu — Complete service pricing from pricing document
 * All prices reflect Ohio-compliant rates per ORC §147.08
 */

export interface ServicePrice {
  name: string;
  category: string;
  priceFrom: number;
  priceTo?: number;
  priceUnit: string;
  description: string;
  compliance?: string;
  popular?: boolean;
}

export const SERVICE_PRICING: ServicePrice[] = [
  // Core Notarization
  { name: "In-Person Notarization", category: "notarization", priceFrom: 5, priceUnit: "per seal", description: "Standard Ohio notarial act per ORC §147.08", compliance: "ORC §147.08 — $5 max per seal" },
  { name: "Remote Online Notarization (RON)", category: "notarization", priceFrom: 25, priceUnit: "per session", description: "Audio-video notarization per ORC §147.60–147.66", compliance: "ORC §147.60–147.66", popular: true },
  { name: "Mobile Notary Service", category: "notarization", priceFrom: 75, priceTo: 150, priceUnit: "per trip", description: "On-site notarization at your location", popular: true },
  { name: "Loan Signing Agent", category: "notarization", priceFrom: 100, priceTo: 200, priceUnit: "per signing", description: "Complete loan document signing package" },
  { name: "Hospital/Facility Notarization", category: "notarization", priceFrom: 100, priceTo: 175, priceUnit: "per visit", description: "Bedside notary services for medical facilities" },
  { name: "Jail/Prison Notarization", category: "notarization", priceFrom: 125, priceTo: 200, priceUnit: "per visit", description: "Notarization at correctional facilities" },
  { name: "Witness Services", category: "notarization", priceFrom: 10, priceUnit: "per witness", description: "Disinterested witness for document signing" },
  { name: "After-Hours Notarization", category: "notarization", priceFrom: 25, priceTo: 50, priceUnit: "surcharge", description: "Weekend, evening, and holiday availability" },
  { name: "Rush/Same-Day Service", category: "notarization", priceFrom: 35, priceTo: 75, priceUnit: "surcharge", description: "Priority same-day scheduling" },

  // Identity & Verification
  { name: "I-9 Employment Verification", category: "verification", priceFrom: 25, priceTo: 50, priceUnit: "per form", description: "Authorized representative I-9 completion", popular: true },
  { name: "Identity Verification (KBA)", category: "verification", priceFrom: 15, priceUnit: "per check", description: "Knowledge-based authentication per RON requirements" },
  { name: "Background Check Coordination", category: "verification", priceFrom: 35, priceTo: 75, priceUnit: "per check", description: "FBI/BCI background check facilitation" },
  { name: "Fingerprinting Services", category: "verification", priceFrom: 25, priceTo: 45, priceUnit: "per card", description: "Ink and live scan fingerprinting" },

  // Document Services
  { name: "Document Preparation", category: "document_services", priceFrom: 25, priceTo: 75, priceUnit: "per document", description: "Professional document drafting and formatting" },
  { name: "Document Scanning & Digitization", category: "document_services", priceFrom: 1, priceTo: 3, priceUnit: "per page", description: "High-resolution scanning with OCR" },
  { name: "Copy Certification", category: "document_services", priceFrom: 5, priceUnit: "per copy", description: "Certified true copy of original documents" },
  { name: "Document Translation", category: "document_services", priceFrom: 25, priceTo: 75, priceUnit: "per page", description: "Professional translation with certification" },
  { name: "PDF Conversion & Processing", category: "document_services", priceFrom: 5, priceTo: 15, priceUnit: "per file", description: "PDF editing, merging, splitting, and conversion" },
  { name: "Form Filling Assistance", category: "document_services", priceFrom: 15, priceTo: 35, priceUnit: "per form", description: "Accurate form completion without legal advice" },

  // Authentication & International
  { name: "Apostille Facilitation", category: "authentication", priceFrom: 75, priceTo: 150, priceUnit: "per document", description: "Ohio Secretary of State apostille processing", popular: true },
  { name: "Consular Legalization Prep", category: "authentication", priceFrom: 100, priceTo: 250, priceUnit: "per document", description: "Embassy/consulate document preparation" },
  { name: "Certified Translation", category: "authentication", priceFrom: 40, priceTo: 100, priceUnit: "per page", description: "ATA-certified translation for official use" },

  // Business & Filing Services
  { name: "LLC Formation Package", category: "business", priceFrom: 149, priceTo: 499, priceUnit: "flat", description: "Articles of Organization filing + operating agreement", popular: true },
  { name: "Registered Agent Service", category: "business", priceFrom: 99, priceUnit: "per year", description: "Annual registered agent and mail forwarding" },
  { name: "Annual Report Filing", category: "business", priceFrom: 50, priceTo: 100, priceUnit: "per filing", description: "Ohio Secretary of State annual compliance" },
  { name: "EIN/Tax ID Application", category: "business", priceFrom: 75, priceUnit: "flat", description: "IRS Employer Identification Number application" },
  { name: "DBA/Fictitious Name Filing", category: "business", priceFrom: 50, priceTo: 75, priceUnit: "flat", description: "County-level trade name registration" },

  // Real Estate
  { name: "Deed Transfer Preparation", category: "real_estate", priceFrom: 75, priceTo: 150, priceUnit: "per deed", description: "Warranty, quitclaim, and transfer-on-death deeds" },
  { name: "County Recorder Filing", category: "real_estate", priceFrom: 35, priceTo: 75, priceUnit: "per document", description: "Ohio county recorder e-filing service" },
  { name: "Title Search Coordination", category: "real_estate", priceFrom: 150, priceTo: 350, priceUnit: "per search", description: "Full title search and report" },
  { name: "Real Estate Closing Support", category: "real_estate", priceFrom: 150, priceTo: 400, priceUnit: "per closing", description: "Complete closing document management" },

  // Process Serving & Legal Support
  { name: "Process Serving", category: "legal_support", priceFrom: 50, priceTo: 100, priceUnit: "per serve", description: "Certified process service with affidavit of service" },
  { name: "Skip Tracing", category: "legal_support", priceFrom: 50, priceTo: 200, priceUnit: "per search", description: "Locate hard-to-find individuals for service" },
  { name: "Court Form Preparation", category: "legal_support", priceFrom: 25, priceTo: 75, priceUnit: "per form", description: "Ohio court form completion (no legal advice)" },
  { name: "Vital Records Request", category: "legal_support", priceFrom: 35, priceTo: 75, priceUnit: "per record", description: "Birth, death, marriage certificate requests" },

  // Virtual Assistant & Admin
  { name: "Virtual Assistant (General)", category: "admin_support", priceFrom: 25, priceTo: 45, priceUnit: "per hour", description: "Administrative support, scheduling, data entry" },
  { name: "Email Management", category: "admin_support", priceFrom: 200, priceTo: 500, priceUnit: "per month", description: "Full email inbox management and correspondence" },
  { name: "Courier & Document Delivery", category: "admin_support", priceFrom: 25, priceTo: 75, priceUnit: "per delivery", description: "Same-day local document courier service" },

  // Print & Creative
  { name: "Business Cards (250)", category: "print", priceFrom: 24.99, priceUnit: "per order", description: "Premium full-color business cards" },
  { name: "Custom Letterhead (250)", category: "print", priceFrom: 49.99, priceUnit: "per order", description: "Professional branded letterhead" },
  { name: "Notary Stamp (Ohio)", category: "print", priceFrom: 24.99, priceUnit: "each", description: "Ohio-compliant notary stamp per ORC §147.04" },
  { name: "Presentation Folders (50)", category: "print", priceFrom: 174.50, priceUnit: "per order", description: "Custom pocket folders for client packets" },
  { name: "Custom Embosser", category: "print", priceFrom: 39.99, priceUnit: "each", description: "Desktop or handheld embossing seal" },

  // Subscriptions & Recurring
  { name: "Starter Plan", category: "subscription", priceFrom: 29, priceUnit: "per month", description: "5 RON sessions, basic document storage, email support", popular: true },
  { name: "Professional Plan", category: "subscription", priceFrom: 79, priceUnit: "per month", description: "25 RON sessions, advanced tools, priority support" },
  { name: "Enterprise Plan", category: "subscription", priceFrom: 199, priceUnit: "per month", description: "Unlimited sessions, API access, dedicated account manager" },
  { name: "Document Storage Vault", category: "subscription", priceFrom: 9.99, priceUnit: "per month", description: "Encrypted cloud storage with 10-year retention" },
  { name: "Virtual Mailroom", category: "subscription", priceFrom: 49, priceUnit: "per month", description: "Mail scanning, forwarding, and digital delivery" },

  // Court Form Typing Packages
  { name: "Divorce Filing Package", category: "court_forms", priceFrom: 150, priceTo: 350, priceUnit: "per package", description: "Ohio divorce complaint, separation agreement, and related filings" },
  { name: "Custody/Visitation Package", category: "court_forms", priceFrom: 125, priceTo: 300, priceUnit: "per package", description: "Custody motion, parenting plan, and supporting documents" },
  { name: "Eviction Filing Package", category: "court_forms", priceFrom: 75, priceTo: 175, priceUnit: "per package", description: "3-day notice, complaint, and summons for Ohio landlord-tenant" },
  { name: "Name Change Package", category: "court_forms", priceFrom: 100, priceTo: 200, priceUnit: "per package", description: "Petition, notice, and order for legal name change" },
  { name: "Guardianship Package", category: "court_forms", priceFrom: 175, priceTo: 400, priceUnit: "per package", description: "Application, bond, and letters of guardianship" },
  { name: "Small Claims Filing", category: "court_forms", priceFrom: 50, priceTo: 100, priceUnit: "per filing", description: "Small claims complaint and summons preparation" },
  { name: "Expungement Package", category: "court_forms", priceFrom: 100, priceTo: 250, priceUnit: "per package", description: "Ohio expungement/sealing application and supporting docs" },
  { name: "Adoption Filing Package", category: "court_forms", priceFrom: 200, priceTo: 500, priceUnit: "per package", description: "Adoption petition, consent forms, and court filings" },
  { name: "Probate Filing Package", category: "court_forms", priceFrom: 150, priceTo: 400, priceUnit: "per package", description: "Application, inventory, and final accounting for estate" },
  { name: "Civil Protection Order", category: "court_forms", priceFrom: 75, priceTo: 150, priceUnit: "per filing", description: "Petition for civil protection/restraining order" },

  // Real Estate Support Services
  { name: "Property Photography", category: "real_estate_support", priceFrom: 100, priceTo: 250, priceUnit: "per session", description: "Professional property photography for listings or records" },
  { name: "Lockbox Coordination", category: "real_estate_support", priceFrom: 25, priceTo: 50, priceUnit: "per service", description: "Key exchange and lockbox setup/retrieval for closings" },
  { name: "Open House Support", category: "real_estate_support", priceFrom: 75, priceTo: 150, priceUnit: "per event", description: "On-site document management and notarization at open houses" },
  { name: "Tenant Document Services", category: "real_estate_support", priceFrom: 35, priceTo: 75, priceUnit: "per package", description: "Lease agreements, move-in/out checklists, and tenant notices" },

  // Additional Services
  { name: "Interpreter Referral Service", category: "admin_support", priceFrom: 50, priceTo: 100, priceUnit: "per session", description: "Qualified interpreter coordination for notarial acts" },
  { name: "Scanback Service", category: "document_services", priceFrom: 10, priceTo: 25, priceUnit: "per package", description: "Scan-back of signed documents to lender or originator" },
  { name: "Document Printing & Prep", category: "document_services", priceFrom: 0.25, priceTo: 1, priceUnit: "per page", description: "Print, collate, and tab documents for signing sessions" },
];

/** Service pricing category labels */
export const PRICING_CATEGORIES: Record<string, { label: string; icon: string }> = {
  notarization: { label: "Core Notarization", icon: "📝" },
  verification: { label: "Identity & Verification", icon: "🔍" },
  document_services: { label: "Document Services", icon: "📄" },
  authentication: { label: "Authentication & International", icon: "🌍" },
  business: { label: "Business & Filing", icon: "🏢" },
  real_estate: { label: "Real Estate", icon: "🏡" },
  legal_support: { label: "Legal Support", icon: "⚖️" },
  admin_support: { label: "Admin & VA", icon: "💼" },
  print: { label: "Print & Supplies", icon: "🖨️" },
  subscription: { label: "Subscriptions", icon: "🔄" },
  court_forms: { label: "Court Form Packages", icon: "📋" },
  real_estate_support: { label: "Real Estate Support", icon: "🏠" },
};
