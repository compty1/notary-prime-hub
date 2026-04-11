import {
  Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home,
  Headphones, PenTool, BarChart3, MessageSquare, Wrench, Eye,
} from "lucide-react";

/**
 * Shared service routing constants used across Services.tsx, ServiceDetail.tsx, and ClientPortal.tsx.
 * Single source of truth to prevent drift (Plan items 111, 115, 178-191, 211-224).
 */

/** Shared icon map for service catalog and detail pages (Gap #17) */
export const SERVICE_ICON_MAP: Record<string, any> = {
  Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home,
  Copy: FileText, ScanFace: Shield, ClipboardCheck: FileText, Search: FileText,
  FileEdit: FileText, FileType: FileText, Scan: FileText, Paintbrush: FileText,
  FormInput: FileText, Building: Briefcase, Flag: Globe, Languages: Globe,
  Layers: FileText, CreditCard: Briefcase, Code: FileText, Award: Shield,
  Building2: Briefcase, Inbox: FileText, Bell: FileText, Layout: FileText,
  GraduationCap: Briefcase, ClipboardList: FileText, Workflow: FileText, Plane: Globe,
  Headphones, PenTool, BarChart3, MessageSquare, Wrench, Eye, Mail: MessageSquare,
};

/** Categories where a commissioned notary performs the action */
export const NOTARY_CATEGORIES = new Set(["notarization", "authentication"]);

export const INTAKE_ONLY_SERVICES = new Set([
  "Apostille Facilitation", "Consular Legalization Prep", "Background Check Coordination",
  "Clerical Document Preparation", "Document Cleanup & Formatting", "Form Filling Assistance",
  "Certified Document Prep for Agencies", "Registered Agent Coordination",
  "Email Management & Correspondence", "Notarized Translation Coordination",
  "Data Entry", "Travel Arrangements", "Blog Post Writing", "Social Media Content",
  "Newsletter Design", "Market Research Report", "Lead Generation",
  "Email Support Handling", "Live Chat Support", "Website Content Updates",
  "UX Audit & Heuristic Review", "User Flow & Workflow Testing",
  "Usability Testing & Report", "UX Research & Persona Development",
  // Court form packages
  "Divorce Filing Package", "Custody/Visitation Package", "Eviction Filing Package",
  "Name Change Package", "Guardianship Package", "Small Claims Filing",
  "Expungement Package", "Adoption Filing Package", "Probate Filing Package",
  "Civil Protection Order",
  // Legal support
  "Process Serving", "Skip Tracing", "Court Form Preparation", "Vital Records Request",
  // Real estate support
  "Property Photography", "Lockbox Coordination", "Open House Support", "Tenant Document Services",
]);

export const SAAS_LINKS: Record<string, string> = {
  "Document Storage Vault": "/portal",
  "Cloud Document Storage": "/portal",
  "PDF Services": "/digitize",
  "Document Digitization": "/digitize",
  "Document Scanning & Digitization": "/digitize",
  "Document Translation": "/digitize",
  "Template Library & Form Builder": "/templates",
  "Virtual Mailroom": "/mailroom",
  "ID Verification / KYC Checks": "/verify-id",
};

export const SUBSCRIPTION_SERVICES = new Set([
  "Business Subscription Plans", "API & Integration Services", "White-Label Partner Programs",
  "Starter Plan", "Professional Plan", "Enterprise Plan", "Document Storage Vault", "Virtual Mailroom",
]);

export const PORTAL_SERVICES = new Set([
  "Secure Document Vault & Storage", "Cloud Document Storage",
  "Document Retention & Compliance", "Automated Reminders & Renewals",
]);

/** Pricing suffix map (Plan items 192-197) */
export const PRICING_SUFFIXES: Record<string, string> = {
  per_seal: "/seal",
  per_document: "/doc",
  per_page: "/page",
  hourly: "/hr",
  per_session: "/session",
  monthly: "/mo",
  flat: "",
  custom: "",
};

/** Maps service keywords to their notarial act type (Phase 15K) */
export const NOTARIAL_ACT_MAP: Record<string, string> = {
  acknowledgment: "acknowledgment",
  deed: "acknowledgment",
  "power of attorney": "acknowledgment",
  mortgage: "acknowledgment",
  trust: "acknowledgment",
  affidavit: "jurat",
  jurat: "jurat",
  "sworn statement": "jurat",
  deposition: "jurat",
  oath: "oath",
  affirmation: "affirmation",
  "copy certification": "copy_certification",
  "certified copy": "copy_certification",
  "i-9": "signature_witnessing",
  "employment verification": "signature_witnessing",
};

export const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  notarization: { label: "Core Notarization", description: "RON, in-person, witness, and certified copy services" },
  verification: { label: "Identity & Verification", description: "ID checks, I-9 verification, employment onboarding" },
  document_services: { label: "Document Services", description: "Preparation, PDF processing, scanning, and formatting" },
  authentication: { label: "Authentication & International", description: "Apostille, consular legalization, and translation services" },
  business: { label: "Business & Volume", description: "Bulk packages, subscriptions, API access, and partner programs" },
  recurring: { label: "Recurring & Value-Add", description: "Storage, virtual mailroom, reminders, and compliance packages" },
  consulting: { label: "Consulting & Training", description: "RON onboarding, workflow audits, and custom automation" },
  business_services: { label: "Business Services", description: "Email management, correspondence handling, and administrative support" },
  admin_support: { label: "Administrative Support", description: "Data entry, travel planning, and general admin tasks" },
  content_creation: { label: "Content Creation", description: "Blog posts, social media, newsletters, and copywriting" },
  research: { label: "Research", description: "Market analysis, lead generation, and competitive intelligence" },
  customer_service: { label: "Customer Service", description: "Email support, live chat, and customer communication" },
  technical_support: { label: "Technical Support", description: "Website updates, content management, and tech tasks" },
  ux_testing: { label: "User Experience", description: "UX audits, usability testing, workflow analysis, and research" },
};

export const CATEGORY_ORDER = [
  "notarization", "verification", "document_services", "authentication",
  "business", "recurring", "consulting", "business_services",
  "admin_support", "content_creation", "research", "customer_service",
  "technical_support", "ux_testing",
];
