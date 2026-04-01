

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

## Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/extract-email-leads/index.ts` | New edge function for AI email-to-lead extraction |
| `src/pages/admin/AdminLeadPortal.tsx` | Real-time subscription, detail panel, "Import from Inbox" button |
| Database migration | Add `lead_extracted` to `email_cache`, `email_cache_id` to `leads`, enable Realtime on leads |

---

## Technical Notes
- Uses Gemini 2.5 Flash for fast, cost-effective email parsing
- Deduplication by email address and phone number prevents duplicate leads
- Real-time subscription uses Supabase channel on `public.leads` with `INSERT` and `UPDATE` events
- The detail panel uses the existing Sheet UI component for a slide-out experience
- Edge function processes emails in batches of 20 to avoid timeouts

