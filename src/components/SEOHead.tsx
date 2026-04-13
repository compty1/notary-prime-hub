/**
 * SE-001/002/005: SEO meta tags, Open Graph, canonical URLs
 * Uses document.title and meta tag injection (no helmet dependency needed)
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  canonicalPath?: string;
  jsonLd?: Record<string, any>;
}

const SITE_NAME = "NotaryDex";
const BASE_URL = "https://notary-prime-hub.lovable.app";
const DEFAULT_OG_IMAGE = "/og-default.png";

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function SEOHead({
  title,
  description = "Ohio's premier online notarization platform — remote online notarization, mobile notary, and document services.",
  ogImage,
  ogType = "website",
  noIndex = false,
  canonicalPath,
  jsonLd,
}: SEOHeadProps) {
  const { pathname } = useLocation();
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = `${BASE_URL}${canonicalPath || pathname}`;
  const image = ogImage || `${BASE_URL}${DEFAULT_OG_IMAGE}`;

  useEffect(() => {
    document.title = fullTitle;
    setMeta("description", description);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:image", image, true);
    setMeta("og:url", canonical, true);
    setMeta("og:type", ogType, true);
    setMeta("og:site_name", SITE_NAME, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);
    setLink("canonical", canonical);

    if (noIndex) {
      setMeta("robots", "noindex, nofollow");
    } else {
      const existing = document.querySelector('meta[name="robots"]');
      if (existing) existing.remove();
    }

    // JSON-LD
    const existingLd = document.querySelector('script[data-seo-jsonld]');
    if (existingLd) existingLd.remove();

    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const ld = document.querySelector('script[data-seo-jsonld]');
      if (ld) ld.remove();
    };
  }, [fullTitle, description, image, canonical, ogType, noIndex, jsonLd]);

  return null;
}
