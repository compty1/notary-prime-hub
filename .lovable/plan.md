

# Comprehensive Gap Analysis & CSV Generation Plan

## Summary
Generate a detailed CSV file cataloging every unimplemented item from all 8 uploaded documents, cross-referenced against the current codebase. Then implement the highest-priority actionable fixes.

## What the CSV Will Contain
A single file `/mnt/documents/notardex_master_implementation_gaps.csv` with columns:
- **ID** (e.g., TOOLS-01, CRM-05, LEAD-12)
- **Source Document** (which PDF/DOCX identified it)
- **Category** (Tools, CRM, Lead Portal, Security, UX, Integration, Monetization)
- **Item** (short title)
- **Description** (specific details)
- **Current Status** (Not Started / Partial / Stub / Bug)
- **Priority** (Critical / High / Medium / Low)
- **Expected Outcome**
- **Implementation Details** (specific files, functions, approach)

## Key Gap Categories Identified (from document parsing)

### Native Tools Audit (82+ items)
- DocuDex FontSize extension not registered, table editing UI incomplete (80%)
- Document Builder missing POA/Healthcare Directive templates (90%)
- Invoice Generator: no Stripe link, no DB persistence (85%)
- OCR Digitizer: no dedicated UI page (70%)
- Grant Generator: no PDF export (90%)
- Resume Builder: PDF parsing uses raw TextDecoder (90%)
- AI Tools Hub: edge function allowlist mismatch for 2 tools, export .md only, '[streaming]' saved in DB
- 10 missing tools: Ohio POA Generator, Healthcare Directive Builder, Session PDF Report, Client AI Chat portal tab, OCR Scanner Page, Apostille Status Tracker, KBA Integration, Video Conferencing Embed, Promo Code Manager, Bulk Invoice Generator
- 6 missing admin tools: Dynamic Pricing Rules Editor, Promo Code Manager, Service Template Manager, Notary Stamp Upload, Session Recording Manager, Client Onboarding Analytics
- Subscription/paywall not connected to Stripe recurring billing

### CRM Audit (40+ items)
- CRM Hub and Lead Portal are separate pages with overlapping functionality and inconsistent pipeline stages (5 vs 7)
- No automated lead scoring engine
- No automated follow-up sequences
- No conversion attribution tracking
- No lead-to-appointment pipeline connection
- HubSpot sync lacks error recovery
- fetch-leads is a stub with hardcoded data

### Lead Portal Audit (47+ items)
- extract-email-leads and hubspot-sync missing JWT auth (CRITICAL)
- generate-lead-proposal uses deprecated getClaims (BUG)
- AILeadChatbot has no lead capture logic
- Enrichment overwrites notes instead of appending
- No lead merge wizard for duplicates
- No map view for leads
- No multi-format import (vCard, Excel)
- PortalLeadsTab is minimal (76 lines, 5 gaps)

### Implementation Plan (SEC/PERF/UX items)
- Items already done: RBAC, CSRF, rate limiting, audit log, accessibility basics, state machine, pricing engine
- Items out of scope: Docker, CI/CD, Prometheus, k6, BullMQ, Redis
- Remaining actionable: API versioning headers, CSP headers tightening, structured error logging

## Implementation Approach

### Step 1: Generate Master CSV
Run a Python script that produces the comprehensive CSV with ~150 rows covering every gap from all 8 documents, with implementation specifics.

### Step 2: Implement Top Priority Fixes (in same session)
1. **Fix ai-tools edge function allowlist** — add missing tool IDs (proposal-template, executive-summary)
2. **Fix AI Tools Hub streaming result** — update tool_generations after streaming completes in ToolRunner.tsx
3. **Add Document Builder templates** — POA, Healthcare Directive, Promissory Note
4. **Fix Invoice Generator** — add DB persistence to invoices table
5. **Unify CRM/Lead pipeline stages** — standardize to 7 stages across both pages

### Technical Details

**Files created:**
- `/mnt/documents/notardex_master_implementation_gaps.csv` — ~150 rows

**Files modified (priority fixes):**
- `supabase/functions/ai-tools/index.ts` — add missing TOOL_IDS
- `src/components/ai-tools/ToolRunner.tsx` — save final result after streaming
- `src/pages/DocumentBuilder.tsx` — add POA/Healthcare Directive templates
- `src/components/InvoiceGenerator.tsx` — add DB save functionality
- `src/pages/admin/AdminLeadPortal.tsx` — unify pipeline stages

