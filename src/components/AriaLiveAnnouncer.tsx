/**
 * SVC-173: ARIA live regions for dynamic content updates
 * Announces status changes to screen readers.
 */
import { useEffect, useRef } from "react";

interface AriaLiveProps {
  message: string;
  politeness?: "polite" | "assertive";
}

export function AriaLiveAnnouncer({ message, politeness = "polite" }: AriaLiveProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && message) {
      ref.current.textContent = "";
      // Force reannounce by clearing then setting
      requestAnimationFrame(() => {
        if (ref.current) ref.current.textContent = message;
      });
    }
  }, [message]);

  return (
    <div
      ref={ref}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

/** Hook to announce messages to screen readers */
export function useAriaAnnounce() {
  const announce = (message: string, politeness: "polite" | "assertive" = "polite") => {
    const el = document.getElementById("aria-live-root");
    if (el) {
      el.setAttribute("aria-live", politeness);
      el.textContent = "";
      requestAnimationFrame(() => { el.textContent = message; });
    }
  };
  return announce;
}
