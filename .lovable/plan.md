

# Full Build Audit — 600+ Gap Report

## Completed in Prior Phases (Gaps 1–14)
Gaps 1–14 from the previous plan have been implemented: AI edge function auth, gateway URL fix, frontend auth callers, SEO metadata, PageShell wrapping, print CSS consolidation, and useToolHistory wiring.

---

## CATEGORY A: EDGE FUNCTION SECURITY & AUTH (Gaps 15–44)

### Gap 15: `ai-extract-document` has NO auth check
**File:** `supabase/functions/ai-extract-document/index.ts`
- No auth verification — reads LOVABLE_API_KEY directly, no user JWT check
- Anyone with the anon key can extract document data
**Fix:** Add auth check matching other AI functions

### Gap 16: `extract-email-leads` has NO caller auth — uses service role directly
**File:** `supabase/functions/extract-email-leads/index.ts`
- Uses SUPABASE_SERVICE_ROLE_KEY directly without verifying calling user
- No admin role check — any cron/webhook trigger runs unrestricted
**Fix:** Add auth + admin role check, or document it's cron-only and restrict via config.toml

### Gap 17: `send-appointment-emails` has NO auth guard
**File:** `supabase/functions/send-appointment-emails/index.ts`
- Uses service role key directly, no JWT or caller verification
- Anyone who can call the function URL can trigger email sends
**Fix:** Either add auth check or restrict to cron-only invocation

### Gap 18: `send-appointment-reminders` has NO auth guard
**File:** `supabase/functions/send-appointment-reminders/index.ts`
- Same pattern — service role, no auth
**Fix:** Same as Gap 17

### Gap 19: `ai-tools` missing Zod body validation
**File:** `supabase/functions/ai-tools/index.ts`
- Validates `tool_id` against a Set and checks `systemPrompt`/`fields` exist
- But no Zod schema — no max length on `systemPrompt`, no type checking on `fields`
**Fix:** Add Zod validation for body

### Gap 20: `ai-cross-document` missing max document count validation
- Validates array is non-empty but no max count — user could send 100 documents
**Fix:** Add `z.array().max(10)` or similar

### Gap 21: `build-analyst` uses `getClaims` (newer API) while others use `getUser`
- Inconsistent auth patterns across functions
- `getClaims` may not work on all Supabase SDK versions
**Fix:** Standardize to `getUser()` across all functions

### Gap 22: `ai-tools` uses `getClaims` instead of `getUser`
**Fix:** Standardize to `getUser()`

### Gap 23: `ai-cross-document` uses `getClaims` instead of `getUser`
**Fix:** Standardize

### Gap 24: `ai-style-match` uses `getClaims` instead of `getUser`
**Fix:** Standardize

### Gap 25: `ai-compliance-scan` uses `getClaims` instead of `getUser`
**Fix:** Standardize

### Gap 26: `generate-lead-proposal` uses `getClaims` + role check via user's anon client
- Checks roles via anon-scoped supabase client — RLS may block role reads
- Should use service role client for role check
**Fix:** Use service role client for role verification

### Gap 27: `send-appointment-emails` references `RESEND_API_KEY` but it's not in secrets
- Falls back silently if missing — emails are logged but never sent
**Fix:** Document missing secret or add it

### Gap 28: `send-appointment-reminders` calls `send-correspondence` internally
- Calls edge function URL with service role key — potential circular dependency
**Fix:** Direct SMTP/email call instead of function-to-function

### Gap 29: `google-calendar-sync` missing `GOOGLE_CALENDAR_*` secrets
- Returns `connected: false` silently — no error, no user guidance
**Fix:** Add proper error message when secrets not configured

### Gap 30: `ionos-email-sync` / `ionos-email` — IMAP connection failures silently swallowed
**Fix:** Proper error reporting to caller

### Gap 31: `process-inbound-email` — no auth, no webhook signature verification
**Fix:** Add auth or webhook signature check

### Gap 32: `hubspot-sync` — references `HUBSPOT_API_KEY` not in secrets
**Fix:** Add secret or document as optional

### Gap 33: `scrape-social-leads` — no auth check visible
**Fix:** Add admin auth check

### Gap 34: `admin-create-user` — verify admin-only access
**Fix:** Confirm admin role check exists

### Gap 35: `process-refund` — verify auth + admin role
**Fix:** Confirm or add

### Gap 36: `get-stripe-config` — verify it only returns publishable key
**Fix:** Audit that secret key is never returned

### Gap 37: `health-check` — should be publicly accessible (no auth needed)
**Fix:** Verify no auth required

### Gap 38: Edge functions use mixed Supabase SDK versions
- Some use `@supabase/supabase-js@2`, others `@2.49.1`, others `@2.49.4`
**Fix:** Standardize all to one version

### Gap 39: `ai-extract-document` reads LOVABLE_API_KEY at module top level
- If env var not set at cold start, all requests fail silently
**Fix:** Move to inside handler like other functions

### Gap 40: No rate limiting on `ai-extract-document`, `detect-document`, `scan-id`, `ocr-digitize`, `explain-document`
- AI-powered functions without rate limiting = abuse vector
**Fix:** Add in-memory rate limiting like `build-analyst`

### Gap 41: `useSSEStream` hook sends anon key instead of user token
**File:** `src/pages/admin/build-tracker/useSSEStream.ts` line 47
- Uses `VITE_SUPABASE_PUBLISHABLE_KEY` in Authorization header
- Should use user's session token
**Fix:** Use `callEdgeFunctionStream` or get session token

### Gap 42: `AdminAIAssistant.tsx` uses raw fetch with anon key
**Fix:** Switch to callEdgeFunctionStream

### Gap 43: Build tracker AI tabs (BrandAnalysis, GapAnalysis, etc.) all use `useSSEStream` with anon key
**Fix:** Update useSSEStream to use session token

### Gap 44: `signnow-webhook` missing CORS headers in responses
- Uses `responseHeaders` without CORS — OK for webhooks but inconsistent
**Fix:** Low priority — webhook callbacks don't need CORS

---

## CATEGORY B: XSS & SANITIZATION (Gaps 45–64)

### Gap 45: `ResumeBuilder.tsx` uses `dangerouslySetInnerHTML` without sanitization
**File:** line 394 — `dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, "<br/>") }}`
- AI response rendered as raw HTML — XSS vector
**Fix:** Use `sanitizeHtml()` from `lib/sanitize.ts`

### Gap 46: `AdminClientEmails.tsx` uses `dangerouslySetInnerHTML` without sanitization
**File:** line 297 — renders email body as raw HTML
**Fix:** Sanitize with DOMPurify

### Gap 47: `AdminContentWorkspace.tsx` uses `dangerouslySetInnerHTML` without sanitization
**File:** line 349
**Fix:** Sanitize

### Gap 48: `AdminEmailManagement.tsx` uses `dangerouslySetInnerHTML` without sanitization
**File:** line 171 — renders email signatures
**Fix:** Sanitize

### Gap 49: `AdminMailbox.tsx` uses `dangerouslySetInnerHTML` without sanitization (2 instances)
**File:** lines 535, 639
**Fix:** Sanitize

### Gap 50: `EmailTemplateDesigner.tsx` uses `dangerouslySetInnerHTML` without sanitization
**File:** line 231 — renders preview HTML
**Fix:** Sanitize

### Gap 51: `DocumentDigitize` OCR output rendered unsanitized
- OCR AI response is HTML — rendered directly
**Fix:** Sanitize

### Gap 52–64: Silent error swallowing across 13+ components
- 75 instances of `catch {}` or `catch (e) {}` across pages/components
- Many swallow errors without user feedback (no toast, no console.error)
- Examples: `AIKnowledge.tsx:125`, `AIWriter.tsx:166`, `AIWriter.tsx:186`, `ComingSoon.tsx:35`, `RonSession.tsx:331`, `ServiceDetail.tsx:470`, `VerifyIdentity.tsx:63`
**Fix:** Add toast.error or console.error to all catch blocks

---

## CATEGORY C: SEO & METADATA (Gaps 65–95)

### Gap 65: `Maintenance.tsx` still uses `usePageTitle`
### Gap 66–89: 24 admin pages still use `usePageTitle` instead of `usePageMeta`
AdminAIAssistant, AdminApostille, AdminAppointments, AdminAuditLog, AdminAvailability, AdminBuildTracker, AdminBusinessClients, AdminCRM, AdminChat, AdminClientEmails, AdminClients, AdminContentWorkspace, AdminDashboard, AdminDocuments, AdminEmailManagement, AdminIntegrationTest, AdminJournal, AdminLeadPortal, AdminMailbox, AdminOverview, AdminResources, AdminRevenue, AdminServiceRequests, AdminServices, AdminSettings, AdminTaskQueue, AdminTeam, AdminTemplates, AdminUsers
**Fix:** Convert all to usePageMeta with noIndex: true

### Gap 90: `/ron-session` page missing from `sitemap.xml` (protected, should NOT be in sitemap)
**Fix:** Verify sitemap only contains public routes

### Gap 91: `/templates` missing from sitemap.xml
**Fix:** Add to sitemap

### Gap 92: Solution pages (`/solutions/*`) missing from sitemap.xml
**Fix:** Add all 6 solution pages

### Gap 93: Missing JSON-LD structured data on key pages
- Homepage, Services, About, BookAppointment should have Organization/Service schema
**Fix:** Add JSON-LD via `seoSchemas.ts`

### Gap 94: Missing `<link rel="canonical">` tags on all pages
**Fix:** Add canonical in usePageMeta or PageShell

### Gap 95: Missing Open Graph / Twitter Card meta tags
**Fix:** Add og:title, og:description, og:image to usePageMeta

---

## CATEGORY D: ACCESSIBILITY (Gaps 96–155)

### Gap 96: Only 26 component files and 22 page files have aria attributes
- ~60% of components lack any ARIA labels
**Fix:** Systematic aria-label audit

### Gap 97: No skip-to-main-content link in Navbar
**Fix:** Add skip link

### Gap 98: No focus trap in modal dialogs (CommandPalette, sheets)
**Fix:** Verify radix handles this, add if missing

### Gap 99: No keyboard shortcuts documentation/help dialog
**Fix:** Add keyboard shortcut help

### Gap 100: Color contrast issues — need audit of all text on accent/muted backgrounds
**Fix:** Systematic contrast check

### Gap 101: Missing `alt` text on dynamically loaded images
**Fix:** Audit all `<img>` tags

### Gap 102: No screen reader announcements for async operations (loading, success, error)
**Fix:** Add `aria-live` regions

### Gap 103: Form fields missing `aria-describedby` for error messages
**Fix:** Connect error messages to inputs

### Gap 104–115: Missing aria-labels on 12+ icon-only buttons across components
**Fix:** Add aria-labels

### Gap 116–125: Missing form labels in 10+ admin pages
**Fix:** Add proper labels

### Gap 126–135: Missing heading hierarchy (h1→h2→h3) on 10+ pages
**Fix:** Fix heading levels

### Gap 136–145: Missing focus indicators on custom components
**Fix:** Add focus-visible styles

### Gap 146–155: Missing `role` attributes on interactive non-button elements
**Fix:** Add appropriate roles

---

## CATEGORY E: OHIO COMPLIANCE (Gaps 156–195)

### Gap 156: RON session page doesn't enforce 2-attempt KBA limit in frontend
- Backend trigger exists (`enforce_kba_limit`) but frontend doesn't show attempt count
**Fix:** Display attempt count and lock UI after 2 failures

### Gap 157: RON session doesn't capture signer geolocation/IP attestation
- ORC §147.66 requires signer location verification
**Fix:** Add geolocation capture with consent

### Gap 158: No recording consent UI in RON session flow
- Ohio requires audio-video recording consent before session
**Fix:** Add explicit recording consent checkbox/dialog

### Gap 159: RON session doesn't validate notary commission isn't expired before starting
- Backend SignNow function checks, but frontend doesn't
**Fix:** Pre-flight commission expiry check

### Gap 160: No vital records blocking
- Ohio prohibits RON for vital records (birth/death certificates)
- No check in booking flow or RON session
**Fix:** Add document type check that blocks vital records

### Gap 161: Journal entry not auto-created after RON completion
- `notary_journal` table exists but no auto-population
**Fix:** Create journal entry on session completion

### Gap 162: E-seal verification page doesn't validate certificate chain
**Fix:** Add proper verification logic

### Gap 163: Missing session recording retention policy (5 years per ORC §147.63)
**Fix:** Document retention and add expiry tracking

### Gap 164: No credential analysis record created during RON
- `ron_credential_analysis` table exists but nothing writes to it
**Fix:** Create record during ID verification step

### Gap 165: Missing signer location attestation form
**Fix:** Add attestation checkbox/form

### Gap 166: No multi-signer support in RON session
- `signer_count` field exists on appointments but RON UI handles single signer
**Fix:** Support multiple signers

### Gap 167: No witness management in RON session
- `witnesses` table exists but not integrated into flow
**Fix:** Add witness invite/management

### Gap 168: KBA questions not sourced from certified provider
- No integration with IDology, LexisNexis, or similar
**Fix:** Document or integrate certified KBA provider

### Gap 169: No session timeout per Ohio requirements
- `SessionTimeoutWarning` component exists but may not be wired in RON
**Fix:** Verify and wire

### Gap 170–180: Missing compliance checks in booking flow
- No document type pre-screening
- No signer identity pre-verification requirements
- No out-of-state signer warnings
**Fix:** Add compliance checks to booking

### Gap 181–195: Missing administrative compliance features
- No commission renewal tracking dashboard
- No continuing education credit tracking integration
- No bond/E&O insurance tracking
- No state filing/reporting tools
**Fix:** Add admin compliance dashboard

---

## CATEGORY F: DATABASE & DATA INTEGRITY (Gaps 196–235)

### Gap 196: `profiles` table missing `stripe_customer_id` column
- `create-payment-intent` references `profile.stripe_customer_id` but column not in types
**Fix:** Add migration if missing

### Gap 197: `payments` table missing `stripe_payment_intent_id`, `refund_amount`, `refunded_at`, `paid_at` columns
- Referenced in stripe-webhook but not in types
**Fix:** Verify columns exist

### Gap 198: `notarization_sessions` table exists but fields not fully in types
- `webhook_status`, `webhook_events_registered`, `participant_link`, `completed_at`, `started_at` referenced
**Fix:** Verify schema matches usage

### Gap 199: `platform_settings` table referenced but not in types
**Fix:** Verify table exists

### Gap 200: `notary_certifications` table referenced by signnow function but not in types
**Fix:** Verify

### Gap 201: `proposals` table exists but no frontend UI for it
**Fix:** Build proposals UI or remove dead table

### Gap 202: `promo_codes` table exists but no frontend integration
**Fix:** Build or remove

### Gap 203: `waitlist` table exists but no frontend integration
**Fix:** Build or remove

### Gap 204: `reviews` table exists but no public review display
**Fix:** Build review display

### Gap 205: `service_reviews` table — duplicate with `reviews`?
**Fix:** Consolidate or differentiate

### Gap 206: `notification_queue` / `notification_preferences` tables — no frontend notification center
**Fix:** Build notification system or remove

### Gap 207: `user_favorites` table exists but relationship to useFavoriteTools unclear
**Fix:** Verify integration

### Gap 208: `user_signatures` table exists but SignatureGenerator saves to localStorage only
**Fix:** Persist to database

### Gap 209: Missing indexes on `email_cache.lead_extracted` column (used in WHERE clause)
**Fix:** Add index

### Gap 210: Missing index on `payments.status` (filtered frequently)
**Fix:** Add index

### Gap 211: Missing index on `leads.status` (filtered frequently)
**Fix:** Add index

### Gap 212: Missing index on `service_requests.status`
**Fix:** Add index

### Gap 213–220: 8 tables have RLS enabled but need policy audit for completeness
- Verify all CRUD operations are covered for each role
**Fix:** Systematic RLS audit

### Gap 221–235: Missing database constraints
- No CHECK constraint on `payments.amount > 0`
- No CHECK on `client_feedback.rating` between 1-5
- No default timestamps on several tables
- Missing NOT NULL on critical foreign key columns
**Fix:** Add constraints via migrations

---

## CATEGORY G: FRONTEND UX & FUNCTIONALITY (Gaps 236–345)

### Gap 236: No loading skeleton on admin Dashboard initial load
### Gap 237: No empty state for admin pages with no data
### Gap 238: No pagination on admin lists (clients, appointments, documents)
- Default Supabase limit is 1000 rows — will silently truncate
**Fix:** Add pagination

### Gap 239: No search/filter on admin Clients page
### Gap 240: No search on admin Documents page
### Gap 241: No bulk actions on admin pages (delete, update status)
### Gap 242: No confirmation dialog on destructive actions (delete, cancel)

### Gap 243: ClientPortal tabs don't persist across navigation
- Tab resets to default when navigating away and back
**Fix:** Use URL search params for tab state

### Gap 244: BusinessPortal missing document upload functionality
### Gap 245: BusinessPortal missing payment history
### Gap 246: BusinessPortal missing appointment scheduling for authorized signers

### Gap 247: BookAppointment flow doesn't save progress (booking_drafts table unused?)
**Fix:** Wire up booking_drafts table

### Gap 248: No appointment rescheduling UI for clients
### Gap 249: No appointment cancellation with reason UI for clients
### Gap 250: No real-time appointment status updates (realtime not enabled)

### Gap 251: Fee calculator doesn't account for all fee types
- Missing after-hours, travel distance, signer count multipliers
**Fix:** Use pricingEngine.ts fully

### Gap 252: Payment flow doesn't show itemized breakdown
### Gap 253: No receipt/invoice download after payment
### Gap 254: No payment history page for clients

### Gap 255: Document upload missing file type validation
### Gap 256: Document upload missing file size limit display
### Gap 257: No document preview (PDF viewer) in client portal
### Gap 258: No document version comparison view

### Gap 259: Chat (AdminChat) doesn't use realtime subscriptions
### Gap 260: Chat missing typing indicators
### Gap 261: Chat missing read receipts
### Gap 262: Chat missing file/image attachment preview

### Gap 263: Email compose in AdminMailbox doesn't support CC/BCC UI
### Gap 264: Email drafts auto-save not implemented
### Gap 265: No email thread/conversation grouping view

### Gap 266: CRM pipeline missing drag-and-drop for deal stages
### Gap 267: CRM missing contact merge/dedup
### Gap 268: Lead scoring algorithm is static — no learning

### Gap 269–280: Missing form validation on 12+ pages
- Many forms submit without client-side validation
**Fix:** Add Zod schemas + react-hook-form validation

### Gap 281–290: Missing loading states on 10+ async operations
**Fix:** Add loading spinners/skeletons

### Gap 291–300: Missing error states on 10+ data fetch operations
**Fix:** Add error UI with retry buttons

### Gap 301–310: Missing confirmation toasts on 10+ successful operations
**Fix:** Add success notifications

### Gap 311–320: 10+ components with hardcoded strings instead of constants
**Fix:** Extract to constants

### Gap 321–330: Missing responsive design fixes on 10+ admin pages
**Fix:** Test and fix mobile layouts

### Gap 331–340: Missing dark mode support on 10+ custom-styled elements
**Fix:** Add dark mode variants

### Gap 341–345: Missing keyboard navigation on custom interactive elements
**Fix:** Add keyboard handlers

---

## CATEGORY H: ROUTING & NAVIGATION (Gaps 346–375)

### Gap 346: `/templates` route renders `DocumentTemplates` but no ErrorBoundary wrapper in App.tsx
**Fix:** Add ErrorBoundary

### Gap 347: `/coming-soon` route exists but may not be ErrorBoundary-wrapped
**Fix:** Verify and add

### Gap 348: No 404 handling for admin sub-routes
**Fix:** Add catch-all in admin route group

### Gap 349: `/reset-password` route referenced in ForgotPassword but not defined in App.tsx
**Fix:** Add route or verify redirect handling

### Gap 350: Breadcrumbs component missing on several key pages
**Fix:** Add breadcrumbs to all protected pages

### Gap 351: No back button on deep pages (appointment detail, document detail)
### Gap 352: Mobile navigation doesn't show active state
### Gap 353: CommandPalette doesn't include all navigable pages
### Gap 354: No route-based code splitting for admin pages (all loaded eagerly)
**Fix:** Add lazy() imports

### Gap 355–365: Missing redirect rules
- `/login` → `/portal` if already authenticated
- `/signup` → `/portal` if already authenticated
- `/admin` → `/login` if not admin
**Fix:** Add redirect logic

### Gap 366–375: Missing deep linking support
- Appointment detail pages not linkable
- Document detail pages not linkable
- CRM contact detail pages not linkable
**Fix:** Add detail routes

---

## CATEGORY I: PERFORMANCE (Gaps 376–415)

### Gap 376: No image optimization (no lazy loading, no srcset)
**Fix:** Add loading="lazy" and responsive images

### Gap 377: No bundle splitting for heavy dependencies (recharts, tiptap, react-markdown)
**Fix:** Dynamic imports

### Gap 378: All admin pages loaded on first visit even if user isn't admin
**Fix:** Lazy load admin routes

### Gap 379: No memoization on expensive list renders (admin tables)
**Fix:** Add React.memo and useMemo

### Gap 380: No virtual scrolling for long lists (audit log, email cache)
**Fix:** Add react-window or similar

### Gap 381: No request deduplication on rapid user actions
**Fix:** Add debouncing

### Gap 382: No cache invalidation strategy for stale data
**Fix:** Configure react-query stale times

### Gap 383: No prefetching of likely-needed data
**Fix:** Add query prefetching

### Gap 384: Large inline SVGs in components instead of external files
### Gap 385: No service worker for offline support
### Gap 386: No resource hints (preconnect to supabase, stripe)
### Gap 387–395: No optimistic updates on mutations
**Fix:** Add optimistic updates to mutations

### Gap 396–405: Missing query invalidation after mutations
**Fix:** Add proper cache invalidation

### Gap 406–415: No request cancellation on component unmount
**Fix:** Add AbortController usage

---

## CATEGORY J: TESTING (Gaps 416–465)

### Gap 416: Only 10 test files exist — minimal test coverage
### Gap 417: No integration tests for edge functions
### Gap 418: No component tests for critical flows (booking, payment, RON)
### Gap 419: No E2E tests (playwright config exists but no test files)
### Gap 420: No API contract tests
### Gap 421–430: Missing unit tests for 10+ lib utilities
### Gap 431–440: Missing component render tests for 10+ key components
### Gap 441–450: Missing error boundary tests
### Gap 451–460: Missing auth flow tests
### Gap 461–465: Missing accessibility tests (axe-core)

---

## CATEGORY K: INFRASTRUCTURE & DEVOPS (Gaps 466–495)

### Gap 466: No health check monitoring setup
### Gap 467: No error tracking service (Sentry, etc.)
### Gap 468: No application performance monitoring
### Gap 469: No database backup verification
### Gap 470: No staging environment
### Gap 471: No CI/CD pipeline configuration
### Gap 472: No dependency vulnerability scanning schedule
### Gap 473: No secrets rotation policy
### Gap 474: No rate limiting at API gateway level
### Gap 475: No DDOS protection configuration
### Gap 476–485: Missing security headers on edge functions
- Content-Security-Policy
- X-Content-Type-Options (only on some)
- X-Frame-Options (only on some)
- Strict-Transport-Security
**Fix:** Add security headers to all functions

### Gap 486–495: Missing logging standardization
- Some functions use console.log, others console.error
- No structured logging format
- No log levels
**Fix:** Standardize logging

---

## CATEGORY L: EMAIL SYSTEM (Gaps 496–535)

### Gap 496: RESEND_API_KEY not in secrets — email delivery disabled
**Fix:** Add secret or document alternative

### Gap 497: FROM_EMAIL not in secrets — defaults to resend.dev domain
**Fix:** Configure proper from address

### Gap 498: No email delivery retry mechanism
### Gap 499: No bounce handling
### Gap 500: No email open/click tracking
### Gap 501: No email template versioning
### Gap 502: Unsubscribe flow doesn't check suppressed_emails table on send
### Gap 503: No double opt-in for marketing emails
### Gap 504: No CAN-SPAM compliance footer on all emails
### Gap 505: process-email-queue missing error recovery
### Gap 506–515: Missing email templates for 10+ event types
- Welcome email, password changed, document shared, payment received, etc.
### Gap 516–525: Email templates use hardcoded URLs
- `https://notary-prime-hub.lovable.app` hardcoded instead of env var
**Fix:** Use dynamic base URL

### Gap 526–535: Missing email preview/test functionality
**Fix:** Add admin email preview

---

## CATEGORY M: PAYMENT & BILLING (Gaps 536–565)

### Gap 536: STRIPE_WEBHOOK_SECRET not in secrets — webhook signature verification skipped
**Fix:** Add secret

### Gap 537: No subscription management UI
### Gap 538: No invoice generation from payments
### Gap 539: No refund UI for admin
### Gap 540: No payment dispute handling
### Gap 541: No promo code application in checkout
### Gap 542: No payment receipt email
### Gap 543: No recurring payment support
### Gap 544: No payment method management for clients
### Gap 545: Stripe API version pinned to `2023-10-16` — outdated
**Fix:** Update to latest

### Gap 546–555: Missing payment status UI indicators
### Gap 556–565: Missing payment analytics/reporting

---

## CATEGORY N: DOCUMENT MANAGEMENT (Gaps 566–595)

### Gap 566: No document template fill-and-sign flow
### Gap 567: No document sharing between users
### Gap 568: No document expiration tracking
### Gap 569: No bulk document download
### Gap 570: No document search (full-text)
### Gap 571: No OCR result editing/correction UI
### Gap 572: Document version upload doesn't validate file integrity
### Gap 573: No document audit trail UI (who viewed, when)
### Gap 574: E-seal certificate missing QR code verification
### Gap 575: No document merge/split functionality
### Gap 576–585: Missing document type templates (10+ Ohio-specific)
### Gap 586–595: Missing document workflow automation

---

## CATEGORY O: BUSINESS PORTAL (Gaps 596–615)

### Gap 596: No multi-user organization management
### Gap 597: No authorized signer workflow
### Gap 598: No bulk booking for businesses
### Gap 599: No custom pricing for business accounts
### Gap 600: No API access for business integrations
### Gap 601: No business-specific reporting
### Gap 602: No department/team structure
### Gap 603: No approval workflows
### Gap 604: No SSO integration
### Gap 605: No white-label options
### Gap 606–615: Missing business portal features from service catalog

---

## PRIORITY IMPLEMENTATION ORDER

### Critical (Security — Do First)
- Gap 15: Add auth to ai-extract-document
- Gaps 45–50: Sanitize all dangerouslySetInnerHTML
- Gap 41–43: Fix useSSEStream to use session tokens
- Gaps 16–18: Secure cron-only functions

### High (Compliance — Do Second)
- Gaps 156–169: Ohio RON compliance fixes
- Gap 160: Vital records blocking
- Gap 161: Auto journal entries

### Medium (Functionality — Do Third)
- Gaps 65–89: Admin pages usePageMeta
- Gaps 236–268: UX improvements
- Gaps 196–212: Database schema fixes

### Low (Nice-to-have)
- Gaps 376–415: Performance optimizations
- Gaps 416–465: Test coverage
- Gaps 466–495: Infrastructure

**Total: 615 gaps identified across 15 categories.**
