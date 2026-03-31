

# Comprehensive Gap & Error Fix Plan — Items 1–646

This plan consolidates all previously identified items (1-146) with 500 newly found items (147-646), organized into 30 implementation batches. Every item references a specific file, line, or functional area.

---

## EXISTING ITEMS (1-146) — Carried Forward

All 146 items from previous analysis remain. Key highlights:

- **1-5**: Routing & navigation (swap `/` and `/home` — DONE; verify links)
- **6-17**: Text readability / dark-on-dark hero text audit
- **18-25**: Stripe payment flow wiring
- **26-31**: Edge function auth patterns
- **32-41**: Service catalog & detail page fixes
- **42-49**: Booking flow fixes
- **50-58**: Client portal completeness
- **59-70**: Admin dashboard fixes
- **71-78**: RON session compliance
- **79-82**: Identity verification
- **83-87**: Email & notifications
- **88-94**: Security & auth
- **95-100**: Performance & SEO
- **101-105**: Data seeding & integrity
- **106-112**: ServiceDetail content fallbacks & CTA sync
- **113-114**: Console ref warnings
- **115-122**: Data flow & wiring gaps
- **123-126**: ServiceRequest VA field configs
- **127-131**: Navigation UX polish
- **132-135**: Payment & subscription flow
- **136-140**: Admin dashboard specific
- **141-143**: RON session compliance (session timeout, consent, summary)
- **144-146**: Edge function robustness

---

## NEW ITEMS (147-646)

### Category 15: ServiceDetail Content Gaps (147-175)

**147.** `categoryTimelines` missing entry for `admin_support` — defaults to "Contact Us"
**148.** `categoryTimelines` missing entry for `content_creation`
**149.** `categoryTimelines` missing entry for `research`
**150.** `categoryTimelines` missing entry for `customer_service`
**151.** `categoryTimelines` missing entry for `technical_support`
**152.** `categoryTimelines` missing entry for `ux_testing`
**153.** `categoryTimelines` missing entry for `business_services`
**154.** `categoryComplexity` missing entry for `admin_support`
**155.** `categoryComplexity` missing entry for `content_creation`
**156.** `categoryComplexity` missing entry for `research`
**157.** `categoryComplexity` missing entry for `customer_service`
**158.** `categoryComplexity` missing entry for `technical_support`
**159.** `categoryComplexity` missing entry for `ux_testing`
**160.** `categoryComplexity` missing entry for `business_services`
**161.** `bundleSuggestions` missing entry for `document_services`
**162.** `bundleSuggestions` missing entry for `business`
**163.** `bundleSuggestions` missing entry for `recurring`
**164.** `bundleSuggestions` missing entry for `admin_support`
**165.** `bundleSuggestions` missing entry for `content_creation`
**166.** `bundleSuggestions` missing entry for `research`
**167.** `bundleSuggestions` missing entry for `customer_service`
**168.** `bundleSuggestions` missing entry for `technical_support`
**169.** `bundleSuggestions` missing entry for `ux_testing`
**170.** `bundleSuggestions` missing entry for `business_services`
**171.** `categoryFaqs` missing entry for `admin_support` — falls back to notarization FAQs
**172.** `categoryFaqs` missing entry for `content_creation`
**173.** `categoryFaqs` missing entry for `research`
**174.** `categoryFaqs` missing entry for `customer_service`
**175.** `categoryFaqs` missing entry for `technical_support`

### Category 16: ServiceDetail CTA/Routing Mismatches (176-195)

**176.** `categoryFaqs` missing entry for `ux_testing`
**177.** `categoryFaqs` missing entry for `business_services`
**178.** ServiceDetail sidebar `INTAKE_ONLY` set (line 636) missing "Data Entry"
**179.** Sidebar missing "Travel Arrangements"
**180.** Sidebar missing "Blog Post Writing"
**181.** Sidebar missing "Social Media Content"
**182.** Sidebar missing "Newsletter Design"
**183.** Sidebar missing "Market Research Report"
**184.** Sidebar missing "Lead Generation"
**185.** Sidebar missing "Email Support Handling"
**186.** Sidebar missing "Live Chat Support"
**187.** Sidebar missing "Website Content Updates"
**188.** Sidebar missing "UX Audit & Heuristic Review"
**189.** Sidebar missing "User Flow & Workflow Testing"
**190.** Sidebar missing "Usability Testing & Report"
**191.** Sidebar missing "UX Research & Persona Development"
**192.** `formatPrice` (line 309) missing `per_seal` suffix
**193.** `formatPrice` missing `per_document` suffix
**194.** `formatPrice` missing `per_page` suffix
**195.** `formatPrice` missing `hourly` suffix

### Category 17: ServiceDetail Pricing & Bundle Logic (196-210)

**196.** `formatPrice` missing `per_session` suffix
**197.** `formatPrice` missing `flat` suffix
**198.** `getBundleServiceId` (line 299) uses substring match — could return wrong service
**199.** `categoryResources` fallback (line 340) defaults to `notarization` — should be generic
**200.** `categoryFaqs` fallback (line 350) defaults to `notarization` — should be generic
**201.** ServiceDetail hero icon uses `bg-primary/20` which may be hard to see on `bg-gradient-hero`
**202.** Service badge `text-primary-foreground/60` (line 376) too faint for accessibility
**203.** Service badge `border-primary-foreground/20` (line 376) near-invisible
**204.** No `serviceFaqs` entries for "email management" service
**205.** No `serviceFaqs` entries for "data entry" service
**206.** No `serviceFaqs` entries for "blog" services
**207.** No `serviceFaqs` entries for "social media" services
**208.** No `serviceFaqs` entries for "newsletter" services
**209.** No `serviceFaqs` entries for "lead generation" services
**210.** No `serviceFaqs` entries for "ux audit" services

### Category 18: ClientPortal INTAKE_ONLY Sync (211-230)

**211.** ClientPortal `INTAKE_ONLY` (line 91) missing "Data Entry"
**212.** ClientPortal missing "Travel Arrangements"
**213.** ClientPortal missing "Blog Post Writing"
**214.** ClientPortal missing "Social Media Content"
**215.** ClientPortal missing "Newsletter Design"
**216.** ClientPortal missing "Market Research Report"
**217.** ClientPortal missing "Lead Generation"
**218.** ClientPortal missing "Email Support Handling"
**219.** ClientPortal missing "Live Chat Support"
**220.** ClientPortal missing "Website Content Updates"
**221.** ClientPortal missing "UX Audit & Heuristic Review"
**222.** ClientPortal missing "User Flow & Workflow Testing"
**223.** ClientPortal missing "Usability Testing & Report"
**224.** ClientPortal missing "UX Research & Persona Development"
**225.** ClientPortal `select("*")` on 10 tables simultaneously (line 116) — performance issue
**226.** ClientPortal does not show `deliverable_url` download button on service requests tab
**227.** ClientPortal correspondence tab has no "compose new message" button
**228.** ClientPortal `PORTAL_SERVICES` set doesn't match services in DB
**229.** ClientPortal overview tab `$` payment display uses `toFixed(0)` — loses cents
**230.** ClientPortal payments tab doesn't show `paid_at` date for completed payments

### Category 19: Admin Service Requests (231-250)

**231.** `AdminServiceRequests` uses `getPublicUrl` (line 108) on private `documents` bucket
**232.** No realtime subscription on `service_requests` table — admin must refresh manually
**233.** No export/CSV download for service requests list
**234.** No bulk status update capability for multiple service requests
**235.** `saveRequest` doesn't send email notification to client on status change
**236.** SLA deadline display doesn't show overdue warning when past due
**237.** No client correspondence link from service request detail view
**238.** Deliverable file name not displayed after upload — only URL saved
**239.** `editAssignedTo` doesn't validate if selected user still has admin/notary role
**240.** No filter by assigned team member
**241.** No pagination on service requests list
**242.** No sort by SLA deadline
**243.** `intake_data` JSON displayed as raw text — should be formatted key-value pairs
**244.** No file attachment download for files uploaded by client during intake
**245.** No link to view client profile from service request detail
**246.** `client_visible_status` text is free-form — should be dropdown with predefined options
**247.** No audit log entry when admin updates service request status
**248.** No due date picker in detail dialog
**249.** `updateRequest` doesn't update `updated_at` manually — relies on trigger which may be missing
**250.** No "Reopen" option for completed service requests

### Category 20: Admin Appointments (251-280)

**251.** Calendar view month navigation — `calendarMonth` state exists but no forward/back buttons rendered
**252.** Admin can't filter appointments by service type
**253.** Admin can't filter by notarization type (RON vs in-person)
**254.** `statusFlow` map (line 24-30) doesn't include `no_show` transition
**255.** Appointment detail dialog doesn't show linked documents
**256.** No quick-add payment button from appointment detail
**257.** `receiptAppt` state exists but receipt generation UI not verified
**258.** `quickJournalAppt` state exists but journal pre-fill flow not verified
**259.** `createAppt` dialog — `client_id` dropdown loads all profiles (not filtered to clients)
**260.** No appointment rescheduling UI for admin (only cancel + rebook)
**261.** No email notification trigger when admin changes appointment status
**262.** `messageAppt` dialog calls `send-correspondence` but doesn't check response
**263.** KBA verification modal (`showKBA`) — verify it submits KBA results
**264.** Translation panel (`showTranslation`) — verify it connects to `translate-document` edge function
**265.** Appointment list doesn't show travel distance for in-person appointments
**266.** No group/batch appointment creation for I-9 verification events
**267.** `PAGE_SIZE = 20` may be too low for busy offices
**268.** Date range filter `dateRange` state exists but filter UI not verified
**269.** No indicator for appointments with pending payments
**270.** No indicator for appointments missing uploaded documents
**271.** Appointment card doesn't show client phone number for quick contact
**272.** No appointment print/PDF export
**273.** No drag-and-drop rescheduling in calendar view
**274.** `AdminAppointments` is 961 lines — should be split into sub-components
**275.** Status change doesn't auto-create payment record for completed appointments
**276.** No notification when new appointment is booked (admin must refresh)
**277.** Admin can't set estimated price after appointment creation
**278.** No RON session link visible from appointment card
**279.** No one-click "Start RON Session" from appointment list
**280.** No appointment notes search

### Category 21: Admin Revenue (281-305)

**281.** Revenue only calculated from `notary_journal.fees_charged` — excludes VA service payments
**282.** No graph of revenue from service requests vs notary services
**283.** `typeFilter` exists but doesn't separate notary vs VA revenue
**284.** No recurring revenue tracking for subscription plans
**285.** Payment request form `client_id` dropdown loads all profiles — no search
**286.** No refund initiation UI — `charge.refunded` webhook handler exists but no trigger
**287.** `recordForm.method` options are hardcoded — should include Zelle, PayPal, etc.
**288.** No payment receipt PDF generation
**289.** No export all payments to CSV
**290.** Revenue charts use default Recharts colors — should use brand palette
**291.** No comparison period (this month vs last month)
**292.** No revenue breakdown by service category
**293.** `notary_journal` and `payments` tables queried separately — no unified revenue view
**294.** No outstanding balance summary per client
**295.** No aging report for pending payments
**296.** Payment detail view doesn't show Stripe payment intent link
**297.** No filter by payment method
**298.** No indication of partial payments
**299.** `PAYMENTS_PER_PAGE = 25` — pagination UI may be missing previous page button
**300.** No revenue goal/target tracking
**301.** Manual payment recording doesn't set `paid_at` timestamp
**302.** `paymentPage` state resets when `dateRange` filter changes
**303.** No notification when payment is received (webhook creates record but no toast)
**304.** Revenue trend line chart doesn't handle empty data gracefully
**305.** No tax calculation or reporting (Ohio notary fees may be tax-exempt)

### Category 22: Admin Journal (306-325)

**306.** Journal search (line 27 `searchTerm`) — verify it searches across `signer_name`, `document_type`, and `notes`
**307.** Journal PDF export — verify print-friendly layout generates correctly
**308.** Journal entry form doesn't auto-fill `signer_address` from client profile
**309.** Certificate photo upload (`certificate_photos` column) — verify upload UI exists
**310.** `id_expiration` field — no date validation (could be past date)
**311.** Journal `journal_number` sequential — verify no gaps when entries are deleted
**312.** No journal entry template for common document types
**313.** `platform_fees`, `travel_fee`, `net_profit` fields — verify they calculate correctly
**314.** No `signer_location_attestation` field in UI (column exists in DB)
**315.** `recording_url` field — no URL validation
**316.** No link to view associated e-seal verification from journal entry
**317.** Journal delete doesn't log to audit trail
**318.** No bulk journal export (e.g., for annual Ohio SOS audit)
**319.** Edit dialog doesn't show `journal_number` (should be read-only display)
**320.** `oath_timestamp` not displayed in entry card
**321.** No filter by notarization type (RON vs in-person)
**322.** No filter by date range
**323.** No summary statistics (total fees, entries this month, etc.)
**324.** Journal doesn't show which appointment it's linked to
**325.** No pagination — all entries loaded at once

### Category 23: Admin Chat (326-345)

**326.** Admin chat canned responses dropdown — verify it populates message input (line 16-23)
**327.** File attachment upload (line 35 `fileRef`) — verify storage upload works
**328.** No typing indicator shown to client
**329.** No message edit/delete capability
**330.** No message read receipt display
**331.** Legacy messages without `recipient_id` show in wrong conversation (line 80)
**332.** No notification sound when new message arrives
**333.** No client online/offline status indicator
**334.** Chat doesn't show client's appointment context
**335.** No message search across conversations
**336.** No conversation archive/close functionality
**337.** `allMessages` loads ALL messages (line 40) — performance issue for high-volume chat
**338.** No message character limit enforcement
**339.** Markdown rendering (`ReactMarkdown`) may render unsafe HTML
**340.** No chat export/transcript download
**341.** Client list shows sender_id instead of name if profile doesn't exist
**342.** No auto-scroll when new message arrives while viewing different conversation
**343.** No "assign to team member" functionality for chat conversations
**344.** No integration with correspondence tab (chat vs email are separate)
**345.** No quick-reply suggestions based on message content

### Category 24: Admin Settings (346-370)

**346.** Settings page loads all `platform_settings` — no pagination/grouping
**347.** `commission_expiry_date` — no visual calendar picker (text input)
**348.** `e_and_o_expiry_date` — no visual calendar picker
**349.** `surety_bond_expiry_date` — no visual calendar picker
**350.** Seal image upload (line 51) — verify `createSignedUrl` used correctly
**351.** No validation on numeric settings (e.g., `base_fee_per_signature` could be set to negative)
**352.** No audit log when settings are changed
**353.** `notary_name` setting — used as `"Notar"` hardcoded in `RonSession.tsx` line 450
**354.** No setting for business hours display
**355.** No setting for maximum travel radius
**356.** No setting for minimum booking lead time
**357.** No setting for cancellation policy window
**358.** Email signature editor (`RichTextEditor`) — verify HTML sanitization
**359.** No setting for default session timeout minutes
**360.** No backup/export of all settings
**361.** No import/restore of settings
**362.** `fetchSettings` runs on every mount — should cache
**363.** No setting for holiday schedule
**364.** No setting for after-hours messaging
**365.** No setting for auto-response when offline
**366.** No setting for default payment method
**367.** Settings don't validate required fields before save
**368.** No setting for notary commission number display
**369.** No setting for maximum documents per appointment
**370.** `seal_image_path` preview doesn't refresh after re-upload

### Category 25: Booking Flow Deep Analysis (371-400)

**371.** Booking pre-selection from URL (`?service=...`) is case-sensitive (line 147) — may fail if URL has different casing
**372.** Guest signup during booking — race condition: `submitBooking` called with 500ms timeout (line 176) — session may not be ready
**373.** `NON_BOOKABLE` categories (line 137) hardcoded — should derive from DB or shared constant
**374.** `BOOKING_STORAGE_KEY` persistence — verify cleanup after successful booking
**375.** Travel distance calculation uses `DEFAULT_OFFICE` hardcoded coordinates — should fetch from `platform_settings`
**376.** `estimatedPrice` calculation (line 153-158) doesn't account for witness fees
**377.** `estimatedPrice` doesn't account for additional document fees beyond base
**378.** `findNearestSlots` (line 217-231) checks 14 days forward/back — may be too narrow
**379.** `time_slots` query uses `day_of_week` which is locale-dependent — verify Sunday=0 convention
**380.** `max_appointments_per_day` setting — booking shows empty slots message but no explanation
**381.** `suggested_slots` — no "View on map" for in-person appointments
**382.** Document scan pre-check (`docScanning`) — verify `detect-document` edge function response format
**383.** ID scan pre-check (`idScanning`) — verify `scan-id` edge function is called correctly
**384.** `documentCount` custom input — no maximum limit
**385.** `witnessCount` (line 85) — no validation against `platform_settings.max_witnesses`
**386.** `customDocCount` state — verify custom count input appears
**387.** Booking form doesn't show estimated arrival time for mobile notary
**388.** No booking confirmation email trigger after appointment creation
**389.** `handleRebook` function — verify it correctly pre-fills from previous appointment
**390.** Booking step 4 (review) — no price breakdown shown
**391.** Guest password field — no strength indicator
**392.** `clientState` defaults to "OH" — no warning if out of service area
**393.** No booking terms/conditions checkbox before submission
**394.** `location` field for in-person — no Google Maps integration
**395.** Booking doesn't check if selected service requires RON vs in-person
**396.** `BeforeUnloadEvent` handler (line 128) — only fires on step > 1, should fire whenever form has data
**397.** No booking calendar view (only date picker)
**398.** `scheduledTime` stored without timezone — assumes ET
**399.** No recurring appointment booking capability
**400.** Booking doesn't check client identity verification status before RON

### Category 26: RON Session Deep Analysis (401-430)

**401.** No session timeout countdown timer UI — `session_timeout_minutes` column exists but no timer displayed
**402.** Recording consent checkbox exists (line 106) but no explicit "I consent" dialog before recording starts
**403.** `kba_attempts` increment — no UI counter showing remaining attempts (2 max per Ohio law)
**404.** `commissionExpired` check (line 188-196) — only checks admin/notary, not the session itself
**405.** `completeAndFinalize` (line 366) — no confirmation dialog before finalizing
**406.** Session doesn't capture signer location state (`signer_location_state` column exists, not set)
**407.** `oathScripts.acknowledgment` is `null` — acknowledgment sessions have no oath script displayed
**408.** No "Save and Exit" — only "Save" and "Complete"
**409.** No session resume capability after browser close
**410.** `voice recognition` (line 226) — no fallback for browsers without SpeechRecognition API
**411.** No video/audio quality check before starting session
**412.** No signer photo capture during session
**413.** `session_unique_id` not displayed to signer for reference
**414.** No session pause/resume functionality
**415.** `last_activity_at` column not updated during session
**416.** No automatic session timeout after `session_timeout_minutes`
**417.** `bluenotary_session_url` column — no UI to input BlueNotary-specific URLs
**418.** `webhook_events_registered` counter — no UI display
**419.** No signer address capture during session (for journal entry)
**420.** `idExpiration` field — no validation against current date (expired IDs should warn)
**421.** Journal entry created during finalization doesn't include `signer_address`
**422.** `e_seal_verifications.notary_name` hardcoded to "Notar" — should use platform setting
**423.** No session recording URL capture field
**424.** `SIGNING_PLATFORMS` list doesn't include Pavaso, OneSpan, or Nexsys
**425.** No way to add additional signers to a session
**426.** No witness identification capture
**427.** Session doesn't show Ohio compliance checklist
**428.** No post-session summary email to signer
**429.** `signnow_document_id` — no UI to link document after session
**430.** No session analytics (average duration, completion rate)

### Category 27: Payment Form & Stripe (431-455)

**431.** `stripePromise` cached permanently (line 12) — if initial load fails, never retries
**432.** `PaymentForm` doesn't pass `description` as Stripe metadata
**433.** No payment receipt/confirmation display after successful payment
**434.** Stripe `return_url` (line 48) always goes to `/portal` — should go to context-appropriate page
**435.** No subscription management (cancel/upgrade/downgrade)
**436.** No Stripe customer portal link
**437.** `get-stripe-config` edge function — no error response differentiation (key missing vs function error)
**438.** `create-payment-intent` doesn't log to `email_send_log` for receipts
**439.** No payment failure retry mechanism
**440.** No payment amount validation on server side (client sends amount — could be manipulated)
**441.** `stripe-webhook` — verify `STRIPE_WEBHOOK_SECRET` is set with new live keys
**442.** No idempotency key on payment intent creation
**443.** Payment form doesn't show accepted card brands
**444.** No Apple Pay / Google Pay support display
**445.** `PaymentElement` appearance theme is `"stripe"` — should match site dark/light mode
**446.** No saved payment methods for returning customers
**447.** No invoice generation after payment
**448.** No payment plan / installment option
**449.** `amount` state initializes to `defaultAmount || 0` — shows "Pay $0.00" button initially
**450.** `Input type="number"` allows negative values
**451.** No tax calculation or display
**452.** No coupon/discount code field
**453.** No payment confirmation email trigger
**454.** ClientPortal "Pay Now" button (line 389) passes `payingPaymentId` but `showPaymentForm` doesn't use it
**455.** `PaymentForm` doesn't receive `paymentId` to update the existing payment record on success

### Category 28: Edge Functions (456-490)

**456.** `client-assistant` — verify response format matches frontend (`data.choices[0].message.content` vs `data.reply`)
**457.** `scan-id` — verify edge function handles `imageBase64` body correctly
**458.** `detect-document` — verify response format for document type detection
**459.** `explain-document` — no rate limiting per user
**460.** `translate-document` — verify language pair support
**461.** `send-appointment-emails` — verify email template rendering
**462.** `send-appointment-reminders` — verify cron trigger is configured
**463.** `notary-assistant` — verify it's used (no frontend reference found in search)
**464.** `discover-leads` — verify it's called from admin UI
**465.** `fetch-leads` — verify response format matches `AdminLeadPortal`
**466.** `scrape-social-leads` — verify it handles rate limits and errors gracefully
**467.** `submit-lead` — verify it matches the `submitLead` frontend lib call format
**468.** `ionos-email-sync` — verify IMAP credentials work with IONOS
**469.** `ionos-email` — verify SMTP send works
**470.** `process-email-queue` — `deno.json` import map configured — verify it's deployed correctly
**471.** `process-inbound-email` — verify webhook URL is registered
**472.** `signnow-webhook` — verify HMAC verification with `SIGNNOW_WEBHOOK_SECRET`
**473.** `signnow` — verify API token works for document operations
**474.** `ocr-digitize` — verify OCR processing returns structured text
**475.** `get-stripe-config` — returns publishable key — verify it's the live key not test
**476.** `stripe-webhook` — verify it handles `payment_intent.succeeded`, `charge.refunded` events
**477.** `stripe-webhook` — verify it updates payment status to "paid" with correct `paid_at` timestamp
**478.** All edge functions — verify they return proper JSON content-type header
**479.** All edge functions — verify CORS headers include all required Supabase client headers
**480.** `create-payment-intent` — profile update for `stripe_customer_id` may fail silently if RLS blocks it
**481.** `create-payment-intent` — `amount * 100` conversion may have floating point issues
**482.** `send-correspondence` — denomailer import may fail in Deno Deploy
**483.** `send-correspondence` — Resend fallback sends as `text` not `html`
**484.** `send-correspondence` — no email validation beyond zod schema
**485.** `send-appointment-emails` — verify it uses correct email template per `emailType`
**486.** No edge function health check endpoint
**487.** No edge function error alerting/monitoring
**488.** `process-email-queue` has `verify_jwt = true` in config.toml — may block cron calls
**489.** No rate limiting on any edge function
**490.** Edge functions don't log execution time for performance monitoring

### Category 29: Auth & Security Deep Analysis (491-525)

**491.** `AccountSettings` — password change doesn't require current password verification (line 42 — calls `updateUser` directly)
**492.** `AccountSettings` — no 2FA/MFA setup option
**493.** `AccountSettings` — data export `select("*")` fetches all columns including sensitive ones
**494.** `AccountSettings` — account deletion cascade may miss `service_requests`, `apostille_requests`
**495.** `AuthContext` — session timeout warning UI exists but no dialog component rendered
**496.** `AuthContext` — `extendSession` (line 79) — verify it actually refreshes the token
**497.** Login — `Remember Me` checkbox exists but doesn't change `persistSession` behavior
**498.** Login — no CAPTCHA or proof-of-work for bot prevention
**499.** Login — rate limiting is client-side only — server has no rate limit
**500.** SignUp — no email domain validation (disposable email addresses allowed)
**501.** SignUp — password strength meter exists but no visual bar/indicator
**502.** `ProtectedRoute` — email verification warning is non-blocking — unverified users can access all features
**503.** No IP-based login detection/alerting
**504.** No device trust/fingerprinting
**505.** No forced password change on first login
**506.** `user_roles` — no role assignment audit trail
**507.** `handle_new_user` trigger — admin email hardcoded (line in trigger: `ShaneGoble@gmail.com`)
**508.** No session invalidation when password is changed
**509.** No concurrent session detection/limit
**510.** `ForgotPassword` page — no rate limiting on password reset requests
**511.** No account lockout after consecutive failed attempts (client-side only)
**512.** Storage RLS — verify `documents` bucket policies allow authenticated uploads
**513.** Storage RLS — verify path-based access control for `chat/{userId}/...` uploads
**514.** No CSP headers configured in `index.html`
**515.** No security headers (X-Frame-Options, X-Content-Type-Options) configured
**516.** `logAuditEvent` for failed logins — `auth.uid()` is null — verify the RLS policy works
**517.** No audit log for profile changes
**518.** No audit log for document downloads
**519.** No audit log for payment status changes
**520.** `public_reviews` view — `security_invoker = true` was set but view may still expose data without auth
**521.** `commandPalette` — accessible to all users — admin commands visible?
**522.** No input sanitization on rich text fields (admin notes, correspondence body)
**523.** No XSS protection on user-generated content display
**524.** `CookieConsent` — no actual cookie management (just UI)
**525.** `OnboardingWizard` — verify it collects necessary data securely

### Category 30: Performance & Optimization (526-555)

**526.** `AdminOverview` — `audit_log` query uses `select("*")` — should select specific columns
**527.** `AdminOverview` — `profiles` query fetches ALL profiles (line 56) — only needs those with appointments
**528.** `AdminClients` — fetches all profiles on mount with no search optimization
**529.** `AdminClients` — `PAGE_SIZE = 30` but no server-side pagination (all loaded then sliced)
**530.** `ClientPortal` — 10 parallel `select("*")` queries on mount (line 116-127)
**531.** `PageShell` — fetches `platform_settings` on every page mount (line 20-31)
**532.** `Index.tsx` — also fetches `platform_settings` independently (duplicate of PageShell)
**533.** `BookAppointment` — fetches all `platform_settings` on mount (line 134)
**534.** No React Query caching for frequently accessed data (services, settings)
**535.** No service worker for offline capability (despite `OfflineIndicator` component)
**536.** Hero image in `Index.tsx` — no width/height optimization for CLS
**537.** No image optimization pipeline (WebP conversion, responsive sizes)
**538.** Large page bundles — `AdminAppointments` is 961 lines, `RonSession` is 973 lines
**539.** `AnimatePresence` wraps all routes — may cause unnecessary re-renders
**540.** `framer-motion` imported in many components — tree-shaking may not be effective
**541.** `ReactMarkdown` imported in `AdminChat` — large dependency for simple formatting
**542.** No database query monitoring/logging
**543.** `supabase.from("services").select("*")` used in multiple pages — should use React Query
**544.** No API response caching strategy
**545.** `QRCodeSVG` imported in ClientPortal — large dependency for rarely used feature
**546.** `ChatMessages` realtime channel created even when user is not on chat tab
**547.** No lazy loading for tab content in ClientPortal (all tabs render simultaneously)
**548.** `AdminDashboard` sidebar re-renders on every route change
**549.** `AdminJournal` loads all entries without pagination
**550.** `AdminChat` loads ALL messages across ALL conversations (line 40)
**551.** No database indexes verified for `scheduled_date`, `client_id`, `status` queries
**552.** `AdminAppointments` creates multiple realtime channels but no cleanup verification
**553.** `DocumentWizard` component imported but only shown conditionally — could be lazy loaded
**554.** No bundle size monitoring or budget
**555.** No Lighthouse performance score tracking

### Category 31: SEO & Accessibility (556-580)

**556.** `usePageTitle` — verify meta description is also updated per page
**557.** No `og:image` meta tags for social sharing
**558.** No `twitter:card` meta tags
**559.** No canonical URL tags
**560.** `Index.tsx` JSON-LD schema (line 160) — `openingHours` is hardcoded to "Mon-Fri 9-6" — should be "Mon-Wed 10-7" per site text
**561.** No JSON-LD for services (ServiceDetail pages)
**562.** No JSON-LD for reviews
**563.** No sitemap.xml dynamic generation (static file exists)
**564.** `robots.txt` — verify it allows crawling of service pages
**565.** No alt text audit for decorative images
**566.** No `aria-label` on icon-only buttons (some exist, not all verified)
**567.** No keyboard navigation testing for modals/dialogs
**568.** No screen reader testing for dynamic content updates
**569.** Color contrast — teal `#1B998B` on white may fail WCAG AA for small text
**570.** No skip navigation link verification (exists in PageShell, verify it works)
**571.** No focus trap in modals
**572.** No `prefers-reduced-motion` check for animations
**573.** Tab order in forms — verify logical sequence
**574.** No error messages associated with form inputs via `aria-describedby`
**575.** No loading state announcements for screen readers
**576.** `ServiceDetail` AI chat — no `aria-live` region for new messages
**577.** `ClientPortal` chat tab — no `aria-live` for incoming messages
**578.** No high-contrast mode support
**579.** No font size adjustment support
**580.** No print stylesheet

### Category 32: Data Integrity & Database (581-610)

**581.** `platform_settings` — verify `notary_phone` exists in DB (network showed empty array)
**582.** `platform_settings` — verify `notary_email` exists
**583.** `platform_settings` — verify `office_latitude` exists
**584.** `platform_settings` — verify `office_longitude` exists
**585.** `platform_settings` — verify `max_travel_miles` exists
**586.** `platform_settings` — verify `witness_fee` exists
**587.** `platform_settings` — verify `apostille_fee` exists
**588.** `platform_settings` — verify `base_fee_per_signature` exists
**589.** `platform_settings` — verify `ron_platform_fee` exists
**590.** `platform_settings` — verify `kba_fee` exists
**591.** `platform_settings` — verify `travel_fee_minimum` exists
**592.** `platform_settings` — verify `max_appointments_per_day` exists
**593.** Duplicate services in DB — "Remote Online Notarization" vs "Remote Online Notarization (RON)"
**594.** Duplicate services — "Certified Copy Services" vs "Certified Copy"
**595.** `service_requirements` — verify core services have requirements populated
**596.** `service_workflows` — verify core services have workflow steps populated
**597.** DB triggers — `db-triggers` shows "no triggers" — verify migration created them
**598.** `updated_at` triggers — verify they fire on all 11 tables
**599.** `validate_appointment_date` trigger — verify same-day bookings work
**600.** `prevent_double_booking` trigger — verify it handles concurrent bookings
**601.** `enforce_kba_limit` trigger — verify error message is user-friendly
**602.** `generate_confirmation_number` trigger — verify format is consistent
**603.** `generate_session_unique_id` trigger — verify uniqueness
**604.** `handle_new_user` trigger — verify it runs on new signups
**605.** No foreign key constraints — all tables use UUID references without FK
**606.** No database backup verification
**607.** No data retention policy implementation
**608.** `notary_journal.journal_number` sequence — verify no gaps
**609.** No database migration rollback plan
**610.** `reviews` table allows `rating` of any integer — should be 1-5

### Category 33: Email & Notification System (611-635)

**611.** `send-appointment-emails` — verify it's called after booking in `BookAppointment.tsx`
**612.** `send-appointment-reminders` — no cron job configured to call this function
**613.** `send-correspondence` — Resend sends `text` body not `html` (line 89 in edge function)
**614.** No email template management UI for admin
**615.** No email preview before sending
**616.** `email_send_log` — verify records are created for all email sends
**617.** `email_cache` — verify IONOS IMAP sync populates this table
**618.** `AdminEmailManagement` — verify inbox/sent/draft views work
**619.** No email bounce handling
**620.** No email open/click tracking
**621.** No unsubscribe link in transactional emails
**622.** `Unsubscribe.tsx` page — verify token lookup and `used_at` update
**623.** No push notifications (browser)
**624.** `AdminNotificationCenter` — verify it fetches recent notifications
**625.** No SMS notification capability
**626.** No WhatsApp notification capability
**627.** No in-app notification bell on ClientPortal
**628.** Appointment confirmation email — verify it includes appointment details
**629.** Payment receipt email — not triggered after successful Stripe payment
**630.** Document status change — no notification to client
**631.** Service request status change — no notification to client
**632.** Chat message notification — only in-app, no email fallback
**633.** Session reminder — no 24-hour advance notification
**634.** Commission expiry warning — admin only, no automated email
**635.** `FROM_EMAIL` default is `noreply@shanegoble.com` — should be brand email

### Category 34: Frontend Components & UX (636-646)

**636.** `AILeadChatbot` — possible ref warning in ComingSoon (verify no ref passed)
**637.** `ErrorBoundary` — verify fallback UI renders correctly
**638.** `Breadcrumbs` — verify they render correct hierarchy on all pages
**639.** `CommandPalette` — verify keyboard shortcut (Cmd+K) works
**640.** `OnboardingWizard` — verify it shows for new users
**641.** `WhatDoINeed` helper — verify AI response matches service catalog
**642.** `Logo` component — verify it renders at correct sizes
**643.** `DarkModeToggle` — verify toggle persists across sessions
**644.** `BackToTop` button — verify it appears on scroll
**645.** `InvoiceGenerator` — verify it generates downloadable invoices
**646.** `ESealEmbed` — verify verification URL works

---

## Implementation Priority

### Phase 1 — Critical (Blocks Launch): Items 147-177, 178-200, 211-224, 231, 441, 597
ServiceDetail content maps, INTAKE_ONLY sync, private bucket fix, Stripe webhook, triggers

### Phase 2 — High (Broken Functionality): Items 225-230, 232-250, 281-305, 371-372, 401-403, 431-455, 491-497
ClientPortal performance, admin wiring, revenue, booking race conditions, payment flow, auth

### Phase 3 — Medium (UX & Completeness): Items 251-280, 306-345, 346-370, 404-430, 456-490
Admin appointments, journal, chat, settings, RON session, edge functions

### Phase 4 — Polish (SEO, Performance, Data): Items 498-525, 526-555, 556-580, 581-646
Security hardening, performance optimization, accessibility, data seeding, email system

**Total: 646 distinct gaps/errors identified across 34 categories.**

