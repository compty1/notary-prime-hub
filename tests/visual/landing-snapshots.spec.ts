/**
 * Visual regression snapshots for key landing routes.
 *
 * First run (locally or in CI):
 *   bunx playwright install chromium
 *   bunx playwright test --update-snapshots
 *
 * Subsequent runs compare against the committed PNGs in
 * tests/visual/landing-snapshots.spec.ts-snapshots/. CI fails on diff.
 *
 * Routes covered: homepage, /about, all six /solutions/*.
 * Breakpoints: 360 (mobile), 768 (tablet), 1280 (desktop).
 */
import { test, expect } from "@playwright/test";

const ROUTES = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "solutions-real-estate", path: "/solutions/for-real-estate" },
  { name: "solutions-law-firms", path: "/solutions/for-law-firms" },
  { name: "solutions-hospitals", path: "/solutions/for-hospitals" },
  { name: "solutions-individuals", path: "/solutions/for-individuals" },
  { name: "solutions-small-business", path: "/solutions/for-small-business" },
  { name: "solutions-notaries", path: "/solutions/for-notaries" },
];

const BREAKPOINTS = [
  { name: "mobile", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const route of ROUTES) {
  for (const bp of BREAKPOINTS) {
    test(`${route.name} @ ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(route.path, { waitUntil: "networkidle" });

      // Disable animations to keep snapshots deterministic.
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

      // Wait for fonts + hero illustrations to settle so spacing is final.
      await page.evaluate(() => (document as any).fonts?.ready);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot(`${route.name}-${bp.name}.png`, {
        fullPage: true,
        // Allow tiny anti-alias jitter; flag real spacing/style shifts.
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
}
