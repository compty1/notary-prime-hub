## Audit: what already exists vs. what's missing

A grep of the codebase confirms most of what you described is already built and routed in `src/App.tsx`:

| Requested | Status | Location |
|---|---|---|
| RON Legality Advisor (Will RON work?) | EXISTS | `/ron-check` → `RonEligibilityChecker.tsx`, plus `RonAdvisorWidget.tsx` compact component |
| RON Info page | EXISTS | `/ron-info` → `RonInfo.tsx` (395 lines, 50-state matrix, comparison, FAQ) |
| Loan Signing service & page | EXISTS | `/loan-signing` → `LoanSigningServices.tsx` |
| White-Label Partner program | EXISTS | `/services/white-label-partner` → `WhiteLabelPartner.tsx` |
| Solutions menu (Hospitals, Law Firms, Real Estate, Small Business, Individuals — excluding Notaries) | EXISTS in nav | `Navbar.tsx` lines 24–29 + 6 pages under `src/pages/solutions/` |
| Zoom consultation CTA (Schedule Zoom + Browse Guides + AI upload) | EXISTS but only on `ServiceDetail.tsx` (one place) | `ServiceDetail.tsx` lines 738–757 |
| Document Cleanup, Apostille Coordination, Translation pages | EXIST | `src/pages/services/` |

So the work is **gap-fill**, not new construction.

## What to actually build

### 1. Extract Zoom CTA into a reusable component
Create `src/components/ZoomConsultCTA.tsx` from the inline block currently in `ServiceDetail.tsx` (lines 738–757). Same copy, same icons, same buttons (`Schedule Zoom` → `/book?service=Consultation`, `Browse Guides` → `/notary-guide`, AI upload link → `/digitize`). Accept optional `compact` and `className` props.

Then drop it onto pages that don't have it yet:
- `src/pages/Index.tsx` — above the footer section
- `src/pages/RonInfo.tsx` — near the bottom CTA
- `src/pages/LoanSigningServices.tsx` — near the bottom CTA
- All 6 `src/pages/solutions/*.tsx` pages — above the final "Get in touch" CTA
- `src/pages/RonEligibilityChecker.tsx` — under the advisor result

Replace the inline block in `ServiceDetail.tsx` with the new component (no behavior change there).

### 2. Surface the RON Legality Advisor more visibly
- `Index.tsx`: add a section that mounts `<RonAdvisorWidget />` next to the existing "Learn about RON" link to `/ron-info`, so visitors can quick-check eligibility from the home page.
- `RonInfo.tsx`: mount `<RonAdvisorWidget />` near the top hero so people can analyze before scrolling 50-state tables.
- `LoanSigningServices.tsx`: mount `<RonAdvisorWidget />` in the sidebar (RON is core to remote closings).

### 3. Branding cleanup (Notar → Shane Goble independent practice)
The recent rebrand left a few leftovers:
- `LoanSigningServices.tsx` line 180: `mailto:contact@notar.com` → use `BRAND.defaultEmail` from `src/lib/brand.ts` (same value but centralized).
- `RonInfo.tsx` line 148: rewrite "Notar uses SignNow…" to "We use SignNow…" so copy reads as a solo practice, not a company.
- Quick `rg "\\bNotar\\b" src/pages/solutions src/pages/LoanSigningServices.tsx src/pages/RonInfo.tsx` pass to convert any remaining brand references in body copy to "Shane Goble" / "this practice" / "we" as appropriate. Header/footer logo stays (Logo component is already brand-driven).

### 4. Verify "Often Paired With" / cross-sell on Document Cleanup, Apostille Coordination, Translation
These are already wired through `ServiceIntakeForm` (packages, FAQ, checklist, timeline). Spot-check that each page renders the Zoom CTA via the new shared component.

## What is intentionally NOT in this plan
- No new pages — the pages you listed already exist.
- No nav changes — Solutions dropdown already lists exactly the 5 you asked for (Notaries entry exists too; you can ask me to remove it separately if you want).
- No real Zoom API integration — the CTA links to the existing `/book?service=Consultation` flow, which is how it currently works on `ServiceDetail.tsx`. If you want true Zoom OAuth (auto-create meeting links), that's a separate, larger task and needs a Zoom Marketplace app + secrets.

## Files touched (estimate)
- New: `src/components/ZoomConsultCTA.tsx`
- Edited: `src/pages/ServiceDetail.tsx`, `src/pages/Index.tsx`, `src/pages/RonInfo.tsx`, `src/pages/LoanSigningServices.tsx`, `src/pages/RonEligibilityChecker.tsx`, and the 6 `src/pages/solutions/*.tsx` files.

Total: ~11 files, no DB migrations, no new routes, no new dependencies.
