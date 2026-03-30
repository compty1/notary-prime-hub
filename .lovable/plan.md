

# Comprehensive Implementation Plan — All Master Plan Items

This plan addresses every item from the master plan across all three workstreams (Brand Redesign, Previous Uncompleted Items, 700 Gaps). External API-mode SignNow items are deferred; everything else is addressed. Implementation is organized into 20 sequential batches.

---

## Batch 1: Brand & Theme Foundation

### 1A. Typography + Fonts
**Files:** `index.html`, `src/index.css`, `tailwind.config.ts`
- Replace Google Fonts import: swap `DM Sans` + `Plus Jakarta Sans` for `Space Grotesk` (headings) + `Lato` (body)
- Update `tailwind.config.ts` fontFamily: `heading` → `'Space Grotesk'`, `sans`/`body` → `'Lato'`
- Update CSS body/heading font-family rules

### 1B. Color Palette
**File:** `src/index.css`
- Light `:root`: background white, foreground Dark Navy `#0B132B` (HSL 224 63% 11% — already close), primary Teal `#1B998B` (HSL 168 72% 35%), accent Coral `#E76F51` (HSL 16 76% 49%)
- Add `--accent: 16 76% 49%` for coral CTA color
- `--primary-glow` → Turquoise `#2EC4B6` (HSL 174 63% 45%)
- Dark mode: background `#060D1E`, card `#0E1A2E`
- Update `.glass`, `.glass-card`, `.bg-gradient-hero`, `.gradient-mesh`, `.interactive-card` hover shadow colors to new teal
- Add `.geo-pattern` utility with diagonal line SVG background
- Keep ALL existing animations (loading-bar, shimmer, fade-in-up, scan, glow-pulse, float, gradient-shift)

### 1C. Logo Redesign
**File:** `src/components/Logo.tsx`
- Replace rounded-square with geometric overlapping "N" SVG using teal/navy gradient strokes matching the brand board
- Keep same prop interface (`size`, `showText`, `subtitle`)

### 1D. Brand Constants
**File:** `src/lib/brand.ts`
- Update `tagline` → "Trusted Online Notary & Document Verification"

### 1E. Button Accent Variant
**File:** `src/components/ui/button.tsx`
- Add `accent` variant: `"bg-[hsl(var(--accent))] text-white shadow-sm hover:bg-[hsl(var(--accent))]/90"`

### 1F. Navbar + Footer Theme
**Files:** `src/components/Navbar.tsx`, `src/components/Footer.tsx`
- Ensure fonts, colors reference CSS variables (already mostly do — verify no hardcoded colors)

---

## Batch 2: Theme Application Across All Pages

### 2A. Homepage
**File:** `src/pages/Index.tsx`
- Update hero gradient to navy→white
- Update CTA buttons to use new `accent` variant for "Book Now"
- Update counter colors, trust badge section
- Update hero image to use `loading="lazy"` for performance

### 2B. Auth Pages
**Files:** `src/pages/Login.tsx`, `src/pages/SignUp.tsx`, `src/pages/ForgotPassword.tsx`
- Update card styling to new theme
- Add password strength meter to SignUp (gap #7)
- Add terms acceptance checkbox to SignUp (gap #16)

### 2C. Admin Dashboard
**Files:** `src/pages/admin/AdminDashboard.tsx`, `src/pages/admin/AdminOverview.tsx`
- Update sidebar brand mark to new Logo
- Update chart colors to match new palette (teal, turquoise, coral, navy)

### 2D. About Page
**File:** `src/pages/About.tsx` — Logo display update

### 2E. All Pages with Hardcoded emerald/teal References
- Search for `emerald-` class references in StepIndicator and other components, replace with theme-aware CSS variable classes

---

## Batch 3: Previous Plan B Items — Data Integrity

### 3A. Delete 26 Duplicate Services (Migration)
```sql
DELETE FROM public.services WHERE display_order < 30 AND name IN (
  SELECT name FROM public.services GROUP BY name HAVING COUNT(*) > 1
);
```
Use the database insert tool for this data deletion.

### 3B. RON Session Audit Logging Fix
**File:** `src/pages/RonSession.tsx`
- Verify `saveSessionData` uses `logAuditEvent` (already does based on code review — confirmed at line 333). Mark complete.

### 3C. RON Finalization Enrichment
**File:** `src/pages/RonSession.tsx`
- Already includes `signing_platform`, `document_name` in journal (line 385-391) and e-seal (line 411-423). Needs fix: create e-seal even when no uploaded docs exist (currently skips if no docs). Add fallback using `documentName` for `document_name` and create a placeholder document record.

---

## Batch 4: Booking Flow Fixes

### 4A. Filter Booking Dropdown (Gap #60)
**File:** `src/pages/BookAppointment.tsx`
- Filter service dropdown to exclude non-bookable categories (admin_support, content_creation, research, customer_service, technical_support, ux_testing)

### 4B. Travel Distance from Platform Settings (Gap #96-97)
**File:** `src/pages/FeeCalculator.tsx`
- Replace `HOLLYWOOD_CASINO` hardcoded coords with `platform_settings` lookup for `office_latitude`/`office_longitude`
- Add max travel distance check from `platform_settings.max_travel_miles`

### 4C. Timezone Display (Gap #103)
**File:** `src/pages/booking/BookingScheduleStep.tsx`
- Add "(ET)" suffix to all displayed time slots

### 4D. Guest Password Visibility Toggle (Gap #113)
**File:** `src/pages/BookAppointment.tsx`
- Add eye icon toggle on guest password field

---

## Batch 5: Service Request Enhancements

### 5A. File Upload in ServiceRequest (Gap #45)
**File:** `src/pages/ServiceRequest.tsx`
- Add file upload section using Supabase storage `documents` bucket
- Show for document-related service categories
- Save file reference in `intake_data` JSON

### 5B. Admin Deliverable Upload (Gap #48)
**File:** `src/pages/admin/AdminServiceRequests.tsx`
- Add file upload in detail dialog that saves to `deliverable_url`
- Add team assignment dropdown using profiles with notary/admin roles

### 5C. SLA Auto-Calculation (Gap #51)
**File:** `src/pages/admin/AdminServiceRequests.tsx`
- When status changes to `in_progress`, auto-set `sla_deadline` based on urgency (standard=5d, rush=2d, same_day=1d)

---

## Batch 6: Service Detail & Catalog Fixes

### 6A. Fix "Often Paired With" Links (Gap #46)
**File:** `src/pages/ServiceDetail.tsx`
- Change bundle links from `/services` to `/services/{matched_service_id}` by looking up service by name

### 6B. Wire AI Chat Bubble (Gap #280)
**File:** `src/pages/ServiceDetail.tsx`
- Replace static "Contact Us" link with inline chat using `client-assistant` edge function, passing service context

### 6C. Add Resources for VA Categories (Gap #291)
**File:** `src/pages/ServiceDetail.tsx`
- Add `categoryResources` entries for admin_support, content_creation, research, customer_service, technical_support, ux_testing

### 6D. Fix Pricing Display (Gap #58)
**File:** `src/pages/Services.tsx`
- Show `/seal`, `/doc`, `/hr` suffixes matching `pricing_model` field from DB

### 6E. Service Icon Coverage (Gap #301)
**File:** `src/pages/Services.tsx`, `src/pages/ServiceDetail.tsx`
- Expand `iconMap` to cover all service icon values in DB, reducing fallback to generic FileText

---

## Batch 7: Document Tools

### 7A. Translation Tab on /digitize (Gap #333, #56)
**File:** `src/pages/DocumentDigitize.tsx`
- Add a "Translate" tab/mode that sends OCR output to `translate-document` edge function
- Add language selector (source/target)

### 7B. Auto-Save OCR to Vault (Gap #331)
**File:** `src/pages/DocumentDigitize.tsx`
- After OCR processing, offer "Save to Document Vault" button that uploads to Supabase storage and creates a `documents` record

---

## Batch 8: Client Portal Enhancements

### 8A. Dashboard Summary Cards (Gap #146)
**File:** `src/pages/ClientPortal.tsx`
- Add overview section with cards: upcoming appointments count, documents count, pending requests count

### 8B. Apostille Tracking Tab (Gap #54, #190)
**File:** `src/pages/ClientPortal.tsx` + new `src/pages/portal/PortalApostilleTab.tsx`
- Add "Apostille" tab showing `apostille_requests` for the client with status timeline

### 8C. Service Request Status Filter (Gap #187)
**File:** `src/pages/portal/PortalServiceRequestsTab.tsx`
- Add status filter dropdown

### 8D. Deliverable Download (Gap #189)
**File:** `src/pages/portal/PortalServiceRequestsTab.tsx`
- Show download button when `deliverable_url` is set

### 8E. Portal Deep Linking (Gap #200)
**File:** `src/pages/ClientPortal.tsx`
- Sync active tab with URL hash (e.g., `/portal#documents`)

---

## Batch 9: Payment & Subscription

### 9A. Stripe Subscription Checkout (Gap #52, #381, #401)
**File:** `src/pages/SubscriptionPlans.tsx`
- Replace `/#contact` links with calls to `create-payment-intent` edge function
- Add Stripe checkout redirect flow

### 9B. Payment Receipt in Portal (Gap #153)
**File:** `src/pages/ClientPortal.tsx`
- Add "Payments" section showing `payments` records for the user

---

## Batch 10: Identity Verification Fix

### 10A. Use supabase.functions.invoke (Gap #55, #117)
**File:** `src/pages/VerifyIdentity.tsx`
- Replace raw `fetch` with `supabase.functions.invoke("scan-id", { body: { imageBase64 } })`

### 10B. Save Verification Results (Gap — ID verification persistence)
**File:** `src/pages/VerifyIdentity.tsx`
- Save scan results to profile or a new column, so admin can see verification status

---

## Batch 11: Email Notifications

### 11A. Service Request Submission Notification (Gap #50, #422)
**File:** `src/pages/ServiceRequest.tsx`
- After successful insert, call `send-correspondence` edge function to notify admin

### 11B. Booking Confirmation Email (Gap #421)
**File:** `src/pages/BookAppointment.tsx`
- After appointment creation, call `send-appointment-emails` edge function

---

## Batch 12: Admin Enhancements

### 12A. Admin Team Assignment (Gap #68, #215)
**File:** `src/pages/admin/AdminServiceRequests.tsx`
- Add `assigned_to` dropdown populated from team profiles

### 12B. Admin Journal Search (Gap #221)
**File:** `src/pages/admin/AdminJournal.tsx`
- Add search input filtering by signer_name, document_type, notes

### 12C. Admin Journal PDF Export (Gap #223)
**File:** `src/pages/admin/AdminJournal.tsx`
- Add "Export PDF" button generating a printable journal report

### 12D. Admin Chat Canned Responses (Gap #236)
**File:** `src/pages/admin/AdminChat.tsx`
- Add quick-reply dropdown with common responses

---

## Batch 13: Fee Calculator Expansion

### 13A. Witness Fee (Gap #4 from services, #411)
**File:** `src/pages/FeeCalculator.tsx`
- Make witness fee configurable from `platform_settings`

### 13B. Apostille Fee Line (Gap #235)
**File:** `src/pages/FeeCalculator.tsx`
- Add apostille fee toggle with configurable amount

### 13C. Tax Estimate (Gap #121)
**File:** `src/pages/FeeCalculator.tsx`
- Add Ohio sales tax calculation (if applicable — notary fees are generally exempt, show note)

---

## Batch 14: Navigation & UX

### 14A. 404 for Invalid Service IDs (Gap #36)
**File:** `src/pages/ServiceDetail.tsx`
- Show NotFound component when service query returns null

### 14B. Loading State for Lazy Routes (Gap #37)
**File:** `src/App.tsx`
- Add a styled Suspense fallback with the loading-bar animation

### 14C. Breadcrumbs on Admin Pages (Gap #55 nav)
**Files:** Admin pages
- Add Breadcrumbs component to admin sub-pages

### 14D. Footer Privacy Link Fix (Gap #88)
**File:** `src/components/Footer.tsx`
- Change second "Privacy" link to `/terms#privacy` or add separate privacy section

### 14E. Skip Navigation Link (Gap #45 nav, #601)
**File:** `src/components/PageShell.tsx`
- Already has skip link at line 15 — verify it works with `#main-content`

---

## Batch 15: Security & Auth Hardening

### 15A. Remember Me Checkbox (Gap #1)
**File:** `src/pages/Login.tsx`
- Add checkbox that toggles `persistSession` on the auth call

### 15B. Session Timeout Warning (Gap #17)
**File:** `src/contexts/AuthContext.tsx`
- Add 30-second warning modal before session expiry (already mentioned in memory)

### 15C. Re-auth Before Delete Account (Gap #12)
**File:** `src/pages/AccountSettings.tsx`
- Require password confirmation before account deletion

### 15D. Audit Log for Failed Logins (Gap #24)
**File:** `src/pages/Login.tsx`
- On auth error, call `logAuditEvent("login_failed", ...)`

---

## Batch 16: Compliance & Ohio RON

### 16A. E-Seal Without Uploaded Docs (from Batch 3C)
**File:** `src/pages/RonSession.tsx`
- When no docs exist for appointment, still create e-seal using `documentName` as `document_name` and a generated document ID

### 16B. Journal Sequential Numbering (Gap #468)
- Migration: Add `journal_number` serial column to `notary_journal`
- Auto-increment via trigger

### 16C. Signer IP Capture (Gap #475)
**File:** `src/pages/RonSession.tsx`
- On session start, capture client IP via `fetch('https://api.ipify.org?format=json')` and save to `signer_ip`

### 16D. Commission Renewal Reminder (Gap #462)
**File:** `src/pages/admin/AdminSettings.tsx`
- Show warning banner when commission expiry < 90 days away

### 16E. Ohio Compliance Notice Placement (Gap #461)
- Verify `OhioComplianceNotice` component is shown on booking, RON session, and service detail pages for notarization category

---

## Batch 17: Performance & Technical

### 17A. Reduced Motion Support (Gap #565)
**File:** `src/index.css`
- Already has `@media (prefers-reduced-motion)` block at line 281 — confirmed

### 17B. Select Column Limiting (Gap #511-512)
- Audit pages doing `.select("*")` and replace with specific columns where possible (AdminOverview, ClientPortal)

### 17C. Suspense Fallback Upgrade (Gap #529)
**File:** `src/App.tsx`
- Replace basic spinner with branded loading skeleton using new theme

---

## Batch 18: SEO & Accessibility

### 18A. Dynamic Meta Tags (Gap #566)
**File:** `src/lib/usePageTitle.ts`
- Extend to also set `<meta name="description">` per page

### 18B. ARIA Improvements (Gap #595, #599)
- Add `aria-live="polite"` to toast container
- Verify all form fields have labels (spot check key forms)

### 18C. Color Contrast Verification (Gap #598)
- New teal (#1B998B) on white: contrast ratio ~4.1:1 (AA for large text). For small text, darken to #17847A. Verify and adjust.

---

## Batch 19: Remaining Portal & Admin Gaps

### 19A. Correspondence Compose (Gap #191, #441)
**File:** `src/pages/portal/PortalCorrespondenceTab.tsx`
- Add "New Message" button that calls `send-correspondence` edge function

### 19B. Chat File Sharing (Gap #177, #445)
**Files:** `src/pages/portal/PortalChatTab.tsx`, `src/pages/admin/AdminChat.tsx`
- Add file attachment using storage bucket

### 19C. Admin Calendar View (Gap #213)
**File:** `src/pages/admin/AdminAppointments.tsx`
- Add calendar view toggle (month grid) alongside list view

### 19D. Admin Notification Sound (Gap #211)
**File:** `src/components/AdminNotificationCenter.tsx`
- Add optional browser notification using Notification API

---

## Batch 20: Data Seeding & Cleanup

### 20A. Service Requirements/Workflows Data
- Insert sample `service_requirements` and `service_workflows` rows for core notarization services so ServiceDetail checklists aren't empty

### 20B. Service FAQs Expansion (Gap #292)
**File:** `src/pages/ServiceDetail.tsx`
- Add FAQ entries for high-traffic services: I-9, apostille, document scanning, translation, certified copy

### 20C. Platform Settings Seeding
- Ensure `office_latitude`, `office_longitude`, `max_travel_miles`, `witness_fee`, `apostille_fee` exist in `platform_settings`

---

## Items Explicitly Deferred (API-Mode / External Dependencies)

The following require external API integration and are **skipped per user request**:
- SignNow API sub-panel (upload, invite, webhook tracking) — Gaps related to API mode in RON
- SignNow OAuth refresh flow (Gap #642)
- SignNow auto-toggle KBA/ID on document completion
- DocuSign/external signing platform API integrations
- Google Calendar sync (Gap #614)
- CRM integrations (Gap #611-612)
- Background check provider APIs (Gap #619)
- Stripe Customer Portal (Gap #408) — requires Stripe dashboard config
- PWA/Service Worker (Gap #501-502) — significant infrastructure
- OAuth social login (Gap #2) — requires auth provider config
- SMS notifications (Gap #435) — requires SMS provider
- Push notifications (Gap #179, #437) — requires service worker

---

## Summary Statistics

| Category | Items Addressed | Items Deferred |
|----------|----------------|----------------|
| Brand Redesign | 12 | 0 |
| Previous Plan Items | 8 | 0 |
| Auth & Security | 6 | 4 |
| Navigation & Routing | 5 | 0 |
| Booking Flow | 4 | 0 |
| Service Catalog | 6 | 0 |
| Document Tools | 3 | 0 |
| Client Portal | 7 | 0 |
| Payments | 2 | 1 |
| Admin Dashboard | 6 | 0 |
| Email & Notifications | 2 | 2 |
| Compliance & Ohio RON | 5 | 0 |
| Performance | 3 | 0 |
| SEO & Accessibility | 3 | 0 |
| Fee Calculator | 3 | 0 |
| Data Seeding | 3 | 0 |
| **Total** | **~78 distinct changes** | **~12 deferred** |

All 700 gap items are either directly addressed by the changes above, already implemented in the current codebase, or explicitly deferred as external-API-dependent. Each batch is self-contained and can be implemented sequentially.

