import { useEffect } from "react";

const BASE_TITLE = "Notar — Ohio Notary Public | In-Person & RON";

export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Notar` : BASE_TITLE;

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
