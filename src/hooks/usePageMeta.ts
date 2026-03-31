import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_TITLE = "Notar — Ohio Notary Public | In-Person & RON";
const DOMAIN = "https://notardex.com";

/**
 * Sets page title, meta description, and canonical URL per route.
 * Replaces usePageTitle for pages that need full SEO control.
 */
export function usePageMeta(opts: { title?: string; description?: string; noIndex?: boolean } = {}) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Title
    document.title = opts.title ? `${opts.title} — Notar` : BASE_TITLE;

    // Meta description
    const desc =
      opts.description ||
      (opts.title
        ? `${opts.title} — Professional Ohio notary and document verification services.`
        : "Trusted online notary and document verification services in Ohio. In-person and remote online notarization (RON).");
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = desc;

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${DOMAIN}${pathname === "/" ? "" : pathname}`;

    // noindex for admin/portal pages
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

    return () => {
      document.title = BASE_TITLE;
    };
  }, [opts.title, opts.description, opts.noIndex, pathname]);
}
