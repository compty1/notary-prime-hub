/**
 * Reusable JSON-LD schema generators for SEO.
 * Items 451-475: structured data for LocalBusiness, FAQ, Breadcrumb, Service, Review, WebSite.
 */

const DOMAIN = "https://notardex.com";
const BUSINESS_NAME = "NotarDex — Ohio Notary Public";
const PHONE = "(614) 300-6890";
const EMAIL = "contact@notardex.com";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Notary",
    name: BUSINESS_NAME,
    url: DOMAIN,
    telephone: PHONE,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Columbus",
      addressRegion: "OH",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "39.9612",
      longitude: "-82.9988",
    },
    areaServed: {
      "@type": "State",
      name: "Ohio",
    },
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BUSINESS_NAME,
    url: DOMAIN,
    potentialAction: {
      "@type": "SearchAction",
      target: `${DOMAIN}/services?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${DOMAIN}${item.url}`,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs.length) return null;
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

export function serviceSchema(service: {
  name: string;
  description: string;
  url: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: service.url.startsWith("http") ? service.url : `${DOMAIN}${service.url}`,
    provider: {
      "@type": "Notary",
      name: BUSINESS_NAME,
    },
    areaServed: { "@type": "State", name: "Ohio" },
    ...(service.price ? { offers: { "@type": "Offer", price: service.price, priceCurrency: "USD" } } : {}),
  };
}

export function reviewSchema(reviews: { author: string; rating: number; body: string; date?: string }[]) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return {
    "@context": "https://schema.org",
    "@type": "Notary",
    name: BUSINESS_NAME,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      reviewBody: r.body,
      ...(r.date ? { datePublished: r.date } : {}),
    })),
  };
}

/** Inject a JSON-LD script tag into <head> and return cleanup function */
export function howToSchema(steps: { name: string; text: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Get a Document Notarized Online with NotarDex",
    description: "Complete guide to remote online notarization in Ohio via NotarDex.",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/** Inject a JSON-LD script tag into <head> and return cleanup function */
export function injectJsonLd(schema: Record<string, unknown> | null): () => void {
  if (!schema) return () => {};
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  script.dataset.seo = "jsonld";
  document.head.appendChild(script);
  return () => script.remove();
}
  if (!schema) return () => {};
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  script.dataset.seo = "jsonld";
  document.head.appendChild(script);
  return () => script.remove();
}
