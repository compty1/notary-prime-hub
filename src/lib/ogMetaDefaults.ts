/**
 * J-021+: Default OG/meta configurations per route pattern.
 * Used by usePageMeta to auto-apply correct metadata when pages
 * don't explicitly set their own.
 */

export interface RouteMeta {
  title: string;
  description: string;
  ogImage?: string;
  noIndex?: boolean;
}

export const ROUTE_META_DEFAULTS: Record<string, RouteMeta> = {
  "/": {
    title: "Ohio Notary Public — In-Person & Remote Online Notarization",
    description: "Trusted Ohio notary public offering remote online notarization (RON), mobile notarization, loan signing, apostille facilitation, and document services. Book online 24/7.",
  },
  "/services": {
    title: "Notary & Document Services",
    description: "Browse our full catalog of notary, document preparation, apostille, and business services. Ohio-based with remote options available nationwide.",
  },
  "/book": {
    title: "Book an Appointment",
    description: "Schedule your notarization, document signing, or service appointment online. Same-day and next-day availability.",
  },
  "/ron-info": {
    title: "Remote Online Notarization (RON)",
    description: "Learn about Ohio remote online notarization. Get documents notarized from anywhere via secure audio-video session per ORC §147.66.",
  },
  "/fee-calculator": {
    title: "Pricing & Fee Calculator",
    description: "Calculate notary and service fees instantly. Transparent pricing for all notarization, document, and business services.",
  },
  "/about": {
    title: "About Us",
    description: "Learn about our Ohio-commissioned notary services, our mission, and our commitment to secure document processing.",
  },
  "/loan-signing": {
    title: "Loan Signing Services",
    description: "Professional loan signing agent services for real estate closings. Experienced, reliable, and background-checked.",
  },
  "/notaries": {
    title: "Find a Notary",
    description: "Browse our directory of Ohio-commissioned notary professionals. Find a notary near you or schedule a remote session.",
  },
  "/verify-seal": {
    title: "Verify E-Seal",
    description: "Verify the authenticity of a notarized document using our secure e-seal verification portal.",
  },
  "/contact": {
    title: "Contact Us",
    description: "Get in touch with our notary team. Available by phone, email, or online chat.",
  },
  // Admin/portal pages — noIndex
  "/admin": { title: "Admin Dashboard", description: "", noIndex: true },
  "/portal": { title: "Client Portal", description: "", noIndex: true },
  "/login": { title: "Sign In", description: "Sign in to your account.", noIndex: true },
  "/signup": { title: "Create Account", description: "Create your account to book services and manage documents.", noIndex: true },
};

/**
 * Get route-specific meta, falling back to defaults.
 */
export function getRouteMeta(pathname: string): RouteMeta | undefined {
  // Exact match
  if (ROUTE_META_DEFAULTS[pathname]) return ROUTE_META_DEFAULTS[pathname];
  
  // Prefix match for admin/portal
  if (pathname.startsWith("/admin")) return ROUTE_META_DEFAULTS["/admin"];
  if (pathname.startsWith("/portal")) return ROUTE_META_DEFAULTS["/portal"];
  
  return undefined;
}
