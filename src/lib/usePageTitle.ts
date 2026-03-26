import { useEffect } from "react";

const BASE_TITLE = "Notar — Ohio Notary Public | In-Person & RON";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Notar` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [title]);
}
