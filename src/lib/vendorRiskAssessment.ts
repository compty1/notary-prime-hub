/**
 * Vendor/third-party risk assessment tracking.
 * Enhancement #85 (Vendor risk assessment)
 */

export interface VendorRisk {
  vendor: string;
  category: "payment" | "communication" | "storage" | "identity" | "signing";
  dataAccess: string[];
  riskLevel: "low" | "medium" | "high";
  lastReviewed: string;
  complianceNotes: string;
  contractExpiry?: string;
}

/** Platform vendor registry with risk assessment */
export const VENDOR_REGISTRY: VendorRisk[] = [
  {
    vendor: "Stripe",
    category: "payment",
    dataAccess: ["payment card info", "billing address", "email"],
    riskLevel: "low",
    lastReviewed: "2026-01-15",
    complianceNotes: "PCI DSS Level 1. No raw card data stored on platform.",
  },
  {
    vendor: "SignNow",
    category: "signing",
    dataAccess: ["documents", "signer identity", "IP address", "email"],
    riskLevel: "medium",
    lastReviewed: "2026-01-15",
    complianceNotes: "SOC 2 Type II. Documents transmitted via TLS. KBA data processed per MISMO standards.",
  },
  {
    vendor: "IONOS (Email)",
    category: "communication",
    dataAccess: ["email addresses", "message content"],
    riskLevel: "low",
    lastReviewed: "2026-01-15",
    complianceNotes: "GDPR compliant. TLS encryption in transit.",
  },
  {
    vendor: "Lovable Cloud",
    category: "storage",
    dataAccess: ["all application data", "user credentials", "documents"],
    riskLevel: "low",
    lastReviewed: "2026-03-01",
    complianceNotes: "SOC 2 infrastructure. RLS enforced. Data encrypted at rest.",
  },
  {
    vendor: "HubSpot",
    category: "communication",
    dataAccess: ["contact info", "lead data", "interaction history"],
    riskLevel: "low",
    lastReviewed: "2026-02-01",
    complianceNotes: "SOC 2 Type II. GDPR compliant. Data processing agreement in place.",
  },
];

/** Get vendors by risk level */
export function getHighRiskVendors(): VendorRisk[] {
  return VENDOR_REGISTRY.filter((v) => v.riskLevel === "high" || v.riskLevel === "medium");
}

/** Check for vendors needing review (>90 days since last review) */
export function getVendorsNeedingReview(): VendorRisk[] {
  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  return VENDOR_REGISTRY.filter((v) => v.lastReviewed < cutoff);
}
