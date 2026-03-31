/**
 * Shared service routing constants used across Services.tsx, ServiceDetail.tsx, and ClientPortal.tsx.
 * Single source of truth to prevent drift (Plan items 111, 115, 178-191, 211-224).
 */

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
