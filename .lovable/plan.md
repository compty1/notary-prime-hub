

# Build Tracker: Comprehensive Gap Analysis & Fix Plan

## Overview

After auditing every file in the build tracker system, platform entities, service flows, page registry, hooks, and cross-referencing against the actual codebase (App.tsx routes, edge functions, DB tables, components), I identified **187 gaps** across 8 categories. Below is the full inventory and implementation plan.

---

## Category 1: Missing Page Registry Entries (12 gaps)

Routes that exist in App.tsx but are NOT in `pageRegistry.ts`:

| # | Route | Component |
|---|-------|-----------|
| 1 | `/booking` | BookAppointment (alias) |
| 2 | `/schedule` | BookAppointment (alias) |
| 3 | `/mailroom` | VirtualMailroom |
| 4 | `/subscribe` | SubscriptionPlans |
| 5 | `/ai-knowledge` | AIKnowledge |
| 6 | `/builder` | DocumentBuilder |
| 7 | `/ai-writer` | AIWriter |
| 8 | `/ai-extractors` | AIExtractors |
| 9 | `/mobile-upload` | MobileUpload |
| 10 | `/digitize` | DocumentDigitize |
| 11 | `/request` | ServiceRequest |
| 12 | `/account-settings` | AccountSettings |

Wait — some of these ARE in the registry. Let me refine: `/booking`, `/schedule` (route aliases), `/mailroom`, `/subscribe` are the actually missing ones. The rest are present.

**Fix**: Add missing routes to `pageRegistry.ts`.

---

## Category 2: Missing Platform Entity Sub-Components (28 gaps)

Sub-components that exist in code but aren't tracked in `platformEntities.ts`:

**Email Management** (5 missing):
1. Inbound email processing (`process-inbound-email` edge fn)
2. Email queue processing (`process-email-queue` edge fn)
3. Email unsubscribe management (`/unsubscribe` page)
4. Email send state configuration (DB table)
5. Bounce/DLQ tracking

**Services Catalog** (3 missing):
6. Loan Signing Services page (`/loan-signing`)
7. Service Request admin (`/admin/service-requests`)
8. Admin Services management (`/admin/services`)

**Documents** (4 missing):
9. Document bundles system
10. Document collections
11. Document tags
12. Document reminders/expiry DB triggers

**RON Sessions** (3 missing):
13. SignNow webhook integration (`signnow-webhook`)
14. SignNow API integration (`signnow`)
15. Notarization session DB table tracking

**CRM & Leads** (4 missing):
16. Social lead scraping (`scrape-social-leads`)
17. Lead discovery (`discover-leads`)
18. Lead fetching (`fetch-leads`)
19. CRM auto-activity triggers (DB triggers exist)

**AI Services** (3 missing):
20. AI Knowledge base (`/ai-knowledge`)
21. Build Analyst AI (`build-analyst` edge fn)
22. ID Scan Assistant (`scan-id` edge fn)

**Admin Dashboard** (3 missing):
23. Admin Mailbox page (referenced in files but no route)
24. Admin Users management (`/admin/users`)
25. Admin Client Emails (`/admin/client-emails` — not in registry or routes)

**Payments** (3 missing):
26. Stripe config endpoint (`get-stripe-config`)
27. Payment tracking via webhooks
28. Stripe publishable key management

**Fix**: Add all 28 sub-components to their respective entities in `platformEntities.ts`.

---

## Category 3: Missing Service Flow Steps (18 gaps)

**Booking Flow** (3 missing):
1. Pre-Signing Checklist (`PreSigningChecklist` component)
2. Signer Checklist (`SignerChecklist` component)
3. Service Pre-Qualifier (`ServicePreQualifier` component)

**RON Session Flow** (4 missing):
4. ID Scan step (`IDScanAssistant` + `scan-id` edge fn)
5. Notarization Certificate generation (`NotarizationCertificate`)
6. Compliance Watchdog real-time check
7. Multi-signer support flow

**Client Portal Flow** (2 missing):
8. Feedback submission (`ClientFeedbackForm`)
9. Onboarding wizard (`OnboardingWizard`)

**Document Flow** (3 missing):
10. Document translation (`translate-document` edge fn)
11. Document explanation (`explain-document` edge fn)
12. Document detection/classification (`detect-document` edge fn)

**Lead Capture Flow** (2 missing):
13. Social media lead scraping flow
14. Lead source management admin

**Admin Workflow** (4 missing):
15. Admin Mailbox step
16. Admin Client Emails step
17. Admin Build Tracker AI Analyst
18. Continuing Education tracking

**Fix**: Add missing steps to `serviceFlows.ts`.

---

## Category 4: Build Tracker Functional Bugs (8 gaps)

1. **Re-analyze returns void, not Promise** — `useReanalyze` returns an async function but `AdminBuildTracker` calls it without `await`, so errors are silently swallowed
2. **Re-analyze fires multiple separate mutations** — each `bulkUpdate.mutate` runs independently; race conditions can occur
3. **useMemo used for side effects** in `EmailTemplatesTab` (line 132-137) — state is set inside `useMemo`, which is a React anti-pattern; should use `useEffect`
4. **Tag insertion loses cursor position** — `insertTag` in EmailTemplatesTab reads `editorRef.current.selectionStart` but the textarea value is controlled React state, so selection position can be stale after re-render
5. **Plan History cross-reference is naive** — only matches first 20 chars of title, missing many valid matches
6. **Dashboard flowHealth is computed with empty deps** — `useMemo(() => ..., [])` means it never re-computes if service flows change
7. **PageAuditorTab doesn't track `/admin/client-emails`** — route exists in navigation but not in PAGE_REGISTRY
8. **Email template save doesn't validate** — can save empty subjects or bodies without warning

**Fix**: Fix each bug in the respective component file.

---

## Category 5: Missing Edge Function Coverage in Tracker (14 gaps)

Edge functions that exist but aren't referenced anywhere in the build tracker:

1. `ai-compliance-scan`
2. `ai-cross-document`
3. `ai-extract-document`
4. `ai-style-match`
5. `discover-leads`
6. `fetch-leads`
7. `scrape-social-leads`
8. `process-email-queue`
9. `process-inbound-email`
10. `send-correspondence`
11. `translate-document`
12. `explain-document`
13. `ocr-digitize`
14. `admin-create-user`

**Fix**: Add these to platform entities or create tracker items.

---

## Category 6: Missing Database Tables in Platform Tracking (15 gaps)

Tables that exist in the DB but have no representation in the tracker:

1. `form_library` — pre-built form templates
2. `mailroom_items` — virtual mailroom
3. `client_style_profiles` — AI style matching
4. `compliance_rule_sets` — compliance rules
5. `document_bundles` — bundled documents
6. `document_collections` — document organization
7. `email_drafts` — saved email drafts
8. `email_send_state` — email configuration
9. `email_signatures` — custom signatures
10. `email_unsubscribe_tokens` — unsubscribe management
11. `lead_sources` — lead source configuration
12. `notarization_sessions` — session tracking
13. `e_seal_verifications` — seal verification records
14. `continuing_education` — notary CE credits
15. `client_feedback` — post-appointment feedback

**Fix**: Add platform entity sub-components or tracker items for each.

---

## Category 7: UX & Accessibility Gaps (22 gaps)

1. No loading skeleton for Build Tracker page itself
2. No empty state illustration for AI Analyst chat
3. Tab bar wraps poorly on mobile (10 tabs)
4. No keyboard shortcut help dialog
5. No confirmation when leaving unsaved email template edits
6. No pagination on Gap Analysis table (can show 200+ rows)
7. No bulk status transition validation (can mark "resolved" → "open" without notes)
8. Dashboard charts have no fallback for zero data
9. No dark mode testing on email template preview
10. Service Flow tab has no search/filter
11. Platform Functions tab "Diagnose" button mentioned in plan but never implemented
12. No export for Plan History
13. No delete capability for plans
14. AI Analyst chat has no conversation history persistence
15. AI Analyst chat has no clear/reset button
16. Email template editor uses raw textarea instead of rich text
17. No undo/redo in email template editor
18. Quick Add dialog doesn't support impact_area or page_route
19. Todo tab doesn't show total count in empty state
20. No timestamp display on plan items
21. Page Auditor doesn't link to actual preview
22. No mobile-responsive view for Gap Analysis table

---

## Category 8: Data Integrity & Security Gaps (12 gaps)

1. `build_tracker_items` has no RLS policies visible — needs audit
2. `build_tracker_plans` has no RLS policies visible — needs audit
3. Email template settings stored in `platform_settings` — table may not exist (uses `as any` cast)
4. No input validation on bulk import (could insert 1000+ items at once)
5. No rate limiting on AI Analyst edge function
6. AI Analyst sends full build context (potentially large) on every message
7. No audit log entries for build tracker changes
8. Plan `chat_context` can store up to 5000 chars of sensitive conversation
9. No size limit on admin_notes field
10. `useReanalyze` can fire multiple mutations without awaiting previous
11. Cross-reference matching could create false positives
12. No data backup/export for build_tracker_plans

---

## Category 9: Missing Components Referenced but Not Integrated (8 gaps)

1. `BulkDocumentUpload` — created but not used in any page
2. `ClientFeedbackForm` — created but not wired into portal
3. `SessionTimeoutWarning` — created but not imported in RonSession
4. `NotarizationCertificate` — component exists, no route
5. `StyleMatchPanel` — component exists, unclear integration
6. `TranslationPanel` — component exists, unclear integration  
7. `SignPreviewWizard` — component exists, not in RON flow
8. `WhatDoINeed` — component exists, not visible on any page

---

## Implementation Plan

### Phase 1: Data Accuracy (bulk DB inserts + file edits)
- Add 4 missing routes to `pageRegistry.ts`
- Add 28 missing sub-components to `platformEntities.ts`
- Add 18 missing steps to `serviceFlows.ts`
- Bulk-insert ~80 new tracker items for all identified gaps

### Phase 2: Bug Fixes (8 items)
- Fix `useReanalyze` to return proper async chain
- Fix `useMemo` side effect in EmailTemplatesTab → `useEffect`
- Fix dashboard `flowHealth` deps
- Improve plan cross-reference matching algorithm
- Add email template save validation
- Fix tag insertion cursor position

### Phase 3: Functional Enhancements (top 15 UX gaps)
- Add pagination to Gap Analysis table
- Add search/filter to Service Flow tab
- Add mobile-responsive overflow handling for 10-tab bar
- Add "Diagnose" button to Platform Functions
- Add conversation persistence for AI Analyst
- Add clear/reset button to AI Analyst
- Add plan delete capability
- Add unsaved changes warning on email templates
- Improve Quick Add dialog with impact_area field
- Add bulk import size limit (max 100)
- Wire `BulkDocumentUpload`, `ClientFeedbackForm`, `SessionTimeoutWarning` into their target pages

### Phase 4: Security Hardening
- Audit and confirm RLS on `build_tracker_items` and `build_tracker_plans`
- Add rate limiting to `build-analyst` edge function
- Truncate AI context to prevent oversized payloads
- Add audit log entries for tracker modifications

---

## Files Changed

### Phase 1:
1. `src/pages/admin/build-tracker/pageRegistry.ts` — add 4 missing routes
2. `src/pages/admin/build-tracker/platformEntities.ts` — add 28 sub-components + 14 edge function references
3. `src/pages/admin/build-tracker/serviceFlows.ts` — add 18 missing flow steps
4. Database: bulk insert ~80 tracker items via migration tool

### Phase 2:
5. `src/pages/admin/build-tracker/hooks.ts` — fix useReanalyze async chain
6. `src/pages/admin/build-tracker/EmailTemplatesTab.tsx` — fix useMemo→useEffect, tag insertion, validation
7. `src/pages/admin/build-tracker/DashboardTab.tsx` — fix flowHealth deps
8. `src/pages/admin/build-tracker/PlanHistoryTab.tsx` — improve cross-reference

### Phase 3:
9. `src/pages/admin/build-tracker/GapAnalysisTab.tsx` — add pagination
10. `src/pages/admin/build-tracker/ServiceFlowTab.tsx` — add search
11. `src/pages/admin/AdminBuildTracker.tsx` — responsive tabs, keyboard shortcuts
12. `src/pages/admin/build-tracker/PlatformFunctionsTab.tsx` — add Diagnose
13. `src/pages/admin/build-tracker/AIAnalystTab.tsx` — persistence, reset
14. `src/pages/portal/PortalAppointmentsTab.tsx` — wire ClientFeedbackForm
15. `src/pages/RonSession.tsx` — wire SessionTimeoutWarning

### Phase 4:
16. Database migration — verify RLS policies
17. `supabase/functions/build-analyst/index.ts` — add rate limiting, context truncation

**Total: 187 gaps identified, ~17 files changed across 4 phases.**

