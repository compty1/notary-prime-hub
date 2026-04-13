

# Notary Pages Standalone Enhancement — Implementation Plan

This plan covers all 127 items from the CSV across 17 categories, organized into implementation sprints. The notary pages (`/n/:slug`) will be upgraded into fully functional standalone professional pages.

---

## Sprint 1: Foundation (DM, AP-010, RT, BR core, OP essentials)

### Database Migrations (~5 migrations)

**DM-001 — Notary Profiles Schema**
- Add missing columns to `notary_pages`: `languages jsonb`, `years_experience int`, `eo_expiration date`, `background_check_date date`, `lsa_certifications jsonb`, `status text DEFAULT 'pending'` (pending/active/suspended), `hours_json jsonb`
- Add index on `slug`, `is_published`, `status`

**DM-002 — Services Table Standardization**
- Verify `services` table has: `slug`, `category`, `is_ron`, `is_mobile`, `base_price`, `sort_order`
- Add missing columns if needed

**DM-003 — Pricing Tiers**
- Add `tier` column (standard/rush/after_hours) and `effective_date`/`deprecated_at` to `pricing_rules` if not present

**DM-005 — Reviews Table**
- Create `reviews` table: `id uuid PK, appointment_id uuid FK UNIQUE, client_id uuid, notary_id uuid, rating int CHECK(1-5), comment text, is_verified bool DEFAULT true, created_at timestamptz`
- RLS: client can insert (own appointment), public can read

**DM-008 — Consent Logs**
- Create `consent_logs`: `id uuid PK, user_id uuid, consent_type text, version text, ip_address text, user_agent text, granted_at timestamptz, revoked_at timestamptz`
- RLS: insert for authenticated, read for admin only, no update/delete

**DM-009 — Audit Events Enhancement**
- Add `old_value_json`, `new_value_json`, `ip_address` columns to existing `audit_log` if missing

### Routing Fixes (RT-001 to RT-008)
- **RT-001/002**: Audit `App.tsx` (432 lines, 100+ routes) for dead routes; remove duplicates, add `<Navigate>` redirects for old paths
- **RT-003**: Update `NotFound.tsx` with "Report broken link" CTA (already partially done — verify it logs to `audit_log`)
- **RT-005**: Add `returnUrl` query param support to login redirect in `ProtectedRoute.tsx`
- **RT-008**: Add slug validation in `NotaryPage.tsx` — reject invalid patterns before querying Supabase

### Branding (BR-001 to BR-003)
- `brandConfig.ts` already exists — verify all components import from it
- Search for remaining hardcoded hex colors; replace with CSS vars
- Audit all `<img>` logo tags for consistent `alt` text from `brandConfig`

### RBAC (AP-010)
- Verify `permissionsMatrix.ts` is enforced in all admin routes
- Ensure `ProtectedRoute` properly gates `adminOnly` vs `requireAdmin`

---

## Sprint 2: Core Notary Pages (NS-001 to NS-010, AP-001 to AP-004, CO-001 to CO-004, BK-001 to BK-005)

### Notary Page Standalone Architecture

**NS-001 — Full Data Wiring** (NotaryPage.tsx)
- Already wired to `notary_pages` — enhance to also fetch from `reviews`, `professional_service_enrollments`
- Add `CommissionBadge` component (already exists) to hero section using `credentials.commission_expiration`

**NS-002 — Self-Serve Editor**
- `PortalNotaryPageTab.tsx` (935 lines) already exists as the editor
- Add: live preview panel (side-by-side iframe of `/n/:slug`), "Preview as Public" button, SEO preview (Google SERP mockup showing title/description/URL)

**NS-003 — Custom Slug**
- Create `src/lib/slugUtils.ts`: validate URL-safe, check uniqueness via DB query, enforce min 3 / max 50 chars
- Add slug editor field to PortalNotaryPageTab with real-time uniqueness check

**NS-004 — Embedded Booking Widget**
- Create `src/components/EmbeddableBookingWidget.tsx` — a compact booking form (date/time/service picker) that works inline on the notary page
- Replace the current "Book Now" link-away pattern with this embedded widget in a collapsible section
- Pre-fill `notary_id` from the page's `user_id`

**NS-005 — Reviews Integration**
- `NotaryReviews.tsx` currently reads from `client_feedback` — update to also read from new `reviews` table
- Add average rating badge to directory cards and hero section

**NS-006 — Service Area Map**
- Create `src/components/ServiceAreaMap.tsx` using Leaflet (CDN via `<link>`/`<script>` in a div)
- Render radius circle centered on notary's primary service area
- Add to NotaryPage after the Service Areas section

**NS-007 — Share / QR Code**
- QR code already partially implemented in PortalNotaryPageTab — wire QR download button on the public NotaryPage
- Add Web Share API integration (already done in NotaryPage line 347)

**NS-008 — Directory Filters**
- NotaryDirectory.tsx currently has type filter and search — add: RON-capable filter, county/area filter, availability filter
- Sync all filters to URL params

**NS-009 — Directory Card Redesign**
- Add star rating, top 3 services, and prominent "Book Now" CTA to each card
- Show `CommissionBadge` on cards

**NS-010 — Commission Expiry Warning**
- Wire `CommissionBadge` (already created) into NotaryPage hero and PortalNotaryPageTab dashboard

### Admin Wiring (AP-001 to AP-004)
- **AP-001**: Wire `AdminServices` CRUD to update the `services` table; public `Services.tsx` already reads from DB
- **AP-002**: Wire `FeeCalculator.tsx` and `PricingMenu.tsx` to read from `pricing_rules` table via `usePricingRules` hook
- **AP-003**: Create `src/pages/admin/AdminNotaryApproval.tsx` — list pending notary pages, approve/reject, update `status` column
- **AP-004**: Ensure `AdminAppointments` can reassign notary, cancel with reason; changes reflect in client portal

### Compliance (CO-001 to CO-004)
- **CO-001**: Validate journal entry fields against ORC §147.04 using `journalValidation.ts` (already created)
- **CO-002**: Ensure RON session captures AV recording link, ID verification, credential analysis
- **CO-003**: Wire `VerifyIdentity.tsx` to log verification results to appointment record
- **CO-004**: Wire `consentLogger.ts` (already created) into booking, RON session, and document upload flows

### Booking (BK-001 to BK-005)
- **BK-001**: Fix calendar to use notary availability from `notary_pages.hours_json` and blocked dates
- **BK-002**: Wire confirmation email with .ics via existing IONOS edge function
- **BK-003**: Wire `RescheduleAppointment.tsx` to update appointment + notify both parties
- **BK-005**: Wire Stripe checkout into booking flow (Stripe already connected)

---

## Sprint 3: Portal, UI Polish, SEO (PT, UI, SE, OP)

### Portal (PT-001 to PT-006)
- **PT-001**: Enhance `ClientPortal` dashboard to show appointments, documents, invoices, review prompts in one view
- **PT-002**: Enhance notary dashboard tab with today's queue, pending count, commission countdown
- **PT-003**: Wire `MobileUpload.tsx` to tag uploads with `appointment_id`
- **PT-004**: Create `PortalNotificationCenter.tsx` — read/unread notifications with bell badge
- **PT-005**: Create `PortalMessages.tsx` — simple client↔notary messaging per appointment

### UI/UX (UI-001 to UI-012)
- **UI-001**: Responsive audit at 320/768/1024/1440px — fix overflows
- **UI-002**: Replace "Loading..." text with skeleton components (using `LoadingSkeletons.tsx` already created)
- **UI-003**: Wrap all page components in `PageErrorBoundary`
- **UI-004**: Deploy `EmptyStateFactory.tsx` (already created) across all list views
- **UI-005**: Audit forms for zod + react-hook-form; fix any that use uncontrolled inputs
- **UI-007**: Run accessibility pass — fix contrast, labels, focus order
- **UI-009**: Fix mobile nav — close on route change, show active state

### SEO (SE-001 to SE-008)
- **SE-001/002**: Create `SEOHead.tsx` component using `react-helmet-async`; apply to all public pages with unique titles and OG tags
- **SE-003**: Use `seoHelpers.ts` (already created) to inject JSON-LD on key pages
- **SE-004**: Wire `sitemapGenerator.ts` to produce dynamic sitemap including notary slugs
- **SE-005**: Add canonical URLs via SEOHead
- **SE-008**: Audit all `<img>` tags for alt text

---

## Sprint 4: Remaining P2 Items

### Admin Features (AP-005 to AP-009)
- **AP-005**: Create admin CMS for guides/glossary content
- **AP-006**: Wire global settings (hours, holidays) to footer and booking availability
- **AP-007**: Wire commission tracker to portal reminders
- **AP-008**: Wire admin notification dispatch to client portal
- **AP-009**: Wire invoice flow (admin → client portal download + email)

### Operations (OP-001 to OP-012)
- Wire existing global error handler to structured logging
- Health check endpoint already exists — verify it returns proper status
- Feature flags already implemented via `featureFlags.ts` — wire to admin UI
- Web Vitals already implemented — verify reporting

### Remaining Categories
- **BK-004/006/007**: Cancellation policy, mobile dispatch travel fees, waitlist
- **CO-005 to CO-010**: Data retention, seal verification, accessibility statement, privacy versioning, E&O display, audit log viewer
- **AI-001 to AI-004**: Guardrails, knowledge base citations, extractor validation, generation logging
- **PM-001 to PM-003**: Print marketplace catalog, cart, order tracking
- **DS-001 to DS-003**: Design studio templates, certificate generator, resume builder
- **LN-001 to LN-003**: Loan signing content, document checklist, agent profile fields
- **SC-001 to SC-003**: Subscription tier enforcement, usage metering, free tier
- **MX-001 to MX-010**: Contractor registration, help/support, unsubscribe, apostille tracking, virtual mailroom, signature generator, DocuDex, document digitize

---

## Sprint 5: P3 Polish

- BR-006/008: Dark mode coverage, print stylesheets
- RT-007: Scroll restoration
- NS-006/007: Service area map, share/QR polish
- UI-008/010/011/012: Reduced-motion, focus management, button hierarchy, table pagination
- SE-006: robots.txt refinement
- CO-009: E&O insurance display
- OP-008/009: Feature flags admin UI, performance monitoring dashboard
- BK-007: Waitlist auto-notification
- DS-003: Resume builder persistence
- MX-004/007/008/010: Grant dashboard, virtual mailroom, signature generator, document digitize

---

## Technical Details

- **Database migrations**: ~6 new migrations (notary_pages columns, reviews table, consent_logs, pricing tiers, audit enhancements, indexes)
- **New files**: ~15 new components/pages (EmbeddableBookingWidget, ServiceAreaMap, AdminNotaryApproval, PortalNotificationCenter, PortalMessages, SEOHead, slugUtils, etc.)
- **Modified files**: ~40 existing files (NotaryPage.tsx, NotaryDirectory.tsx, PortalNotaryPageTab.tsx, BookAppointment.tsx, App.tsx, PageShell.tsx, FeeCalculator.tsx, PricingMenu.tsx, etc.)
- **Key architectural change**: NotaryPage gets a `NotaryLayout` wrapper with minimal branded header instead of `hideNav` removing all navigation

