/**
 * Batch 12 & 15: Accessibility and UX utilities
 * Keyboard navigation, focus management, and ARIA helpers.
 */

/** Announce a message to screen readers via an aria-live region */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", priority);
  el.setAttribute("aria-atomic", "true");
  el.className = "sr-only";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/** Trap focus within a container (useful for modals/dialogs) */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(", ");
  return Array.from(container.querySelectorAll<HTMLElement>(selectors));
}

/** Skip-to-main-content link ID */
export const MAIN_CONTENT_ID = "main-content";

/** Generate aria-describedby text for form validation errors */
export function getErrorId(fieldName: string): string {
  return `${fieldName}-error`;
}

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Format a phone number for screen readers */
export function phoneForScreenReader(phone: string): string {
  return phone.replace(/\D/g, "").split("").join(" ");
}
