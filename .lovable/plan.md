

# Implement All Remaining Gaps from Master CSV & Implementation Plan

## Summary
Cross-referencing the 109-item CSV and the Comprehensive Implementation Plan PDF against the current codebase reveals that **many P0 items are already done** (RBAC, migrations, input validation, CSRF, rate limiting, audit trail, health-check, error boundaries). Infrastructure items (Docker, CI/CD, Prometheus, k6, BullMQ/Redis) are out of scope for Lovable. This plan implements the **~40 actionable remaining items** grouped into batches.

## Already Done (skip these)
- TOOLS-01/02: AI Tools allowlist + streaming fix — already fixed
- TOOLS-03: FontSize registered in DocuDexEditor (line 22 imports it)
- TOOLS-05: InvoiceGenerator has DB save (already added)
- LEAD-01/02: extract-email-leads and hubspot-sync already have JWT auth
- LEAD-03: generate-lead-proposal already updated with current auth pattern
- LEAD-04: AILeadChatbot already has lead capture form (lines 21-80)
- CRM-02: AdminLeadPortal uses 7 stages, AdminCRM uses 7 LEAD_STAGES (line 32)
- COMP-02: AdminJournal already has JSON export (line 220+)
- SEC-01 through SEC-05: Already have RBAC, rate limiting, CSRF, session timeout, input validation
- OOS-01 through OOS-05: Docker, CI/CD, Prometheus, k6, BullMQ — out of scope

## Batch 1: Critical Bug Fixes & Edge Functions

### 1. Fix fetch-leads stub data (CRM-08)
**File:** `supabase/functions/fetch-leads/index.ts`
- Replace hardcoded Ohio county recorder data with actual database query from `leads` table
- Add Google Places API integration stub (requires API key) that fetches real business data
- Return leads from DB when source=all, only attempt external API when source=google_places

### 2. Fix lead enrichment note overwrite (LEAD-05)
**File:** `src/pages/admin/AdminLeadPortal.tsx`
- Find the enrichment update logic and change from overwriting `notes` to appending with timestamp

### 3. CRM pipeline stages unification (CRM-01)
**File:** `src/pages/admin/AdminCRM.tsx`
- Update `PIPELINE_STAGES` from 5 stages to 7 to match AdminLeadPortal's pipeline
- Add "new" and "contacted" stages before "discovery"

## Batch 2: Native Tool Enhancements

### 4. DocuDex table toolbar wiring (TOOLS-04)
**File:** `src/components/docudex/DocuDexTableToolbar.tsx`
- Verify and wire insert/delete row/column commands to the editor instance

### 5. Grant Dashboard PDF export (TOOLS-08)
**File:** `src/pages/GrantDashboard.tsx`
- Add PDF export using `html2canvas` + `jsPDF` or `window.print()` for grant proposals

### 6. Resume Builder PDF parsing fix (TOOLS-09)
**File:** `src/pages/ResumeBuilder.tsx`
- Replace raw `TextDecoder` PDF parsing with call to `ai-extract-document` edge function

### 7. AI Tools export format selector (TOOLS-10)
**File:** `src/components/ai-tools/ToolRunner.tsx`
- Add format selector (Markdown, Plain Text, HTML) to the download function
- Current download is `.md` only — add `.txt` and `.html` options

### 8. Add missing AI tool registry entries (TOOLS-11, 12, 13)
**File:** `src/lib/aiToolsRegistry.ts` + `supabase/functions/ai-tools/index.ts`
- Add Ohio POA Generator, Healthcare Directive Builder, Session PDF Report tools
- Add corresponding IDs to edge function TOOL_IDS set

## Batch 3: Service Flow Completions

### 9. Estate Plan Bundle in booking (SVC-05)
**File:** `src/pages/BookAppointment.tsx` or `src/pages/booking/bookingConstants.ts`
- Add "Estate Plan Bundle" as a bookable service type with its $200 price

### 10. Business Formation wizard enhancement (SVC-10)
**File:** `src/pages/admin/AdminBusinessFormation.tsx`
- Add step-by-step wizard flow for LLC, Corporation, DBA formation types

### 11. I-9 verification guided flow (SVC-03)
**File:** `src/pages/admin/AdminI9Verifications.tsx`
- Add step-by-step verification wizard with document checklist per List A/B/C

## Batch 4: CRM & Lead Enhancements

### 12. Lead-to-appointment pipeline (CRM-06)
**File:** `src/pages/admin/AdminLeadPortal.tsx`
- Add "Book Appointment" button in lead detail sheet that pre-fills booking form with lead data

### 13. Lead scoring engine (CRM-03)
**File:** `src/pages/admin/AdminLeadPortal.tsx`
- Add auto-scoring function based on: has email (+20), has phone (+15), business type (+10), service_needed matches high-value service (+25), recent activity (+10)

### 14. Deal pipeline Kanban (CRM-09)
**File:** `src/pages/admin/AdminCRM.tsx`
- Add Kanban board tab for deals using drag-and-drop pipeline visualization

## Batch 5: Security & Middleware

### 15. API versioning header (SEC-01)
**File:** `supabase/functions/_shared/middleware.ts`
- Add `X-API-Version: 1.0` header to the shared cors/response helpers

### 16. Structured error logging (SEC-03)
**File:** `supabase/functions/_shared/middleware.ts`
- Add `structuredLog()` helper that outputs JSON with timestamp, level, function_name, correlation_id

## Batch 6: Brand & UX

### 17. Email templates branding (BRAND-04)
**Files:** `supabase/functions/_shared/email-templates/*.tsx`
- Verify all 6 email templates use "Notar" branding, correct colors, and `contact@notar.com`

### 18. Compliance retention badge in RON session (COMP-01)
**File:** `src/pages/RonSession.tsx`
- Add visible badge showing "10-Year Retention (ORC §147.66)" on session page

### 19. Compliance dashboard for notary role (COMP-03)
**File:** Create `src/pages/admin/AdminNotaryCompliance.tsx` or enhance existing
- Show commission status, journal entry count, recent sessions, compliance checklist

## Batch 7: Monetization

### 20. Free tier limit enforcement (MON-01)
**Files:** `src/pages/GrantDashboard.tsx`, `src/pages/ResumeBuilder.tsx`, `src/pages/DocumentBuilder.tsx`
- Add usage limit checks (matching AI Tools Hub pattern) before generation

### 21. Annual billing option (MON-04)
**File:** `src/pages/SubscriptionPlans.tsx`
- Add annual billing toggle with 20% discount display

## Technical Details

**Files modified (~25 files):**
- `supabase/functions/fetch-leads/index.ts` — real DB query
- `supabase/functions/_shared/middleware.ts` — API version header + structured logging
- `supabase/functions/ai-tools/index.ts` — add 3 tool IDs
- `src/lib/aiToolsRegistry.ts` — add 3 tools
- `src/pages/admin/AdminCRM.tsx` — unify pipeline, add Kanban
- `src/pages/admin/AdminLeadPortal.tsx` — lead scoring, booking link, note append
- `src/components/ai-tools/ToolRunner.tsx` — export format selector
- `src/pages/GrantDashboard.tsx` — PDF export + free tier check
- `src/pages/ResumeBuilder.tsx` — PDF parsing fix + free tier check
- `src/pages/RonSession.tsx` — retention badge
- `src/pages/BookAppointment.tsx` — estate plan bundle
- `src/pages/SubscriptionPlans.tsx` — annual billing
- `src/pages/admin/AdminI9Verifications.tsx` — guided wizard
- `src/pages/admin/AdminBusinessFormation.tsx` — wizard steps
- Email templates (6 files) — brand verification

**No database migrations needed** — all changes use existing tables.

**CSV artifact:** Updated CSV will be generated at `/mnt/documents/notardex_final_implementation_status.csv` showing all items with their resolved status.

