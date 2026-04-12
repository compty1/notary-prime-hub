/**
 * J-041: Sitemap data generator for dynamic URLs.
 * Used by edge function to generate XML sitemap.
 */
import { SERVICE_REGISTRY } from "@/lib/serviceRegistry";
import { BRAND_CONFIG } from "@/lib/brandConfig";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

/** Static routes with their priorities */
const STATIC_ROUTES: SitemapEntry[] = [
  { loc: "/", changefreq: "weekly", priority: 1.0 },
  { loc: "/services", changefreq: "weekly", priority: 0.9 },
  { loc: "/book", changefreq: "daily", priority: 0.9 },
  { loc: "/fee-calculator", changefreq: "monthly", priority: 0.8 },
  { loc: "/ron-info", changefreq: "monthly", priority: 0.8 },
  { loc: "/ron-check", changefreq: "monthly", priority: 0.7 },
  { loc: "/loan-signing", changefreq: "monthly", priority: 0.8 },
  { loc: "/notaries", changefreq: "daily", priority: 0.8 },
  { loc: "/directory", changefreq: "daily", priority: 0.8 },
  { loc: "/about", changefreq: "monthly", priority: 0.6 },
  { loc: "/help", changefreq: "monthly", priority: 0.5 },
  { loc: "/contact", changefreq: "monthly", priority: 0.6 },
  { loc: "/templates", changefreq: "weekly", priority: 0.7 },
  { loc: "/notary-guide", changefreq: "monthly", priority: 0.7 },
  { loc: "/notary-certificates", changefreq: "monthly", priority: 0.6 },
  { loc: "/terms", changefreq: "yearly", priority: 0.3 },
  { loc: "/signer-rights", changefreq: "yearly", priority: 0.4 },
  { loc: "/verify-seal", changefreq: "monthly", priority: 0.5 },
  { loc: "/ai-tools", changefreq: "weekly", priority: 0.6 },
  { loc: "/docudex", changefreq: "weekly", priority: 0.5 },
  // Solutions
  { loc: "/solutions/notaries", changefreq: "monthly", priority: 0.7 },
  { loc: "/solutions/hospitals", changefreq: "monthly", priority: 0.7 },
  { loc: "/solutions/real-estate", changefreq: "monthly", priority: 0.7 },
  { loc: "/solutions/law-firms", changefreq: "monthly", priority: 0.7 },
  { loc: "/solutions/small-business", changefreq: "monthly", priority: 0.7 },
  { loc: "/solutions/individuals", changefreq: "monthly", priority: 0.7 },
];

/** Generate sitemap entries from service registry */
export function getServiceRegistryEntries(): SitemapEntry[] {
  return SERVICE_REGISTRY.map(s => ({
    loc: `/services/${s.slug}`,
    changefreq: "monthly" as const,
    priority: 0.6,
  }));
}

/** Get all static sitemap entries */
export function getStaticSitemapEntries(): SitemapEntry[] {
  return [...STATIC_ROUTES, ...getServiceRegistryEntries()];
}

/** Generate full sitemap URL */
export function fullUrl(path: string): string {
  return `${BRAND_CONFIG.seo.siteUrl}${path}`;
}

/** Generate XML sitemap string */
export function generateSitemapXml(entries: SitemapEntry[]): string {
  const today = new Date().toISOString().split("T")[0];
  const urlEntries = entries
    .map(e => `  <url>
    <loc>${fullUrl(e.loc)}</loc>
    <lastmod>${e.lastmod || today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/** Generate robots.txt content */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /portal/
Disallow: /api/
Disallow: /login
Disallow: /register

Sitemap: ${BRAND_CONFIG.seo.siteUrl}/sitemap.xml
`;
}
