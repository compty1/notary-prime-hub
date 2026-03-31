/**
 * Scrolls to the first invalid form field after a failed submit.
 * Usage: call scrollToError() in your submit handler after validation fails.
 */
export function scrollToError(containerRef?: React.RefObject<HTMLElement>) {
  const root = containerRef?.current || document;
  const el = root.querySelector<HTMLElement>(
    "[aria-invalid='true'], .border-destructive, input:invalid, select:invalid, textarea:invalid"
  );
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }
}
