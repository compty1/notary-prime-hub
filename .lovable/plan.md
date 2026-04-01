# Build Tracker Gap Fix Plan

## 163 Gaps · 6 Phases · Priority-Ordered

---

## Phase 1: Critical Routing & Accessibility (8 items) — HIGH PRIORITY

These gaps make existing pages/components completely unreachable.

| # | Gap | Fix | Files Changed |
|---|-----|-----|---------------|
| 1 | AdminClientEmails page has no route (lines 90, 115, 155 — duplicated 3x) | Add `/admin/client-emails` route to App.tsx | `src/App.tsx` |
| 2 | AdminMailbox page has no route (lines 91, 116 — duplicated) | Add `/admin/mailbox` route to App.tsx | `src/App.tsx` |
| 3 | Missing page registry: `/booking` alias | Add entry to pageRegistry.ts | `build-tracker/pageRegistry.ts` |
| 4 | Missing page registry: `/schedule` alias | Add entry to pageRegistry.ts | `build-tracker/pageRegistry.ts` |
| 5 | Missing page registry: `/mailroom` | Add entry to pageRegistry.ts | `build-tracker/pageRegistry.ts` |
| 6 | Missing page registry: `/subscribe` | Add entry to pageRegistry.ts | `build-tracker/pageRegistry.ts` |
| 7 | No 404 handling for `/admin/*` subroutes | Add catch-all `<Route path="*">` inside admin layout | `src/App.tsx` |
| 8 | No error boundary on public pages | Wrap critical public routes with `<ErrorBoundary>` | `src/App.tsx` |

**Effort**: ~1 session. Single file edits mostly in App.tsx + pageRegistry.ts.

---

## Phase 2: Wire Orphaned Components (14 items) — HIGH PRIORITY

Built components sitting unused. Each needs an import + render in its target page.

| # | Component | Target Integration | Files Changed |
|---|-----------|-------------------|---------------|
| 1 | `SessionTimeoutWarning` (HIGH) | Import in `RonSession.tsx` | `src/pages/RonSession.tsx` |
| 2 | `ComplianceBanner` | Wire into RON session or services pages | Target page |
| 3 | `NotarizationCertificate` | Add to RON session completion flow | `src/pages/RonSession.tsx` |
| 4 | `SignPreviewWizard` | Add to RON pre-signing step | `src/pages/RonSession.tsx` |
| 5 | `ClientFeedbackForm` | Wire into `PortalAppointmentsTab` | `src/pages/portal/PortalAppointmentsTab.tsx` |
| 6 | `OnboardingWizard` | Import in `ClientPortal.tsx` for new users | `src/pages/ClientPortal.tsx` |
| 7 | `BulkDocumentUpload` | Wire into `AdminDocuments.tsx` | `src/pages/admin/AdminDocuments.tsx` |
| 8 | `PreSigningChecklist` | Wire into booking flow before review | `src/pages/BookAppointment.tsx` |
| 9 | `SignerChecklist` | Wire into booking or RON session | `src/pages/BookAppointment.tsx` |
| 10 | `ESealEmbed` | Wire into VerifySeal or RON completion | `src/pages/VerifySeal.tsx` |
| 11 | `InvoiceGenerator` | Wire into admin revenue or RON completion | `src/pages/admin/AdminRevenue.tsx` |
| 12 | `BackToTop` | Add to `PageShell.tsx` | `src/components/PageShell.tsx` |
| 13 | `MobileFAB` | Add to portal/booking for mobile | `src/components/PageShell.tsx` |
| 14 | `OfflineIndicator` | Add to `App.tsx` or `PageShell` | `src/App.tsx` |

Side items (low priority):
- `CalendarDownload` → wire into `AppointmentConfirmation.tsx`
- `ServiceDetailPanel` → wire into `ServiceDetail.tsx`
- `StyleMatchPanel` → wire into AI Writer
- `TranslationPanel` → wire into document builder
- `WhatDoINeed` → wire into services or booking

**Effort**: ~2 sessions. Each is a small import + conditional render.

---

## Phase 3: Platform Entity & Service Flow Data (65+ items) — MEDIUM PRIORITY

These are tracker metadata gaps — existing features not registered in `platformEntities.ts` or `serviceFlows.ts`.

### 3A: Add to `platformEntities.ts` (~50 items)

Group by entity:

**Email Management** (add 12 sub-components):
- `process-inbound-email`, `process-email-queue`, `ionos-email`, `send-correspondence` edge fns
- `email_cache`, `email_send_log`, `email_drafts`, `email_signatures`, `email_unsubscribe_tokens`, `email_send_state`, `suppressed_emails`, `appointment_emails` tables
- Bounce/DLQ tracking, unsubscribe management

**Documents** (add 8 sub-components):
- `ocr-digitize` edge fn
- `form_library`, `document_bundles`, `document_collections`, `document_tags`, `document_reminders`, `document_versions`, `documents` tables

**AI Services** (add 7 sub-components):
- `ai-compliance-scan`, `ai-cross-document`, `ai-extract-document`, `ai-style-match`, `build-analyst`, `scan-id` edge fns
- `client_style_profiles`, AI Knowledge page

**RON Sessions** (add 5 sub-components):
- `signnow`, `signnow-webhook` edge fns
- `notarization_sessions`, `e_seal_verifications` tables

**CRM** (add 7 sub-components):
- `submit-lead`, `discover-leads`, `fetch-leads`, `scrape-social-leads` edge fns
- `leads`, `crm_activities`, `deals`, `lead_sources`, `proposals` tables
- CRM auto-activity triggers

**Services Catalog** (add 7 sub-components):
- `services`, `service_requests`, `service_requirements`, `service_reviews`, `service_workflows`, `service_faqs`, `apostille_requests` tables

**Payments** (add 5 sub-components):
- `get-stripe-config` edge fn
- `payments`, `notary_payouts`, `promo_codes` tables
- Payment webhook tracking

**Admin Dashboard** (add 7 sub-components):
- `admin-create-user` edge fn
- `platform_settings`, `audit_log`, `notary_invites`, `notary_journal`, `notary_certifications` tables
- Admin Users page

**Client Portal** (add 4 sub-components):
- `client_feedback`, `reviews`, `user_favorites` tables
- `chat_messages` table

**Auth** (add 2 sub-components):
- `profiles` table, `compliance_rule_sets` table

**Business Portal** (add 2): `business_members`, `business_profiles` tables

**Booking/Appointments** (add 4): `appointments`, `booking_drafts`, `time_slots` tables, `continuing_education` table

**New entities to create**:
- **Mailroom**: `mailroom_items` table, VirtualMailroom page
- **Apostille**: apostille tracking, shipping, status
- **Solutions/Verticals**: 6 solution pages
- **Notifications**: `notification_preferences` table

### 3B: Add to `serviceFlows.ts` (12 steps)

- **Booking Flow**: PreSigningChecklist, SignerChecklist, ServicePreQualifier
- **RON Flow**: ID Scan, NotarizationCertificate, ComplianceWatchdog, multi-signer
- **Client Portal Flow**: ClientFeedbackForm, OnboardingWizard
- **Document Flow**: translate-document, explain-document, detect-document

**Files Changed**: `platformEntities.ts`, `serviceFlows.ts`
**Effort**: ~1 session. Pure data file edits.

---

## Phase 4: Missing UI for Existing Data (10 items) — MEDIUM PRIORITY

DB tables exist but have no admin/client UI.

| # | Gap | Fix | Effort |
|---|-----|-----|--------|
| 1 | No admin view for client feedback | Create feedback review section in `AdminOverview` or new page | Medium |
| 2 | No admin UI for promo codes | Create promo code management in `AdminSettings` or new page | Medium |
| 3 | No UI for notification preferences | Add preferences section to `AccountSettings.tsx` | Small |
| 4 | No admin UI for waitlist | Add waitlist table to `AdminOverview` | Small |
| 5 | User favorites has no UI | Add bookmark buttons to portal items | Medium |
| 6 | Time slots disconnected from availability UI | Verify/wire `time_slots` ↔ `AdminAvailability` | Small |
| 7 | service_workflows table unused in UI | Wire to admin service management | Medium |
| 8 | Notary certifications management incomplete | Add to admin team/settings page | Medium |
| 9 | No UI for suppressed emails list | Add to email management settings | Small |
| 10 | Booking flow has no progress indicator | Add step progress bar to `BookAppointment` | Small |

**Effort**: ~3-4 sessions. Mix of new components and wiring.

---

## Phase 5: Error Handling, Validation & Code Quality (30+ items) — MEDIUM PRIORITY

### 5A: Missing Error Handling (10 pages)
Add error states/boundaries to: `About.tsx`, `AppointmentConfirmation.tsx`, `VerifySeal.tsx`, `AdminAuditLog.tsx`, `AdminContentWorkspace.tsx`, `AdminOverview.tsx`, `AdminTaskQueue.tsx`, `PortalLeadsTab.tsx`, `AdminCRM.tsx` (loading state)

### 5B: Edge Function Error Logging (4 functions)
Add `console.error` + try/catch: `admin-create-user`, `create-payment-intent`, `get-stripe-config`, `ionos-email`

### 5C: Form Validation (2 forms)
Add zod/input validation: `AdminAIAssistant.tsx`, `AdminDocuments.tsx`

### 5D: Database Triggers (2 items)
Add `update_updated_at_column` trigger: `email_send_state`, `platform_settings`

### 5E: TODO Comments (3 items)
Review/resolve TODOs in: `OnboardingWizard.tsx`, `formatPhone.ts`, `BusinessPortal.tsx`

### 5F: UX Polish (3 items)
- No toast notification for some form successes
- No print stylesheet for journal/certs/invoices
- Missing loading skeleton for `AdminCRM.tsx`

**Effort**: ~2 sessions. Repetitive but straightforward patterns.

---

## Phase 6: Infrastructure & Operations (5 items) — LOW PRIORITY

| # | Gap | Fix |
|---|-----|-----|
| 1 | No webhook retry mechanism | Add retry with exponential backoff to SignNow/Stripe webhooks |
| 2 | No health check endpoint | Create `health-check` edge function |
| 3 | No database backup schedule visible | Document RPO/RTO in admin settings |
| 4 | No storage cleanup for orphaned files | Add cleanup trigger or scheduled function |
| 5 | `client_correspondence` table not tracked | Add to Email Management entity |

**Effort**: ~1-2 sessions.

---

## Deduplication Notes

The CSV contains **5 duplicate entries** that should be consolidated:
- AdminClientEmails no-route: lines 90, 115, 155 (3x)
- AdminMailbox no-route: lines 91, 116 (2x)

**Unique gaps after dedup: ~158**

---

## Execution Order Summary

| Phase | Items | Priority | Sessions |
|-------|-------|----------|----------|
| 1. Routing & Accessibility | 8 | 🔴 Critical | 1 |
| 2. Wire Orphaned Components | 14+ | 🔴 High | 2 |
| 3. Platform Entity Data | 65+ | 🟡 Medium | 1 |
| 4. Missing UI | 10 | 🟡 Medium | 3-4 |
| 5. Error/Validation/Quality | 30+ | 🟡 Medium | 2 |
| 6. Infrastructure | 5 | 🟢 Low | 1-2 |
| **Total** | **~158 unique** | | **~10-12 sessions** |
