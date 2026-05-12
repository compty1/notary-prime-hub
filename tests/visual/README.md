# Visual regression snapshots

This directory holds Playwright tests + committed PNG baselines for the public
landing routes (`/`, `/about`, `/services`, `/book`, all six `/solutions/*`)
plus the booking-funnel variants, all at three breakpoints (360 / 768 / 1280).

Baselines live in:

- `tests/visual/landing-snapshots.spec.ts-snapshots/`
- `tests/visual/booking-funnel.spec.ts-snapshots/`

## How the baselines are created

The Lovable sandbox can't launch headless Chromium (no system GTK/glib libs),
so the **first** baselines are generated automatically by the
`Visual Regression` GitHub Actions workflow
(`.github/workflows/visual-regression.yml`):

1. Push the project to GitHub (Lovable → Plus (+) menu → GitHub if not yet linked).
2. The workflow detects empty snapshot directories, runs
   `playwright test --update-snapshots`, and **commits the PNGs back to the
   branch** with `[skip ci]`.
3. Subsequent pushes compare against those committed PNGs and fail on >1%
   pixel diff.

## Running the workflow manually (regenerate baselines on demand)

Use this any time hero illustrations, spacing, or landing copy intentionally
change and you need to refresh the committed baselines.

**Desktop (web):**

1. Open the repo on GitHub → **Actions** tab.
2. In the left sidebar, click **Visual Regression**.
3. Click **Run workflow** (top-right of the runs list).
4. **Use workflow from:** select the branch you want baselines generated against
   (usually `main`, or your feature branch).
5. Tick **Regenerate baseline snapshots and commit them back to the branch**
   (`update_snapshots`).
6. Click **Run workflow**.

**GitHub mobile / browser on phone:**

1. Tap **Actions → Visual Regression → Run workflow**.
2. Toggle **update_snapshots** on, choose the branch, **Run workflow**.

**GitHub CLI:**

```bash
gh workflow run "Visual Regression" --ref <branch> -f update_snapshots=true
```

When `update_snapshots` is checked the workflow will:

- regenerate every PNG under both snapshot directories,
- commit the changes to the target branch with message
  `chore(visual): bootstrap landing + booking-funnel snapshots [skip ci]`,
- skip the comparison step for that run (no false-fail on the bootstrap commit).

Subsequent pushes will then compare against the fresh baselines.

## What you see when CI fails

If a regular push/PR run finds a diff:

- The job adds a **CI summary** listing each failing route + breakpoint.
- On pull requests, a **sticky PR comment** (header `visual-regression`)
  appears with the same table and a link to the `playwright-report` artifact.
- Download the `playwright-report` artifact from the run page and open
  `test-results/**/*-diff.png` to see exactly what shifted.

## Running locally

The Lovable sandbox can't run headless Chromium, but any Linux/macOS dev
machine can. Two ways:

**One-shot script** (mirrors CI's `update_snapshots=true` path and commits):

```bash
bun run snapshots:regenerate
# or, regenerate without committing:
bun run snapshots:regenerate -- --no-commit
```

**Manual:**

```bash
bun install
bunx playwright install --with-deps chromium
bun run dev &                          # vite on :8080
bun run test:visual:update             # regenerate
# or
bun run test:visual                    # compare only (CI parity)
```

Then commit everything under both `*-snapshots/` directories.
