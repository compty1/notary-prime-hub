/**
 * Accessibility utilities — skip to content, focus management, reduced motion, high contrast
 */

/** Add skip-to-main-content link if not present */
export function ensureSkipLink() {
  if (document.getElementById("skip-to-main")) return;
  const link = document.createElement("a");
  link.id = "skip-to-main";
  link.href = "#main-content";
  link.textContent = "Skip to main content";
  link.className =
    "sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium";
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const main = document.getElementById("main-content") || document.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus();
      main.removeAttribute("tabindex");
    }
  });
  document.body.prepend(link);
}

/** Check if user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Focus the first focusable element in a container */
export function focusFirst(container: HTMLElement) {
  const focusable = container.querySelector<HTMLElement>(
    'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  focusable?.focus();
}

/** High contrast mode toggle */
export function setHighContrast(enabled: boolean) {
  document.documentElement.classList.toggle("high-contrast", enabled);
  try { localStorage.setItem("high-contrast", String(enabled)); } catch {}
}

export function getHighContrast(): boolean {
  try { return localStorage.getItem("high-contrast") === "true"; } catch { return false; }
}

export function initHighContrast() {
  if (getHighContrast()) document.documentElement.classList.add("high-contrast");
}
