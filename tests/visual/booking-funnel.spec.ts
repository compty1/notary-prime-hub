/**
 * Visual regression for the public booking funnel.
 *
 * Covered states (deep-link, no auth required):
 *   - /book                      → step 1 (Type / Service start)
 *   - /book?type=in_person       → form state with notarization type preset
 *   - /book?type=remote          → RON form state
 *
 * Note: /confirmation is auth-gated (ProtectedRoute requireVerifiedEmail) and
 * therefore excluded — confirmation visuals are covered by component-level
 * tests, not full-page snapshots.
 *
 * Breakpoints: 360 (mobile), 768 (tablet), 1280 (desktop).
 */
import { test, expect } from "@playwright/test";

const STATES = [
  { name: "book-start", path: "/book" },
  { name: "book-in-person", path: "/book?type=in_person" },
  { name: "book-remote", path: "/book?type=remote" },
];

const BREAKPOINTS = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const state of STATES) {
  for (const bp of BREAKPOINTS) {
    test(`${state.name} @ ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(state.path, { waitUntil: "networkidle" });

      // Deterministic: kill animations + transitions
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `,
      });

      await page.evaluate(() => (document as any).fonts?.ready);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot(`${state.name}-${bp.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
}
