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
  { name: "In-Person Notarization", category: "notarization", priceFrom: 5, priceUnit: "per act", description: "Standard Ohio notarial act per ORC §147.08", compliance: "ORC §147.08 — $5 max per act", popular: true },
  { name: "Remote Online Notarization (RON)", category: "notarization", priceFrom: 40, priceTo: 45, priceUnit: "all-in per session", description: "$30/act (ORC max) + $10 tech fee. Audio-video notarization per ORC §147.60–147.66", compliance: "ORC §147.60–147.66", popular: true },
  { name: "Mobile Notary Service", category: "notarization", priceFrom: 30, priceTo: 60, priceUnit: "act + zone travel", description: "$5/act + zone-based travel fee. On-site at your location", popular: true },
  { name: "Loan Signing — Standard", category: "notarization", priceFrom: 125, priceUnit: "flat package", description: "Standard refinance loan signing package (includes notarization)" },
  { name: "Loan Signing — Purchase/Refi", category: "notarization", priceFrom: 150, priceUnit: "flat package", description: "Purchase or complex refinance loan signing package" },
  { name: "Loan Signing — Reverse Mortgage", category: "notarization", priceFrom: 175, priceUnit: "flat package", description: "Reverse mortgage signing with extended appointment time" },
  { name: "Hospital/Facility Notarization", category: "notarization", priceFrom: 50, priceTo: 100, priceUnit: "act + $20 surcharge + travel", description: "Bedside notary at hospitals, nursing homes, and assisted living" },
  { name: "Jail/Prison Notarization", category: "notarization", priceFrom: 100, priceTo: 150, priceUnit: "act + $75 surcharge + travel", description: "Notarization at correctional facilities with security coordination" },
  { name: "Witness Services", category: "notarization", priceFrom: 15, priceUnit: "per witness", description: "Disinterested witness for document signing" },
  { name: "After-Hours (Evening)", category: "notarization", priceFrom: 35, priceUnit: "surcharge", description: "6 PM – 10 PM appointments" },
  { name: "After-Hours (Emergency)", category: "notarization", priceFrom: 105, priceUnit: "surcharge", description: "10 PM – 9 AM emergency appointments (3× base)" },
  { name: "Rush/Same-Day Service", category: "notarization", priceFrom: 25, priceUnit: "surcharge", description: "Priority same-day scheduling" },
  { name: "Holiday Surcharge", category: "notarization", priceFrom: 50, priceUnit: "surcharge", description: "Major holiday appointments" },
  { name: "Weekend Appointments", category: "notarization", priceFrom: 0, priceUnit: "no surcharge", description: "Free weekend availability — competitive advantage" },
  { name: "Estate Plan Bundle", category: "notarization", priceFrom: 100, priceUnit: "flat bundle", description: "Will, POA, healthcare directive, and living will notarization bundle" },
  { name: "POA Surcharge", category: "notarization", priceFrom: 25, priceUnit: "surcharge", description: "Additional compliance verification for Power of Attorney documents" },

  // Identity & Verification
  { name: "I-9 Employment Verification", category: "verification", priceFrom: 45, priceUnit: "per form", description: "Authorized representative I-9 completion", popular: true },
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
  { name: "Apostille Facilitation", category: "authentication", priceFrom: 175, priceUnit: "per document", description: "Ohio Secretary of State apostille processing (includes coordination & filing)", popular: true },
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

  // Compliance & Safety
  { name: "OSHA Safety Doc Package", category: "compliance", priceFrom: 350, priceTo: 750, priceUnit: "flat", description: "Written safety programs, hazard communication, emergency action plans" },
  { name: "ADA Website Accessibility Audit", category: "compliance", priceFrom: 250, priceTo: 1500, priceUnit: "flat", description: "WCAG 2.1/2.2 AA compliance audit with remediation recommendations" },
  { name: "Compliance Calendar Setup", category: "compliance", priceFrom: 75, priceTo: 150, priceUnit: "flat", description: "Industry-specific compliance deadline tracking with automated reminders" },
  { name: "Cannabis Document Preparation", category: "compliance", priceFrom: 500, priceTo: 2500, priceUnit: "flat", description: "Ohio DCC licensing applications, SOP manuals, compliance review" },
  { name: "Construction Document Prep", category: "compliance", priceFrom: 200, priceTo: 500, priceUnit: "flat", description: "Bid packages, safety plans, subcontractor packets" },
  { name: "Healthcare Document Prep", category: "compliance", priceFrom: 250, priceTo: 1500, priceUnit: "flat", description: "Credentialing packets, HIPAA documentation, policy manuals" },

  // Financial Services
  { name: "Bookkeeping Monthly", category: "financial", priceFrom: 200, priceTo: 1000, priceUnit: "per month", description: "Monthly bookkeeping including bank reconciliation and financial reports" },
  { name: "Payroll Processing", category: "financial", priceFrom: 50, priceTo: 150, priceUnit: "per month", description: "Full-service payroll with auto tax filing" },
  { name: "Financial Projections & Modeling", category: "financial", priceFrom: 250, priceTo: 1200, priceUnit: "flat", description: "Revenue forecasts, P&L, balance sheets, cash flow projections" },
  { name: "AR/Collections Management", category: "financial", priceFrom: 150, priceTo: 400, priceUnit: "per month", description: "Invoice management, aging reports, collection letters" },
  { name: "Business Plan Writing", category: "financial", priceFrom: 750, priceTo: 2500, priceUnit: "flat", description: "Full business plans with market analysis and pitch decks" },
  { name: "Grant Writing & Proposals", category: "financial", priceFrom: 1500, priceTo: 5000, priceUnit: "flat", description: "Grant discovery, application writing, and post-award compliance" },

  // Translation & Language
  { name: "Standard Translation", category: "translation", priceFrom: 25, priceTo: 100, priceUnit: "per page", description: "General-purpose translation in 70+ languages" },
  { name: "Certified Translation", category: "translation", priceFrom: 35, priceTo: 200, priceUnit: "per page", description: "ATA-certified translations for USCIS, courts, and government" },
  { name: "Court-Certified Translation", category: "translation", priceFrom: 50, priceTo: 350, priceUnit: "per page", description: "Court-admissible translation with attestation" },
  { name: "Interpreter Coordination", category: "translation", priceFrom: 35, priceTo: 65, priceUnit: "per session", description: "On-site, VRI, and phone interpreter booking in 20+ languages" },
  { name: "Credential Evaluation Coordination", category: "translation", priceFrom: 75, priceTo: 150, priceUnit: "flat", description: "WES/ECE foreign credential evaluation coordination" },

  // Tech & Digital
  { name: "Website Design", category: "tech_digital", priceFrom: 1500, priceTo: 5000, priceUnit: "flat", description: "Custom website design from landing pages to full sites" },
  { name: "E-Commerce Store Setup", category: "tech_digital", priceFrom: 2500, priceTo: 5000, priceUnit: "flat", description: "Shopify or WooCommerce store setup" },
  { name: "UX Audit & Consulting", category: "tech_digital", priceFrom: 500, priceTo: 3000, priceUnit: "flat", description: "Heuristic evaluation, user flow analysis, and recommendations" },
  { name: "SEO Monthly Management", category: "tech_digital", priceFrom: 300, priceTo: 750, priceUnit: "per month", description: "Local SEO, keyword tracking, and content strategy" },
  { name: "Social Media Management", category: "tech_digital", priceFrom: 350, priceTo: 800, priceUnit: "per month", description: "Content creation, scheduling, and engagement" },
  { name: "Google Business Profile Optimization", category: "tech_digital", priceFrom: 200, priceTo: 400, priceUnit: "flat", description: "GBP setup, optimization, and review management" },
  { name: "Online Reputation Management", category: "tech_digital", priceFrom: 150, priceTo: 750, priceUnit: "per month", description: "Review monitoring and reputation strategy" },
  { name: "AI Content Studio", category: "tech_digital", priceFrom: 500, priceTo: 1500, priceUnit: "per month", description: "AI-powered content production" },
  { name: "Custom Chatbot Development", category: "tech_digital", priceFrom: 500, priceTo: 2000, priceUnit: "flat", description: "AI chatbot for lead capture and support" },
  { name: "AI Workflow Automation", category: "tech_digital", priceFrom: 350, priceTo: 1000, priceUnit: "flat", description: "Automated business workflows using AI" },
  { name: "CRM Setup & Configuration", category: "tech_digital", priceFrom: 500, priceTo: 1500, priceUnit: "flat", description: "HubSpot, Pipedrive, or Zoho CRM setup" },
  { name: "Micro-SaaS Tool Development", category: "tech_digital", priceFrom: 500, priceTo: 8000, priceUnit: "flat", description: "Custom web tools, dashboards, and portals" },

  // Sales & CX
  { name: "Lead List Building", category: "sales_cx", priceFrom: 200, priceTo: 400, priceUnit: "flat", description: "Qualified B2B lead list research" },
  { name: "LinkedIn Prospecting", category: "sales_cx", priceFrom: 350, priceTo: 1500, priceUnit: "per month", description: "LinkedIn outreach campaign management" },
  { name: "Email Campaign Management", category: "sales_cx", priceFrom: 150, priceTo: 600, priceUnit: "flat", description: "Email campaign design and automation" },
  { name: "Customer Journey Mapping", category: "sales_cx", priceFrom: 750, priceTo: 1500, priceUnit: "flat", description: "End-to-end journey maps with recommendations" },
  { name: "Voice of Customer Program", category: "sales_cx", priceFrom: 1000, priceTo: 2500, priceUnit: "flat", description: "VoC program with surveys and NPS" },
  { name: "Loyalty Program Design", category: "sales_cx", priceFrom: 500, priceTo: 1500, priceUnit: "flat", description: "Customer loyalty and retention program design" },

  // Publishing
  { name: "Book Publishing - Novel", category: "publishing", priceFrom: 500, priceTo: 2000, priceUnit: "flat", description: "Novel publishing with formatting and cover design" },
  { name: "Coffee Table Book", category: "publishing", priceFrom: 1500, priceTo: 5000, priceUnit: "flat", description: "Premium hardcover photo or art book" },
  { name: "Training Manual Production", category: "publishing", priceFrom: 350, priceTo: 1500, priceUnit: "flat", description: "Training manual design and printing" },

  // Operations & HR
  { name: "Employee Onboarding Packet", category: "operations_hr", priceFrom: 150, priceTo: 350, priceUnit: "flat", description: "Complete onboarding document package" },
  { name: "Employee Handbook Creation", category: "operations_hr", priceFrom: 500, priceTo: 1200, priceUnit: "flat", description: "Comprehensive employee handbook" },
  { name: "Productized SOP Development", category: "operations_hr", priceFrom: 500, priceTo: 1500, priceUnit: "flat", description: "Standard operating procedure creation" },
  { name: "Fractional Operations Management", category: "operations_hr", priceFrom: 150, priceTo: 250, priceUnit: "per hour", description: "Part-time operations management" },

  // Digital Legacy
  { name: "Digital Estate Planning", category: "digital_legacy", priceFrom: 250, priceTo: 500, priceUnit: "flat", description: "Digital asset inventory and legacy planning" },
  { name: "Cybersecurity Assessment", category: "digital_legacy", priceFrom: 500, priceTo: 1500, priceUnit: "flat", description: "Security audit with vulnerability assessment" },

  // Creative
  { name: "Brand Identity Kit", category: "creative", priceFrom: 400, priceTo: 3500, priceUnit: "flat", description: "Logo suite, colors, typography, and brand guidelines" },
  { name: "Presentation Templates", category: "creative", priceFrom: 200, priceTo: 500, priceUnit: "flat", description: "Custom presentation templates with 10+ layouts" },
  { name: "Packaging Design", category: "creative", priceFrom: 200, priceTo: 750, priceUnit: "flat", description: "Custom packaging design for boxes and labels" },

  // Print (additional)
  { name: "Metal/Wood Business Cards", category: "print", priceFrom: 250, priceTo: 500, priceUnit: "flat", description: "Premium metal or wood cards with engraving" },
  { name: "Bumper Stickers", category: "print", priceFrom: 85, priceTo: 175, priceUnit: "flat", description: "Custom bumper stickers" },
  { name: "Holographic Labels", category: "print", priceFrom: 95, priceTo: 200, priceUnit: "flat", description: "Holographic security labels" },
  { name: "Corrugated Mailers", category: "print", priceFrom: 200, priceTo: 500, priceUnit: "flat", description: "Custom branded shipping boxes" },
  { name: "Branded Tape", category: "print", priceFrom: 75, priceTo: 125, priceUnit: "flat", description: "Custom printed packing tape" },
  { name: "Sandwich Cards", category: "print", priceFrom: 150, priceTo: 400, priceUnit: "flat", description: "Edge-painted layered business cards" },

  // Native SaaS Tools
  { name: "CPN Calculator", category: "native_tools", priceFrom: 0, priceUnit: "flat", description: "Free Cost Per Notarization calculator" },
  { name: "Amortization Engine", category: "native_tools", priceFrom: 9.99, priceTo: 29.99, priceUnit: "per month", description: "Equipment depreciation calculator" },
  { name: "Tax & Schedule C Suite", category: "native_tools", priceFrom: 14.99, priceTo: 39.99, priceUnit: "per month", description: "Self-employment tax tools" },
  { name: "Expense Logger with OCR", category: "native_tools", priceFrom: 4.99, priceTo: 14.99, priceUnit: "per month", description: "Receipt scanning and expense tracking" },
  { name: "Mileage Tracker", category: "native_tools", priceFrom: 4.99, priceTo: 9.99, priceUnit: "per month", description: "IRS-compliant mileage tracking" },
  { name: "Revenue Tracker", category: "native_tools", priceFrom: 9.99, priceTo: 19.99, priceUnit: "per month", description: "Income ledger and tax summaries" },

  // Passport
  { name: "Passport Photo Service", category: "verification", priceFrom: 15, priceTo: 25, priceUnit: "flat", description: "US State Department compliant passport photos" },

  // Legal & Document (additional from master catalog)
  { name: "Court Filing Runner", category: "legal_support", priceFrom: 35, priceTo: 85, priceUnit: "per filing", description: "Same-day court document filing and retrieval" },
  { name: "Legal Research", category: "legal_support", priceFrom: 75, priceTo: 175, priceUnit: "per project", description: "Case law research, statute analysis, and legal memoranda" },
  { name: "Contract Review", category: "legal_support", priceFrom: 95, priceTo: 175, priceUnit: "per document", description: "Contract review for completeness and compliance (no legal advice)" },
  { name: "Real Estate Doc Prep", category: "real_estate", priceFrom: 75, priceTo: 125, priceUnit: "per document", description: "Purchase agreements, deeds, and closing documents" },
  { name: "Tenant Screening", category: "real_estate_support", priceFrom: 35, priceTo: 55, priceUnit: "per screening", description: "Credit, criminal, and eviction history checks" },
  { name: "Lockbox Coordination", category: "real_estate_support", priceFrom: 35, priceTo: 50, priceUnit: "per service", description: "Key exchange and lockbox install/retrieval" },
  { name: "Open House Staffing", category: "real_estate_support", priceFrom: 50, priceTo: 70, priceUnit: "per event", description: "On-site document management at open houses" },
  { name: "Probate Filing Assist", category: "legal_support", priceFrom: 125, priceTo: 450, priceUnit: "per case", description: "Probate court filing assistance and document preparation" },

  // Tech & Digital (additional)
  { name: "Blog Post Writing", category: "tech_digital", priceFrom: 75, priceTo: 350, priceUnit: "per post", description: "SEO-optimized blog content creation" },
  { name: "IT Help Desk", category: "tech_digital", priceFrom: 75, priceTo: 200, priceUnit: "per hour", description: "Remote IT support and troubleshooting" },
  { name: "QA Testing", category: "tech_digital", priceFrom: 200, priceTo: 1500, priceUnit: "per project", description: "Manual and automated QA testing services" },
  { name: "Workflow Integration", category: "tech_digital", priceFrom: 100, priceTo: 350, priceUnit: "per integration", description: "Connect apps and automate workflows (Zapier, Make, etc.)" },
  { name: "Micro-SaaS Tool Development", category: "tech_digital", priceFrom: 500, priceTo: 8000, priceUnit: "flat", description: "Custom web tools, dashboards, and portals" },

  // Sales & CX (additional)
  { name: "Appointment Setting", category: "sales_cx", priceFrom: 25, priceTo: 75, priceUnit: "per appointment", description: "Qualified appointment setting for B2B sales" },
  { name: "NPS Setup & Management", category: "sales_cx", priceFrom: 500, priceTo: 1000, priceUnit: "flat", description: "Net Promoter Score program setup and reporting" },

  // Publishing (additional)
  { name: "Newsletter/Magazine Production", category: "publishing", priceFrom: 250, priceTo: 1000, priceUnit: "per issue", description: "Newsletter or magazine layout, design, and printing" },

  // Print (additional)
  { name: "Custom Post-Its", category: "print", priceFrom: 45, priceTo: 150, priceUnit: "per order", description: "Branded custom sticky notes" },

  // Native SaaS (additional)
  { name: "Newsletter Builder", category: "native_tools", priceFrom: 19.99, priceTo: 49.99, priceUnit: "per month", description: "Drag-and-drop newsletter creation tool" },

  // Document & Language (additional)
  { name: "Doc Formatting", category: "document_services", priceFrom: 25, priceTo: 50, priceUnit: "per document", description: "Professional document formatting and cleanup" },
  { name: "Apostille Coordination", category: "authentication", priceFrom: 45, priceTo: 75, priceUnit: "per document", description: "Ohio SOS apostille coordination and filing" },
  { name: "Credential Evaluation Coordination", category: "translation", priceFrom: 75, priceTo: 150, priceUnit: "flat", description: "WES/ECE foreign credential evaluation coordination" },
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
  compliance: { label: "Compliance & Safety", icon: "🛡️" },
  financial: { label: "Financial Services", icon: "💰" },
  translation: { label: "Translation & Language", icon: "🌐" },
  creative: { label: "Creative & Design", icon: "🎨" },
  tech_digital: { label: "Tech & Digital", icon: "💻" },
  sales_cx: { label: "Sales & CX", icon: "📈" },
  publishing: { label: "Publishing", icon: "📚" },
  operations_hr: { label: "Operations & HR", icon: "⚙️" },
  digital_legacy: { label: "Digital Legacy", icon: "🔐" },
  native_tools: { label: "Native SaaS Tools", icon: "🧰" },
};
