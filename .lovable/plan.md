# Implementation plan — final polish pass

Five focused passes. Each is independently shippable.

## Pass 1 — Solution-page CTA standardization

Audit every CTA across `src/pages/solutions/*` and any other public marketing page (`/services`, `/about`, `/resources`, `/help`, `/glossary`, `/track-*`).

- All `<Button size="lg">` (primary + outline) gain: `rounded-full px-8 border-2 border-foreground shadow-block hover:-translate-y-0.5 hover:shadow-block-lg font-black tracking-tight uppercase transition-all`.
- Primary CTAs: `bg-primary text-primary-foreground` (yellow on navy text).
- Outline CTAs: `bg-card text-foreground` with same border/shadow stack.
- Extract into a shared `<HeroCTA variant="primary|outline">` wrapper in `src/components/ui/hero-cta.tsx` so future pages can't drift.

## Pass 2 — Hero illustrations (paper-card / Block Shadow)

Generate four new hero illustrations matching the existing `hero-document-card.png` motif (Block Shadow paper-card, navy background friendly, yellow accents):

```
src/assets/hero-services.png       — stack of stamped documents
src/assets/hero-about.png          — courthouse + paper card
src/assets/hero-resources.png      — open book + bookmark tabs
src/assets/hero-solutions-individuals.png
src/assets/hero-solutions-real-estate.png
src/assets/hero-solutions-hospitals.png
src/assets/hero-solutions-law-firms.png
src/assets/hero-solutions-small-business.png
```

(`hero-solutions-notaries.png` already exists — reuse.)

For each, also generate `.webp` + `.avif` desktop variants via `sharp` so they flow through the existing `<Picture>` component. Mobile variants skipped — solution heroes use the same composition at every breakpoint.

Wire each into its page hero, replacing the current lucide-only blocks or stock asset.

## Pass 3 — Build-time asset integrity check

New script `scripts/check-asset-imports.ts`:

- Walks `src/**/*.{ts,tsx}` with a regex matching `from "@/assets/..."` and `from ".*/assets/..."`.
- For each import, resolves the path and confirms the file exists on disk.
- Exits non-zero with a grouped report of missing files.

Wire into `package.json` as `"check:assets": "tsx scripts/check-asset-imports.ts"` and call it from a new `"prebuild"` hook so the production build fails fast on a missing asset.

## Pass 4 — Visual regression snapshots

Extend `tests/visual/landing-snapshots.spec.ts` (Playwright) with snapshots for:

- `/` desktop 1360×900 + mobile 390×844 (already covered — confirm and refresh).
- `/solutions/individuals`, `/solutions/real-estate`, `/solutions/law-firms`, `/solutions/small-business`, `/solutions/hospitals`, `/solutions/notaries` — desktop + mobile.
- `/services`, `/about`, `/resources` — desktop hero only.

Use Playwright's `toHaveScreenshot({ maxDiffPixelRatio: 0.02 })` to flag palette/layout drift without flaking on font sub-pixel rendering. Run via `bunx playwright test tests/visual` and regenerate baselines with `scripts/regenerate-snapshots.sh`.

## Pass 5 — Build + Lighthouse verification

1. `bun run build` — must pass; capture bundle size for the homepage chunk.
2. Lighthouse headless against the preview URL (mobile + desktop). Extract: Performance, LCP, CLS, Total Byte Weight, "next-gen image formats", "properly size images". Targets: ≥ 90 desktop, ≥ 80 mobile, LCP < 2.5s mobile.
3. Post the before/after numbers and the bundle delta in chat.

## Technical details

- Image generation: `imagegen` standard tier, `transparent_background: true` against a clean background, then convert to `.webp` (q=82) + `.avif` (q=60) with `sharp` in a one-off script.
- All hero `<Picture>` calls keep `loading="eager"` + `fetchPriority="high"` for above-the-fold; below-the-fold stays `lazy`.
- CTA refactor is presentation-only — no router or business-logic changes.
- Asset check script runs in ~50ms; safe to add to `prebuild`.
- Playwright visual snapshots are stored under `tests/visual/*-snapshots/` and gitignored where the `.gitkeep` files already sit.

## Out of scope

- Backend / RLS / pricing logic changes.
- Non-public dashboard routes (already token-clean per the palette audit).
- Mobile-specific solution-hero variants (composition is already centered + scales).

## Deliverables

- `src/components/ui/hero-cta.tsx` (new)
- Updated `src/pages/solutions/*.tsx`, `src/pages/Resources.tsx`, etc.
- 8 new hero PNG + AVIF + WebP under `src/assets/`
- `scripts/check-asset-imports.ts` + `prebuild` hook
- Expanded `tests/visual/landing-snapshots.spec.ts`
- Build + Lighthouse summary posted to chat
