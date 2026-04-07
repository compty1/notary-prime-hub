import { useEffect } from "react";
import { BRAND } from "@/lib/brand";

const BASE_TITLE = BRAND.fullTitle;

export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${BRAND.name}` : BASE_TITLE;

    // Set meta description
    const desc = description || (title ? `${title} — Professional Ohio notary and document verification services.` : "Trusted online notary and document verification services in Ohio. In-person and remote online notarization (RON).");
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, description]);
}