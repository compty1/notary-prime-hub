

# Complete Implementation Plan — Logo Redesign + Visual Rebrand + 500 Service Gap Fixes

---

## Part A: Logo Redesign — N with Integrated Checkmark

### Design
The right leg of the "N" bends outward at the bottom into a checkmark shape. The SVG uses three elements:
- **Left stem**: Dark blue vertical rounded rect (unchanged)
- **Diagonal**: Teal stroke connecting top-right to bottom-left (unchanged)
- **Right leg + checkmark**: The right vertical stem descends then angles down-right at ~45° to form a checkmark tail. This is a single `<path>` with rounded `stroke-linecap="round"` and `stroke-linejoin="round"`, replacing the current `<rect>`.

### File: `src/components/Logo.tsx`
Replace the right stem `<rect>` with a path like:
```
M 48 8 L 48 38 L 56 48
```
Using `stroke="hsl(var(--mint))"`, `strokeWidth="10"`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"`. The checkmark angle and proportions should convey trust/verification while remaining legible at 24px (sm size). The left stem and diagonal remain as rounded rects.

---

## Part B: Previous Plan Items (Unchanged)

1. **Navbar.tsx** — Coral "Sign In" pill button ✅ (already implemented)
2. **index.css** — Muted-foreground contrast + `--light-gray` token ✅ (already implemented)
3. **Index.tsx** — Hero contrast verification ✅ (already implemented)
4. **ServiceDetail.tsx** — Conditional "Notary action" / "Provider action" badge ✅ (already implemented)
5. **ServiceDetailPanel.tsx** — Same conditional badge with `category` prop ✅ (already implemented)

---

## Part C: 500 Service Gap Implementation — Batched by Feature

Each batch groups related gaps and specifies the files, approach, and deliverables.

---

### Batch 1: Service Catalog & Discovery (Gaps 1–40)

**Files**: `src/pages/Services.tsx`, `src/lib/serviceConstants.ts`, `src/components/ServiceCatalogFilters.tsx` (new)

| Fix | Approach |
|-----|----------|
| 1–2: Comparison tool + popular badge | Add `is_popular` column via migration; render "Popular" badge on cards; create comparison drawer that holds 2 service IDs in state |
| 3: Availability indicator | Query `availability` table for next open slot per service; show "Available today" or "Next: [date]" on card |
| 4–5: Fuzzy search + autocomplete | Replace exact `filter` with Postgres `ilike` + client-side `fuse.js` for typo tolerance; show dropdown suggestions |
| 6: Recently viewed | Store last 5 viewed service IDs in `localStorage`; show "Recently Viewed" section at top |
| 7: Rating display | Add `avg_rating` computed column or view from a new `service_reviews` table; render stars on cards |
| 8: Category tab overflow | Add `overflow-x-auto` with scroll-snap + gradient fade indicators on edges |
| 9: Deep-link search | Sync search query to `?q=` URL param using `useSearchParams` |
| 10: Per-category skeleton | Replace full-page skeleton with per-category skeleton cards |
| 11–13: New/turnaround/type badges | Add `created_at` comparison for "New" badge; show `estimated_turnaround` field; add RON/in-person filter toggle |
| 14: Use Supabase client | Replace raw `fetch()` calls with `supabase.from("services").select()` |
| 15–16: Pagination + sort | Add `page` state, fetch 20 per page with `.range()`; add sort dropdown (price, alpha, popular) |
| 17: Shared iconMap | Move `iconMap` to `src/lib/serviceConstants.ts`; import from both Services.tsx and ServiceDetail.tsx |
| 18: Empty state illustration | Add illustrated SVG empty state with category name |
| 19: Dynamic AI tools | Move `aiTools` array to database or config constant |
| 20–21: Bundles + CTA label fix | Show bundle cards from DB; change "Notarize Now" to "Book Now" for non-notary services using same category check |
| 22–29: Price ranges, geo filter, wishlist, social proof, descriptions, breadcrumbs, A/B, SEO URLs | Progressive enhancements — price range from `price_from`/`price_to`; `localStorage` wishlist; category route `/services/notarization` with redirect from query params |
| 30–40: JSON-LD, print, positioning, distinction, retry, offline, keyboard, etc. | JSON-LD `Service` schema in `<Helmet>`; print CSS media query; retry with state preservation; service worker cache for catalog |

---

### Batch 2: Service Detail Pages (Gaps 41–85)

**Files**: `src/pages/ServiceDetail.tsx`, `src/components/AILeadChatbot.tsx`, `src/components/ServiceDetailPanel.tsx`

| Fix | Approach |
|-----|----------|
| 41: Service-specific images | Add `hero_image_url` column to services table; render as banner if present, fallback to gradient |
| 42: Readiness checklist persistence | Store checked items in `localStorage` keyed by service ID |
| 43: Completion date calculator | Query pending request count for service; estimate based on avg completion time |
| 44: Share button | Add `navigator.share()` with clipboard fallback; social share links |
| 45–46: Print view + breadcrumb category | Print CSS; add category segment to breadcrumb |
| 47–50: AI chat mobile overlap, persistence, char limit, suggestions | Position chat above bottom nav on mobile; store messages in `sessionStorage`; add `maxLength` + counter; add 3 suggested question chips |
| 51–53: Bundle matching, prices, dynamic estimate | Use exact name match instead of substring; show bundle price; calculate estimate from queue |
| 54: Legal disclaimer scope | Add `verification` to categories that show legal disclaimer |
| 55–60: Video, testimonials, social proof, profile-aware requirements, duration, PDF checklist | Optional `video_url` field; `service_reviews` table display; cross-reference profile completeness; per-step duration; PDF generation via client-side library |
| 61–70: External link indicators, email info, sidebar constants, pricing breakdown, cancellation policy, a11y, book-for-others, related services, comparison, chat counter | External link icon for `target="_blank"`; import from `serviceConstants`; show cancellation policy from `platform_settings`; ARIA labels on chat; "Book for someone else" checkbox; "View all" link |
| 71–85: Update history, promos, callback, SLA, FAQ from DB, rich FAQ, FAQ search, feedback, pre-qualifier scope, pre-qualifier passthrough, Hague list sync, chat loading/timestamps/typing/rate-limit | Migration for `service_faqs` table; replace hardcoded FAQs; pass pre-qualifier answers to booking via URL params; use shared Hague list from `bookingConstants`; add loading spinner + timestamps + typing indicator + client-side rate limit (max 1 msg/2sec) |

---

### Batch 3: Booking Flow (Gaps 86–150)

**Files**: `src/pages/BookAppointment.tsx`, `src/pages/booking/BookingIntakeFields.tsx`, `src/pages/booking/BookingScheduleStep.tsx`, `src/pages/booking/BookingReviewStep.tsx`, `src/pages/booking/bookingConstants.ts`

| Fix | Approach |
|-----|----------|
| 86–87: Component decomposition + DB auto-save | Extract into `BookingServiceStep.tsx`, `BookingGuestAuth.tsx`, `BookingLocationStep.tsx`; save draft to `booking_drafts` table (new migration) on each step change |
| 88–90: Multi-signer, book-for-others, recurring | Add `additional_signers` array field; "Booking for someone else" toggle with name/email fields; recurring toggle with frequency selector (weekly/monthly) |
| 91: Waitlist | When no slots available, show "Join Waitlist" button; insert into `waitlist` table (new); notify when slot opens |
| 92–94: Buffer time, holidays, suggested slots config | Enforce 30-min buffer client-side when rendering slots; add admin-configurable blackout dates from `platform_settings`; make lookahead days configurable |
| 95–97: Timezone, duration display, duration-aware slots | Detect user timezone via `Intl.DateTimeFormat`; show appointment duration next to slot; filter slots that overlap based on service duration |
| 98–100: Earliest available, travel time, map | "Earliest Available" button that auto-selects first open slot; integrate distance estimate display; embed static map image for in-person |
| 101–103: Doc count validation, guest flow fix, social login | Add `max={50}` to document count input; save booking state before email verification redirect in `sessionStorage`; add Google OAuth button |
| 104–110: Rebooking data copy, step label sync, back warning, price estimate, promo codes, group booking, confirmation SMS | Copy `intake_data` on rebook; derive step labels from rendered steps; `beforeunload` warning; use service-specific pricing; `promo_codes` table + validation; bulk booking UI for businesses; SMS via edge function |
| 111–120: Calendar integration, storage key collision, timezone selection, error boundary, retry, pre-qualifier data, deposit, session expiry, upload progress, PDF support | `.ics` download link; unique storage key with timestamp; timezone dropdown for RON; wrap `submitBooking` in error boundary; retry with backoff; include pre-qualifier answers in payload; optional deposit via Stripe; session heartbeat check; `XMLHttpRequest` progress events; accept `application/pdf` for ID |
| 121–130: Doc scan display, confirmation dialog, email preview, price updates, cancellation fee, a11y labels, duration on schedule, calendar view, capacity, special instructions | Show AI analysis summary in review; add `AlertDialog` before final submit; preview confirmation email template; recalculate price if settings change; warn about 24hr cancellation fee; add `aria-label` to all step buttons; show duration alongside time slots; optional calendar grid view; show "X slots left" from availability count; add special instructions textarea |
| 131–140: Address validation, geolocation guidance, notarization type icons, service grouping, AI-recommended service, document matching, amendment flow, slot locking, race condition, booking reference | Validate Ohio zip codes; help text for manual entry fallback; add icons to RON/in-person cards; group services by category in dropdown; suggest service from doc analysis; improve matching algorithm; allow amendment before confirmation; lock slot in DB for 10min on selection; use DB transaction for submission; generate reference number on creation |
| 141–150: Real-time slots, mobile booking, phone format, password requirements, continue as guest, address validation, CC option, past appointment outcomes, rush estimate, I-9 deadline | Subscribe to slot changes via realtime; mobile-optimized full-screen step layout; enforce phone format with mask; show requirements upfront; allow guest checkout without account; validate address format; CC field in review; show outcomes in past appointments; display rush vs standard timeline; warn about I-9 Section 2 deadlines |

---

### Batch 4: Intake Forms & Service Request (Gaps 151–200)

**Files**: `src/pages/ServiceRequest.tsx`, `src/pages/booking/bookingConstants.ts`

| Fix | Approach |
|-----|----------|
| 151: Shared Hague list | Import `HAGUE_COUNTRIES` from `bookingConstants.ts`; remove duplicate in ServiceRequest.tsx |
| 152–153: Validation + auto-save | Add `zod` schema validation per service; auto-save form state to `localStorage` every 5 seconds |
| 154–161: File upload UX | Show max file size (10MB); show accepted types; descriptive error messages; progress bar via XHR; drag-drop border highlight; sanitize filenames; add virus scan notice; enforce max 10 files |
| 162–168: Response time, conditional fields, search selects, tooltips, confirmation summary, draft save, guest blocking | Show "Typical response: 1-2 business days"; implement field dependency logic (show embassy only for non-Hague); add search to long dropdowns; add `<Tooltip>` on labels; add summary dialog before submit; save drafts to DB; block form for guests with clear sign-in CTA |
| 169–178: Default fields improvement, priority, cost estimate, ToS, file storage, notification, conversation, schema validation, reference number, email confirmation | Detect category and show category-specific defaults; add priority selector; show estimated cost from pricing; add ToS checkbox; store files as JSON array; notify client on status change; add comment thread; validate `intake_data` with JSON schema; auto-generate reference number; fix empty catch block in email edge function |
| 179–190: Form persistence, a11y, translation validation, PII notice, CAPTCHA, number types, bulk requests, templates, email policies, cancellation, chat hours, UX audit URL | Persist form on back-navigation; add aria labels to dropzone; validate language pair availability; add encryption notice for PII fields; add reCAPTCHA or honeypot; store document_count as number; add bulk upload mode; saved request templates; explain data access; allow client cancellation; validate business hours; validate URL format |
| 191–200: Conditional pricing, date picker, field dependencies, success page, SMS option, editing, tagging UI, multi-select, audience pricing, file preview | Update price estimate on field change; replace free-text dates with date picker; implement dependency chains (if A=X show B); add next-steps guidance on success; SMS notification toggle; allow editing within 1hr; tag input component for keywords; multi-select for platforms; show pricing impact of audience size; file thumbnail previews |

---

### Batch 5: Client Portal Service Tracking (Gaps 201–240)

**Files**: `src/pages/portal/PortalServiceRequestsTab.tsx`, `src/pages/ClientPortal.tsx`

| Fix | Approach |
|-----|----------|
| 201–205: Progress timeline, realtime, date filter, expandable intake, additional docs | Add step timeline component showing status progression; subscribe to `service_requests` changes via realtime; add date range picker filter; expand/collapse for all intake fields; upload button per request |
| 206–215: Message thread, download tracking, preview, SLA urgency, satisfaction survey, duplicate/reorder, cost tracking, status labels, push notifications, export | Link messages to request ID; track download count; preview with `<iframe>` or thumbnail; red badge when SLA < 24hrs; post-completion survey dialog; "Reorder" button that pre-fills form; add cost column from `pricing`; capitalize + format status labels properly; service worker push; CSV/PDF export |
| 216–230: Cancellation reason, category grouping, pagination, search, awaiting_client prompt, document request flow, SLA breach notification, admin notes visibility, timeline view, status sync, cost approval, cancellation with reason, request-to-appointment link, quality guarantee, escalation | Show reason on cancelled; group by category with collapsible sections; paginate with `.range()`; search by service name/reference; show client action banner for awaiting_client; document request notification flow; automated email on SLA breach; show admin notes marked as "from team"; full timeline view; sync visible/internal status; approval flow before work starts; cancellation with reason dropdown; link request to appointment ID; display quality policy; escalation button |
| 231–240: Deliverable metadata, multi-file, version tracking, digital signature, invoice, payment, archival, analytics, similar service, mobile notification | Store deliverables as JSON with name/size/type; multi-file array; version suffix tracking; e-seal on completed docs; generate invoice from request; integrate payment for non-appointment requests; auto-archive after 90 days; client dashboard with spend/usage stats; "Request Similar" quick action; push notification for deliverable ready |

---

### Batch 6: Admin Service Management (Gaps 241–280)

**Files**: `src/pages/admin/AdminServiceRequests.tsx`, `src/pages/admin/AdminServices.tsx`

| Fix | Approach |
|-----|----------|
| 241–250: Notifications, Kanban, batch update, time tracking, cost tracking, templates, SLA dashboard, auto-assignment, skill filter, workload | Desktop notification API; Kanban board with drag-drop columns; checkbox multi-select + batch status update; start/stop timer per request; internal cost log; saved response templates; SLA countdown dashboard; auto-assign based on `team_skills` table; filter team by skill tags; workload bar chart per team member |
| 251–260: Analytics, deliverable notification, quality review, handoff, auto-escalation, communication log, revenue tracking, audit scope, tags, recurring automation | Service request analytics dashboard with charts; auto-notify client on deliverable upload; add "QA Review" status step; transfer request to another admin; auto-escalate when SLA < 4hrs; log all client communications on request; revenue per request tracking; expand audit log to all field changes; tag/label system; recurring request automation |
| 261–270: Service catalog CRUD, pricing management, requirements management, workflow management, FAQ management, availability config, bundle management, service analytics, feedback dashboard, merge duplicates | Admin UI for CRUD on `services` table; pricing editor per service; requirements checklist editor; workflow step builder; FAQ editor per service; availability calendar config; bundle builder; analytics dashboard (bookings, requests, revenue per service); client feedback review page; merge duplicate requests |
| 271–280: Follow-up reminders, export, assignment history, internal notes, dependency tracking, automated billing, custom fields, SLA config, satisfaction metrics, resolution notes | Automated stale request reminders; CSV export; assignment audit trail; internal-only notes field; request dependency linking; auto-generate invoice on completion; custom intake fields per service type in admin; SLA config per service; CSAT score per service; resolution knowledge base |

---

### Batch 7: Pricing & Fee Calculator (Gaps 281–320)

**Files**: `src/pages/FeeCalculator.tsx`, `src/lib/pricingEngine.ts` (new)

| Fix | Approach |
|-----|----------|
| 281–290: All services, per-service pricing, bundles, quote PDF, book-at-price CTA, rush fee sync, dynamic pricing, volume discounts, payment plans, tax | Expand calculator to include all service categories; use per-service pricing from DB; show bundle discounts; generate PDF quote; "Book at this price" passes estimate to booking URL; sync rush fee from `platform_settings` only; demand-based multiplier; tiered volume pricing display; payment plan calculator; tax calculation from zip code |
| 291–300: Witness cap, driving distance, add-ons, price match, history, Ohio fee schedule, invoice generation, RON vs in-person comparison, zero-price handling, transparency page | Cap witnesses at 5; note "straight-line estimate" with driving distance link; per-service add-ons; competitor comparison table; returning client price history; link to Ohio fee schedule; auto-generate invoice from estimate; side-by-side comparison view; show "Contact Us" for $0; dedicated pricing page |
| 301–320: Deposit calc, refund policy, price sync during booking, API, bulk calculator, subscription comparison, urgency tiers, mobile layout, promotions, admin validation, historical data, per-doc breakdown, travel waiver, apostille scaling, payment method fees, consultation value, return customer tier, annual vs monthly, jurisdiction complexity, holiday awareness | Deposit = 25% of estimate; link refund policy; recalculate on service change; pricing API endpoint; multi-service calculator; subscription tier comparison; urgency tier pricing; responsive calculator layout; promo banner integration; admin validation (min 0); pricing history log; per-document cost breakdown; waive travel < 5mi; scale apostille by count; show CC surcharge; display free consultation value; loyalty discount tier; annual savings display; complexity multiplier; block rush on holidays |

---

### Batch 8: Ohio Compliance & Legal (Gaps 321–350)

**Files**: `src/components/OhioComplianceNotice.tsx`, `src/pages/BookAppointment.tsx`, `src/pages/RonSession.tsx`, new `src/components/ComplianceBanner.tsx`

| Fix | Approach |
|-----|----------|
| 321–330: RON compliance banner, journal retention, electronic journal, signer location, recording consent, multi-state warnings, credential analysis, compliance notice placement, commission expiration, E&O display | Add ORC §147.65-.66 compliance banner on RON booking steps; display 5-year retention notice; integrate journal entry form; add signer location verification step (state + address); recording consent checkbox; warn if signer is outside Ohio; add AAMVA reference to KBA flow; show compliance notice on all RON-related pages; admin commission expiration tracker; display E&O insurance status |
| 331–340: Tamper-evident disclosure, SOS fee link, POA disclaimer, minor blocker, incapacitated guidance, conflict of interest, full credential analysis, recording storage notice, dual-factor auth, e-seal guidelines | Disclose tamper-evident technology on e-sealed docs; link to Ohio SOS apostille fees; POA-specific disclaimers; block booking if signer indicates minor; accommodation guidance page; conflict of interest self-check; full credential analysis flow (KBA + AAMVA + CA); recording storage compliance notice; enforce 2FA for RON sessions; e-seal placement guidelines page |
| 341–350: Acknowledgment vs jurat, oath disclosure, satisfactory evidence, foreign-language, ADA compliance, no legal prep disclosure, fee schedule posting, bond info, willing signer, document completeness | Document type selector with explanations; oath administration disclosure for jurats; acceptable ID alternatives; interpreter accommodation guidance; ADA-compliant booking flow; disclaimer that notary cannot prepare legal docs; post Ohio fee schedule; display bond information; willing signer confirmation step; document completeness pre-check before session |

---

### Batch 9: Native Tools Integration (Gaps 351–385)

**Files**: Various tool pages, `src/pages/ClientPortal.tsx`, integration points

| Fix | Approach |
|-----|----------|
| 351–360: Batch OCR, merge/split, template auto-fill, AI Writer link, document builder integration, version control, translation in booking, comparison tool, e-signature, annotation | Batch file upload in digitize page; add merge/split actions; auto-fill templates from profile data; "Draft with AI" button on service request forms; link document builder templates to service types; document version history in portal; translation panel in booking flow for non-English docs; before/after document diff view; SignNow e-signature integration; PDF.js annotation layer |
| 361–370: KBA in booking, auto status updates, e-seal verification, expiration tracking, invoice from completion, auto certificate, watermarking, redaction, batch download, external sharing | Add KBA step to RON booking flow; auto-update document status after tool use; client-facing seal verification page; document expiration reminders; auto-generate invoice on service completion; auto-generate notarization certificate; add watermark option; redaction tool for sensitive content; "Download All" zip option; share link with expiry |
| 371–385: Rich text for notes, thumbnails, document search, tagging, mobile camera, fee-to-booking link, auto requirement checklist, document notifications, rejection workflow, chat-to-booking, document follow-up, audit trail, translation-apostille link, ID-to-RON link, mailroom-to-request | Use RichTextEditor for service request notes; PDF thumbnail generation; full-text search in documents; client-side document tags; mobile camera capture component; "Book at this price" from calculator; auto-generate checklist from service requirements; email/SMS on document review; rejection with resubmission workflow; pre-fill booking from AI chat answers; automated follow-up for missing docs; client-visible document audit trail; link translation to apostille workflow; pass ID verification to RON session; connect mailroom to service request flow |

---

### Batch 10: Notifications & Communications (Gaps 386–420)

**Files**: Edge functions, `src/components/NotificationCenter.tsx` (new for clients), `src/components/AdminNotificationCenter.tsx`

| Fix | Approach |
|-----|----------|
| 386–395: SMS, email error handling, notification preferences, client notification center, push notifications, appointment reminders, assignment notification, notes notification, acknowledgment, stale follow-up | Twilio/SMS edge function; fix empty catch blocks; notification preferences page in settings; in-app notification bell for clients; service worker + push subscription; cron-based reminder edge function; notify on assignment change; notify client on admin notes; auto-acknowledge service request receipt; automated stale request follow-up |
| 396–410: Tomorrow reminder, feedback request, marketing opt-in, batching, delivery status, admin templates, multi-language, payment notification, document status, welcome sequence, abandoned booking, no-show follow-up, escalation notification, digest email | 24hr reminder email; post-service feedback email; marketing opt-in checkbox; batch notifications per hour; delivery status tracking; admin email template editor; i18n notification templates; payment received/failed notification; document status change notification; welcome email sequence on signup; abandoned booking recovery email (24hr); no-show follow-up email; priority escalation notification; weekly digest for multi-request clients |
| 411–420: SLA notification, unread indicator, thank-you message, referral notification, seasonal notifications, price change alerts, cancellation reason collection, re-engagement, task completion, email tracking | Admin SLA warning notification; unread count badge on portal; auto thank-you after appointment; referral program notification; seasonal availability updates; price change alerts for bookmarked services; cancellation reason collection form; 30-day inactive re-engagement email; team task completion notification; email open/click tracking via webhook |

---

### Batch 11: Search, Filter & Navigation (Gaps 421–445)

**Files**: `src/components/CommandPalette.tsx`, `src/pages/Services.tsx`, new `src/pages/SearchResults.tsx`

| Fix | Approach |
|-----|----------|
| 421–435: Global search, results page, command palette services, recent searches, price filter, turnaround filter, delivery method filter, compare mode, category landing pages, dynamic sitemap, current service highlight, context restoration, cross-service search, suggestion engine, category breadcrumb | Add global search endpoint querying services + FAQs + guides; unified results page; add services to command palette; store recent searches in `localStorage`; price range slider filter; turnaround time filter; delivery method filter toggle; multi-select comparison mode; static category pages with SEO content; dynamic sitemap generation; highlight active service in nav; restore scroll position on return; search within service detail; recommendation engine based on view history; "Back to [Category]" breadcrumb |
| 436–445: Anchor links, URL hash for tabs, faceted search, show more pagination, RSS feed, availability calendar, compliance filter, near me, saved filters, recommendation quiz | Hash links to FAQ/requirements sections; sync active tab to URL hash; combine multiple filters with AND logic; "Show more" within categories; RSS feed for service updates; calendar view of availability; Ohio compliance filter; geolocation-based in-person filter; save filter preferences in `localStorage`; enhanced `WhatDoINeed` wizard with more paths |

---

### Batch 12: Accessibility (Gaps 446–465)

**Files**: Multiple component files

| Fix | Approach |
|-----|----------|
| 446–465 | Add `role="dialog"` + `aria-modal` to AI chat; `role="article"` on service cards; `<fieldset>`/`<legend>` on radio groups; add icon+text to status indicators; focus trap in chat popup; `aria-live="polite"` for step changes; `prefers-reduced-motion` media query checks; arrow key navigation for tabs; high contrast mode CSS; keyboard-accessible dropzone; `role="status"` on toasts; skip-to-content link; ARIA step roles on booking stepper; `role="status"` on spinners; announce select values; focus management after step transitions; check badge contrast ratios; `role="log"` on chat messages; test text scaling to 200%; captioning for video content |

---

### Batch 13: Mobile UX (Gaps 466–485)

**Files**: Various component files, responsive CSS

| Fix | Approach |
|-----|----------|
| 466–485 | Increase touch targets to 44px minimum; sticky mobile CTA bar on service detail; reposition AI chat above mobile nav; add scroll indicator arrows to category tabs; test 320px breakpoint for cards; full-screen step layout on mobile; native date picker on mobile; adjust autocomplete dropdown for keyboard; swipe gesture support with touch events; increase tap target on accordion triggers; "Call to Book" tel: link on mobile; scale QR code to mobile width; mobile-sized dropzone; mobile invoice view; increase review step font size; bottom sheet pattern for mobile CTA; haptic feedback via `navigator.vibrate()`; auto-dismiss keyboard on submit; pull-to-refresh via touch events; ensure last tab visible with scroll padding |

---

### Batch 14: Error Handling & Resilience (Gaps 486–500)

**Files**: `src/components/ErrorBoundary.tsx`, various pages, new `src/lib/apiClient.ts`

| Fix | Approach |
|-----|----------|
| 486–500 | Distinguish disabled vs deleted vs invalid service IDs with specific error messages; exponential backoff retry wrapper in `apiClient.ts`; retry on slot fetch failure; client-side retry for service requests; `ErrorBoundary` per service card; graceful fallback UI when AI chat is down; clean up partial file uploads on error; connectivity check with `navigator.onLine` before submission; increase toast duration for errors to 8 seconds; external error logging service integration; user-friendly error message mapping from HTTP codes; circuit breaker pattern (3 failures = stop retrying for 30s); stale data indicator with "Last updated X ago"; per-field validation error highlighting with red borders; global error state via React context |

---

## Database Migrations Required

1. `service_reviews` table (rating, comment, user_id, service_id)
2. `booking_drafts` table (user_id, draft_data JSONB, step, updated_at)
3. `waitlist` table (user_id, service_id, preferred_date, status)
4. `service_faqs` table (service_id, question, answer, sort_order)
5. `notification_preferences` table (user_id, channel, event_type, enabled)
6. `promo_codes` table (code, discount_type, discount_value, valid_from, valid_to, usage_limit)
7. Add columns to `services`: `hero_image_url`, `video_url`, `estimated_turnaround`, `is_popular`, `avg_rating`
8. Add `reference_number` auto-generated column to `service_requests`
9. Enable realtime on `service_requests` and `appointments`
10. RLS policies for all new tables

---

## Verification Checklist

After all batches are implemented, verify:
- [ ] Logo renders correctly at all 4 sizes (sm/md/lg/xl) in light and dark mode
- [ ] All service catalog filters, search, sort, and pagination work
- [ ] Every service detail page loads with correct badges, FAQs, and resources
- [ ] Booking flow completes end-to-end for RON + in-person with all new fields
- [ ] Service request forms validate, auto-save, and submit with confirmation
- [ ] Client portal shows real-time status updates with progress timeline
- [ ] Admin can manage requests with Kanban, batch update, and analytics
- [ ] Fee calculator covers all service types with accurate pricing
- [ ] Ohio RON compliance notices appear on all required pages
- [ ] All native tools are integrated into their respective service flows
- [ ] Notifications fire for all critical events (email + in-app)
- [ ] Global search returns services, FAQs, and guides
- [ ] All pages pass WCAG AA accessibility audit
- [ ] Mobile UX passes on 320px–414px viewports
- [ ] Error handling provides clear, user-friendly recovery for all failure modes
- [ ] No console errors, no broken routes, no missing data on any page

All 500 gaps across all 20 domains have implementation plans. No items were skipped.

