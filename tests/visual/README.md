# Visual regression snapshots

This directory holds Playwright tests + committed PNG baselines for the public
landing routes (`/`, `/about`, all six `/solutions/*`) at three breakpoints
(360 / 768 / 1280). Baselines live in
`tests/visual/landing-snapshots.spec.ts-snapshots/`.

## How the baselines are created

The Lovable sandbox can't launch headless Chromium (it lacks system GTK/glib
libs), so the **first** baselines are generated automatically by the
`Visual Regression` GitHub Actions workflow (`.github/workflows/visual-regression.yml`):

1. Push the project to GitHub (Lovable → "Connect GitHub" if not already linked).
2. The workflow detects the empty
   `tests/visual/landing-snapshots.spec.ts-snapshots/` directory, runs
   `playwright test --update-snapshots`, and **commits the PNGs back to the
   branch** with `[skip ci]`.
3. Subsequent pushes compare against those committed PNGs and fail on >1%
   pixel diff.

Manual regeneration: trigger the workflow via "Run workflow" → check
**update_snapshots**.

## Running locally

If you have a Linux/macOS dev machine (anywhere with system Chromium libs):

```bash
bun install
bunx playwright install --with-deps chromium
bun run dev &                          # vite on :8080
bunx playwright test --update-snapshots
```

Then commit everything under `tests/visual/landing-snapshots.spec.ts-snapshots/`.
