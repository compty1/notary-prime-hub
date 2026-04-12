/**
 * Accessibility utilities for WCAG 2.1 AA compliance.
 */

/** Generate a unique ID for aria-labelledby associations */
let counter = 0;
export function generateAriaId(prefix: string = "aria"): string {
  return `${prefix}-${++counter}-${Date.now()}`;
}

/** Create screen-reader-only text */
export function srOnly(text: string): string {
  return text;
}

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Check if user prefers high contrast */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

/** Focus trap utility for modals */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
    'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
  ].join(", ");
  return Array.from(container.querySelectorAll<HTMLElement>(selectors));
}

/** Keyboard navigation helpers */
export const KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
} as const;

/** Check if a keyboard event is an activation key (Enter or Space) */
export function isActivationKey(e: React.KeyboardEvent): boolean {
  return e.key === KEYS.ENTER || e.key === KEYS.SPACE;
}

/** Announce to screen readers via live region */
export function announceToScreenReader(message: string, priority: "polite" | "assertive" = "polite") {
  const el = document.getElementById("aria-live-announcer");
  if (el) {
    el.setAttribute("aria-live", priority);
    el.textContent = "";
    requestAnimationFrame(() => { el.textContent = message; });
  }
}

/** Calculate color contrast ratio between two hex colors */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const rgb = hex.replace("#", "").match(/.{2}/g)?.map(c => {
      const v = parseInt(c, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }) ?? [0, 0, 0];
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const l1 = lum(hex1);
  const l2 = lum(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Check if contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large) */
export function meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
  return ratio >= (isLargeText ? 3 : 4.5);
}
