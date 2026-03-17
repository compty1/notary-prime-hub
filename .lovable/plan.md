

# Comprehensive Implementation Plan

This plan addresses all requested workstreams across 10 areas. Every item includes specific file changes to ensure zero gaps.

---

## 1. Document Translation Service

**New service added to DB** via insert tool:
- Add "Document Translation" to `services` table (category: `document_services`, pricing_model: `per_page`)

**New edge function: `supabase/functions/translate-document/index.ts`**
- Accepts text content + target language
- Uses Lovable AI (Gemini) to translate, returns translated text
- Also returns a "Certificate of Translation Accuracy" template pre-filled

**Booking flow (`BookAppointment.tsx`):**
- Add translation-specific intake fields: source language, target language (dropdown of common languages), document type, page count
- Add "Document Translation" to `DIGITAL_ONLY_SERVICES` (no location needed)

**Service detail page (`ServiceDetail.tsx`):**
- Add translation-specific FAQs to `serviceFaqs` map
- Add translation-specific resources

**Admin side — auto-translation display:**
- In `AdminAppointments.tsx` detail view: when service_type contains "translation", show a "Translate" button that calls the edge function with the client's uploaded document text
- Display translated output alongside original in a side-by-side panel
- Add download link for translated document + Certificate of Translation Accuracy

**New component: `src/components/TranslationPanel.tsx`**
- Side-by-side original/translated view
- Download translated doc as .txt/.docx
- Print certificate of accuracy

---

## 2. Lead Finder — Real Individual Lead Discovery via Firecrawl

**Connect Firecrawl:** Use `standard_connectors--connect` with `firecrawl` connector to link it to project.

**New edge function: `supabase/functions/scrape-social-leads/index.ts`**
- Uses Firecrawl search API to find real posts from people seeking notary services in Columbus
- Search queries focused on INDIVIDUALS:
  - `"need a notary" Columbus Ohio`
  - `"looking for notary" Columbus`
  - `"notary near me" Columbus OH`
  - `"mobile notary" Columbus Ohio`
  - `"notarize documents" Columbus`
  - `"notary public" Columbus Reddit`
  - `"notary" Columbus Nextdoor`
  - `site:reddit.com notary Columbus Ohio`
  - `site:facebook.com notary Columbus Ohio`
- Firecrawl search returns URLs + snippets
- Pass results through Lovable AI to extract: name (if available), context, source URL, intent score
- Insert into `leads` table with `source = 'social_scrape'`, `lead_type = 'individual'`
- Dedup by source_url

**Update `discover-leads/index.ts`:**
- Add a `"scrape_social"` action that calls the new scrape function
- Update default discovery queries to focus on individuals, not businesses
- Add individual-focused queries

**Update `AdminLeadPortal.tsx`:**
- Add "Scrape Social" button alongside existing AI Discover
- Show source badge for social scrape results
- Add filter for `lead_type` (individual vs business)

**Daily auto-update:** Create a cron job (via SQL insert tool) to invoke `scrape-social-leads` daily at 6 AM.

---

## 3. Admin Apostille — Pre-filled Form & Full Management

**Update `AdminApostille.tsx`:**
- Make each apostille request clickable to open a full detail/management panel
- In the detail panel, show:
  - Pre-filled Ohio SOS Apostille Request form using data from the request (client name from profiles, document description, destination country, doc count)
  - Print-ready apostille cover sheet
  - Status pipeline with clickable advancement
  - Document checklist (original doc, notarized copy, SOS fee, cover letter)
  - Shipping label section (upload/view)
  - Fee tracking and payment status
  - Timeline of status changes
- Add "Download Cover Sheet" button that generates a printable cover letter with all details pre-filled
- Add "Generate SOS Submission Form" that creates a printable form with client/document info filled in

---

## 4. Service Pages — Smart CTA (Book vs Use) + Zoom on Every Page

**Update `ServiceDetail.tsx`:**

a) Smart CTA logic:
```
SAAS_SERVICES = ["Document Storage Vault", "Cloud Document Storage", "PDF Services", 
  "Document Digitization", "Notary API Access", "White-Label Notarization"]
BOOKING_REQUIRED = everything in notarization, authentication, verification categories + 
  "Closing Coordination", "Bulk Notarization"
```
- For SaaS services: Show "Use This Service" button linking to the relevant tool page (`/digitize`, `/templates`, etc.)
- For booking-required: Show "Book This Service" (current behavior)
- For everything else: Show "Get Started" with contact/booking option

b) Add Zoom consultation card on EVERY service page (not just consulting):
- "Have Questions? Schedule a Zoom Meeting" card with link to `/book?service=Consultation`
- Below it: "Or message us for a response within 24 hours (typically within 2 hours)"
- "You can also upload your document for instant AI-powered answers" with link to `/digitize`

c) Remind users about other resources:
- Add info card: "Upload your document to get instant answers about what's needed" → `/digitize`
- "Browse our FAQ and guides" → `/notary-guide`
- "Use our AI assistant to ask questions" → link to WhatDoINeed section

---

## 5. KBA Flow — Placeholder Setup

**New component: `src/components/KBAVerification.tsx`**
- UI for Knowledge-Based Authentication flow
- Steps: Enter signer info → Generate questions (placeholder API call) → Present questions → Verify answers
- Uses placeholder API endpoint pattern with clear `TODO: Replace with IDology/Evident API`
- State management for quiz questions, answers, pass/fail
- Integrates into `AdminAppointments.tsx` detail view — "Start KBA" button for RON appointments
- Records KBA result in `notarization_sessions` table (`kba_completed` field)

---

## 6. Storage Vault — Verify Full Setup

**Verify existing implementation:**
- `documents` storage bucket exists (confirmed: private bucket)
- Client portal has upload/download/view (confirmed in `ClientPortal.tsx`)
- RLS policies on `documents` table allow user CRUD on own docs (confirmed)

**Enhancements:**
- In `ClientPortal.tsx` Documents tab: add folder organization (by appointment or date)
- Add "Storage Used" indicator
- Ensure signed URL generation works for private bucket downloads

---

## 7. Admin Client Detail — Service-Specific Forms & Downloads

**Update `AdminClients.tsx` or `AdminAppointments.tsx` detail view:**

When viewing a client's appointment, analyze the service type and show relevant downloadable forms:
- Power of Attorney → Link to POA template from `/templates`
- Real Estate → Deed/closing forms
- I-9 → USCIS I-9 form link
- Affidavit → Affidavit template
- Immigration → Relevant USCIS form links based on intake notes

Create a helper function `getServiceForms(serviceType: string, intakeNotes: string)` that returns an array of `{ title, url, type }` for each service.

**Add to appointment detail dialog in `AdminAppointments.tsx`:**
- "Required Forms" section with download links
- Pre-filled where possible using client profile data

---

## 8. Admin Form Library — Upload, Save, Print, Download

**Update `AdminTemplates.tsx`:**
- Add a third tab: "My Forms Library"
- Features:
  - Upload custom forms (PDF, DOCX, images) to `documents` storage bucket with a `form_library/` prefix
  - List all uploaded forms with preview, download, print, delete
  - Categorize forms (Notarial Certificates, Client Forms, Business Forms, etc.)
  - Search/filter forms

**New DB table (migration):**
```sql
CREATE TABLE public.form_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
ALTER TABLE public.form_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage form library" ON public.form_library FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Notaries view form library" ON public.form_library FOR SELECT USING (has_role(auth.uid(), 'notary'));
```

---

## 9. A/B Document Explanation for I-9 & Verification Services

**Update `ServiceDetail.tsx`:**
- For verification category services, add an expandable "Acceptable Documents" section explaining List A, B, and C documents:
  - **List A** (Identity + Employment): US Passport, Permanent Resident Card, Foreign Passport with I-94, Employment Authorization Document
  - **List B** (Identity only): Driver's license, State ID, School ID with photo, Voter registration card
  - **List C** (Employment only): Social Security card, Birth certificate, US Citizen ID Card
- Add this as a dedicated card below the prep checklist

**Update `BookAppointment.tsx`:**
- For I-9/employment verification services, add info tooltip explaining A/B/C documents in the intake flow

---

## 10. Zoom Integration Enhancement

**Current state:** Zoom link stored in `platform_settings`, shown on consulting services and client portal.

**Enhancements to `ServiceDetail.tsx`:**
- Add "Schedule a Zoom Meeting" card on ALL service pages (not just consulting)
- Card includes: "Have questions about this service? Schedule a free 15-minute Zoom call" with book link
- Also show: "You can also message us through the site — we typically respond within 2 hours"

**Enhancements to `ClientPortal.tsx`:**
- In appointments tab, show "Join Zoom Meeting" button for appointments with consulting/zoom services
- Already partially implemented — verify it works for all applicable services

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/translate-document/index.ts` | **CREATE** — AI translation edge function |
| `supabase/functions/scrape-social-leads/index.ts` | **CREATE** — Firecrawl-powered individual lead scraper |
| `src/components/TranslationPanel.tsx` | **CREATE** — Translation display component |
| `src/components/KBAVerification.tsx` | **CREATE** — KBA placeholder flow |
| `src/pages/ServiceDetail.tsx` | **EDIT** — Smart CTA, Zoom on all pages, A/B docs, translation FAQs |
| `src/pages/BookAppointment.tsx` | **EDIT** — Translation intake fields, A/B doc tooltips |
| `src/pages/admin/AdminApostille.tsx` | **EDIT** — Clickable detail panel, pre-filled forms, full management |
| `src/pages/admin/AdminAppointments.tsx` | **EDIT** — Service-specific forms, KBA button, translation panel |
| `src/pages/admin/AdminTemplates.tsx` | **EDIT** — Add form library tab with upload/manage |
| `src/pages/admin/AdminLeadPortal.tsx` | **EDIT** — Social scrape button, individual filter, source badges |
| `supabase/functions/discover-leads/index.ts` | **EDIT** — Add individual-focused queries, scrape_social action |
| `src/App.tsx` | No changes needed (routes already exist) |
| `supabase/functions/client-assistant/index.ts` | **EDIT** — Reference translation service in prompt |

**Database migrations:**
- `form_library` table with RLS
- Insert "Document Translation" service

**Connector:** Link Firecrawl connection to project

**Cron job:** Daily social lead scrape at 6 AM

