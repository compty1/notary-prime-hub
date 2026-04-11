// Centralized brand configuration for Notar
export const BRAND = {
  name: "Notar",
  initials: "N",
  tagline: "Safe, Secure, Legal — Remote Online Notarization",
  taglineShort: "Notary & Document Services",
  fullTitle: "Notar — Ohio Notary Public | In-Person & RON",
  domain: "Notar.com",
  company: "Notar",
  legalName: "Notar Notary Services",
  footerText: (year: number) => `© ${year} Notar. All rights reserved.`,
  calendarProdId: "-//Notar//Notar.com//EN",
  calendarDescription: (type: string) =>
    type === "ron"
      ? "Remote Online Notarization (RON) session with Notar"
      : "In-person notarization appointment with Notar",
  defaultPhone: "(614) 300-6890",
  defaultEmail: "contact@notardex.com",
  teamLead: {
    name: "Shane Goble",
    title: "Lead Notary & Founder",
    credentials: "NNA Certified Notary Signing Agent",
  },
} as const;
