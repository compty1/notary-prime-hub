

# Plan: Comprehensive Gap Resolution — Full Audit Fix

## Overview

The uploaded document contains ~800+ gap items across 48 pages. After deduplication, there are approximately **120 unique issues** spanning 10 categories. Many items are already implemented (skip-link, dark mode, back-to-top, cookie consent, UPL disclaimer, click-to-call, sitemap, robots.txt, OG tags, CSP headers, breadcrumbs, etc.). This plan addresses only the **genuinely missing or incomplete** items.

---

## Phase 1: SEO & Structured Data Fixes
**Files:** `public/sitemap.xml`, `index.html`, `src/pages/*.tsx`

1. **Fix sitemap.xml** — URLs still reference `shanegoblenotary.com` instead of `notardex.com`. Add missing routes (`/about`, `/solutions/*`, `/resources`, `/loan-signing`, `/fee-calculator`, `/join`)
2. **Add FAQ structured data** — Add `FAQPage` JSON-LD to Index.tsx (already has FAQ content)
3. **Add BreadcrumbList schema** — Emit JSON-LD breadcrumb markup dynamically from the existing `Breadcrumbs.tsx` component
4. **Add `SameAs` social links** to the existing `Notary` JSON-LD in `index.html`
5. **Add `PriceRange` and `geo` coordinates** to LocalBusiness schema
6. **Per-page meta descriptions** — Ensure every page calls `usePageTitle` with a unique description via a new `usePageMeta` hook that sets `<meta name="description">` dynamically
7. **Canonical tags** — Add `<link rel="canonical">` per route via the same `usePageMeta` hook

---

## Phase 2: Content Gaps — Legal, Compliance & Education
**Files:** `src/pages/TermsPrivacy.tsx`, `src/components/Footer.tsx`, new content components

1. **Cancellation & rescheduling policy** — Add policy section to TermsPrivacy page and surface a summary in the booking review step
2. **Witness provision policy** — Add witness guidelines section to `/notary-guide` explaining credible witness protocol, client responsibility, and paid witness add-on pricing
3. **After-hours/emergency fee disclosure** — Add clear pricing tiers to `/fee-calculator` and booking flow (already computed in `geoUtils.ts` but not displayed prominently)
4. **Prohibited documents disclaimer** — Add a "What We Cannot Notarize" section to the notary guide and services pages
5. **Signer preparation checklist** — Create a reusable `SignerChecklist` component shown on booking confirmation and `/notary-guide`
6. **ID requirements content** — Add an "Acceptable Identification" section with images to `/notary-guide` (driver's license, passport, state ID)
7. **E&O Insurance & bonding disclosure** — Add to the About page and footer area
8. **Conflict of interest disclosure** — Add ORC-compliant disclosure to TermsPrivacy
9. **Notarial act education** — Add "Acknowledgment vs. Jurat vs. Oath" explainer to `/notary-guide`
10. **Minor signer protocol** — Add guidance on signatures by mark and minor signer requirements
11. **Apostille facilitation content** — Expand the existing admin apostille page with a public-facing `/services/apostille` info section

---

## Phase 3: Form UX & Validation
**Files:** `src/pages/Index.tsx`, `src/pages/BookAppointment.tsx`, booking components

1. **Inline form validation** — Add real-time validation (email regex, phone format, required fields) to the lead capture form on Index.tsx and booking intake fields
2. **Form submission feedback** — Add success/error toast + redirect to confirmation page on lead form submission (partially done, verify consistency)
3. **Visual cues for required fields** — Add asterisk indicators and `aria-required` attributes to all form fields
4. **Loading/disabled states on submit buttons** — Audit all forms; add `disabled` + spinner during submission (already done in many places, verify coverage)
5. **Honeypot spam fields** — Already mentioned in context but verify implementation on all public forms
6. **Legal consent checkbox** — Add "I agree to Terms & Privacy Policy" checkbox on lead form and booking form
7. **Browser autocomplete attributes** — Add `autoComplete` props to name, email, phone, address fields
8. **ARIA live regions for validation** — Add `aria-live="polite"` to form error message containers

---

## Phase 4: Accessibility (WCAG 2.1 AA)
**Files:** `src/components/Navbar.tsx`, various components, `src/index.css`

1. **Focus indicators** — Add visible `:focus-visible` outline styles globally in `index.css` (replace any `outline-none` on interactive elements)
2. **ARIA labels on nav toggle** — Add `aria-label="Open menu"` and `aria-expanded` to mobile hamburger button
3. **ARIA labels on interactive elements** — Audit Logo link, social links, icon-only buttons
4. **Color contrast audit** — Fix footer link contrast (currently `sidebar-foreground/60`), ensure 4.5:1 ratio minimum
5. **Image alt text** — Audit all `<img>` tags across the site; add descriptive alt text (Logo already has alt, check others)
6. **Reduced motion support** — Add `@media (prefers-reduced-motion: reduce)` to disable Framer Motion animations
7. **Focus trap in mobile nav** — Trap focus within mobile sheet/drawer when open
8. **Form label associations** — Ensure every `<Input>` has an explicit `<Label htmlFor>` match

---

## Phase 5: Performance & Assets
**Files:** `index.html`, `vite.config.ts`, various components

1. **Image lazy loading** — Add `loading="lazy"` to all below-fold images
2. **Font-display: swap** — Already using Google Fonts with `&display=swap` (verify)
3. **Explicit image dimensions** — Add `width`/`height` to `<img>` tags to prevent CLS
4. **LCP preload** — Add `<link rel="preload">` for hero image/logo in `index.html`
5. **Vite chunk splitting** — Already using lazy loading; verify vendor chunk separation in `vite.config.ts`

---

## Phase 6: Security Hardening
**Files:** `index.html`, `public/.well-known/security.txt`, edge functions

1. **CSP refinement** — Already has CSP meta tag; verify it covers Stripe, fonts, and Supabase (already done)
2. **HSTS** — Cannot set HTTP headers from a static site (handled by hosting/CDN), but document this limitation
3. **External links** — Add `rel="noopener noreferrer" target="_blank"` to all external `<a>` tags site-wide
4. **File upload MIME validation** — Add client-side MIME type checks on document upload components (MobileUpload, BusinessPortal)
5. **Security.txt** — Already exists at `public/.well-known/security.txt` (verify content)

---

## Phase 7: Business Logic & Workflow
**Files:** Booking flow, service pages, pricing engine

1. **Service differentiation (GNW vs LSA)** — Add clear distinction between General Notary Work and Loan Signing Agent services on the services page
2. **Volume/bulk pricing** — Add volume tier logic to `pricingEngine.ts` and expose on `/fee-calculator`
3. **I-9 verification service** — Add I-9 as a service listing in `serviceConstants.ts` and on services page
4. **Appointment duration estimates** — Show estimated duration per service type in booking review
5. **Post-booking calendar integration** — Generate `.ics` calendar file download on the confirmation page
6. **Payment method display** — Already in footer; add to booking review step as well
7. **Travel fee transparency** — Already computed; add explicit fee breakdown in booking review (verify display)

---

## Phase 8: Trust & Branding
**Files:** `src/pages/About.tsx`, `src/components/Footer.tsx`, `index.html`

1. **Personal trust signals** — Add notary bio, photo, commission details to About page
2. **Commission verification link** — Add link to Ohio SOS notary lookup on About page
3. **Professional badges** — Add NNA member, background-checked, bonded/insured badges to homepage and About
4. **Social proof integration** — Add Google Business review widget or static testimonials with verified badge
5. **Consistent brand naming** — Audit all pages for "Notar" vs "NotarDex" inconsistency; standardize to "Notar."
6. **Favicon suite** — Generate apple-touch-icon, 192x192, 512x512 from existing logo; add web app manifest

---

## Phase 9: Navigation & UX Polish
**Files:** `src/components/Navbar.tsx`, `src/components/Footer.tsx`, various pages

1. **Sticky mobile header** — Make navbar sticky on mobile (`sticky top-0`)
2. **Mobile menu auto-close** — Close mobile sheet on route change (verify current behavior)
3. **Footer "For Hospitals" link** — Add to solutions column in footer
4. **404 page** — Already exists (`NotFound.tsx`); verify it's branded
5. **Active nav state** — Ensure current route is highlighted in nav (verify)
6. **Print stylesheet** — Add `@media print` styles for clean document printing

---

## Phase 10: Missing Integrations (Flagged but Deferred)

These items require external service setup beyond code changes. Flag for awareness:
- SMS/text notifications (requires Twilio/similar)
- Google Business Review widget (requires GMB API key)
- GA4/GTM integration (requires GA4 measurement ID)
- Real-time scheduling sync (already has booking system)
- DMARC/SPF/DKIM (DNS-level, not code)
- CDN/HTTP2/Brotli (hosting-level, not code)
- WAF/DDoS protection (hosting-level)
- HSTS preload (hosting-level header)

---

## Implementation Order

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Phase 3: Form UX | Medium | High — conversion |
| 2 | Phase 1: SEO | Medium | High — discoverability |
| 3 | Phase 4: Accessibility | Medium | High — compliance |
| 4 | Phase 2: Content | Large | High — trust/legal |
| 5 | Phase 7: Business Logic | Medium | Medium — functionality |
| 6 | Phase 8: Trust & Branding | Small | Medium — credibility |
| 7 | Phase 9: Nav & UX Polish | Small | Medium — polish |
| 8 | Phase 5: Performance | Small | Medium — speed |
| 9 | Phase 6: Security | Small | Medium — hardening |
| 10 | Phase 10: Integrations | — | Deferred (external deps) |

---

## Technical Details

**Files to Create:**
- `src/hooks/usePageMeta.ts` — Dynamic meta description + canonical per route
- `src/components/SignerChecklist.tsx` — Reusable signer preparation checklist
- `src/components/CalendarDownload.tsx` — .ics file generation for post-booking

**Files to Modify (key ones):**
- `public/sitemap.xml` — Fix domain, add missing routes
- `index.html` — Add apple-touch-icon, manifest link, expanded JSON-LD
- `src/index.css` — Focus indicators, reduced motion, print styles
- `src/components/Footer.tsx` — Add hospitals link, E&O disclosure
- `src/components/Navbar.tsx` — ARIA improvements, sticky mobile
- `src/pages/Index.tsx` — FAQ schema, inline validation, consent checkbox
- `src/pages/BookAppointment.tsx` — Consent checkbox, duration estimates, .ics download
- `src/pages/About.tsx` — Bio, commission info, trust badges
- `src/pages/NotaryGuide.tsx` — ID requirements, witness policy, act education, prohibited docs
- `src/pages/TermsPrivacy.tsx` — Cancellation policy, conflict of interest
- `src/lib/pricingEngine.ts` — Volume tier logic
- `src/lib/serviceConstants.ts` — I-9 service, duration estimates
- `src/pages/AppointmentConfirmation.tsx` — Calendar download, payment methods
- `src/pages/FeeCalculator.tsx` — After-hours display, volume pricing

**Estimated total: ~45 file touches across 9 implementation phases**

