/**
 * SE-003: JSON-LD structured data builders for key pages
 */

const BUSINESS_INFO = {
  name: "NotaryDex",
  url: "https://notary-prime-hub.lovable.app",
  phone: "+16143006890",
  email: "shane@notardex.com",
  address: {
    "@type": "PostalAddress",
    addressRegion: "OH",
    addressCountry: "US",
  },
};

export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BUSINESS_INFO.name,
    url: BUSINESS_INFO.url,
    telephone: BUSINESS_INFO.phone,
    email: BUSINESS_INFO.email,
    address: BUSINESS_INFO.address,
    description: "Ohio's premier online notarization platform — remote online notarization, mobile notary, and professional document services.",
    priceRange: "$$",
    areaServed: {
      "@type": "State",
      name: "Ohio",
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "20:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "09:00", closes: "17:00" },
    ],
  };
}

export function buildPersonJsonLd(notary: {
  name: string;
  slug: string;
  photo?: string;
  description?: string;
  commissionNumber?: string;
  serviceAreas?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: notary.name,
    url: `${BUSINESS_INFO.url}/n/${notary.slug}`,
    image: notary.photo,
    description: notary.description || `Commissioned Notary Public in Ohio`,
    jobTitle: "Notary Public",
    worksFor: { "@type": "Organization", name: BUSINESS_INFO.name },
    hasCredential: notary.commissionNumber
      ? { "@type": "EducationalOccupationalCredential", credentialCategory: "Notary Commission", name: `Ohio Notary #${notary.commissionNumber}` }
      : undefined,
    areaServed: notary.serviceAreas?.map((area) => ({ "@type": "AdministrativeArea", name: area })),
  };
}

export function buildServiceJsonLd(service: {
  name: string;
  description: string;
  price?: number;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: `${BUSINESS_INFO.url}/services#${service.slug}`,
    provider: { "@type": "LocalBusiness", name: BUSINESS_INFO.name },
    areaServed: { "@type": "State", name: "Ohio" },
    ...(service.price && {
      offers: {
        "@type": "Offer",
        price: service.price,
        priceCurrency: "USD",
      },
    }),
  };
}

export function buildFAQJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
