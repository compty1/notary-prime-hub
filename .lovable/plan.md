


# Email-to-Lead Import with AI Extraction and Real-Time Lead Detail View

## Overview
Build an automated pipeline that scans synced inbox emails, uses AI to extract lead information (name, phone, email, service needed, source identification), and inserts them into the `leads` table. Enhance the Lead Portal with a clickable lead detail panel and real-time updates via Supabase Realtime.

---

## 1. New Edge Function: `extract-email-leads`

Create `supabase/functions/extract-email-leads/index.ts` that:
- Queries `email_cache` for unprocessed inbox emails (not yet linked to a lead)
- Uses AI (Gemini Flash via Lovable AI) to analyze each email's subject + body and extract structured lead data: name, phone, email, business name, city, state, service needed, and identified source (e.g., "google_search", "referral", "zillow", "realtor.com", "facebook", "direct_inquiry")
- Deduplicates against existing leads by email/phone before inserting
- Tags each lead with `source: "email_inbox"` and stores the originating `email_cache.id` in notes for traceability
- Adds a `processed_for_leads` flag tracking via a new column on `email_cache` or a separate tracking approach (using notes/labels)

**AI prompt design:** Instruct the model to identify the sender's intent (notarization request, loan signing inquiry, apostille need, etc.) and map it to `service_needed` and `intent_score` (high if they mention urgency/dates, medium otherwise).

---

## 2. Database Changes

**Migration:**
- Add `lead_extracted` boolean column (default false) to `email_cache` table to track which emails have been processed for lead extraction
- Add `email_cache_id` uuid column (nullable) to `leads` table to link leads back to their source email
- Enable Realtime on the `leads` table: `ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;`

---

## 3. Lead Portal Enhancements (`AdminLeadPortal.tsx`)

### 3a. Real-Time Updates
- Subscribe to `postgres_changes` on the `leads` table so new leads appear instantly without manual refresh
- Show a subtle "New lead" animation/badge when a lead arrives in real-time

### 3b. Clickable Lead Detail Panel
- Replace the current "click to edit" behavior with a full detail slide-out panel (Sheet component)
- Detail panel shows ALL available info in organized sections:
  - **Contact Info:** name, phone (clickable), email (clickable), business name
  - **Location:** full address, city, state, zip
  - **Lead Intelligence:** source, source URL, intent score, service needed, lead type
  - **Timeline:** created date, contacted date, last updated
  - **Notes:** full notes with the original email excerpt if sourced from email
  - **Source Email:** if `email_cache_id` exists, show a preview of the original email
  - **Actions:** Edit, Schedule Appointment, Generate Proposal, Change Status, Delete

### 3c. "Import from Inbox" Button
- Add a button in the Lead Portal toolbar that invokes the `extract-email-leads` edge function
- Shows progress and results (e.g., "Scanned 47 emails, extracted 12 new leads")

---

## 4. Auto-Source Identification Logic

The AI extraction prompt will identify sources based on email content patterns:
- Emails from `@gmail.com` with notarization keywords = "direct_inquiry"
- Emails forwarded from Zillow/Realtor = "zillow" / "realtor"
- Emails mentioning "referred by" = "referral"
- Form submission notifications = "website_contact_form"
- Loan signing requests from title companies = "title_company"
- The source is stored in the `source` column; the original email address in `source_url`

---

## 5. HubSpot CRM Integration

- New edge function `hubspot-sync` for two-way sync between leads and HubSpot Contacts
- `hubspot_contact_id` and `hubspot_deal_id` columns on leads table
- Admin Settings UI for HubSpot connection and sync controls

---

## 6. AI Services Suite ✅ IMPLEMENTED

### 6a. Smart Due Diligence Extractors (`/ai-extractors`)
- Four specialized extractors: Legal/Real Estate, Finance, HR, General
- Edge function `ai-extract-document` using Gemini 2.5 Pro with tool calling
- Structured JSON output with source citations and confidence scores
- CSV export of extraction results

### 6b. Style-Match Drafting
- Edge function `ai-style-match` for analyzing writing samples and generating style-matched documents
- Style analysis (tone, vocabulary, sentence patterns) stored in `client_style_profiles` table
- Streaming document generation matching client's writing style

### 6c. Compliance Watchdog
- Edge function `ai-compliance-scan` with built-in rule sets:
  - Ohio ORC §147 (notary compliance)
  - GDPR privacy
  - General legal compliance
  - Brand guidelines
- Returns severity-ranked findings with suggested fixes

### 6d. Cross-Document Synthesis (`/ai-knowledge`)
- Edge function `ai-cross-document` for multi-document RAG queries
- Streaming responses with document citations
- Chat interface for iterative questioning across document collections
- `document_collections` table for persistent groupings

### 6e. Proposal Generator Enhancement
- `proposals` table for tracking lifecycle (draft → sent → viewed → accepted)
- Linked to leads table for pre-filling

---

## 7. Database Tables Created ✅

| Table | Purpose |
|-------|---------|
| `client_style_profiles` | Writing style samples and analysis per user |
| `document_collections` | Groups documents for cross-document queries |
| `proposals` | AI-generated proposals with lifecycle tracking |
| `compliance_rule_sets` | Configurable compliance scanning rules |

### Performance Indexes Added ✅
- `idx_leads_status`, `idx_leads_source`, `idx_leads_created_at`, `idx_leads_email`
- `idx_appointments_status`, `idx_appointments_scheduled_date`, `idx_appointments_client_id`

---

## 8. Security Gap Fixes ✅

- CSP header updated to include AI gateway domain
- Client-side rate limiting on lead submissions (3/minute)

---

## 9. Remaining Gap Fixes (Queued)

### High Priority
- Timezone selector in booking flow
- Inline form validation (replace toast errors)
- File upload preview in ServiceRequest
- Apple Pay / Google Pay enablement
- Personal/Business toggle in booking
- Success toast duration increase
- Remove `target="_blank"` from internal links

### Medium Priority
- Pagination on admin lists (leads, appointments, documents, journal)
- Bulk actions in Lead Portal
- Calendar view for appointments
- Document tagging system
- Invoice auto-generation
- Notification preferences UI

---

## Files Modified/Created

| File | Changes |
|------|---------|
| `supabase/functions/extract-email-leads/index.ts` | AI email-to-lead extraction |
| `supabase/functions/ai-extract-document/index.ts` | ✅ Smart due diligence extraction |
| `supabase/functions/ai-compliance-scan/index.ts` | ✅ Compliance watchdog scanning |
| `supabase/functions/ai-cross-document/index.ts` | ✅ Cross-document synthesis (streaming) |
| `supabase/functions/ai-style-match/index.ts` | ✅ Style-matching document generation |
| `src/pages/AIExtractors.tsx` | ✅ AI Document Intelligence Hub |
| `src/pages/AIKnowledge.tsx` | ✅ Cross-document knowledge base |
| `src/pages/admin/AdminLeadPortal.tsx` | Real-time subscription, detail panel, Import |
| `src/lib/submitLead.ts` | ✅ Rate limiting added |
| `index.html` | ✅ CSP updated for AI gateway |
| Database migration | ✅ New tables + indexes |

---

## Technical Notes
- Uses Gemini 2.5 Pro for complex document analysis, Gemini 2.5 Flash for compliance scanning
- Tool calling for structured extraction (no JSON mode)
- Streaming SSE for cross-document and style-match generation
- Deduplication by email address and phone number prevents duplicate leads
- Real-time subscription uses Supabase channel on `public.leads` with `INSERT` and `UPDATE` events
- Edge functions process emails in batches of 20 to avoid timeouts
- Client-side rate limit: 3 submissions per 60-second window
