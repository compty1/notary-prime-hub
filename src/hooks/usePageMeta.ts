import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { injectJsonLd } from "@/lib/seoSchemas";

const BASE_TITLE = "Notar — Ohio Notary Public | In-Person & RON";
const DOMAIN = "https://notardex.com";
const DEFAULT_OG_IMAGE = `${DOMAIN}/og-default.jpg`;

/**
 * Sets page title, meta description, canonical URL, OG tags, Twitter cards, and JSON-LD per route.
 * Items 451-475: comprehensive SEO control.
 */
export function usePageMeta(
  opts: {
    title?: string;
    description?: string;
    noIndex?: boolean;
    ogImage?: string;
    schema?: Record<string, unknown> | null;
  } = {}
) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Title
    const pageTitle = opts.title ? `${opts.title} — Notar` : BASE_TITLE;
    document.title = pageTitle;

    // Meta description
    const desc =
      opts.description ||
      (opts.title
        ? `${opts.title} — Professional Ohio notary and document verification services.`
        : "Trusted online notary and document verification services in Ohio. In-person and remote online notarization (RON).");
    setMeta("description", desc);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${DOMAIN}${pathname === "/" ? "" : pathname}`;

    // Open Graph tags (items 453, 460)
    setMeta("og:title", pageTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:url", `${DOMAIN}${pathname === "/" ? "" : pathname}`, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:image", opts.ogImage || DEFAULT_OG_IMAGE, "property");
    setMeta("og:locale", "en_US", "property");
    setMeta("og:site_name", "Notar", "property");

    // Twitter card tags (item 454)
    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", pageTitle, "name");
    setMeta("twitter:description", desc, "name");
    setMeta("twitter:image", opts.ogImage || DEFAULT_OG_IMAGE, "name");

    // hreflang (item 451)
    let hreflang = document.querySelector('link[hreflang="en-US"]') as HTMLLinkElement | null;
    if (!hreflang) {
      hreflang = document.createElement("link");
      hreflang.rel = "alternate";
      hreflang.hreflang = "en-US";
      document.head.appendChild(hreflang);
    }
    hreflang.href = `${DOMAIN}${pathname === "/" ? "" : pathname}`;

    // noindex for admin/portal pages (item 455)
    let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (opts.noIndex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, nofollow";
    } else if (robots) {
      robots.remove();
    }

    // JSON-LD schema (item 456)
    const cleanupSchema = opts.schema ? injectJsonLd(opts.schema) : () => {};

    // A11y/SEO: ensure every page has at least one <h1>. If the page already
    // renders one, do nothing. Otherwise inject a visually-hidden fallback so
    // landmark structure and SEO ranking are preserved without disturbing the
    // visual design.
    let injectedH1: HTMLHeadingElement | null = null;
    const ensureH1 = () => {
      if (document.querySelector("h1")) return;
      const h1 = document.createElement("h1");
      h1.textContent = opts.title || BASE_TITLE;
      h1.setAttribute("data-auto-h1", "true");
      // sr-only equivalent (no Tailwind dependency at runtime)
      h1.style.cssText =
        "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
      document.body.prepend(h1);
      injectedH1 = h1;
    };
    // defer a tick so the page tree mounts first
    const t = window.setTimeout(ensureH1, 0);

    return () => {
      document.title = BASE_TITLE;
      cleanupSchema();
      window.clearTimeout(t);
      if (injectedH1 && injectedH1.parentNode) injectedH1.parentNode.removeChild(injectedH1);
    };
  }, [opts.title, opts.description, opts.noIndex, opts.ogImage, opts.schema, pathname]);
}

/** Helper to set or create a meta tag */
function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}
