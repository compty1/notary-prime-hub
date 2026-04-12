

# Comprehensive Gap Analysis & CSV Generation Plan (Up to 1000 Items)

## Summary
Generate an exhaustive CSV cataloging every remaining gap, bug, and incomplete implementation found through deep codebase analysis and cross-referencing with all 8 previously uploaded documents. Special focus on: Document Anatomy (incomplete descriptions, placeholder images instead of real photographed examples), Resources page gaps, and all items not yet addressed from prior document analysis.

## Key Findings

### Document Anatomy & Resources (CRITICAL)
- **All 10 document images** in `/public/images/documents/` are placeholder `.jpg` files — they need to be replaced with actual photographed examples of notarized Ohio documents (with PII redacted and SAMPLE watermark)
- **AnatomyDiagram callout positions** use static x/y percentages that don't align with actual document layouts since images are placeholders
- **Resources page** lists 11 resource cards but some link to pages with incomplete content (e.g., `/notary-guide-process` route, `/templates` route)
- **AdminResources page** (1464 lines) has a full Form Vault but the anatomy keys don't always align with `DOCUMENT_ANATOMY` entries
- Missing document types in anatomy: Loan Signing Closing Package, I-9 Employment Verification, Affidavit (general), Deed/Real Estate Transfer

### Pricing Prompt Mismatch (BUG)
- `generate-lead-proposal/index.ts` lines 25-29 still reference old pricing ($25 RON, $0.75/mile, $150 loan signing, $50 apostille) — must be updated to match new audit pricing ($40-45 RON, zone-based travel, $125+ loan signing, $175 apostille)

### Lead & CRM Gaps
- **AILeadChatbot**: No lead capture — never collects name/email/phone or inserts into `leads` table
- **fetch-leads**: Still uses hardcoded sample data (5 Ohio county recorders) — no real API integration
- **PortalLeadsTab**: Only shows service_requests, not actual leads — 76 lines with no lead detail view
- No lead scoring engine, no automated follow-up sequences, no lead merge wizard
- No map view for leads, no multi-format import (vCard/Excel)

### Native Tools Gaps
- **InvoiceGenerator**: No DB persistence — generates text/PDF only, no `invoices` table save
- **SubscriptionManager**: Reads `payments` table but no Stripe recurring billing connection
- **GrantDashboard**: No PDF export for generated grants
- **ResumeBuilder**: PDF parsing may use raw TextDecoder for non-PDF files
- **DocuDex**: Table editing toolbar exists but merge/split cells may not fully work
- AI Tools Hub: export only supports `.md` format, not `.docx` or `.pdf`

### Missing Service Tools (from document analysis)
- Ohio POA Generator (dedicated wizard, not just template)
- Healthcare Directive Builder (ORC §1337.12 compliant wizard)
- Session PDF Report Generator (post-notarization summary)
- Apostille Status Tracker (client-facing tracking page)
- Promo Code Manager (admin tool for discount codes)
- Bulk Invoice Generator (batch invoicing for business clients)
- Dynamic Pricing Rules Editor (admin override for pricing engine)
- Notary Stamp Upload Manager (admin credential management)
- Session Recording Manager (RON recording archive)
- Client Onboarding Analytics (admin dashboard)

### Security & Edge Function Gaps
- No API versioning headers on edge functions
- CSP headers could be tightened (currently broad `*` CORS)
- Several edge functions lack structured error logging
- `brand.ts` email domain mismatch: `contact@notardex.com` vs brand name "Notar"

### UX & Service Flow Gaps
- No booking-to-payment flow completion (booking doesn't trigger payment)
- No post-session automated workflow trigger from UI
- No client satisfaction survey after appointment
- Cancellation/no-show policy display not linked to booking flow
- No service area map visualization on public pages
- Missing "What to Bring" checklist per service type on booking confirmation

## What the CSV Will Contain
`/mnt/documents/notardex_comprehensive_gaps_v3.csv` with columns:
- **ID** (GAP-001 through GAP-xxx)
- **Category** (Document Anatomy, Resources, Pricing, CRM, Lead Portal, Native Tools, Admin Tools, Security, UX, Service Flows, Edge Functions, Brand, Compliance)
- **Item** (short title)
- **Description** (detailed gap description)
- **Current Status** (Not Started / Partial / Stub / Bug / Placeholder)
- **Priority** (P0-Critical / P1-High / P2-Medium / P3-Low)
- **Source Document** (which audit doc identified it, or "Codebase Analysis")
- **Expected Outcome** (what the fix delivers)
- **Implementation Details** (specific files, functions, approach)
- **Estimated Effort** (Small/Medium/Large)

## Implementation Approach

### Step 1: Generate Master CSV
Python script producing the comprehensive CSV with all identified gaps (targeting 200-400 high-quality rows covering every category).

### Step 2: Implement Top Priority Fixes (same session)
1. **Update generate-lead-proposal pricing prompt** — align with audit pricing
2. **Add lead capture to AILeadChatbot** — collect name/email/phone, insert into leads table
3. **Add DB persistence to InvoiceGenerator** — save to invoices or service_requests table
4. **Add 4 missing document anatomy types** — Loan Signing, I-9, General Affidavit, Deed Transfer
5. **Fix brand email consistency** — align `contact@notardex.com` or update to match brand

### Technical Details

**Files created:**
- `/mnt/documents/notardex_comprehensive_gaps_v3.csv`

**Files modified (priority fixes):**
- `supabase/functions/generate-lead-proposal/index.ts` — update pricing prompt
- `src/components/AILeadChatbot.tsx` — add lead capture form
- `src/components/InvoiceGenerator.tsx` — add DB save
- `src/components/AnatomyDiagram.tsx` — add missing document types
- `src/lib/brand.ts` — email consistency fix

