## Goal

Close out the remaining "Block Shadow" homepage work and prove the responsive-image optimization actually moves the needle. Four focused passes, then verification.

## Pass 1 — Shared `Picture` component

Create `src/components/ui/picture.tsx`:

- Props: `{ sources: { avif?: string; webp?: string; mobileAvif?: string; mobileWebp?: string }, src, alt, width, height, sizes?, loading?, fetchPriority?, className? }`.
- Renders a single `<picture>` with `<source type="image/avif">` + `<source type="image/webp">` (mobile variants gated by `media="(max-width: 640px)"` when provided), then a fallback `<img>`.
- Defaults: `decoding="async"`, `loading="lazy"`, `fetchPriority="auto"`. Hero usage passes `loading="eager"` + `fetchPriority="high"`.
- Always require `width`/`height` to prevent CLS.

Refactor `src/pages/Index.tsx` to use `<Picture>` for:
- Hero document card (desktop + mobile sources, eager + high priority).
- `step-upload`, `step-verify`, `step-sign` (lazy, sizes `(max-width: 768px) 80vw, 280px`).
- `feature-phone-mockup` (lazy, sizes `(max-width: 1024px) 90vw, 448px`).

Delete now-unused inline `<picture>` blocks and the per-image `webp`/`avif` import aliases that the component replaces.

## Pass 2 — Audit & fix homepage images / imports

- `rg "src/assets" src/pages/Index.tsx` and `rg "import .* from .*assets" src/pages/Index.tsx`; for each import, confirm the file exists in `src/assets/`. Remove dead imports, fix any mismatched paths.
- Walk through the rendered homepage in the preview, capture screenshots at 1360px and 390px, look for: broken `<img>` (no src / 404), empty avatar circles in testimonials, missing icon backgrounds, oversized SVG fallbacks.
- For any avatar / placeholder still using a raw color div, replace with a Block-Shadow framed initials chip (`rounded-[7px] border-2 border-foreground bg-primary/20 shadow-block` + initials).

## Pass 3 — Block Shadow consistency on remaining sections

Bring the following homepage sections in line with the service-card style (2px `border-foreground`, `rounded-[7px]`, `shadow-block-lg`, `hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_hsl(var(--foreground))]`, `font-black tracking-tighter` headings, uppercase eyebrow chip):

- "How It Works" step cards + numbered step pills.
- "Trusted by Ohioans" testimonial cards (also update `src/components/TestimonialsSection.tsx` so the shared component matches: replace `shadow-lg` + soft border with `border-2 border-foreground shadow-block-lg`, swap `text-accent-warm` stars to `fill-primary text-primary`, wrap the avatar in a Block Shadow chip).
- "Legal expertise meets modern convenience" feature grid: pill badges become `border-2 border-foreground rounded-[7px] shadow-block bg-card` chips; section eyebrow standardized.
- Final navy CTA: primary button `bg-primary text-primary-foreground border-2 border-foreground shadow-block-lg`; secondary `bg-card text-foreground border-2 border-foreground shadow-block`.
- Headlines across all sections: `font-black tracking-tighter` with consistent size ramp (`text-4xl md:text-5xl lg:text-6xl` for section H2, `text-xl md:text-2xl` for card titles).

No logic changes — presentation only.

## Pass 4 — Verification

1. `bun run build` — must succeed; note bundle size delta for the homepage chunk.
2. Lighthouse (mobile + desktop) against the preview URL using Chrome headless:
   ```bash
   npx -y lighthouse <preview-url> --preset=desktop --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-desktop.json
   npx -y lighthouse <preview-url> --form-factor=mobile --quiet --chrome-flags="--headless" --output=json --output-path=/tmp/lh-mobile.json
   ```
   Extract and report: Performance score, LCP, CLS, Total Byte Weight, "Serve images in next-gen formats" + "Properly size images" audits. Target: ≥ 90 desktop, ≥ 80 mobile; LCP < 2.5s mobile.
3. Visual QA: browser tool at 1360×915 and 390×844 — screenshot every homepage section, confirm no broken images, no horizontal scroll, Block Shadow style consistent.
4. `rg "<img " src/pages/Index.tsx` — should return zero hits after Pass 1 (all routed through `<Picture>`).

## Out of scope

- Non-homepage routes (already covered in earlier passes).
- Backend / RLS / business logic.
- New illustrations — reuse current Block Shadow assets.

## Deliverables

- `src/components/ui/picture.tsx` (new)
- `src/pages/Index.tsx` (refactor)
- `src/components/TestimonialsSection.tsx` (style alignment)
- Build + Lighthouse summary posted in chat with before/after numbers where available.
