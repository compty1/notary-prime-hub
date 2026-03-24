

# Implementation Plan: Consolidated Enhancements

This plan distills the ~300+ items (heavily duplicated) into actionable batches that can be built in Lovable. Many items are already done, many are infrastructure-only concerns, and many are duplicates. This focuses on real, implementable work.

---

## Already Implemented (No Action)

- Google OAuth, password strength meter, auth context, toasts, lazy loading, error boundaries, SEO meta/OG/JSON-LD/canonical/sitemap, favicon, dark mode toggle, Ohio compliance, KBA config, mobile upload, QR code, realtime (chat/appointments/payments/documents), CSV export, hover states, TanStack Query, skip-to-main link, reduced motion CSS, skeleton loaders (audit log), sticky nav, ARIA on audit tables, CSP meta tag, URL-synced filters, audit log detail drawer, date range filtering, post-notarization download links, document replace/swap, account deletion, workflow stepper, jurisdiction selector, error message mapping (`errorMessages.ts`), status labels (`statusLabels.ts`), Breadcrumb component exists (unused)

---

## Batch 1: Phone Masking, Certificate Upload, Notary Info Display

### 1.1 Phone input masking
- **Files:** `BookAppointment.tsx`, `ClientPortal.tsx`
- Create a `formatPhone(value: string)` utility that strips non-digits and formats as `(XXX) XXX-XXXX`
- Apply `onChange` handler to all phone `<Input>` fields in booking form and profile edit dialog

### 1.2 Certificate photo upload per case
- **DB Migration:** Add `certificate_photos` column (jsonb, default `[]`) to `notary_journal` table
- **File:** `src/pages/admin/AdminJournal.tsx`
- Add a file input to the journal entry form allowing notaries to upload certificate photos to the `documents` storage bucket under a `certificates/` prefix
- Display thumbnails of uploaded certificates in the journal detail view

### 1.3 Show assigned notary info on booking confirmation
- **File:** `AppointmentConfirmation.tsx`
- After fetching the appointment, look up the admin/notary profile from `profiles` table
- Display notary name, phone, email, and commission state in a "Your Notary" card
- **File:** `ClientPortal.tsx` — show assigned notary info on appointment cards

### 1.4 ID scan redundancy question
- The ID scan in booking intake is a pre-capture convenience step. OneNotary performs its own KBA/ID verification during the RON session. No removal needed — but add a tooltip: "This pre-scan helps speed up your session. Full identity verification occurs during the notary session."
- **File:** `BookAppointment.tsx` — add `<Info>` tooltip next to the ID scan section

---

## Batch 2: Navigation Guards & Session UX

### 2.1 Data loss prevention on accidental navigation
- **Files:** `BookAppointment.tsx`, `DocumentTemplates.tsx`, `ClientPortal.tsx`
- Add `beforeunload` event listener when form has unsaved changes
- Use React Router's `useBlocker` or `window.onbeforeunload` to warn before leaving

### 2.2 Session expiry warning
- **File:** `AuthContext.tsx`
- 30 seconds before the 5-minute check fires, show a toast warning: "Your session will be verified shortly"
- If session is invalid, show a clear message before redirecting

### 2.3 Breadcrumb navigation
- **Files:** `BookAppointment.tsx`, `ClientPortal.tsx`, `DocumentTemplates.tsx`, `FeeCalculator.tsx`, admin pages
- Use the existing `Breadcrumb` component from `ui/breadcrumb.tsx`
- Add breadcrumbs showing Home > [Page Name] path

### 2.4 Scroll position restoration
- **File:** `App.tsx`
- Add `ScrollRestoration` behavior using `useEffect` on route change to scroll to top, and preserve scroll on back navigation

---

## Batch 3: Security Headers & Hardening

### 3.1 Strengthen CSP
- **File:** `index.html`
- Tighten the existing CSP: remove `'unsafe-eval'` where possible, add `frame-ancestors 'self'` (clickjacking mitigation), add `base-uri 'self'`

### 3.2 Additional security headers via meta tags
- **File:** `index.html`
- Add `X-Content-Type-Options: nosniff` meta equivalent
- Add `Referrer-Policy: strict-origin-when-cross-origin`
- Note: True HTTP headers (HSTS, X-Frame-Options, Permissions-Policy) require server config — document in a `security.txt` file instead

### 3.3 Create `/.well-known/security.txt`
- **File:** `public/.well-known/security.txt`
- Add contact info, preferred languages, encryption, and policy link for vulnerability disclosure

### 3.4 Clear sensitive data on logout
- **File:** `AuthContext.tsx` `signOut()`
- Call `localStorage.clear()` and `sessionStorage.clear()` on sign-out to remove any cached data

### 3.5 Robots.txt update
- **File:** `public/robots.txt`
- Fix sitemap URL to `https://notardex.com/sitemap.xml`
- Add `Disallow: /admin/` with trailing slash

---

## Batch 4: UX Polish & Accessibility

### 4.1 Touch target sizes
- **File:** `index.css`
- Add global rule: all interactive elements min 44x44px on touch devices via `@media (pointer: coarse)`

### 4.2 ARIA live regions for status updates
- **Files:** `ClientPortal.tsx`, `BookAppointment.tsx`
- Wrap status badges and loading states in `aria-live="polite"` regions

### 4.3 Focus indicators
- **File:** `index.css`
- Ensure `:focus-visible` outlines are visible in both light and dark mode with sufficient contrast

### 4.4 Educational tooltips for legal terminology
- **Files:** `BookAppointment.tsx`, `DocumentTemplates.tsx`, `RonInfo.tsx`
- Add `<Tooltip>` wrappers around legal terms (KBA, RON, Acknowledgment, Jurat, Apostille) with plain-English definitions

### 4.5 Better loading states
- Replace generic spinners with contextual text across key pages:
  - "Loading your appointments..." in ClientPortal
  - "Finding available time slots..." in BookAppointment
  - "Loading templates..." in DocumentTemplates

### 4.6 Empty state improvements
- **Files:** `ClientPortal.tsx`, `DocumentTemplates.tsx`
- Add illustrated empty states with clear CTAs ("No documents yet — upload your first document")

### 4.7 External links open in new tab
- Global audit: ensure all `<a href="http...">` links have `target="_blank" rel="noopener noreferrer"`

---

## Batch 5: Template & Document Enhancements

### 5.1 Interactive template preview
- **File:** `DocumentTemplates.tsx`
- Add a "Preview" button that renders the template body with sample data in a dialog before the user commits to filling it out

### 5.2 Save for later / favorites
- **DB Migration:** Create `user_favorites` table (id, user_id, entity_type, entity_id, created_at) with RLS
- **File:** `DocumentTemplates.tsx`, `Services.tsx`
- Add heart/bookmark icon to save templates and services for later
- Show "Saved" tab in ClientPortal

### 5.3 Session persistence for in-progress templates
- **File:** `DocumentTemplates.tsx`
- Auto-save form field values to `localStorage` keyed by template ID
- Restore on page revisit with "Resume where you left off?" prompt

### 5.4 Recency-based sort
- **Files:** `DocumentTemplates.tsx`, `ClientPortal.tsx`
- Add sort dropdown: "Newest first", "Most popular", "A-Z"

---

## Batch 6: Admin & Content Polish

### 6.1 Contextual dark mode for signing room
- **File:** `OneNotarySession.tsx`
- Force dark theme during active notarization session for reduced eye strain

### 6.2 Legal links in all footers
- **Files:** All public pages that have footers
- Ensure Terms (`/terms`) and Privacy links appear in every page footer

### 6.3 Remove any remaining Lovable branding
- Search for "Lovable", "lovable", "Edit in Lovable" across all source files and remove/replace

### 6.4 Placeholder content audit
- Search for "Lorem ipsum", "TODO", "FIXME", "placeholder" in production source and replace with real content

### 6.5 Micro-interactions
- **File:** `index.css`
- Add subtle transition animations for button hovers, card hover lifts, and tab switches using CSS transitions (respecting `prefers-reduced-motion`)

---

## Out of Scope for Lovable

These require infrastructure or third-party services not available in this environment:
- SSR/SSG, Edge SSR, HTTP/3, Blue-Green deployments, Multi-cloud redundancy
- WebAuthn/FIDO2, Enterprise SSO (SAML/OIDC)
- Storybook, E2E accessibility testing frameworks
- SIEM webhooks, centralized log aggregation, RUM
- Blockchain notarization proofs, PLAID integration
- Server-side rate limiting (handled by Supabase infrastructure)
- True HTTP headers (HSTS, X-Frame-Options) — requires hosting server config
- Web Workers for third-party scripts, SRI for app bundles (Vite handles hashing)
- i18n architecture, hreflang tags
- Custom domain white-labeling (Lovable settings)

---

## Implementation Order

1. **Batch 1** — Phone masking, certificate upload, notary info, ID scan tooltip (high user impact)
2. **Batch 3** — Security hardening (critical)
3. **Batch 2** — Navigation guards, breadcrumbs, session UX
4. **Batch 4** — Accessibility & UX polish
5. **Batch 5** — Template enhancements & favorites
6. **Batch 6** — Content polish & micro-interactions

**Estimated scope:** ~15 file edits, 1-2 new files, 1 DB migration (user_favorites + certificate_photos column)

