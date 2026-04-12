/**
 * SEO helpers — canonical URLs, JSON-LD structured data
 */

const SITE_DOMAIN = "https://notar.com";

/** Set canonical URL for the current page */
export function setCanonical(path: string) {
  const url = `${SITE_DOMAIN}${path}`;
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
  url: SITE_DOMAIN,
  telephone: "+16143006890",
  email: "contact@notar.com",
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
    provider: { "@type": "LocalBusiness", name: "Notar" },
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

/** #3638: Breadcrumb JSON-LD */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_DOMAIN}${item.url}`,
    })),
  };
}

/** #3639: Review aggregate schema */
export function reviewAggregateJsonLd(ratingValue: number, reviewCount: number, bestRating = 5) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Notar — Ohio Notary & Document Services",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating,
      worstRating: 1,
    },
  };
}

/** #3947: Open Graph meta helper */
export function setOpenGraphMeta(opts: { title: string; description: string; image?: string; url?: string; type?: string }) {
  const tags: Record<string, string> = {
    "og:title": opts.title,
    "og:description": opts.description,
    "og:type": opts.type || "website",
    "og:url": opts.url ? `${SITE_DOMAIN}${opts.url}` : SITE_DOMAIN,
    "og:site_name": "Notar",
  };
  if (opts.image) tags["og:image"] = opts.image;

  // Twitter card
  tags["twitter:card"] = opts.image ? "summary_large_image" : "summary";
  tags["twitter:title"] = opts.title;
  tags["twitter:description"] = opts.description;
  if (opts.image) tags["twitter:image"] = opts.image;

  Object.entries(tags).forEach(([property, content]) => {
    let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"], meta[name="${property}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(property.startsWith("twitter:") ? "name" : "property", property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  });
}