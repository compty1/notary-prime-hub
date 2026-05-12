
## Goal

Apply the new Notar visual identity (yellow `#FBBF24` + dark navy `#0F172A` + Outfit/DM Sans + clean rounded cards with subtle paper-style illustrations as in the mockups) **globally and universally** across the entire site — pages, components, and illustrations — not just the homepage.

## Scope (everything in)

### A. Landing page composition (`src/pages/Index.tsx`)
Rebuild to match the two reference screenshots:
1. **Hero** — full-width navy section, eyebrow chip, H1 "Legal Online **Notarization**" with yellow underline swash, subhead, yellow rounded "Start Notarizing Now" + dark "Contact Sales" CTAs, decorative blue/yellow circles + dot pattern, paper-document illustration on the right, trust strip below CTAs.
2. **"How can we help you today?"** — 3 service cards (Mobile Notary, Remote Online [highlighted "Most Popular"], Remote Apostille).
3. **How It Works** — 3 steps (Upload Document → Verify & Connect → Sign & Download), Step pills, paper-style icons.
4. **Trusted by Ohioans** — 3 testimonial cards with 5 yellow stars, quote-mark icon, circular avatars + city.
5. **Legal expertise meets modern convenience** — phone mockup with floating stat cards on the left, headline + 4 dark pill badges on the right.
6. **Final CTA** — navy strip with yellow + dark outline buttons.

### B. Universal site-wide theme audit
For **every** page and component on the site (marketing, auth, portal, admin, services, design studio chrome, enterprise, solutions, shop, academy, etc.):

- Replace all hardcoded `bg-[#…]`, `text-[#…]`, `border-[#…]`, raw hex/HSL color literals with semantic tokens (`bg-primary`, `text-foreground`, `border-border`, `bg-secondary`, `bg-accent`, `bg-muted`, etc.).
- Standardize button styles to the new system (yellow primary rounded-full, dark secondary rounded-full, ghost outline).
- Standardize card styles (white surface, subtle border, soft shadow, `rounded-card` token).
- Standardize section eyebrow chips (small uppercase pill with light primary tint).
- Standardize headings to `font-heading` (Outfit) and body to `font-body` (DM Sans) wherever an inline font-family override exists.
- Verify dark-mode tokens render correctly on each touched surface.

**Exclusions** — these are user-customizable artifact templates and must keep their literal colors so end-users can change them:
- `src/components/docudex/**` (DocuDex visual editor — user designs)
- `src/pages/design/**` (Print Design Studio configurators — user designs)
- `src/components/InvoicePDFExport.tsx`, `NotarizationCertificate.tsx`, `PrintStylesheet.tsx`, `EmailTemplateDesigner.tsx`, `SignatureGenerator.tsx`, `PaymentForm.tsx` Stripe Elements skin (PDF/email/Stripe artifacts — fixed by spec)
- `src/components/RevenueByServiceChart.tsx` chart palette (uses semantic tokens already; only adjust if hardcoded)
- `AdminNotaryPages.tsx` / `AdminAutomatedEmails.tsx` / `PortalNotaryPageTab.tsx` color-picker **defaults** stay literal but seeded to the new brand (`#FBBF24` / `#0F172A` / `#3B82F6`).

In-scope chrome files for hex → token sweep include: `Hero3DAnimation.tsx`, `ProcessGuide.tsx`, `AnatomyDiagram.tsx`, `NotaryPage.tsx`, `Login.tsx`, `SignUp.tsx`, `PortalEmailsTab.tsx`, `ai-tools/ToolRunner.tsx`, `design/ProductScene3D.tsx` (3D scene clear color/lighting only), and any remaining page/component flagged by `rg`.

### C. Illustrations & graphics — unified style
The mockups use a **flat paper-card style with soft drop shadows, subtle yellow + blue accents, and rounded corners**. Replace the existing mismatched 3D rendered illustrations (current `hero-3d-illustration.png`, `about-3d-illustration.png`, etc.) with this consistent set:

1. `src/assets/hero-document-card.png` — paper document with signature + yellow check seal (used in hero right column).
2. `src/assets/step-upload.png` — paper card with upload arrow.
3. `src/assets/step-verify.png` — paper card with ID + check.
4. `src/assets/step-sign.png` — paper card with signature line + downward arrow check.
5. `src/assets/feature-phone-mockup.png` — phone showing notary app with floating stat cards.
6. `src/assets/about-credentials.png` — replacement for `about-3d-illustration` matching the new flat style.

Generate via `imagegen` at premium quality, transparent background where appropriate. Keep file slots in `src/assets/` so other pages that import the existing names continue to work; old files are replaced in place where the new style fits, otherwise added alongside and old imports updated.

### D. Shared chrome
- **Header / Nav** — confirm logo lockup, link colors, and "Start Notarizing" CTA match new brand (yellow rounded-full).
- **Footer** — confirm navy bg, yellow link hover, semantic tokens.
- **Auth pages** (`Login.tsx`, `SignUp.tsx`, `ForgotPassword.tsx`) — apply paper-card form on light background, yellow primary submit.
- **NotFound / Maintenance / ComingSoon / Accessibility / Compliance / Security / SignerRights** — one-pass theme alignment.
- **Client Portal & Admin shells** — sidebar navy + yellow active state already configured; verify content surfaces use `surface-card` / `bg-card` rather than raw whites.

## Files touched (high-level)

- `src/pages/Index.tsx` (full rebuild of 6 sections)
- ~30–45 component & page files in scope-A list above (token sweep + small style normalizations only — **no logic changes**)
- `src/assets/*.png` (6 new illustrations)
- `src/components/Hero3DAnimation.tsx` (palette already updated; verify)
- `src/components/Header.tsx`, `Footer.tsx`, `PageShell.tsx` (nav/footer alignment if hex literals found)

## Process

Work in 4 passes so the user can see incremental progress:
1. **Pass 1 — Homepage rebuild** (Index.tsx + new hero/step/feature illustrations).
2. **Pass 2 — Universal hex → token sweep** across all in-scope chrome pages/components.
3. **Pass 3 — Auth + utility pages + nav/footer** style alignment.
4. **Pass 4 — Verification**: `npx tsc --noEmit`, `rg '#[0-9a-fA-F]{6}'` on in-scope files (zero hits expected), spot-check key pages at desktop + mobile.

## Out of scope
- Backend, business logic, routing, RLS, edge functions.
- User-customizable artifact templates (DocuDex, Print Design Studio, PDF/email templates, Stripe Elements skin).
- New features.

## Verification
- TypeScript clean.
- Zero hardcoded hex in in-scope files.
- Visual diff vs. mockup screenshots on home, login, portal dashboard, admin dashboard, one services page, one solutions page.
