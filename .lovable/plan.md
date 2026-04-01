

# Fix Plan for All Open Build Tracker Gaps

## Scope

101 open items across 6 CSVs, organized into 7 execution phases by priority and file grouping.

---

## Phase 1: Critical & High — ErrorBoundary Wrapping (15 items)

Wrap all unprotected routes in `<ErrorBoundary>` in `src/App.tsx`.

**Routes to wrap**: `/ron-session` (critical), `/portal`, `/confirmation`, `/verify-id` (high), `/mobile-upload`, `/builder`, `/ai-writer`, `/digitize`, `/request`, `/mailroom`, `/subscribe`, `/ai-extractors`, `/ai-knowledge`, `/account-settings`, `/business-portal`

**Files**: `src/App.tsx`
**Effort**: Small — pattern already exists for admin routes.

---

## Phase 2: Ohio Compliance Gaps (5 items, high priority)

| # | Gap | Fix |
|---|-----|-----|
| 1 | No tamper-evident seal (HIGH) | Add SHA-256 document hash to `e_seal_verifications` table; verify hash on seal check in `VerifySeal.tsx` |
| 2 | No notary commission number display | Display `commission_number` from profiles on `NotarizationCertificate` and journal entries |
| 3 | No digital journal backup | Add "Export Journal" button to `AdminJournal.tsx` generating CSV/JSON backup |
| 4 | No session recording storage validation | Add retention check query to `RonSession.tsx` completion flow |
| 5 | No credential analysis verification log | Add `credential_analysis_result` column to `notarization_sessions` via migration; save KBA/ID scan results |

**Files**: `src/pages/VerifySeal.tsx`, `src/components/NotarizationCertificate.tsx`, `src/pages/admin/AdminJournal.tsx`, `src/pages/RonSession.tsx` + 1 DB migration
**Effort**: Medium — 1-2 sessions.

---

## Phase 3: Console.log Removal (12 items)

Remove or gate behind `import.meta.env.DEV` all production `console.log` statements in:

`ErrorBoundary.tsx`, `PaymentForm.tsx`, `BookAppointment.tsx`, `DocumentDigitize.tsx`, `RonSession.tsx`, `ServiceDetail.tsx`, `AdminAppointments.tsx`, `AdminSettings.tsx`, `AdminAIAssistant.tsx`, `Services.tsx`, `ServiceRequest.tsx`, `NotFound.tsx`

**Pattern**: Replace `console.log(...)` with nothing, or for error-level logs keep `console.error` only.
**Files**: 12 component files
**Effort**: Small — mechanical find-and-remove.

---

## Phase 4: Database Indexes & Query Limits (29 items)

### 4A: Missing Indexes (20 items) — Single migration

```sql
CREATE INDEX idx_booking_drafts_user_id ON booking_drafts(user_id);
CREATE INDEX idx_business_profiles_created_by ON business_profiles(created_by);
CREATE INDEX idx_client_style_profiles_user_id ON client_style_profiles(user_id);
CREATE INDEX idx_document_collections_user_id ON document_collections(user_id);
CREATE INDEX idx_document_bundles_bundle_type ON document_bundles(bundle_type);
CREATE INDEX idx_email_signatures_user_id ON email_signatures(user_id);
CREATE INDEX idx_form_library_uploaded_by ON form_library(uploaded_by);
CREATE INDEX idx_lead_sources_source_type ON lead_sources(source_type);
CREATE INDEX idx_notary_certifications_user_id ON notary_certifications(user_id);
CREATE INDEX idx_notary_invites_email ON notary_invites(email);
CREATE INDEX idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX idx_service_faqs_service_id ON service_faqs(service_id);
CREATE INDEX idx_service_requirements_service_id ON service_requirements(service_id);
CREATE INDEX idx_service_reviews_service_id ON service_reviews(service_id);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_time_slots_day_available ON time_slots(day_of_week, is_available);
CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_service_workflows_service_id ON service_workflows(service_id);
CREATE INDEX idx_compliance_rule_sets_category ON compliance_rule_sets(category);
CREATE INDEX idx_build_tracker_plans_source ON build_tracker_plans(source);
```

### 4B: Unbounded Queries (9 items)

Add `.limit()` calls to queries in: `About.tsx`, `AccountSettings.tsx` (×3: appointments, documents, payments), `BookAppointment.tsx` (×2: services, time_slots), `BusinessPortal.tsx` (×3: documents, appointments, payments)

**Files**: 1 migration + 4 page files
**Effort**: Small-medium — 1 session.

---

## Phase 5: Accessibility — ARIA Attributes (20 items)

Add `role="main"` and `aria-label` to the outermost wrapper `<div>` of each page:

`AIExtractors`, `AIKnowledge`, `AIWriter`, `About`, `AccountSettings`, `AppointmentConfirmation`, `BusinessPortal`, `ComingSoon`, `DocumentBuilder`, `DocumentDigitize`, `DocumentTemplates`, `FeeCalculator`, `HelpSupport`, `JoinPlatform`, `LoanSigningServices`, `Maintenance`, `MobileUpload`, `NotFound`, `NotaryGuide`, `NotaryProcessGuide`

**Pattern per file**: Change `<div className="...">` → `<main aria-label="Page Name" className="...">`
**Files**: 20 page files
**Effort**: Small — mechanical.

---

## Phase 6: Feature Gaps (7 items)

| # | Gap | Fix | Files |
|---|-----|-----|-------|
| 1 | No data export for admin tables | Add CSV export utility function; wire export button to `AdminAppointments`, `AdminClients`, `AdminJournal`, `AdminRevenue` | 4-5 files |
| 2 | No bulk actions on admin tables | Add checkbox column + bulk status dropdown to `AdminAppointments`, `AdminDocuments` | 2 files |
| 3 | No email notification on doc status change | Add email send call in document status update handler | 1 edge fn or page file |
| 4 | Realtime on appointments table | `ALTER PUBLICATION supabase_realtime ADD TABLE appointments` | Migration |
| 5 | Realtime on documents table | `ALTER PUBLICATION supabase_realtime ADD TABLE documents` | Migration |
| 6 | Realtime on service_requests table | `ALTER PUBLICATION supabase_realtime ADD TABLE service_requests` | Migration |
| 7 | No service worker / PWA | Deferred — low severity, requires infrastructure |

**Effort**: 2-3 sessions.

---

## Phase 7: Build Tracker UX & Performance Infra (13 items)

| # | Gap | Fix |
|---|-----|-----|
| 1 | AI Analyst oversized context | Already fixed (4000 char truncation in build-analyst edge fn) — mark resolved |
| 2 | Gap Analysis pagination | Already implemented — mark resolved |
| 3 | Service Flow search | Already implemented — mark resolved |
| 4 | Platform Functions Diagnose button | Add diagnostic checks per entity in `PlatformFunctionsTab.tsx` |
| 5 | AI Analyst no persistence | Store chat in `localStorage` keyed by session |
| 6 | Email template raw textarea | Replace with `RichTextEditor` component already in codebase |
| 7 | Quick Add missing page_route | Already added impact_area; add page_route input field |
| 8 | No unsaved changes warning | Add `beforeunload` listener in `EmailTemplatesTab` |
| 9 | No image optimization | Add `vite-imagetools` to vite config |
| 10 | No bundle analyzer | Add `rollup-plugin-visualizer` |
| 11 | LegalGlossaryProvider scope | Move from App root to only content-page routes |
| 12 | No Lighthouse CI | Deferred — CI/CD infrastructure |
| 13 | Admin chunk grouping | Add `manualChunks` for admin routes in vite config |

**Effort**: 1-2 sessions.

---

## Summary

| Phase | Items | Priority | Sessions |
|-------|-------|----------|----------|
| 1. ErrorBoundary wrapping | 15 | Critical/High | 0.5 |
| 2. Ohio Compliance | 5 | High | 1.5 |
| 3. Console.log removal | 12 | Medium | 0.5 |
| 4. DB indexes + query limits | 29 | Medium | 1 |
| 5. ARIA accessibility | 20 | Low | 1 |
| 6. Feature gaps | 7 | Medium | 2.5 |
| 7. Build Tracker UX + perf | 13 | Low-Medium | 1.5 |
| **Total** | **101** | | **~8.5 sessions** |

### Files Changed (estimated)

- `src/App.tsx` — ErrorBoundary wrapping (Phase 1)
- 12 component files — console.log removal (Phase 3)
- 20 page files — ARIA attributes (Phase 5)
- 4-5 admin pages — export + bulk actions (Phase 6)
- 5 files — Ohio compliance (Phase 2)
- 3 build-tracker tabs — UX fixes (Phase 7)
- `vite.config.ts` — bundle analysis + chunking (Phase 7)
- 2-3 DB migrations — indexes, realtime, compliance columns (Phases 2, 4, 6)

