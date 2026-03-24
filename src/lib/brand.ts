// Centralized brand configuration for Notar
export const BRAND = {
  name: "Notar",
  initials: "N",
  tagline: "Notary & Document Services — Ohio",
  taglineShort: "Notary & Document Services",
  fullTitle: "Notar — Ohio Notary Public | In-Person & RON",
  domain: "NotarDex.com",
  company: "Notar",
  legalName: "Notar Notary Services",
  footerText: (year: number) => `© ${year} Notar — Ohio Notary & Document Services`,
  calendarProdId: "-//Notar//NotarDex.com//EN",
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
