/**
 * SEO helpers — canonical URLs, JSON-LD structured data
 */

/** Set canonical URL for the current page */
export function setCanonical(path: string) {
  const url = `https://notary-prime-hub.lovable.app${path}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

/** Inject JSON-LD structured data */
export function setJsonLd(data: Record<string, any>) {
  const id = "json-ld-structured";
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/** Organization JSON-LD for the homepage */
export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Notar — Ohio Notary & Document Services",
  url: "https://notary-prime-hub.lovable.app",
  telephone: "+16143006890",
  email: "contact@notardex.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Columbus",
    addressRegion: "OH",
    postalCode: "43215",
    addressCountry: "US",
  },
  description: "Professional notary and document services in Columbus, Ohio. Remote Online Notarization (RON), mobile notary, loan signings, and more.",
  priceRange: "$$",
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "19:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "16:00" },
  ],
  sameAs: [],
};

/** Service JSON-LD */
export function serviceJsonLd(name: string, description: string, price?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: { "@type": "LocalBusiness", name: "NotarDex" },
    areaServed: { "@type": "State", name: "Ohio" },
    ...(price ? { offers: { "@type": "Offer", price, priceCurrency: "USD" } } : {}),
  };
}

/** FAQ JSON-LD */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}
