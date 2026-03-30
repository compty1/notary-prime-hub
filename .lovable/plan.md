

## Comprehensive Plan: RON Simplification + 14 New Services + 900 Gaps + Error Fixes + IONOS Email Platform

This plan preserves ALL items from the previous three plans and adds 500 new gaps (401–900) plus a full IONOS email management platform.

---

### A. RON Session Simplification (Already Implemented)

The RON session page (`src/pages/RonSession.tsx`) was already simplified:
- StepIndicator component added (Paste Link → Verify ID/KBA → Administer Oath → Finalize)
- SignNow API upload/invite flow removed
- Link-paste is now the only session initiation method
- `saveSessionLink` auto-sets status to "confirmed"

**Remaining RON cleanup:**
- Remove `ron_session_method` setting from `AdminSettings.tsx` (lines 278–291 still present)

---

### B. Database Migration — Insert 14 New Services

Single SQL migration inserting all services:

| # | Service | Category | Price From | Price To | Pricing Model |
|---|---------|----------|-----------|----------|---------------|
| 1 | Data Entry | admin_support | 50 | 150 | flat |
| 2 | Travel Arrangements | admin_support | 100 | 300 | flat |
| 3 | Blog Post Writing | content_creation | 150 | 400 | flat |
| 4 | Social Media Content | content_creation | 120 | 350 | flat |
| 5 | Newsletter Design | content_creation | 125 | 375 | flat |
| 6 | Market Research Report | research | 200 | 500 | flat |
| 7 | Lead Generation | research | 150 | 400 | flat |
| 8 | Email Support Handling | customer_service | 80 | 250 | flat |
| 9 | Live Chat Support | customer_service | 100 | 100 | per_hour |
| 10 | Website Content Updates | technical_support | 75 | 200 | flat |
| 11 | UX Audit & Heuristic Review | ux_testing | 250 | 600 | flat |
| 12 | User Flow & Workflow Testing | ux_testing | 200 | 500 | flat |
| 13 | Usability Testing & Report | ux_testing | 300 | 700 | flat |
| 14 | UX Research & Persona Development | ux_testing | 350 | 800 | flat |

---

### C. Frontend — Add 6 New Categories

**`src/pages/admin/AdminServices.tsx`** — Add to `categories` array:
- `admin_support`, `content_creation`, `research`, `customer_service`, `technical_support`, `ux_testing`

**`src/pages/Services.tsx`** — Add to `categoryLabels`, `categoryOrder`, `iconMap`, and `INTAKE_ONLY_SERVICES`

**`src/pages/booking/bookingConstants.ts`** — Add all 6 to `DIGITAL_ONLY_CATEGORIES`

**`src/pages/ServiceRequest.tsx`** — Add intake field configs for each new service

---

### D. Fix Non-2xx Code Errors

1. **`supabase/functions/create-payment-intent/index.ts` (line 27)** — `supabase.auth.getClaims()` does not exist in Supabase JS v2. Replace with `supabase.auth.getUser()`:
```typescript
const { data: { user }, error: userErr } = await supabase.auth.getUser();
if (userErr || !user) { return 401 }
const userId = user.id;
const userEmail = user.email;
```

2. **`src/pages/Index.tsx` (line 18)** — `import heroImage from "@/assets/hero-notary.jpg"` will fail if asset missing. Add try/catch or optional import with fallback.

3. **Edge function CORS** — Standardize OPTIONS preflight handling across all functions

---

### E. IONOS Email Platform — Full Email Management System

Build a complete email client integrated into the admin dashboard that connects to an IONOS email account via IMAP/SMTP, allowing the admin to view, compose, send, receive, search, and manage emails directly from the platform.

#### E1. New Edge Function: `ionos-email` 
Path: `supabase/functions/ionos-email/index.ts`

This edge function acts as the email gateway, supporting multiple actions:
- **`list`** — Fetch emails from IONOS inbox/sent/folders via IMAP (using Deno IMAP library or REST proxy)
- **`read`** — Fetch a single email with full body/attachments
- **`send`** — Send email via IONOS SMTP (host: `smtp.ionos.com`, port 587, STARTTLS)
- **`reply`** — Send reply with In-Reply-To / References headers
- **`forward`** — Forward email to new recipient
- **`delete`** — Move email to trash via IMAP
- **`move`** — Move email between folders (inbox, archive, trash, custom)
- **`search`** — IMAP search by subject, sender, date range, keyword
- **`folders`** — List all IMAP folders
- **`mark_read`** / **`mark_unread`** — Toggle read/unread flag
- **`star`** / **`unstar`** — Toggle flagged status
- **`attachments`** — Download attachment from a specific email

Since Deno edge functions don't have native IMAP support, the approach will use one of:
- Option A: Use `npm:imapflow` (works in Deno with npm: specifier) for IMAP and `npm:nodemailer` for SMTP
- Option B: If IONOS offers a webmail API, use REST calls instead

**Required secrets** (to be added via `add_secret`):
- `IONOS_EMAIL_ADDRESS` — The IONOS email address (e.g., `admin@shanegoble.com`)
- `IONOS_EMAIL_PASSWORD` — The IONOS email account password
- `IONOS_IMAP_HOST` — IMAP server (default: `imap.ionos.com`)
- `IONOS_SMTP_HOST` — SMTP server (default: `smtp.ionos.com`)

#### E2. New Database Table: `email_cache`
Cache fetched emails locally for faster UI and search:
- `id` (uuid PK)
- `message_id` (text, unique — IMAP Message-ID)
- `folder` (text — inbox, sent, drafts, trash, archive)
- `from_address` (text)
- `from_name` (text)
- `to_addresses` (jsonb)
- `cc_addresses` (jsonb)
- `bcc_addresses` (jsonb)
- `subject` (text)
- `body_text` (text)
- `body_html` (text)
- `date` (timestamptz)
- `is_read` (boolean)
- `is_starred` (boolean)
- `has_attachments` (boolean)
- `attachments` (jsonb — array of {filename, size, content_type})
- `in_reply_to` (text)
- `references` (text)
- `labels` (text[])
- `synced_at` (timestamptz)
- RLS: Only admin role can access

#### E3. New Database Table: `email_drafts`
- `id` (uuid PK)
- `user_id` (uuid)
- `to_addresses` (jsonb)
- `cc_addresses` (jsonb)
- `subject` (text)
- `body_html` (text)
- `attachments` (jsonb)
- `in_reply_to` (text — for draft replies)
- `created_at`, `updated_at` (timestamptz)
- RLS: Owner only

#### E4. New Database Table: `email_signatures`
- `id` (uuid PK)
- `user_id` (uuid)
- `name` (text — e.g., "Professional", "Personal")
- `signature_html` (text)
- `is_default` (boolean)
- `created_at` (timestamptz)
- RLS: Owner only

#### E5. New Admin Page: Full Email Client UI
Replace or heavily extend `src/pages/admin/AdminEmailManagement.tsx` with a full email client:

**Layout:** Three-column layout (folder sidebar | email list | email reader/composer)

**Folder Sidebar:**
- Inbox (with unread count badge)
- Sent
- Drafts (local drafts from `email_drafts` table)
- Starred
- Archive
- Trash
- Custom folders (fetched from IMAP)
- Compose button at top

**Email List Panel:**
- Sortable by date, sender, subject
- Search bar with filters (from, to, subject, date range, has:attachment)
- Bulk actions: select all, mark read/unread, delete, move, archive
- Pagination / infinite scroll
- Unread emails shown in bold with accent indicator
- Star toggle per email
- Preview snippet (first ~100 chars of body)
- Attachment paperclip icon
- Pull-to-refresh / auto-refresh every 60 seconds

**Email Reader Panel:**
- Full email header (from, to, cc, date, subject)
- HTML email body rendered safely (sanitized via DOMPurify)
- Attachment list with download buttons
- Action bar: Reply, Reply All, Forward, Archive, Delete, Mark Unread, Star, Print
- Thread view grouping emails by References/In-Reply-To headers

**Compose / Reply / Forward Dialog:**
- To, CC, BCC fields with email autocomplete from `profiles` table
- Subject line (auto-prefixed with Re: / Fwd: for replies/forwards)
- Rich text editor (reuse existing `RichTextEditor` component)
- Email signature selector (from `email_signatures` table)
- Auto-append signature on compose
- File attachment upload (stored to Supabase storage, attached via SMTP)
- Save as Draft button
- Send button with loading state
- Discard confirmation dialog
- Schedule send (optional — store as draft with `scheduled_at`)

**Email Signatures Management:**
- Create/edit/delete signatures
- Set default signature
- Rich text editor for signature content
- Preview signature

**Settings Panel (within email page):**
- Configure sync frequency
- Configure from name / reply-to address
- Auto-reply / out-of-office message (stored in platform_settings)
- Email notification preferences

#### E6. Edge Function: `ionos-email-sync`
Cron-triggered edge function that periodically syncs IONOS inbox to `email_cache`:
- Runs every 5 minutes via pg_cron
- Fetches new emails since last sync (using IMAP SINCE date or UID tracking)
- Inserts new emails into `email_cache`
- Updates read/starred flags for existing emails
- Removes emails that were deleted on the server

#### E7. Update Existing `send-correspondence` Edge Function
- Add option to send via IONOS SMTP instead of Resend
- Fallback chain: IONOS → Resend → log only
- Include proper email headers (Message-ID, Date, MIME-Version)

#### E8. Link Client Correspondence to Emails
- When receiving inbound email (via sync), auto-match to clients by sender email
- Create `client_correspondence` record linked to the `email_cache` entry
- Show correspondence timeline alongside email thread in client detail views

---

### F. Full 400-Point Gap Analysis (Gaps 1–400 — PRESERVED FROM PREVIOUS PLAN)

#### Authentication & Security (1–25)
1. No email verification enforcement  2. No password strength validation  3. No client-side login rate limiting  4. No CAPTCHA on auth forms  5. No re-auth on sensitive actions  6. No role-specific loading in ProtectedRoute  7. No "remember me" option  8. No MFA/2FA  9. No account lockout  10. Google OAuth not implemented  11. No confirmation UI after password reset email  12. No session invalidation on password change  13. `handle_new_user` hardcodes admin email  14. No IP-based admin access control  15. No CSRF beyond defaults  16. No SignNow token rotation  17. Stripe webhook signature verification gaps  18. No CSP headers  19. No audit log for failed logins  20. No audit log for profile updates  21. No audit log for document deletions  22. Admin email check hardcoded  23. No re-auth for destructive actions  24. Guest booking no verification step  25. No logout confirmation

#### Database & Data Integrity (26–55)
26–55: No FK constraints, no cascading deletes, no email validation, no unique on profiles.user_id, negative payments allowed, no future-date constraint, no day_of_week range check, missing indexes, NULL fees_charged, duplicate HAGUE arrays, no soft deletes, no data export, no unique on setting_key, no FK on e_seal, no pagination (1000 limit), EIN plain text, no retention policy, no lead dedup, no chat length limit, no file_path validation, no backup schedule, no rating range check, status free text, missing "no_show" status, redundant columns, no updated_at triggers

#### Frontend UI/UX (56–105)
56–105: No Services skeleton, no empty portal state, no breadcrumbs, no "no results" illustration, mobile menu doesn't close, no admin shortcuts, no back-to-top, tab overflow on mobile, no cancel confirmation, no drag-drop upload, no dark mode transition, no offline indicator, no PWA, no contact form animation, no chart skeletons, no active sidebar highlight, no truncated tooltips, no fee calc PDF, no print styles, no skip-to-content, no focus management, no aria-live, form errors not announced, no high-contrast, color-only status, no responsive admin tables, no lazy images, hero may 404, no favicon, no OG meta, no JSON-LD, page titles reset, no 404 for invalid services, no RON timeout warning, no auto-save notes, no char counters, no file type validation, no file size limits, no image preview, no bulk admin actions, no CSV/PDF export, no date range filters, no admin sorting, no column visibility, no notification persistence, no admin client search, no pagination component, raw file paths in portal, no PDF viewer, no QR download

#### Booking & Appointments (106–135)
106–135: No timezone handling, no buffer time, no daily limit, no holiday blocking, no recurring, no modification, no waitlist, no SMS, no calendar sync, no duration estimation, no reminder retry, no template preview, no confirmation email, no past-date validation, time slot race condition, no deposit, no password visibility toggle, no admin booking summary, stale fallback array, no doc carry-over on rebook, no multi-signer, no group booking, no location validation, hardcoded coordinates, no booking embed, no shareable URLs, localStorage never expires, no cancel reason, no cancel policy display, no minimum advance time

#### RON Session (136–160)
136–160: No video recording, no ID screenshot, no KBA questions, no location attestation, no witness management, no multi-document, no time tracking, no session expiry, no tech check pre-join, no eligibility at booking, no session replay, bluenotary_session_url empty, signer_ip empty, no seal application, no certificate generation, no SignNow domain validation, no reschedule, no pre-session review, no post-session feedback, no recording consent, no timezone on commission expiry, hardcoded oaths, no multilingual oaths, no signature pad, voice-to-notes no punctuation

#### Document Management (161–180)
161–180: No versioning, no sharing, no expiry tracking, no searchable OCR, no tagging, no PDF merge, no batch upload, no approval workflow, no signed URLs, no virus scan, no watermark, no diff view, no annotation, no e-sig for non-RON, no status transition validation, no retention policy, no wizard persistence, no batch digitize, no template versioning, no download tracking

#### Payment & Billing (181–200)
181–200: getClaims() broken (FIX), no invoices, no receipt email, no refunds, no payment history, webhook gaps, no subscription billing, no promo codes, no tax calc, no multi-currency, no installments, no late reminders, no saved cards, no payment error recovery, no Stripe Connect, no travel fee in payout, no minimum payment, no amount precision, no reconciliation, no idempotency keys

#### Communication & Chat (201–215)
201–215: No typing indicator, no read receipts, no file preview, no emoji picker, no E2E encryption, no push notifications, no email preferences, no email templates, no spam filter, no auto-responses, no transcript export, no group chat, no message search, no edit/delete, no unread badge

#### Admin Dashboard (216–240)
216–240: Hardcoded chart colors, no real-time updates, no custom widgets, no activity feed, no staff metrics, no revenue date range, no comparison view, no goal setting, no daily summary email, no numeric validation, no settings backup, no audit filtering, no audit export, no admin templates, no batch status, no impersonation, no admin 2FA, no session log, no role on invite, no permission granularity, no business onboarding, no SLA tracking, no auto-assignment, no workload balance, tests may fail silently

#### Edge Functions & API (241–265)
241–265: No assistant history, no session context, no confidence thresholds, no explain language, no scan caching, no OCR progress, no language validation, no lead dedup, no lead pagination, no scrape rate limit, no actionable SignNow errors, no webhook replay protection, no rate limit on stripe config, no health check, no API versioning, no request logging, no timeout handling, no error alerting, no API docs, no Content-Type validation, CORS wildcard, no request size limits, no cron for reminders, no webhook retry, no function health dashboard

#### Business Portal (266–275)
266–275: No team UI, no business pricing, no invoice aggregation, no signer UI, no verification UI, no doc sharing, no activity report, no billing history, no API access UI, no bulk booking

#### SEO & Infrastructure (276–290)
276–290: No SSR, no CDN, no image optimization, no bundle analysis, no Sentry, no analytics, no A/B testing, static sitemap, robots.txt no sitemap ref, no canonical URLs, no meta descriptions, no OG images, no Twitter Cards, AnimatePresence slowness, stale QueryClient

#### Compliance & Legal (291–305)
291–305: No cookie consent, no privacy link everywhere, incomplete terms, no GDPR export, no account deletion, no Ohio compliance at booking, no commission on e-seal, no recording consent (ORC), no signer ID log (ORC §147.53), no tamper-evident journal, no certificate chain, no e-seal revocation, e-seal shows "Notar" not notary name, no county validation, no compliance reporting

#### Mobile (306–315)
306–315: No PWA, no mobile scanning, MobileUpload camera only, no biometric, no offline, no mobile push, no responsive emails, admin not tablet-optimized, calendar not touch, no mobile RON

#### Testing (316–330)
316–330: 1 trivial test, no component tests, no integration tests, no E2E, no visual regression, no API tests, no perf tests, no a11y tests, no coverage, no CI/CD, no error boundary tests, no mock factories, no auth fixtures, no load testing, no pen testing

#### Miscellaneous (331–400)
331–400: No notification prefs, no profile pic, no address validation, no i18n, no help center, no onboarding tour, no keyboard nav, no undo, no changelog, no status page, no feedback widget, no referral, no affiliate, no cache strategy, no prefetching, no RON connection indicator, no browser compat, no min browser, no API key rotation UI, no webhook management UI, VirtualMailroom no scanning, SubscriptionPlans not configured, JoinPlatform no status, NotaryGuide no progress, RonEligibilityChecker no save, LoanSigningServices no inquiry workflow, DocumentBuilder no auto-save, no client doc request, no doc deadline, no type-specific pricing, no demand pricing, no tip option, no post-appointment survey, no follow-ups, no abandoned booking recovery, no marketing campaigns, no blog/CMS, no review response management, no social sharing, no QR per service, no calendar embed, no availability widget, no partner dashboard, no white-label UI, no custom domain, no email domain verification, no SPF/DKIM guidance, no compliance certificates, no batch journal export, no commission renewal reminders, no E&O tracking, no surety bond tracking, no CE tracking, no multi-state commission, no interstate compact, no doc-type automation, no conditional form logic, no file conversion, no stamp customization, no appointment note templates, no quick-reply templates, no saved responses, no client segmentation, no lifecycle tracking, no credit/balance, no prepaid packages, no gift certificates, no seasonal pricing, no service availability scheduling, no service dependencies

---

### G. Additional 500 Gaps (401–900) — NEW

#### Advanced Authentication & Identity (401–430)
401. No passwordless/magic-link login option  402. No SSO (SAML/OIDC) for enterprise clients  403. No device fingerprinting for session security  404. No trusted device management  405. No login history/activity log for users  406. No concurrent session limit enforcement  407. No geographic login anomaly detection  408. No password expiration policy  409. No forced password change on first login  410. No account recovery via phone number  411. No identity provider linking (merge social + email accounts)  412. No user impersonation audit trail  413. No API key generation for business accounts  414. No OAuth scope management for API access  415. No JWT token revocation mechanism  416. No session fingerprint validation (user-agent + IP)  417. No adaptive authentication (step-up for risky actions)  418. No security question fallback for account recovery  419. No brute-force IP blacklisting  420. No honeypot fields on public forms  421. No bot detection on booking forms  422. No signup domain allowlist/blocklist  423. No email alias detection (user+alias@gmail)  424. No disposable email detection  425. No account merge functionality  426. No delegated access (allow another user to act on behalf)  427. No temporary access tokens for document sharing  428. No role hierarchy enforcement  429. No permission inheritance for team members  430. No custom role creation for business accounts

#### Advanced Database & Data Management (431–470)
431. No database connection pooling configuration  432. No read replica routing for heavy queries  433. No materialized views for dashboard aggregations  434. No database query performance monitoring  435. No slow query logging  436. No data archival strategy for old appointments  437. No table partitioning for large tables  438. No full-text search indexes on documents/emails  439. No GIN index on JSONB columns  440. No database migration rollback strategy  441. No seed data for development/testing  442. No data anonymization for staging environments  443. No database schema documentation  444. No ERD (entity relationship diagram) maintained  445. No data dictionary  446. No column-level encryption for sensitive fields  447. No audit trail for schema changes  448. No database health monitoring  449. No automatic stale data cleanup  450. No data import from CSV/Excel  451. No data export to multiple formats  452. No database-level computed columns  453. No stored procedures for complex business logic  454. No database-level rate limiting  455. No row-level audit trail (who changed what)  456. No temporal tables (point-in-time queries)  457. No change data capture (CDC) for event sourcing  458. No database sharding strategy for scale  459. No connection timeout configuration  460. No deadlock detection and alerting  461. No database vacuum scheduling  462. No TOAST table management for large text  463. No foreign data wrapper for external data  464. No custom aggregation functions  465. No recursive CTE for hierarchical data  466. No window function usage for running totals  467. No partial indexes for filtered queries  468. No BRIN indexes for time-series data  469. No generated columns for derived values  470. No constraint exclusion for partitioned tables

#### Advanced UI/UX & Design System (471–540)
471. No design system documentation  472. No component library storybook  473. No design tokens file  474. No spacing scale documentation  475. No typography scale beyond Tailwind defaults  476. No color palette documentation  477. No icon set documentation  478. No animation guidelines  479. No micro-interactions on buttons and cards  480. No skeleton screens for all data-loading states  481. No optimistic UI updates for mutations  482. No infinite scroll on any list  483. No virtual scrolling for large lists  484. No command palette (Cmd+K)  485. No global search across all entities  486. No recent items / quick access panel  487. No bookmarks/favorites for frequent pages  488. No dashboard widget drag-and-drop  489. No split-view for comparing documents  490. No side-by-side diff for document versions  491. No inline editing in admin tables  492. No column reordering in admin tables  493. No column resizing in admin tables  494. No frozen columns in wide tables  495. No row grouping in admin tables  496. No tree/hierarchical table view  497. No Kanban board view for appointments  498. No timeline/Gantt view for scheduling  499. No calendar heat map for availability  500. No sparkline charts in table cells  501. No contextual help tooltips on form fields  502. No form field dependency visualization  503. No multi-step form progress persistence across sessions  504. No form auto-fill from previous submissions  505. No smart defaults based on user history  506. No input masking for phone/SSN/date fields  507. No address autocomplete on all address fields  508. No map view for appointment locations  509. No route optimization for mobile notary  510. No dark mode for email templates  511. No theme customization beyond dark/light  512. No custom accent color selection  513. No compact/comfortable/spacious density toggle  514. No right-to-left (RTL) language support  515. No multi-window/tab synchronization  516. No persistent layout preferences  517. No collapsible sections memory  518. No notification sound options  519. No desktop notification support  520. No system tray integration  521. No floating action button on mobile  522. No pull-to-refresh on mobile lists  523. No swipe gestures on mobile cards  524. No haptic feedback on mobile interactions  525. No bottom sheet navigation on mobile  526. No voice search capability  527. No barcode/QR scanner in mobile view  528. No augmented reality document scanner  529. No gesture-based navigation  530. No picture-in-picture for RON video  531. No mini-player for ongoing RON sessions  532. No breadcrumb trail memory  533. No recently viewed items panel  534. No page transition loading indicators  535. No content placeholder shimmer effects on all pages  536. No error state illustrations (beyond generic text)  537. No success state animations  538. No empty state illustrations for all views  539. No onboarding checklist widget  540. No progress bars for multi-step processes

#### Advanced Booking & Scheduling (541–580)
541. No multi-provider scheduling (multiple notaries with individual calendars)  542. No resource/room scheduling  543. No double-booking prevention with lock mechanism  544. No appointment dependency chains  545. No preparation time before appointments  546. No cleanup/processing time after appointments  547. No lunch break / personal time blocking  548. No seasonal availability templates  549. No emergency/rush appointment slots  550. No priority queue for premium clients  551. No booking approval workflow for certain services  552. No automated waitlist notification  553. No calendar color coding by service type  554. No appointment notes visible to client before session  555. No pre-appointment checklist for clients  556. No automated document request before appointment  557. No appointment rescheduling policy enforcement  558. No late cancellation fee enforcement  559. No no-show fee processing  560. No appointment series/package tracking  561. No linked appointments (parent/child)  562. No travel time calculation between appointments  563. No geo-fencing for service area  564. No dynamic pricing by time slot (peak/off-peak)  565. No last-minute discount slots  566. No appointment rating prompts (automated)  567. No appointment follow-up task creation  568. No post-appointment document delivery tracking  569. No appointment history export for clients  570. No calendar widget for client portal  571. No appointment sharing (send to another person)  572. No appointment delegation  573. No multi-timezone client display  574. No daylight saving time handling  575. No appointment conflict resolution  576. No batch appointment creation  577. No recurring appointment management UI  578. No appointment template creation  579. No appointment type-specific fields  580. No appointment SLA timer

#### Advanced RON & Notarization Compliance (581–620)
581. No real-time audio/video quality monitoring  582. No automatic session recording with timestamped events  583. No biometric verification (face match against ID)  584. No credential analysis API for document verification  585. No automated fraud detection on IDs  586. No multi-state RON compliance rule engine  587. No dynamic oath scripts per document type and state  588. No electronic notary journal with tamper-proof signatures  589. No blockchain-anchored audit trail  590. No MISMO standards compliance for mortgage documents  591. No EDGAR compliance for SEC filings  592. No UETA/ESIGN compliance documentation  593. No automated compliance reporting per Ohio ORC §147.60-66  594. No secretary of state integration for commission verification  595. No real-time commission validation API  596. No multi-jurisdictional fee schedule enforcement  597. No automated statutory citation in certificates  598. No county recorder integration for recorded documents  599. No electronic recording (e-recording) integration  600. No document classification by notarial act type  601. No automated certificate of notarial act attachment  602. No venue/jurisdiction auto-detection  603. No signer credible witness workflow  604. No foreign language interpreter integration  605. No ADA compliance for RON sessions (captioning, screen reader)  606. No session bandwidth test before start  607. No fallback audio channel if video drops  608. No split-screen document + video layout  609. No document annotation during RON session  610. No real-time co-browsing of documents  611. No electronic stamp placement tool  612. No batch notarization within single session  613. No session pause/resume capability  614. No session participant management (add/remove signers)  615. No notary handoff (transfer session to another notary)  616. No cross-session document reference  617. No automated notary journal entry creation on finalization  618. No journal entry digital signature requirement  619. No session expiry warning for signer  620. No emergency session termination with audit log

#### Advanced Document Processing (621–660)
621. No AI-powered document classification  622. No intelligent field extraction from scanned documents  623. No document comparison between versions  624. No redaction tools for sensitive information  625. No digital watermark embedding  626. No document chain-of-custody tracking  627. No notarized document download with certificate bundle  628. No document integrity verification (hash check)  629. No document access control lists  630. No document workflow automation rules  631. No conditional routing based on document type  632. No automated document validation rules  633. No document template variable substitution  634. No merge document from multiple sources  635. No document splitting (multi-page to individual)  636. No document reordering (page sequence)  637. No document rotation/crop tools  638. No document optical mark recognition (OMR)  639. No handwriting recognition  640. No barcode/QR code reading from documents  641. No document archival with retention schedule  642. No document destruction certification  643. No long-term preservation format (PDF/A conversion)  644. No document metadata stripping  645. No EXIF data removal from images  646. No document encryption at rest  647. No document decryption key management  648. No document preview generation (thumbnail)  649. No document full-text indexing  650. No document tagging taxonomy  651. No document collections/folders  652. No document sharing links with expiration  653. No document access analytics  654. No document download rate limiting  655. No document format conversion pipeline  656. No document batch export with zip  657. No document import from cloud storage (Google Drive, Dropbox)  658. No document scanner integration (TWAIN/WIA)  659. No document OCR language selection  660. No document OCR confidence scoring

#### Advanced Payment & Financial (661–700)
661. No split payment support (multiple payment methods)  662. No payment escrow for pending services  663. No automatic invoicing on appointment completion  664. No recurring billing for subscription services  665. No payment dispute management  666. No chargeback handling workflow  667. No ACH / bank transfer payment option  668. No cash payment recording  669. No check payment recording  670. No payment receipt PDF generation  671. No financial reporting dashboard  672. No profit/loss tracking  673. No expense tracking for mobile notary  674. No mileage tracking and reimbursement  675. No tax report generation (1099 preparation)  676. No sales tax collection by jurisdiction  677. No payment link generation for invoices  678. No partial payment / balance tracking  679. No payment plan setup and management  680. No overdue payment alerts  681. No automatic late fee calculation  682. No payment gateway failover  683. No multi-gateway routing (Stripe + PayPal)  684. No cryptocurrency payment acceptance  685. No payment analytics (average order value, conversion)  686. No revenue forecasting  687. No budget vs actual tracking  688. No client credit memo issuance  689. No batch payment processing  690. No vendor/subcontractor payment tracking  691. No commission calculation for referrals  692. No tiered pricing for volume clients  693. No dynamic pricing engine  694. No coupon/voucher management UI  695. No gift card system  696. No loyalty points program  697. No prepaid balance top-up  698. No payment notification customization  699. No financial audit trail  700. No PCI DSS compliance documentation

#### Advanced Communication & Notifications (701–740)
701. No email threading/conversation view  702. No email templates library with variables  703. No email scheduling (send later)  704. No email tracking (open/click rates)  705. No email bounce handling and retry  706. No SMS integration (Twilio/MessageBird)  707. No WhatsApp Business integration  708. No in-app notification center with history  709. No notification grouping/batching  710. No notification priority levels  711. No do-not-disturb schedules  712. No notification delivery confirmation  713. No web push notification support  714. No email digest (daily/weekly summary)  715. No automated birthday/anniversary messages  716. No client milestone notifications  717. No staff task assignment notifications  718. No escalation notifications (SLA breach)  719. No custom notification sounds  720. No notification templates per event type  721. No multi-channel notification routing  722. No notification preference center for clients  723. No automated appointment reminder sequence  724. No post-service follow-up sequence  725. No re-engagement notification triggers  726. No feedback request automation  727. No referral request automation  728. No thank-you message automation  729. No seasonal greeting automation  730. No system maintenance notification  731. No service disruption alerts  732. No real-time chat with typing indicators  733. No chat bot for common questions  734. No chat transfer to human agent  735. No chat satisfaction rating  736. No canned responses for chat  737. No chat analytics (response time, resolution)  738. No voicemail transcription  739. No call recording integration  740. No video message support

#### Advanced Admin & Operations (741–780)
741. No staff shift scheduling  742. No staff time tracking  743. No staff payroll integration  744. No staff commission tracking  745. No staff certification verification  746. No staff training module  747. No staff performance reviews  748. No KPI dashboard per staff member  749. No task management system  750. No project management for complex services  751. No workflow builder (visual)  752. No automation rules engine  753. No trigger-based actions  754. No approval chain management  755. No delegation of authority matrix  756. No SLA definition and monitoring  757. No quality assurance scoring  758. No customer satisfaction scoring (NPS)  759. No churn prediction  760. No client health score  761. No client lifetime value calculation  762. No reporting builder (custom reports)  763. No scheduled report delivery  764. No data export API  765. No webhook management for external integrations  766. No Zapier/Make integration  767. No custom integration builder  768. No API rate limiting dashboard  769. No system health monitoring  770. No uptime monitoring  771. No error rate tracking  772. No performance dashboards  773. No capacity planning tools  774. No demand forecasting  775. No inventory management (supplies, seals)  776. No equipment tracking  777. No vehicle/mileage tracking for mobile notary  778. No multi-location management  779. No franchise management features  780. No white-label management dashboard

#### Advanced Business Intelligence & Analytics (781–820)
781. No Google Analytics 4 integration  782. No conversion funnel tracking  783. No attribution modeling  784. No A/B test results dashboard  785. No heat map analytics (user interaction)  786. No session recording playback  787. No user flow visualization  788. No cohort analysis  789. No retention analysis  790. No revenue by service category report  791. No revenue by time period comparison  792. No client acquisition cost tracking  793. No marketing ROI tracking  794. No geographic heat map of clients  795. No service popularity trending  796. No booking conversion rate tracking  797. No appointment completion rate tracking  798. No average handle time tracking  799. No client satisfaction trending  800. No NPS score tracking over time  801. No custom event tracking  802. No goal completion tracking  803. No e-commerce analytics (for paid services)  804. No funnel visualization builder  805. No dashboard sharing/embedding  806. No scheduled analytics emails  807. No real-time analytics dashboard  808. No predictive analytics  809. No anomaly detection in metrics  810. No benchmark comparison (industry standards)  811. No ROI calculator for marketing campaigns  812. No client segmentation by revenue  813. No client segmentation by service type  814. No client segmentation by geography  815. No client segmentation by engagement  816. No churn risk scoring  817. No upsell/cross-sell opportunity detection  818. No service recommendation engine  819. No demand prediction by day/time  820. No pricing optimization suggestions

#### Advanced Security & Compliance (821–860)
821. No penetration test scheduling  822. No vulnerability scanning integration  823. No dependency vulnerability monitoring  824. No OWASP top 10 compliance review  825. No SOC 2 compliance documentation  826. No HIPAA compliance for medical notarization  827. No FedRAMP compliance for government work  828. No CCPA compliance (California clients)  829. No data processing agreement (DPA) management  830. No third-party vendor risk assessment  831. No incident response plan  832. No data breach notification system  833. No security incident log  834. No access review schedule  835. No least privilege enforcement audit  836. No encryption key rotation schedule  837. No certificate management (SSL/TLS)  838. No security awareness training tracking  839. No phishing simulation for staff  840. No document classification (public/internal/confidential)  841. No data loss prevention rules  842. No email content scanning for sensitive data  843. No USB/external device policy enforcement  844. No network segmentation documentation  845. No backup encryption verification  846. No disaster recovery plan  847. No business continuity plan  848. No RTO/RPO documentation  849. No tabletop exercise scheduling  850. No compliance calendar  851. No regulatory change monitoring  852. No audit preparation toolkit  853. No evidence collection for audits  854. No control testing documentation  855. No risk register management  856. No risk assessment scheduling  857. No security metrics dashboard  858. No compliance scorecard  859. No vendor security questionnaire management  860. No subprocessor registry

#### Advanced Integration & Interoperability (861–900)
861. No Google Workspace integration  862. No Microsoft 365 integration  863. No Slack notification integration  864. No Zoom integration for RON sessions  865. No DocuSign integration (alternative e-sign)  866. No QuickBooks integration for accounting  867. No Xero integration for accounting  868. No Salesforce CRM integration  869. No HubSpot CRM integration  870. No Calendly integration  871. No Google Maps API for distance calculation  872. No USPS address verification API  873. No LexisNexis integration for KBA  874. No IDology integration for ID verification  875. No Plaid integration for bank verification  876. No Twilio integration for SMS  877. No SendGrid integration fallback  878. No AWS S3 integration for document backup  879. No Google Drive integration for doc import  880. No Dropbox integration for doc import  881. No Notarize.com API for overflow  882. No OneSpan integration for e-signatures  883. No FreshBooks integration  884. No Gusto payroll integration  885. No ADP integration  886. No Deel integration for international payments  887. No Intercom for customer support  888. No Zendesk for ticket management  889. No Jira for internal task tracking  890. No GitHub integration for developer access  891. No Webhook.site for testing  892. No Postmark for transactional email fallback  893. No Cloudflare for CDN/WAF  894. No DataDog for APM  895. No PagerDuty for alerting  896. No LaunchDarkly for feature flags  897. No Segment for event routing  898. No Mixpanel for product analytics  899. No Amplitude for behavioral analytics  900. No OpenAI embeddings for document search

---

### Files Modified

| File | Change |
|------|--------|
| New DB migration | INSERT 14 services + CREATE email_cache, email_drafts, email_signatures tables |
| `src/pages/admin/AdminServices.tsx` | Add 6 category options |
| `src/pages/admin/AdminSettings.tsx` | Remove `ron_session_method` setting |
| `src/pages/Services.tsx` | Add categories, labels, icons, INTAKE_ONLY entries |
| `src/pages/booking/bookingConstants.ts` | Add 6 categories to DIGITAL_ONLY_CATEGORIES |
| `src/pages/ServiceRequest.tsx` | Add intake field configs for 14 services |
| `supabase/functions/create-payment-intent/index.ts` | Fix `getClaims()` → `getUser()` |
| `src/pages/Index.tsx` | Add hero image fallback |
| `src/pages/admin/AdminEmailManagement.tsx` | Complete rewrite as full IONOS email client |
| New: `supabase/functions/ionos-email/index.ts` | IMAP/SMTP gateway edge function |
| New: `supabase/functions/ionos-email-sync/index.ts` | Periodic email sync cron function |
| `supabase/functions/send-correspondence/index.ts` | Add IONOS SMTP option |
| Edge functions (various) | Standardize CORS handling |

### Required New Secrets
- `IONOS_EMAIL_ADDRESS`
- `IONOS_EMAIL_PASSWORD`
- `IONOS_IMAP_HOST` (default: `imap.ionos.com`)
- `IONOS_SMTP_HOST` (default: `smtp.ionos.com`)

### What Stays the Same
- All existing services, tables, RLS policies
- SignNow edge function (used elsewhere)
- RON client view, ID verification, KBA, oath, voice notes, finalization
- All auth flows, portals, admin pages not listed above
- Realtime subscriptions, commission expiry checks
- Existing `client_correspondence` table and functionality (enhanced, not replaced)

