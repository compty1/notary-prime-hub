// Centralized brand configuration for NotarDex
export const BRAND = {
  name: "NotarDex",
  initials: "N",
  tagline: "Safe, Secure, Legal — Remote Online Notarization",
  taglineShort: "Notary & Document Services",
  fullTitle: "NotarDex — Ohio Notary Public | In-Person & RON",
  domain: "NotarDex.com",
  company: "NotarDex",
  legalName: "NotarDex Notary Services",
  footerText: (year: number) => `© ${year} NotarDex.com. All rights reserved.`,
  calendarProdId: "-//NotarDex//NotarDex.com//EN",
  calendarDescription: (type: string) =>
    type === "ron"
      ? "Remote Online Notarization (RON) session with NotarDex"
      : "In-person notarization appointment with NotarDex",
  defaultPhone: "(614) 300-6890",
  defaultEmail: "contact@notardex.com",
  teamLead: {
    name: "Shane Goble",
    title: "Lead Notary & Founder",
    credentials: "NNA Certified Notary Signing Agent",
  },
} as const;