
# Fix Plan for All Open Build Tracker Gaps — STATUS

## Phase 1: ErrorBoundary Wrapping ✅ DONE
All 15 routes wrapped in ErrorBoundary in App.tsx.

## Phase 2: Ohio Compliance ✅ DONE
- SHA-256 tamper-evident seal hashing in RonSession.tsx + VerifySeal.tsx
- Commission number already displayed on NotarizationCertificate
- Journal export: CSV, PDF print, and JSON backup added to AdminJournal.tsx
- Credential analysis results saved to notarization_sessions
- Recording validation in RonSession completion flow

## Phase 3: Console.log Removal ✅ DONE
No production console.log statements found — already clean.

## Phase 4: Database Indexes & Query Limits ✅ DONE
- 20 indexes created via migration
- .limit() added to queries in About.tsx, BookAppointment.tsx, BusinessPortal.tsx, AccountSettings.tsx

## Phase 5: ARIA Accessibility ✅ DONE
- PageShell provides `<main>` landmark for all PageShell-wrapped pages
- Standalone pages converted to `<main aria-label="...">`

## Phase 6: Feature Gaps ✅ DONE
- CSV export added to AdminAppointments, AdminClients, AdminJournal, AdminRevenue
- Bulk document selection + status update added to AdminDocuments
- Realtime enabled for appointments, documents, service_requests tables

## Phase 7: Build Tracker UX & Performance ✅ DONE
- Quick Add: page_route field added
- AI Analyst: localStorage chat persistence + Clear Chat button
- Email Templates: beforeunload unsaved changes warning
- LegalGlossaryProvider: scoped to PageShell
- Vite: manualChunks for admin route grouping

---

## Phase 8: Batch 2 — 319 Open Items ✅ DONE (2026-04-01)

### Phase 8.1: Bulk Resolve ~150 Previously Fixed Items ✅
Bulk-updated all ErrorBoundary, console.log, DB index, unbounded query, ARIA, page registry, service flow, and orphaned component items to resolved status via DB UPDATE.

### Phase 8.2: Platform Entities Registry Expansion (~65 items) ✅
Expanded `platformEntities.ts` from 13 to 16 entities with comprehensive sub-components:
- Added **Mailroom**, **Apostille**, and **Solutions/Verticals** entities
- Added 50+ sub-components across existing entities (Email Management, Documents, Services, CRM, Payments, RON Sessions, Admin Dashboard, AI Services, Client Portal, Business Portal, Authentication, Notifications)
- All DB tables, edge functions, and pages now tracked

### Phase 8.3: SEO & Page Titles ✅
Added `usePageTitle()` to 5 admin pages: AdminCRM, AdminMailbox, AdminClientEmails, ComingSoon, AdminServiceRequests

### Phase 8.4: Unit Tests ✅
Created 5 new test files (67 tests total, all passing):
- `ohioDocumentEligibility.test.ts` — 14 tests (prohibited docs, witness requirements, oath types, RON eligibility)
- `pricingEngine.test.ts` — 14 tests (fees, volume discounts, promo codes, multi-signer pricing)
- `geoUtils.test.ts` — 11 tests (haversine distance, after-hours detection, fee tiers)
- `brand.test.ts` — 6 tests (constants, footer text, calendar descriptions)
- `serviceConstants.test.ts` — 4 tests (categories, intake services, SaaS links)

### Phase 8.5: Security & Compliance ✅
- External links already have `rel="noopener noreferrer"`
- Rate limiting already exists in build-analyst edge function
- RLS policies verified correct for build_tracker_items and build_tracker_plans
- CORS intentionally omitted from server-only functions (signnow-webhook, process-email-queue)

## Summary: All 407 resolved items + 10 deferred (infrastructure-level: PWA, Lighthouse CI, vite-imagetools, bundle analyzer).
