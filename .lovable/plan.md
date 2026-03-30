

# Comprehensive Implementation Plan — All Gaps Addressed (830+ Items)

This plan consolidates the existing 625-gap analysis (Sections A–N in plan.md) with the per-service addendum (Section O, items 626–830) into a single phased implementation plan. Every item is assigned to a batch with specific file changes, database migrations, and edge function work.

---

## Phase 1: Publish-Ready Foundation (Batches 1–5)

### Batch 1 — Critical Security Hardening (Items 1–15, 22–26, 52–55)
**What:** Fix exploitable vulnerabilities before any public access.
- **Migration 1:** Fix overly permissive storage INSERT policies, restrict audit_log INSERT to `auth.uid() = user_id`, remove `payments`/`documents`/`service_requests` from Supabase Realtime publication
- **Migration 2:** Add missing email validation triggers on `leads` table
- **Edge functions:** Add auth header verification to `send-correspondence` (item 14), `scan-id`, `detect-document`, `ocr-digitize` (item 16), add input length validation to all edge function payloads (item 54)
- **index.html:** Add CSP meta tag (item 23), X-Frame-Options, Referrer-Policy, Permissions-Policy (items 24–26)
- **send-correspondence/index.ts:** Sanitize HTML in `body` field with DOMPurify (item 52)
- **RichTextEditor.tsx:** Sanitize content before storage (item 53)
- **AuthContext.tsx:** Add server-side-style rate limiting note, CAPTCHA placeholder (item 4)
- **Login.tsx / SignUp.tsx:** Add CAPTCHA integration point (item 4), password breach check via HIBP (item 9)
- **Configure auth:** Enable leaked password protection via Cloud auth settings (item 9)

### Batch 2 — Coming Soon Landing Page & Route Wiring (Items from conversation: 16–18, 56–64)
**What:** Publishable landing page + fix broken routes.
- **Create** `src/pages/ComingSoon.tsx` — branded obsidian/teal page with email capture (saves to `leads` with source "coming_soon"), countdown timer, trust badges, Ohio compliant badge
- **App.tsx:** Set `/` to `ComingSoon`, move current Index to `/home`; add `/admin/users` route with lazy import of `AdminUsers`; add `/admin/service-requests` route
- **AdminDashboard.tsx:** Add "User Management" and "Service Requests" to sidebar nav
- **Navbar.tsx:** Close mobile menu on route change via useEffect on location (item 63)
- **CommandPalette.tsx:** Add all admin sub-routes (item 64)
- **ServiceDetail.tsx:** Add back button (item 62)
- **Add breadcrumbs** to BookAppointment, RON session, ServiceDetail pages (item 61)

### Batch 3 — Theme & Brand Overhaul: Obsidian + Teal (Items from conversation: 19–55)
**What:** Full visual redesign matching the provided code's palette.
- **index.css:** Replace entire color system — light mode background `#F7F9FB`, dark mode background `#0B132B`, primary `#00E5FF` (teal), update all HSL variables for card, muted, border, accent, sidebar, destructive. Add `@import` for Plus Jakarta Sans + DM Sans Google Fonts. Update glow-pulse, gradient-mesh, glass utilities for teal.
- **tailwind.config.ts:** Add `fontFamily: { heading: ['Plus Jakarta Sans', ...], body: ['DM Sans', ...] }`, update animation config for teal glow
- **Logo.tsx:** Obsidian background with teal accent
- **Navbar.tsx:** Frosted glass nav with obsidian base
- **Footer.tsx:** Dark obsidian footer with teal link hovers
- **Button variants (button.tsx):** Teal primary, obsidian outline
- **Card (card.tsx):** Subtle teal border-glow on hover
- **Badge (badge.tsx):** Teal accent variants
- **All page files (~20):** Update hero sections, CTA buttons, step indicators, dashboard accents to teal/obsidian palette
- **AdminOverview.tsx:** Update CHART_COLORS to teal-family palette, recharts tooltip styling
- **Delete** `src/App.css` (unused Vite boilerplate, item 456 from conversation)

### Batch 4 — Missing Database Foundation (Items 56–115)
**What:** Add all missing foreign keys, indexes, constraints, triggers.
- **Migration 3:** Add 14 foreign keys (items 56–70): `appointments.client_id → profiles.user_id`, `documents.uploaded_by → profiles.user_id`, `documents.appointment_id → appointments.id`, `payments.client_id`, `payments.appointment_id`, `chat_messages.sender_id`, `notary_journal.appointment_id`, `notarization_sessions.appointment_id`, `reviews.client_id`, `reviews.appointment_id`, `e_seal_verifications.document_id`, `apostille_requests.client_id`, `mailroom_items.client_id`, `client_correspondence.client_id`
- **Migration 4:** Create `service_requests` table (item 72/170) with columns: `id`, `client_id`, `service_type`, `status`, `priority`, `details jsonb`, `assigned_to uuid`, `due_date`, `sla_deadline`, `deliverable_url`, `client_visible_status`, `created_at`, `updated_at`. Add RLS policies.
- **Migration 5:** Add 10 database indexes (items 73–82): `appointments.scheduled_date`, `appointments.client_id`, `documents.uploaded_by`, `chat_messages.sender_id`, `chat_messages.recipient_id`, `leads.status`, `payments.client_id`, `email_cache.folder`, `email_send_log.message_id`, `email_send_log.template_name`
- **Migration 6:** Add unique constraints: `reviews(appointment_id, client_id)` (item 83), `email_cache.message_id` (item 97), `email_unsubscribe_tokens.token` (item 98), `email_unsubscribe_tokens.email` (item 99), `business_members(business_id, user_id)` (item 111), `profiles.email` (item 90), unique on `profiles.user_id` (item 91)
- **Migration 7:** Add `updated_at` triggers on `profiles`, `payments`, `leads`, `chat_messages`, `email_cache` (items 92–96); add check constraint `time_slots.day_of_week` 0–6 (item 101); set `notary_journal.fees_charged` default 0 (item 86); drop duplicate `platform_fees`/`platform_fee` column (items 105–106)
- **Migration 8:** Add `validate_appointment_date` trigger to appointments (item 84, function exists but trigger missing per db-triggers showing none); add `prevent_double_booking` trigger (item 116); add `generate_confirmation_number` trigger (item 154); add `enforce_kba_limit` trigger; add `generate_session_unique_id` trigger; add `validate_email` trigger on leads; add `handle_new_user` trigger on auth.users

### Batch 5 — Auth & Authorization Fixes (Items 1–10, 17–21, 46–47, 65–75 from conversations)
**What:** Harden auth flows.
- **AuthContext.tsx:** Fix race condition in fetchRoles (item 66), add loading state during OAuth redirect (item 67), add audit log for failed logins (item 17), password resets (item 18), role changes (item 19), profile edits (item 20)
- **ForgotPassword.tsx:** Add password strength validation matching signup (item 73 from conversation)
- **SignUp.tsx:** Case-insensitive email for admin check (already done in trigger, verify client-side)
- **Login.tsx:** Show rate limit error UI with countdown (items 3, 512)
- **ProtectedRoute.tsx:** Add email verification check (item 1), show reminder if unverified (item 69 from conversation)
- **Create** `src/pages/AccountSettings.tsx` — account deletion with data export (items 40–41, 214–215), session management
- **signOut in AuthContext:** Invalidate all sessions option (item 6, 68 from conversation)

---

## Phase 2: Core Workflow Completion (Batches 6–10)

### Batch 6 — Booking & Appointment Workflow (Items 116–170)
- **Migration:** Add `buffer_minutes`, `duration_minutes` to `services` table (items 117–118); add `confirmation_number` to appointments (item 154); add `rescheduled_from` self-ref FK (item 156); add `notary_id` to appointments (item from conversation 90)
- **BookAppointment.tsx:** Add timezone display (item 126), buffer time between slots (item 117), service-specific durations (item 137), real-time availability via Supabase Realtime (item 169), address validation on location field (item 162), auto-populate from profile (item 163), estimated completion time (item 164), price estimate display (item from conversation 177), appointment confirmation number display (item 154)
- **Create** `src/pages/RescheduleAppointment.tsx` — reschedule flow (item 122)
- **AppointmentConfirmation.tsx:** Add .ics download (item 133), QR code for check-in (item 155), add-to-Google-Calendar link (item 125)
- **Create edge function** `send-appointment-reminders` cron trigger configuration (item 123) — document cron setup needed
- **AdminAvailability.tsx:** Add holiday/blackout dates (item 147), seasonal blocking

### Batch 7 — Client Portal Completion (Items 171–220)
- **ClientPortal.tsx:** Add dashboard summary tab (item 171), notification center (item 172), document expiration reminders (item 175), payment history pagination (item 180), invoice/receipt download (items 177–178), profile completion indicator (item 184), profile photo upload (item 183), referral UI (item 208), tab persistence via URL params (item 209, 530), search across all content (item 210)
- **PortalDocumentsTab.tsx:** Add drag-and-drop upload (item 202), multi-file upload (item 201), file size/type validation (items 193–195), document versioning UI (item 196), document preview (item from conversation 116), document signing flow (item 199)
- **PortalChatTab.tsx:** Add typing indicators (item 186), read receipts (item 187), file attachments (item 188), message search (item 191), notification sound (item 190), markdown rendering (item 189)
- **PortalAppointmentsTab.tsx:** Add reschedule button linking to reschedule flow (item 122), appointment cost breakdown (item 206), calendar view option (item from conversation 134)
- **Create** `src/pages/portal/PortalServiceRequestsTab.tsx` — service request tracking (item 205, 815), deliverable download, status timeline, communication thread
- **Create** `src/pages/portal/PortalCorrespondenceTab.tsx` — reply to correspondence from portal (item 204)
- **BusinessPortal.tsx:** Add authorized signer management (item 218), billing center (item 219), usage analytics (item 220), multi-business profiles (item 217)
- **Create** `src/components/OnboardingWizard.tsx` — new user onboarding (item 185)

### Batch 8 — Admin Dashboard Completion (Items 221–285)
- **AdminOverview.tsx:** Cache queries with React Query (item 221), add refresh indicator (item 222), add real-time updates (item 223), add date range selector (item from conversation 153)
- **AdminAppointments.tsx:** Add calendar view (day/week/month) (item 233), drag-and-drop (item 232), bulk status update (item 230), color coding by type (item 234), export CSV/iCal (item 237), print (item 236)
- **AdminClients.tsx:** Add advanced filters (item 238), unified client profile view with payments/documents/correspondence (item 239), client merge (item 240), tagging (item 241), communication timeline (item 242), satisfaction scoring (item 243)
- **AdminDocuments.tsx:** Add bulk operations (item 244), document approval workflow (item 391), watermarking (item 246), redaction tool (item 247), document request from admin (item 406)
- **AdminJournal.tsx:** Add auto-save (item 248), auto-populate from appointment (item 249), PDF export (item 250), batch export by date range (item 251), notarization count tracking (item 252)
- **AdminRevenue.tsx:** Add tax reporting (item 253), P&L generation (item 254), expense tracking (item 255), forecasting (item 256), invoice creation (item 257), payment reconciliation (item 259)
- **AdminEmailManagement.tsx:** Add bulk actions (item 260), auto-sync on load (item 261), template management (item 262), scheduling (item 263), analytics (item 264)
- **AdminLeadPortal.tsx:** Add automated follow-ups (item 265), lead scoring (item 266), lead assignment (item 267), conversion tracking (item 268), Kanban pipeline (item 269)
- **AdminTeam.tsx:** Add role permissions matrix (item 270), activity tracking (item 271), performance metrics (item 272), shift management (item 273)
- **AdminAuditLog.tsx:** Add export (item 274), advanced filtering by date/entity/user (item 275)
- **AdminSettings.tsx:** Add input validation (item 276), confirmation before overwrite (item 277), backup/restore (item 278)
- **AdminServices.tsx:** Add drag-and-drop reorder (item 281), pricing history (item 282), service analytics (item 283)
- **AdminApostille.tsx:** Add deadline management (item 284), client status notifications (item 285)
- **Create** `src/pages/admin/AdminServiceRequests.tsx` — cross-service request management dashboard (item 811 from addendum), assignment workflow (812), priority/SLA tracking (813), progress tracking (814)
- **Create** `src/pages/admin/AdminClientWorkspace.tsx` — per-client engagement view (addendum)

### Batch 9 — Payment & Billing (Items 336–375)
- **Enable Stripe:** Use stripe--enable tool to configure
- **SubscriptionPlans.tsx:** Wire to actual Stripe subscription creation (item 336), manage upgrade/downgrade/cancel (item 337)
- **Create edge function** `create-checkout-session` for subscriptions with `checkout.session.completed` handling (item 363)
- **stripe-webhook/index.ts:** Add handlers for `payment_intent.failed` (item 362 — already exists, verify), `customer.subscription.updated` (item 364), `customer.subscription.deleted` (item 365), `invoice.payment_failed` (item 366), `charge.refunded` (already exists)
- **Create** `src/components/InvoiceGenerator.tsx` — invoice creation with line items, PDF download (items 344–345)
- **Create** `src/components/ReceiptGenerator.tsx` — receipt generation (item 346)
- **Create edge function** `send-receipt-email` — automated receipt after payment (item 347)
- **PaymentForm.tsx:** Add payment method management (item 355), ACH support (item 356), coupon/discount field (item 339)
- **Migration:** Add enum constraint on `payments.status` (item 369), add `refund_amount`, `refunded_at`, `stripe_payment_intent_id` columns if missing, add `tax_amount`, `discount_code` columns
- **Create** Stripe Customer Portal redirect endpoint (item 354)
- **AdminRevenue.tsx:** Add Stripe test mode indicator (item 375), payment link generation (item 357)

### Batch 10 — RON & Ohio Compliance (Items 286–335)
- **RonSession.tsx:** Add commission status check before session start (item 287), session recording integration placeholder with storage (items 288–290), multi-party support (item 291), credential analysis step (item 292), tamper-evident document hash (item 293), per-session unique ID display (item 295, trigger exists), signer location verification (item 296), session timeout with warning (item 308), max signer count validation (item 309), document type RON eligibility check (item 310), fee compliance display (item 311), notarization certificate generation (item 312), e-seal image embedding (item 313), dual-auth for session start (item 318), witness management (item 319), consent form before session (item 334), recording consent acknowledgment (item 335)
- **KBAVerification.tsx:** Add server-side retry limits (items 300–301), failure lockout (item 301), brute-force protection (item 36)
- **TechCheck.tsx:** Add camera/microphone permission check (item 332), network quality check (item 333)
- **Create** `src/components/NotarizationCertificate.tsx` — Ohio §147.542 certificate generation (item 323)
- **Create** `src/components/ESealEmbed.tsx` — e-seal image with commission number (items 313–315)
- **Migration:** Add `recording_url` validation, `session_hash` column to `notarization_sessions`, `signer_ip`, `signer_geolocation` columns
- **AdminJournal.tsx:** Add Ohio electronic journal compliance fields (item 294), journal backup export (item 328), date range search (item 329), correction workflow (item 330)
- **AdminSettings.tsx:** Add bond/E&O insurance expiry tracking with session blocking (item 325), commission renewal workflow (item 324)
- **VerifySeal.tsx:** Wire to actual verification endpoint (item 314)
- **RonEligibilityChecker.tsx:** Enforce results (block ineligible documents) (item 326)

---

## Phase 3: Service-Specific Flows (Batches 11–16)

### Batch 11 — Email Management Service (Items 626–650)
- **Create** `src/components/EmailOnboardingWizard.tsx` — client email setup wizard (forwarding address generation, IMAP/OAuth connection) (items 626–627, 650)
- **Migration:** Create `client_email_accounts` table (client_id, forwarding_address, connection_type, credentials_encrypted, status, preferences jsonb)
- **AdminEmailManagement.tsx:** Add per-client inbox view (item 628), email routing rules per client (item 629), managed inbox dashboard (item 630), AI response drafting (item 631), per-client analytics (item 632), SLA timer (item 636), quick-reply templates per client (item 640), attachment handling (item 641)
- **Create** `src/pages/portal/PortalEmailActivityTab.tsx` — client view of handled emails (item 633)
- **Create edge function** `auto-triage-email` — AI categorizes incoming managed emails (item 635)
- **Migration:** Add `client_id` to `email_cache` for per-client routing, add email service status tracking
- Wire recurring billing for email management subscriptions (item 638)
- Add email forwarding verification flow (item 639)
- Add service pause/resume (item 645)
- Add email threading by client (item 647)
- Add Google Workspace / M365 OAuth integration point (item 649)

### Batch 12 — Lead Generation Service (Items 651–670)
- **Migration:** Create `client_leads` table separate from platform `leads` (item 651): `id`, `engagement_id`, `client_id`, `lead_data jsonb`, `quality_score`, `status`, `delivered_at`
- **AdminLeadPortal.tsx:** Add client engagement mode toggle (item 652), per-client lead workspace
- **Create** `src/pages/portal/PortalLeadsTab.tsx` — client view of delivered leads with CSV/PDF export (items 653, 662)
- **Create edge function** `kickstart-lead-research` — AI generates initial lead list from client intake criteria (item 654)
- Add lead enrichment pipeline with AI (item 658)
- Add lead generation SLA tracking (item 659)
- Add lead generation report template (item 661)
- Add CRM export formats (item 665)
- Add geographic boundary enforcement (item 667)
- Add industry-specific templates (item 669)
- Add AI summary report generation (item 670)
- Add deduplication against client contacts (item 657)
- Add compliance checks (item 666)

### Batch 13 — Content Creation Services (Items 671–690)
- **Create** `src/pages/admin/AdminContentWorkspace.tsx` — content creation dashboard with draft → review → approval → delivery workflow (items 671–672)
- **Migration:** Create `content_drafts` table: `id`, `service_request_id`, `client_id`, `content_type`, `draft_content`, `version`, `status`, `reviewer_notes`, `approved_at`
- **AIWriter.tsx:** Wire AI auto-draft from service request intake (item 673), add save to content_drafts (item 453), add output history (item 451), template library (item 452), word/character count (item 454), tone adjustment (item 455), export to PDF (item from conversation 197)
- Add content calendar for social media clients (item 674)
- Add brand asset storage per client (item 677)
- Add revision tracking (item 678)
- Add content delivery mechanism (item 679)
- Add SEO analysis for blog posts (item 681)
- Add AI image generation integration (item 682)
- Add style guide persistence per client (item 683)
- Add approval notification (item 686)
- Add multi-format export (item 690)

### Batch 14 — Document & Administrative Services (Items 691–780)
- **Create** `src/pages/admin/AdminTaskQueue.tsx` — Kanban board for data entry, admin support, document prep tasks (item 705)
- Add file upload integration for client source data (item 692)
- Add AI-assisted data extraction from uploads (item 698)
- Add time tracking per engagement (item 708)
- Add billable hours tracking (item 708)
- Add task handoff between team members (item 709)
- Add document preparation workspace (item 766)
- Wire AI document drafting from intake (item 768)
- Add document cleanup automation (item 769)
- Add form auto-fill from client profile (item 770)
- Add document quality review checklist (item 771)
- Add completed document delivery workflow (item 772)
- Add document revision request flow (item 773)
- Add pricing by complexity/page count (item 774)
- Add AI proofreading (item 780)
- Add travel itinerary builder for Travel Arrangements (item 699)
- Add AI travel research (item 703)

### Batch 15 — Customer Service, Tech Support, UX Services (Items 711–765)
- **Create** `src/pages/admin/AdminSupportDashboard.tsx` — shared inbox for managing client's customer emails (items 711–712)
- Add canned response library per client (item 713)
- Add AI auto-response suggestions (item 714)
- Add support ticket system (item 717)
- Add support volume analytics (item 718)
- Add SLA monitoring (item 719)
- Add AI chatbot as first-line responder (item 722)
- Add knowledge base builder (item 723)
- Add website credential secure storage (item 731)
- Add screenshot before/after documentation (item 733)
- Add CMS integration framework (item 735)
- Add UX audit report template (item 746)
- Add AI-powered UX analysis from screenshots (item 753)
- Add research deliverable PDF generation (item 758)
- Add findings database with severity ratings (item 752)

### Batch 16 — Business & Subscription Services (Items 796–830)
- Wire Stripe subscription products for each plan tier (item 796)
- Add subscription lifecycle management (item 797)
- Add usage metering for API subscriptions (item 798)
- **Create** `src/pages/admin/AdminAPIKeys.tsx` — API key issuance and management (item 799)
- Add API documentation portal (item 800)
- Add webhook configuration interface (item 801)
- Add white-label partner onboarding (item 802)
- Add partner branding management (item 803)
- Add revenue sharing tracking (item 804)
- Add volume discount engine (item 806)
- Add business org hierarchy (item 807)
- Add dedicated account manager assignment (item 808)
- Add business SLA management (item 809)
- Add bulk notarization queue (item 810)
- **Cross-service ops (items 811–830):** Unified admin service request dashboard, assignment workflow, priority/SLA tracking, progress percentage, client notifications on status changes, comment threads, deliverable uploads, billing per request, time tracking, SLA violation alerts, completion surveys, automated acknowledgment emails, file attachments on request forms, request edit/cancel by client, multi-request bundling

---

## Phase 4: Document & Communication (Batches 17–19)

### Batch 17 — Document Management (Items 376–410)
- Add OCR/text extraction pipeline (item 376)
- Add document classification automation with AI (item 377)
- Add fillable field template system (item 378)
- **DocumentBuilder.tsx:** Add resume, invoice, contract, letter templates (items 380–383)
- Add bulk download as ZIP (item 384)
- Add document merge/combine/split/reorder (items 385–387)
- Add PDF form filling (item 388)
- Add PDF digital signature embedding (item 389)
- Add document comparison/diff (item 390)
- Add multi-step approval workflow (item 391)
- Add retention policy enforcement (item 392)
- Add document access log (item 393)
- Add secure sharing links (item 394)
- Add collaboration/annotations (item 395)
- Add non-PDF preview (item 396)
- Add Word→PDF conversion (item 397)
- Add per-document storage access control (item 398)
- Add storage quota per user (item 399)
- Wire DocumentDigitize results to documents table (item 401)
- Wire translate-document to UI (item 402)
- Add document status notifications (item 404)
- Add document rejection reason (item 405)
- Add document checklist per appointment type (item 407)

### Batch 18 — Email & Communication System (Items 411–450)
- Set up cron for IONOS email sync (item 411)
- Wire `process-email-queue` cron invocation (item 429)
- Wire `process-inbound-email` webhook (item 430)
- Add email threading/conversation view (item 413)
- Add AI auto-categorization (item 414)
- Add after-hours auto-response (item 415)
- Add email template system for common responses (item 416)
- Add email signature management UI (item 417)
- Add email attachment handling/storage (item 418)
- Add cc/bcc in compose (item 420)
- Add rich formatting in compose (item 421)
- Add delivery status tracking (item 422)
- Add bounce handling (item 423)
- **Create** `src/pages/Unsubscribe.tsx` — email unsubscribe page (item 424)
- Add transactional email templates: welcome, booking confirmation, appointment reminder, completion (item 425)
- Add email scheduling (item 427)
- Add email queue monitoring dashboard (item 428)
- Add admin notification for new bookings, registrations, messages, payments, uploads (items 225–229)
- Add notification preferences management (item 435)
- Add automated onboarding email sequence (item 438)
- Add automated reminder sequence: 1 week, 1 day, 1 hour (item 439)
- Add review request email post-appointment (item 440)
- Add contact form admin notification (item 444)
- Add email health monitoring dashboard (item 446)
- Fix hardcoded FROM_EMAIL (item 449)

### Batch 19 — AI & Automation Completion (Items 451–480)
- **AIWriter.tsx:** Add history/saved generations (item 451), template library (452), save to documents (453), word/char count (454), tone slider (455), grammar check (456), social media char limits (457)
- Add AI appointment scheduling optimization (item 458)
- Add AI document clause extraction and risk flagging (item 459)
- **Create** `src/components/AILeadChatbot.tsx` — public page chatbot for lead capture (item 460)
- Verify AdminAIAssistant functionality (item 461)
- Add AI lead scoring (item 462)
- Add AI service recommendation engine (item 463)
- Add AI content moderation for chat (item 464)
- Add AI FAQ generation (item 465)
- Add AI compliance checking (item 467)
- Wire AI document translation to UI (item 468)
- Add AI data extraction from uploads (item 469)
- Add WhatDoINeed actionable results with booking links (item 471)
- Add AI search across platform (item 472)
- Add AI usage tracking (item 473)
- Add AI cost monitoring (item 474)
- Add AI model fallback (item 475)
- Add AI feedback mechanism (item 476)
- Add AI conversation history persistence (item 477)
- Add AI system prompt configuration in admin (item 478)
- Add client assistant service context (item 479)
- Add AI document proofreading (item 480)

---

## Phase 5: UX, Accessibility & Polish (Batches 20–22)

### Batch 20 — UI/UX Fixes (Items 481–535)
- Add loading skeleton for Services AI tools section (item 481)
- Add empty states for zero search results (item 482)
- Add error boundary on service cards (item 483)
- Add toast for clipboard copy (item 484)
- Add confirmation dialogs for all destructive actions (item 485)
- Add field-specific form validation messages (item 486)
- Add inline validation (item 487)
- Add form auto-save for long forms (item 488)
- Add form persistence across reloads (item 489)
- Add table column resizing (item 490), visibility toggles (491), row selection (492), keyboard nav (493)
- Add ARIA live regions (item 494), screen reader announcements (495)
- Add focus trap in modals (item 496)
- Add skip nav focus management (item 497)
- Verify all color contrast ratios (item 498)
- Add high contrast mode (item 499)
- Add prefers-reduced-motion support (item 500)
- Add font size adjustment (item 501)
- Fix mobile nav focus trap (item 502) and active link indicator (503)
- Add pull-to-refresh on mobile (item 504)
- Add swipe gestures (item 505)
- Verify all footer links (item 506)
- Add breadcrumbs consistently (items 507–508)
- Add lazy route loading indicator (item 509)
- Enhance 404 page with search/nav suggestions (item 510)
- **Create** `src/pages/Maintenance.tsx` (item 511)
- Add rate limit error UI (item 512)
- Add network error retry UI (item 513)
- Add offline form submission queue (item 514)
- Add print stylesheet (item 515)
- Add admin report PDF export (item 516)
- Add chart accessibility (item 517), legend interaction (518), drill-down (519)
- Add responsive table card view for mobile (item 520)
- Add admin sidebar unread counts (item 521)
- Add admin dashboard widget customization (item 522)
- Add floating action button (item 523)
- Add keyboard shortcut help dialog (item 524)
- Add command palette recent commands (item 525)
- Add contextual help tooltips (item 526)
- Add admin walkthrough tour (item 527)
- Add dark mode optimization for data screens (item 528)
- Add chart loading state (item 529)
- Add tab URL deep linking (item 530)
- Add image lazy loading (item 531)
- Add skeleton for individual cards (item 532)
- Configure favicon (item 533)
- Add Open Graph meta tags (item 534)
- Add Twitter Card meta tags (item 535)

### Batch 21 — Integrations (Items 536–570)
- **SignNow:** Complete document upload flow (536), signer invite (537), template management (538), bulk sending (539), full webhook handling (540), token rotation (541)
- **Stripe:** Customer Portal (542), subscription lifecycle (543), Connect for sub-notaries (544), payment links (545), test/live mode indicator (546)
- **IONOS:** Auto-sync via cron (547), IMAP IDLE (548), CalDAV calendar (549)
- Add Google Calendar API (550)
- Add Outlook integration (551)
- Add Twilio SMS (553)
- Add Google Maps API for address validation (554–555)
- Add Google Analytics (556)
- Add Sentry error tracking (557)
- Add Lighthouse CI (558)
- Add uptime monitoring (559)
- Add Zapier webhook support (560)
- Add cloud storage integration (563)
- Wire OneNotary API (568)
- Add Slack/Teams webhook for admin notifications (570)

### Batch 22 — Performance & Infrastructure (Items 571–600)
- Add service worker / PWA (item 571)
- Add asset caching strategy (item 572)
- Add image optimization pipeline (item 573)
- Optimize hero image with srcset/lazy loading (item 574)
- Add component-level code splitting (item 575)
- Add bundle size monitoring (item 576)
- Add performance budgets (item 577)
- Fix N+1 queries (item 578)
- Consolidate AdminOverview queries (item 579)
- Optimize React Query caching (item 580)
- Add cursor-based pagination (item 581)
- Add preconnect/DNS prefetch hints (items 585–586)
- Add edge function health checks (item 592)
- Add edge function monitoring (item 593)
- Add rate limiting on public queries (item 594)
- Refactor large components: BookAppointment, AdminAppointments, RonSession (item 595)
- Add component lazy loading within tabs (item 596)
- Add virtual scrolling for long lists (item 597)
- Add realtime subscription cleanup (items 598–599)
- Fix AnimatePresence memory concerns (item 600)

---

## Phase 6: Testing & DevOps (Batch 23)

### Batch 23 — Testing & DevOps (Items 601–625)
- Add unit tests for all utility functions (items 601–602)
- Add edge function integration tests (item 603)
- Add E2E tests for booking, payment, RON flows (item 604)
- Add component tests for complex forms (item 605)
- Add visual regression tests (item 606)
- Add accessibility tests with axe-core (item 607)
- Add load testing configuration (item 608)
- Add API contract tests (item 609)
- Configure CI/CD pipeline (item 610)
- Document staging environment setup (item 611)
- Add feature flags system (item 612)
- Add database migration rollback strategy (item 614)
- Add log aggregation (item 617)
- Add alerting/monitoring (item 618)
- Document SLA (item 619)
- Document disaster recovery (item 620)
- Add data backup verification (item 621)
- Create runbook (item 622)
- Document incident response (item 623)
- Add changelog automation (item 624)
- Add dependency vulnerability scanning (item 625)

---

## Technical Summary

**Total items addressed:** 830+ (625 from plan.md sections A–N + 205 from per-service section O)

**New files to create:** ~25 components/pages
**Files to modify:** ~40 existing files
**Database migrations:** ~10 migration files
**New edge functions:** ~5
**Modified edge functions:** ~8

**Implementation order rationale:** Security and publishability first (Phases 1–2), then revenue-generating service workflows (Phase 3), then polish and scale (Phases 4–6).

