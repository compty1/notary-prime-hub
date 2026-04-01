
# Email-to-Lead Import with AI Extraction and Real-Time Lead Detail View

## Overview
Build an automated pipeline that scans synced inbox emails, uses AI to extract lead information (name, phone, email, service needed, source identification), and inserts them into the `leads` table. Enhance the Lead Portal with a clickable lead detail panel and real-time updates via Supabase Realtime.

---

## 1. New Edge Function: `extract-email-leads` ✅ IMPLEMENTED

## 2. Database Changes ✅ IMPLEMENTED

## 3. Lead Portal Enhancements ✅ IMPLEMENTED
- Real-time subscription with INSERT/UPDATE/DELETE
- Clickable lead detail slide-out panel
- Import from Inbox button
- Pagination (25 per page)
- Bulk actions (multi-select, bulk status change, bulk delete)

## 4. Auto-Source Identification Logic ✅ IMPLEMENTED

## 5. HubSpot CRM Integration ✅ IMPLEMENTED
- Edge function `hubspot-sync` with test/push/pull actions
- `hubspot_contact_id` and `hubspot_deal_id` columns on leads table
- Admin Settings UI with Test Connection, Push Leads, Pull Contacts

## 6. AI Services Suite ✅ IMPLEMENTED

## 7. Database Tables Created ✅

## 8. Security Gap Fixes ✅

## 9. Gap Fixes ✅ COMPLETED

### High Priority — Done
- ✅ Timezone display in booking flow (Eastern Time label)
- ✅ Inline form validation in booking (replaces toast-only errors)
- ✅ File upload preview in ServiceRequest (image thumbnails)
- ✅ Personal/Business toggle in booking (Signing Capacity selector)
- ✅ Success toast duration increase (5s)
- ✅ Remove `target="_blank"` from internal links

### Medium Priority — Done
- ✅ Pagination on admin leads list (25 per page)
- ✅ Bulk actions in Lead Portal (multi-select + bulk status/delete)
- ✅ Calendar view for appointments (already existed)
- ✅ Document tagging system (inline tags with filter)
- ✅ HubSpot CRM integration

### Deferred
- Apple Pay / Google Pay (requires Stripe dashboard config)
- Invoice auto-generation (InvoiceGenerator component exists)
- Notification preferences UI (table exists, UI deferred)

---

## Technical Notes
- Uses Gemini 2.5 Pro for complex document analysis, Gemini 2.5 Flash for compliance scanning
- Tool calling for structured extraction (no JSON mode)
- Streaming SSE for cross-document and style-match generation
- Deduplication by email address and phone number prevents duplicate leads
- Real-time subscription uses Supabase channel on `public.leads` with INSERT, UPDATE, DELETE events
- Edge functions process emails in batches of 20 to avoid timeouts
- Client-side rate limit: 3 submissions per 60-second window
- HubSpot sync uses v3 CRM API with search-based deduplication
- Document tags use `document_tags` table with RLS scoped to document owner
