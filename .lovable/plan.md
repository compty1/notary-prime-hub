

# Notary Resources — Bug Fixes, Gaps & Enhancements Plan

## Bugs Found

1. **Missing `DialogDescription` (a11y warning)**: Both `Resources.tsx` lightbox and `AnatomyDiagram.tsx` lightbox use `Dialog` without a `DialogDescription`, causing the console warning "Missing Description or aria-describedby for DialogContent."

2. **Missing images in `public/images/documents/`**: Two images (`certificate-correction.jpg`, `oath-affirmation-certificate.jpg`) exist in `src/assets/documents/` but are NOT copied to `public/images/documents/`. If any page references them via public paths, they'll 404.

3. **Dual image storage**: Document images are duplicated across `src/assets/documents/` (bundled via Vite `import.meta.url`) and `public/images/documents/` (static paths). `NotaryGuide.tsx` uses `/images/documents/...` public paths while `AnatomyDiagram.tsx` uses `@/assets/...` bundled imports. This inconsistency means updates must be made in two places.

## Gaps Found

4. **Resources page missing resource cards**: No cards for RON Eligibility Checker (`/ron-eligibility`), Notary Directory (`/notary-directory`), or Verify Seal (`/verify-seal`) — all are existing routes that belong in the resources hub.

5. **Document gallery lightbox lacks ORC badges**: The `DocumentExamplesSection` lightbox shows callouts without ORC references or external links, even though the `DOCUMENT_ANATOMY` data includes them.

6. **No "SAMPLE" watermark disclaimer on gallery thumbnails**: The page text says "All examples are marked SAMPLE" but the images themselves may not carry this marking — no visual overlay exists in the UI.

7. **ProcessGuide missing print stylesheet**: Component has a Print button but no `@media print` CSS to hide nav/footer.

## Enhancement Plan

### Step 1: Fix DialogDescription warnings
- Add `<DialogDescription>` to the lightbox in `Resources.tsx` `DocumentExamplesSection`
- Add `<DialogDescription>` to both dialogs in `AnatomyDiagram.tsx`

### Step 2: Consolidate image paths
- Copy the 2 missing images (`certificate-correction.jpg`, `oath-affirmation-certificate.jpg`) to `public/images/documents/`
- Migrate `AnatomyDiagram.tsx` to use `/images/documents/...` public paths instead of `import.meta.url` bundling — eliminates the dual-source problem

### Step 3: Add missing resource cards
- Add cards for: RON Eligibility Checker, Notary Directory, Verify a Seal
- Each with appropriate icon, description, and category badge

### Step 4: Enhance lightbox with ORC badges & links
- Update `DocumentExamplesSection` lightbox to render `c.orc` as a Badge and `c.link` as an external link (matching the `AnatomyDiagram` callout legend pattern)

### Step 5: Add SAMPLE overlay on gallery thumbnails
- Add a diagonal "SAMPLE" text overlay on each document thumbnail in the gallery grid using CSS `absolute` positioning

### Step 6: Print-friendly styles
- Add `@media print` rules to `index.css` that hide navbar, footer, and non-essential UI when printing resources/process guides

---

**Files to modify:**
- `src/pages/Resources.tsx` — DialogDescription, new cards, lightbox ORC badges, SAMPLE overlay
- `src/components/AnatomyDiagram.tsx` — DialogDescription, switch to public image paths
- `public/images/documents/` — copy 2 missing images
- `src/index.css` — print media query
- `src/pages/NotaryGuide.tsx` — no changes needed (already uses public paths)

