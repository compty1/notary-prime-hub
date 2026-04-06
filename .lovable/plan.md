

# Updated Plan: Email Mailbox Preview Fix + All Open/Deferred Build Tracker Gap Remediation

This plan adds the mailbox preview fix and full open/deferred gap remediation to the existing plan without removing anything.

---

## NEW — Workstream 5: Email Mailbox Preview — Missing Sender, Subject, Date

### Root Cause
The `ionos-email-sync` edge function's `parseEnvelope()` (line 117) uses regex patterns like `BODY[HEADER.FIELDS (SUBJECT)]` to find each header field individually. However, the FETCH command (line 231) requests ALL headers in a single `BODY.PEEK[HEADER.FIELDS (SUBJECT FROM TO DATE MESSAGE-ID IN-REPLY-TO CONTENT-TYPE)]` block. IMAP returns this as one contiguous header block — not separate per-field responses. So every regex fails to match, and all fields return empty strings.

**Evidence:** Every row in `email_cache` has empty `from_address`, `from_name`, and `subject = "(no subject)"` — confirmed via direct DB query.

### Fix
1. **Rewrite `parseEnvelope()`** in `ionos-email-sync/index.ts` to parse a standard multi-line header block instead of expecting per-field IMAP literals:
   - Match `Subject: ...`, `From: ...`, `To: ...`, `Date: ...`, `Message-ID: ...`, `In-Reply-To: ...` as simple header lines within the response
   - Handle header continuation lines (lines starting with whitespace)
2. **Clear stale email_cache data** — the ~10+ rows with empty metadata need to be deleted so a re-sync populates them correctly
3. **Redeploy `ionos-email-sync`** edge function
4. **No UI changes needed** — `AdminMailbox.tsx` already renders `from_name`, `from_address`, `subject`, and `date` correctly (lines 494-518); the data was simply missing

### Files Modified
- `supabase/functions/ionos-email-sync/index.ts` — rewrite `parseEnvelope()` header parser

---

## NEW — Workstream 6: Resolve All 760 Open/Deferred Build Tracker Gaps

There are **750 open** and **10 deferred** items across 18 categories. This workstream addresses them in priority order (critical/high first).

### 6a. Critical Items (9 total)
| Category | Count | Examples |
|----------|-------|---------|
| Compliance | 6 | Ohio RON journal credential_analysis not populated; witness ID verification; commission expiry auto-check; e-seal hash verification; recording duration validation; notary session timeout |
| Security | 3 | Missing RLS DELETE policies; service role key exposed in client bundle check; CORS wildcard on edge functions |

**Fix approach:** Add missing RLS policies via migration; add journal population logic to RON session finalize flow; add commission expiry check to notary dashboard; verify CORS headers in all edge functions.

### 6b. High Severity Items (53 total)
| Category | Count |
|----------|-------|
| Compliance | 13 |
| Feature | 15 |
| UX | 16 |
| Security | 6 |
| DevOps | 5 |
| Edge Function | 6 |
| Integration | 3 |
| Accessibility | 2 |
| Performance | 3 |
| Flow | 1 |
| Component | 1 |
| Mobile | 1 |
| Bug | 1 |

**Fix approach:** Batch by category — compliance items get DB triggers and validation; feature items get incremental implementation; UX items get loading skeletons, confirmation dialogs, empty states; security items get RLS and input validation.

### 6c. Medium Severity Items (446 total)
Largest categories:
- Feature: 101 — missing functionality across portal, admin, AI tools
- UX: 83 — inconsistent states, mobile issues, date formatting
- Accessibility: 30 — form labels, focus traps, ARIA roles
- Data Integrity: 30 — orphaned references, missing defaults
- Testing: 30 — missing unit/integration tests
- Security: 23 — input validation, rate limiting
- Compliance: 17 — documentation gaps, audit trail completeness
- Edge Function: 17 — error handling, timeout management
- Performance: 16 — N+1 queries, missing pagination
- DevOps: 12 — logging, monitoring, health checks
- Mobile: 11 — responsive layouts, touch targets
- Component: 10 — prop validation, error boundaries
- Integration: 9 — SignNow, HubSpot, Google Calendar completion

### 6d. Low Severity Items (251 total)
- Documentation: 39 — JSDoc, README, API docs
- SEO: 28 — structured data, canonical URLs
- Security: 24 — best practices, CSP enhancements
- UX: 68 — polish, micro-interactions
- Feature: 47 — nice-to-have features
- Others: 45

### Execution Strategy
Given the volume (760 items), these will be addressed in batches:
1. **Batch 1 (Critical+High, ~62 items):** All critical and high-severity items — implemented directly with code changes, migrations, and edge function updates
2. **Batch 2 (Medium Priority, ~200 items):** Security, compliance, data integrity, and accessibility mediums — systematic fixes with automated patterns (e.g., bulk htmlFor/id pairing, RLS policy generator)
3. **Batch 3 (Medium Features/UX, ~246 items):** Feature completeness and UX consistency — loading skeletons, empty states, confirmation dialogs applied as reusable patterns
4. **Batch 4 (Low, ~251 items):** Documentation, SEO, polish — documentation generation, structured data injection

Each batch marks items as `resolved` in the tracker with `resolved_at` timestamp after implementation.

### Items from Previous Plans Still Unfinished (included in Batch 1)
- Form label audit (Gap 142) — add htmlFor/id pairs across 12+ forms
- Color contrast increase (Gap 143) — update badge and muted text color tokens
- Keyboard nav fixes (Gaps 147-150) — focus traps in modals, dropdown arrow key nav
- N+1 query fix in AdminClients (Gap 202) — join queries instead of per-row fetches
- useMemo wrapping in ClientPortal (Gap 203) — memoize expensive renders
- Refund email notification (Gap 372) — add email trigger in process-refund
- Global error handler (window.onerror) — add to main.tsx
- JSDoc on lib exports — add to all lib/ files

---

## Updated Execution Order

1. Database migrations (from Workstream 3 — version table, plan column)
2. **Fix email_cache header parsing + redeploy ionos-email-sync** (Workstream 5)
3. Generate & import 800 gaps into build tracker (Workstream 1)
4. Fix build tracker bugs (Workstream 2)
5. Build portal AI Tools tab with history + editing + versions (Workstream 3)
6. Implement free plan cap in edge function + UI (Workstream 4)
7. **Resolve critical+high gaps — Batch 1** (Workstream 6)
8. **Resolve medium priority gaps — Batch 2** (Workstream 6)
9. **Resolve medium features/UX gaps — Batch 3** (Workstream 6)
10. **Resolve low severity gaps — Batch 4** (Workstream 6)
11. Fix remaining items from previous phases (accessibility, performance, UX)

---

## Files Modified (New additions only)

- `supabase/functions/ionos-email-sync/index.ts` — rewrite parseEnvelope() header parser
- Multiple files across all categories per gap resolution batches
- Database: delete stale email_cache rows with empty metadata

