/**
 * Skip-to-content accessibility link.
 * Placed at top of layout for keyboard navigation.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:p-3 focus:rounded-lg focus:shadow-lg focus:border focus:border-border focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}
