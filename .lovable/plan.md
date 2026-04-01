

# Comprehensive Gap Resolution & CRM Build Plan

This plan addresses every item from the user's list, grouped into prioritized phases. Items already implemented are noted. The plan also incorporates unfinished items from previous plans.

---

## Phase 1: Native CRM System (HIGH — Core Business Logic)

**Current state:** HubSpot sync exists as an edge function; Lead Portal has basic CRUD, pagination, bulk actions, and real-time updates. No unified CRM page exists.

### 1.1 Build Admin CRM Dashboard (`/admin/crm`)
- Create `src/pages/admin/AdminCRM.tsx` as a full CRM hub with tabs: **Pipeline**, **Contacts**, **Activities**, **Deals**, **Reports**
- **Pipeline view**: Kanban board for leads across stages (new → contacted → qualified → proposal → converted → closed-won / closed-lost)
- **Contacts view**: Unified table merging `leads`, `profiles` (clients), and `business_profiles` with search, filters, tags, and inline editing
- **Activity timeline**: Log all interactions (emails, calls, appointments, notes, status changes) per contact, pulled from `audit_log`, `client_correspondence`, `appointments`, `chat_messages`
- **Deals view**: Track deals with value, stage, expected close date, assigned notary — new `deals` table
- **Reports view**: Charts for conversion rates, revenue by source, lead aging, pipeline velocity

### 1.2 Database: `deals` table + `crm_activities` table
```sql
CREATE TABLE deals (id uuid PK, contact_id uuid, lead_id uuid, title text, value numeric, stage text DEFAULT 'discovery', expected_close date, assigned_to uuid, notes text, hubspot_deal_id text, created_at, updated_at);
CREATE TABLE crm_activities (id uuid PK, contact_type text, contact_id uuid, activity_type text, subject text, body text, created_by uuid, created_at);
```
- RLS: admin-only management
- Wire HubSpot sync to push/pull deals bidirectionally

### 1.3 CRM Integration Points
- Auto-create CRM activity when: appointment booked, email sent/received, lead status changes, payment received, document uploaded
- Link booking flow outcomes to CRM pipeline
- Add CRM nav item to admin sidebar

---

## Phase 2: RON Session Notary Guide & Task Queue (HIGH)

**Current state:** `RonSession.tsx` has 4-step workflow with oath scripts. `AdminTaskQueue.tsx` is a basic service request kanban. No per-session contextual instructions exist.

### 2.1 Session-Specific Notary Guide Panel
- Add a collapsible side panel in `RonSession.tsx` with dynamically generated instructions based on:
  - Document type (determines acknowledgment vs. jurat)
  - Number of signers (multi-signer coordination steps)
  - Signing capacity (POA, trustee, corporate officer — special ID requirements)
  - Notarization type (RON vs. in-person — different compliance steps)
  - Witness requirements (auto-detected from document keywords)
- Include: what to say (oath scripts already exist), next steps checklist, compliance reminders, Ohio-specific rules
- Persist checklist progress in `notarization_sessions.details` JSONB

### 2.2 RON To-Do Queue
- Create dedicated RON task queue within admin that shows upcoming RON sessions with pre-session checklist:
  - [ ] Verify signer identity document
  - [ ] Confirm KBA completion
  - [ ] Check commission expiry
  - [ ] Verify recording consent
  - [ ] Confirm document eligibility
  - [ ] Multi-signer coordination (if applicable)

---

## Phase 3: Booking System Fixes (HIGH)

### 3.1 Route Validation
- `/book` route exists and works. Add `/booking` and `/schedule` as aliases redirecting to `/book`
- Validate all CTAs point to `/book` not `#` or placeholder paths

### 3.2 Google Calendar Integration
- Create `google-calendar-sync` edge function using Google Calendar API
- Add OAuth2 flow in Admin Settings for Google account connection
- Sync appointments bidirectionally: create calendar events on booking, update on reschedule/cancel
- Display Google Calendar availability in booking time slot picker
- Requires `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` secrets

### 3.3 Ghost CTA Fix
- Audit all "Get Started" / CTA buttons across Index, Services, solution pages
- Replace `#` and placeholder hrefs with proper routing to `/book` with appropriate query params
- Create Entry Logic Controller: detect if user needs Mobile Notary (→ `/book?type=in_person`) or RON (→ `/book?type=ron`)

### 3.4 Draft/Resume Workflow
- `booking_drafts` table already exists. Wire it up: save form state on each step change, restore on page load if draft exists

---

## Phase 4: Security & Compliance Hardening (HIGH)

### 4.1 IDOR Prevention
- Replace any UUID exposure in URLs with signed/opaque tokens for document access
- Audit all API responses to strip internal IDs not needed by frontend
- Add server-side ownership checks on all document/appointment access

### 4.2 E-Sign Consent Step
- Add mandatory UETA/ESIGN Act consent checkbox before any electronic signing in RON flow
- Record consent timestamp in `notarization_sessions`

### 4.3 File Upload Security
- Add server-side file type validation in upload edge functions (check magic bytes, not just extension)
- Enforce size limits (configurable per document type)
- Add locked PDF detection: check if PDF is encrypted/password-protected during intake

### 4.4 Cookie & Session Security
- Add `SameSite=Strict`, `Secure`, `HttpOnly` flags — Supabase handles this natively
- Add idle session timeout notification (15 min warning before auto-logout)
- Session duration cap (configurable, default 8 hours)

### 4.5 Rate Limiting
- Client-side rate limiting already exists for leads (3/min). Extend pattern to all public forms
- Add honeypot fields to remaining public forms (contact, booking)

### 4.6 Commission Expiry Enforcement
- Query `platform_settings` for commission expiry date before allowing future appointment creation
- Block RON sessions if commission expired (partially exists per memory)
- Alert admin 30/60/90 days before expiry

### 4.7 Timing-Safe Token Comparison
- Use `crypto.timingSafeEqual` in password reset edge functions

### 4.8 HSTS, CSP, Security Headers
- CSP already exists in `index.html`. Add HSTS via meta tag
- X-Frame-Options: already present (`SAMEORIGIN`)
- X-Content-Type-Options: already present (`nosniff`)
- Referrer-Policy: already present (`strict-origin-when-cross-origin`)
- Permissions-Policy: already present

---

## Phase 5: Ohio-Specific Compliance (HIGH)

### 5.1 Document Eligibility Logic
- Create `ohioDocumentEligibility.ts` utility that checks document types against Ohio restrictions (no vital records, no court orders, etc.)
- Integrate into booking intake and document upload flows
- Block prohibited documents with clear error messages

### 5.2 Jurisdictional Validation
- Validate signer location state against Ohio RON rules
- For out-of-state signers: display Full Faith & Credit notice
- Geographic service area validation for mobile notary (30-mile radius check already exists in `geoUtils.ts`)

### 5.3 Witness Coordination Workflow
- Add witness invitation step in booking for documents requiring witnesses
- Track witness count, names, and contact info in appointment record
- Document-specific witness threshold logic (e.g., wills require 2 witnesses in Ohio)

### 5.4 Statutory Technology Disclosure
- Add mandatory disclosure that RON sessions are recorded per ORC §147.66
- Display in pre-session checklist and record consent

---

## Phase 6: Accessibility (WCAG 2.1 AA) (MEDIUM-HIGH)

### 6.1 Focus Management
- Add visible focus indicators globally via CSS (`:focus-visible` with 2px ring)
- Focus trap in all modals/dialogs (shadcn Dialog already handles this)
- Focus trap in mobile navigation Sheet

### 6.2 Keyboard Navigation
- Make date picker keyboard-accessible (add keyboard event handlers)
- Ensure drag-and-drop zones have keyboard alternatives
- Add ARIA live regions for dynamic status updates (appointment status, session status)

### 6.3 Color & Contrast
- Audit and fix insufficient contrast ratios in footer, disabled states, subtle UI elements
- Ensure color is never sole information conveyor (add icons/text to status badges — partially done)

### 6.4 Screen Reader Support
- Add proper `aria-label` on brand links, icon-only buttons
- Ensure all form inputs have associated labels (not placeholder-only)
- Add `alt` text to all functional images; empty `alt=""` for decorative
- Add ARIA live regions for toast notifications

### 6.5 Skip Navigation
- Already exists in `PageShell.tsx` and `AdminDashboard.tsx` ✅

---

## Phase 7: SEO & Performance (MEDIUM)

### 7.1 Already Implemented ✅
- JSON-LD structured data (Notary schema)
- Open Graph / Twitter meta tags
- Canonical URL
- robots.txt with sitemap reference
- security.txt (RFC 9116)
- Lazy loading / code splitting
- DNS prefetch / preconnect

### 7.2 Needed Fixes
- Add unique `<title>` and `<meta description>` per page (usePageMeta hook exists — verify all pages use it)
- Add breadcrumb Schema.org markup on service detail pages
- Add `srcset` responsive image attributes on hero/service images
- Preload LCP image in `<head>`
- Add dynamic copyright year in footer
- Optimize hero animation to reduce main-thread blocking

---

## Phase 8: Email System Enhancements (MEDIUM)

### 8.1 Email Template Designer
- Add visual email template editor in Admin Settings with:
  - Logo upload/placement
  - Color picker for header/footer/accent colors
  - Spacing/layout controls
  - Font selection
  - Live preview panel showing rendered template
- Store templates in `platform_settings` as HTML with variable placeholders

### 8.2 Email Sync Error Handling
- Fix "error aborted" message in IONOS sync — add retry logic and more specific error messages
- Distinguish between timeout aborts (which still succeed) and actual failures

### 8.3 SPF/DKIM/DMARC
- Already handled by Lovable Emails infrastructure for `notify.notardex.com`
- Add informational display in admin settings showing email authentication status

---

## Phase 9: SignNow Webhook Enhancements (MEDIUM)

### 9.1 `check_webhooks` Action
- Add `check_webhooks` action to `signnow` edge function that calls SignNow API to list all active webhook subscriptions for a document
- Return subscription status, event types, and URLs

### 9.2 Webhook Status Indicator in Admin RON View
- Display webhook registration status per document in admin RON session view (already partially exists per memory — verify and enhance)

---

## Phase 10: UX & Navigation Fixes (MEDIUM)

### 10.1 Dead-End Elimination
- Every form submission routes to a "Next Steps" success page
- Post-payment page shows: receipt, next steps, calendar download, support link
- Post-cancellation page shows: confirmation, rebooking CTA

### 10.2 Mobile Navigation
- Ensure mobile Sheet menu has focus trap and is fully keyboard accessible
- Add haptic feedback on mobile button presses (navigator.vibrate API)

### 10.3 Breadcrumbs
- `Breadcrumbs.tsx` component exists — ensure it's used on all multi-step flows
- Add dynamic breadcrumbs that preserve form state on back-navigation

### 10.4 Miscellaneous UX
- Add "Back to Top" button (component exists ✅)
- Add special instructions field in booking intake
- Add mileage calculator for mobile services (geoUtils already calculates distance ✅)
- Pre-fill support forms for logged-in users
- Add loading states to all buttons during async operations
- Branded 404 page (already implemented with Notar branding ✅)

---

## Phase 11: Hardware & Pre-Session Checks (MEDIUM)

### 11.1 Pre-Flight Hardware Check
- `TechCheck.tsx` already exists with camera/mic/connection checks ✅
- Add browser version check (reject unsupported browsers)
- Add WebRTC NAT traversal test using STUN server

### 11.2 Pre-Payment Connectivity Audit
- Run TechCheck before payment step in RON booking flow

---

## Phase 12: Remaining Items (LOW-MEDIUM)

### 12.1 Age Verification
- Add date-of-birth field in booking for minor signer detection
- If minor detected, require guardian co-signer workflow

### 12.2 Multi-Signer Pre-Configuration
- Add multi-signer fields in booking intake (additional signer names, emails)
- Generate individual verification links per signer

### 12.3 Post-Service Feedback Loop
- Auto-send feedback request email after appointment completion
- Simple 1-5 star rating + comment form

### 12.4 Click-Wrap Agreement
- Add mandatory checkbox for Terms of Service before booking confirmation
- Record acceptance timestamp

### 12.5 Dark Mode
- Already implemented via `DarkModeToggle` ✅ — verify coverage across all pages including signer portal

### 12.6 Stripe Webhook Sync
- `stripe-webhook` edge function exists — verify subscription status sync works end-to-end

### 12.7 Font in PDFs
- Embed fonts (Space Grotesk, Lato) in generated PDFs to prevent substitution errors

### 12.8 Unverified Email Change
- Require email verification before email change takes effect (Supabase Auth handles this natively)

### 12.9 Service Worker / PWA
- Add basic service worker for offline indicator (component exists ✅)
- Add web manifest with PWA assets

---

## Items Already Implemented (No Action Needed)
- ✅ Error boundaries (`ErrorBoundary.tsx` wraps all admin routes)
- ✅ Skip navigation links
- ✅ 404 page (branded with popular pages)
- ✅ security.txt (RFC 9116)
- ✅ robots.txt with sitemap
- ✅ JSON-LD structured data
- ✅ OG/Twitter meta tags
- ✅ CSP, X-Frame-Options, X-Content-Type-Options headers
- ✅ Dark mode toggle
- ✅ Inline form validation in booking
- ✅ File upload preview
- ✅ Toast duration (5s)
- ✅ Rate limiting on lead forms
- ✅ Back to Top component
- ✅ Calendar download component
- ✅ Legal glossary provider
- ✅ Tech check component
- ✅ Compliance banner
- ✅ Booking draft persistence table (needs wiring)
- ✅ Command palette
- ✅ Lazy loading / code splitting
- ✅ Honeypot on public forms
- ✅ Password strength indicator on signup

---

## Implementation Order

1. **Phase 1** — Native CRM (largest new feature, 3-4 implementation rounds)
2. **Phase 2** — RON Session Guide
3. **Phase 3** — Booking fixes + Google Calendar
4. **Phase 4** — Security hardening
5. **Phase 5** — Ohio compliance
6. **Phase 6** — Accessibility
7. **Phase 8** — Email template designer
8. **Phase 9** — SignNow webhook enhancements
9. **Phase 7** — SEO/performance
10. **Phase 10-12** — UX, pre-session, remaining items

Total estimated implementation: ~15-20 rounds across all phases.

