/**
 * SVC-001/002: Centralized Service Registry
 * Canonical source of truth for all platform services with metadata,
 * routing, required fields, and display tags.
 */

export interface ServiceRegistryEntry {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  path: string;
  /** Fields required during booking intake */
  requiredFields: string[];
  /** Display tags for badges */
  tags: ServiceTag[];
  /** Whether service requires notary commission */
  requiresNotary: boolean;
  /** Whether available via RON */
  ronAvailable: boolean;
  /** Whether ID verification is required */
  idRequired: boolean;
  /** Estimated duration in minutes */
  estimatedDuration?: number;
  /** Ohio ORC reference if applicable */
  orcReference?: string;
}

export type ServiceTag =
  | "remote"
  | "in-person"
  | "same-day"
  | "id-required"
  | "notary-required"
  | "ohio-only"
  | "nationwide"
  | "rush-available"
  | "subscription"
  | "free-tier";

export const SERVICE_REGISTRY: ServiceRegistryEntry[] = [
  // Core Notarization
  {
    id: "ron-session",
    name: "Remote Online Notarization",
    slug: "remote-online-notarization",
    category: "notarization",
    description: "Legally binding notarization via secure audio-video session per ORC §147.66",
    path: "/book",
    requiredFields: ["fullName", "email", "phone", "documentType", "signerCount", "scheduledDate", "scheduledTime"],
    tags: ["remote", "id-required", "notary-required", "ohio-only"],
    requiresNotary: true,
    ronAvailable: true,
    idRequired: true,
    estimatedDuration: 30,
    orcReference: "ORC §147.66",
  },
  {
    id: "in-person-notarization",
    name: "In-Person Notarization",
    slug: "in-person-notarization",
    category: "notarization",
    description: "Traditional in-person notarization at our office or your location",
    path: "/book",
    requiredFields: ["fullName", "email", "phone", "documentType", "signerCount", "scheduledDate", "scheduledTime"],
    tags: ["in-person", "id-required", "notary-required", "same-day"],
    requiresNotary: true,
    ronAvailable: false,
    idRequired: true,
    estimatedDuration: 30,
    orcReference: "ORC §147.53",
  },
  {
    id: "mobile-notarization",
    name: "Mobile Notarization",
    slug: "mobile-notarization",
    category: "notarization",
    description: "Notary travels to your location for convenient signing",
    path: "/book",
    requiredFields: ["fullName", "email", "phone", "documentType", "signerCount", "scheduledDate", "scheduledTime", "clientAddress"],
    tags: ["in-person", "id-required", "notary-required"],
    requiresNotary: true,
    ronAvailable: false,
    idRequired: true,
    estimatedDuration: 45,
  },
  {
    id: "loan-signing",
    name: "Loan Signing",
    slug: "loan-signing",
    category: "notarization",
    description: "Professional loan signing agent services for closings",
    path: "/loan-signing",
    requiredFields: ["fullName", "email", "phone", "lenderName", "loanType", "pageCount", "scheduledDate", "scheduledTime"],
    tags: ["in-person", "id-required", "notary-required"],
    requiresNotary: true,
    ronAvailable: false,
    idRequired: true,
    estimatedDuration: 60,
  },
  // Verification
  {
    id: "i9-verification",
    name: "I-9 Employment Verification",
    slug: "i9-verification",
    category: "verification",
    description: "Authorized agent review of I-9 employment eligibility documents",
    path: "/book",
    requiredFields: ["fullName", "email", "phone", "employerName", "scheduledDate", "scheduledTime"],
    tags: ["in-person", "id-required", "same-day"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: true,
    estimatedDuration: 20,
  },
  {
    id: "identity-certificate",
    name: "Identity Certificate",
    slug: "identity-certificate",
    category: "verification",
    description: "Certified identity verification document",
    path: "/book",
    requiredFields: ["fullName", "email", "phone", "scheduledDate", "scheduledTime"],
    tags: ["in-person", "id-required", "notary-required"],
    requiresNotary: true,
    ronAvailable: false,
    idRequired: true,
    estimatedDuration: 20,
  },
  // Document Services
  {
    id: "document-prep",
    name: "Document Preparation",
    slug: "document-preparation",
    category: "document_services",
    description: "Professional document drafting and formatting",
    path: "/request",
    requiredFields: ["fullName", "email", "documentType", "description"],
    tags: ["remote", "rush-available"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: false,
    estimatedDuration: 60,
  },
  {
    id: "document-digitization",
    name: "Document Digitization",
    slug: "document-digitization",
    category: "document_services",
    description: "Convert physical documents to searchable digital format",
    path: "/digitize",
    requiredFields: ["fullName", "email"],
    tags: ["remote", "rush-available"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: false,
    estimatedDuration: 30,
  },
  // Authentication & International
  {
    id: "apostille",
    name: "Apostille Facilitation",
    slug: "apostille-facilitation",
    category: "authentication",
    description: "Document authentication for international use via Ohio Secretary of State",
    path: "/request",
    requiredFields: ["fullName", "email", "phone", "documentDescription", "destinationCountry"],
    tags: ["nationwide", "rush-available"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: false,
    estimatedDuration: 120,
  },
  // Court Forms
  {
    id: "divorce-filing",
    name: "Divorce Filing Package",
    slug: "divorce-filing-package",
    category: "court_forms",
    description: "Ohio divorce court form typing and preparation",
    path: "/request",
    requiredFields: ["fullName", "email", "phone", "county", "caseType"],
    tags: ["ohio-only", "rush-available"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: false,
    estimatedDuration: 45,
  },
  {
    id: "custody-package",
    name: "Custody/Visitation Package",
    slug: "custody-visitation-package",
    category: "court_forms",
    description: "Ohio custody and visitation court form package",
    path: "/request",
    requiredFields: ["fullName", "email", "phone", "county"],
    tags: ["ohio-only"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: false,
    estimatedDuration: 45,
  },
  // Business Services
  {
    id: "business-formation",
    name: "Business Formation",
    slug: "business-formation",
    category: "business",
    description: "LLC, Corporation, and DBA formation services",
    path: "/request",
    requiredFields: ["fullName", "email", "phone", "businessName", "entityType"],
    tags: ["remote", "rush-available"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: false,
    estimatedDuration: 60,
  },
  // Subscription / SaaS
  {
    id: "document-vault",
    name: "Secure Document Vault",
    slug: "document-vault",
    category: "recurring",
    description: "Encrypted cloud storage for sensitive documents",
    path: "/portal",
    requiredFields: [],
    tags: ["remote", "subscription", "free-tier"],
    requiresNotary: false,
    ronAvailable: false,
    idRequired: false,
    estimatedDuration: 0,
  },
  // Estate Planning
  {
    id: "estate-plan-bundle",
    name: "Estate Plan Bundle",
    slug: "estate-plan-bundle",
    category: "notarization",
    description: "Will, POA, healthcare directive preparation and notarization",
    path: "/book",
    requiredFields: ["fullName", "email", "phone", "scheduledDate", "scheduledTime"],
    tags: ["remote", "in-person", "id-required", "notary-required"],
    requiresNotary: true,
    ronAvailable: true,
    idRequired: true,
    estimatedDuration: 60,
    orcReference: "ORC §1337.12",
  },
];

/** Lookup a service by ID */
export function getServiceById(id: string): ServiceRegistryEntry | undefined {
  return SERVICE_REGISTRY.find(s => s.id === id);
}

/** Lookup a service by slug */
export function getServiceBySlug(slug: string): ServiceRegistryEntry | undefined {
  return SERVICE_REGISTRY.find(s => s.slug === slug);
}

/** Get all services in a category */
export function getServicesByCategory(category: string): ServiceRegistryEntry[] {
  return SERVICE_REGISTRY.filter(s => s.category === category);
}

/** Get all services with a specific tag */
export function getServicesByTag(tag: ServiceTag): ServiceRegistryEntry[] {
  return SERVICE_REGISTRY.filter(s => s.tags.includes(tag));
}

/** Get unique categories from registry */
export function getRegistryCategories(): string[] {
  return [...new Set(SERVICE_REGISTRY.map(s => s.category))];
}
