/**
 * Accessibility audit utilities (Items 560-578)
 * Runtime a11y checks, focus trap management, and ARIA helpers.
 */

/** Trap focus within a container element (for modals/dialogs) */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableSelectors = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = container.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  container.addEventListener("keydown", handleKeyDown);
  
  // Focus the first focusable element
  const firstFocusable = container.querySelector<HTMLElement>(focusableSelectors);
  firstFocusable?.focus();

  return () => container.removeEventListener("keydown", handleKeyDown);
}

/** Announce message to screen readers via live region */
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

/** Check if element has sufficient color contrast (WCAG AA) */
export function hasVisibleFocusIndicator(el: HTMLElement): boolean {
  const styles = window.getComputedStyle(el, ":focus-visible");
  const outline = styles.outlineStyle;
  const boxShadow = styles.boxShadow;
  return (outline !== "none" && outline !== "") || (boxShadow !== "none" && boxShadow !== "");
}

/** Generate unique ID for ARIA relationships */
let ariaIdCounter = 0;
export function generateAriaId(prefix = "aria"): string {
  return `${prefix}-${++ariaIdCounter}`;
}

/** Validate required ARIA attributes on form elements */
export function validateFormAccessibility(form: HTMLFormElement): string[] {
  const issues: string[] = [];
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const el = input as HTMLElement;
    const label = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
    const htmlLabel = form.querySelector(`label[for="${el.id}"]`);
    if (!label && !htmlLabel && !el.closest("label")) {
      issues.push(`Input ${el.id || el.getAttribute("name") || "unnamed"} lacks accessible label`);
    }
  });
  return issues;
}
