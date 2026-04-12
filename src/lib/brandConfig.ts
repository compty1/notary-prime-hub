/**
 * BR-001: Centralized brand configuration for all visual identity references.
 * All logo URLs, palette tokens, fonts, and taglines in one place.
 */
import { BRAND } from "@/lib/brand";

export const BRAND_CONFIG = {
  ...BRAND,

  // Logo references — replace hardcoded paths everywhere
  logos: {
    primary: "/logo.svg",
    icon: "/favicon.svg",
    darkMode: "/logo-dark.svg",
    altText: `${BRAND.name} — ${BRAND.taglineShort}`,
  },

  // CSS custom property palette keys (HSL values defined in index.css)
  palette: {
    primaryGold: "var(--primary)",
    accentBlue: "var(--accent)",
    backgroundCream: "var(--background)",
    foreground: "var(--foreground)",
    muted: "var(--muted)",
    card: "var(--card)",
    border: "var(--border)",
  },

  // Typography
  fonts: {
    heading: "var(--font-heading, 'Inter', sans-serif)",
    body: "var(--font-body, 'Inter', sans-serif)",
    mono: "var(--font-mono, 'JetBrains Mono', monospace)",
  },

  // Social / SEO
  social: {
    ogImage: "/og-image.png",
    twitterHandle: "@notarcom",
    facebookPage: "",
    linkedIn: "",
  },

  // Default SEO
  seo: {
    defaultTitle: BRAND.fullTitle,
    titleTemplate: `%s | ${BRAND.name}`,
    defaultDescription:
      "Ohio notary public offering remote online notarization (RON), mobile notarization, loan signing, apostille, and document services. Available 24/7.",
    siteUrl: "https://notar.com",
  },

  // Contact defaults
  contact: {
    phone: BRAND.defaultPhone,
    email: BRAND.defaultEmail,
    address: "West Jefferson, OH 43162",
    businessHours: "Mon–Fri 8 AM – 8 PM EST, Sat 9 AM – 5 PM EST",
  },

  // Ohio compliance references
  compliance: {
    commissionState: "Ohio",
    orcRON: "ORC §147.66",
    orcJournal: "ORC §147.04",
    orcFeeCap: "ORC §147.08",
    maxFeePerAct: 5.0,
    maxRONFeePerAct: 30.0,
    retentionYears: 10,
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
