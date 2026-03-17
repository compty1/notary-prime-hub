

# Implementation Plan: Document Digitization SaaS, About Page, AI Help, Zoom, and More

This plan covers 8 workstreams across ~15 files with 2 new edge functions, 1 new page, and several component enhancements.

---

## 1. Site Heading & Navigation Updates

**Problem:** Navigation says "Notary Public — Ohio" but doesn't mention document management or other business services.

**Changes to `Index.tsx` and all page navs:**
- Update subtitle to "Notary Public & Document Services — Ohio"
- Add a short banner below the hero trust bar: "Beyond notarization: document digitization, secure storage, form preparation, and more. [View All Services →]"
- Add "About" and "Documents" links to nav (desktop + mobile menu)

---

## 2. Document Digitization SaaS (New Feature)

**Problem:** No OCR/digitization workflow exists. Users need to upload scanned documents and receive editable, formatted digital versions.

### 2a. New Edge Function: `supabase/functions/ocr-digitize/index.ts`
- Accepts uploaded document (image/PDF) as base64 or storage path
- Uses Lovable AI (Gemini model — supports image input) to perform OCR transcription
- System prompt instructs: "Transcribe this document preserving original formatting, headings, paragraphs, tables, lists. Return clean HTML with formatting preserved."
- Returns structured HTML content

### 2b. New Page: `src/pages/DocumentDigitize.tsx`
- **Upload step**: Drag-and-drop or file picker for images/PDFs (multiple files supported)
- **Processing step**: Shows progress as each document is sent to OCR edge function
- **Editor step**: Rich text editor using a lightweight library (TipTap — already Prosemirror-based, works well in React) to display and edit the transcribed HTML
- **Export step**: Export as PDF (browser print), DOCX (simple HTML-to-blob), or "Save to Vault" (uploads to `documents` storage bucket and inserts into `documents` table)
- Requires authentication; guests prompted to sign up
- Payment integration: show pricing card before processing (can use existing PaymentForm/Stripe flow for per-document pricing)

### 2c. Route Addition: `App.tsx`
- Add `/digitize` route (lazy loaded, protected)
- Add nav link on Index, Services, and ClientPortal

### 2d. Dependencies
- Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-text-align` for the rich text editor (used here AND in templates below)

---

## 3. Template Rich Text Editing + AI Chat + Save to Dashboard

**Problem:** `DocumentTemplates.tsx` currently renders plain text preview with no editing, no saving, and no AI assistance.

**Changes to `DocumentTemplates.tsx`:**
- Replace the plain text preview dialog with a TipTap rich text editor pre-loaded with the rendered template body (converted from plain text to HTML)
- Add toolbar: Bold, Italic, Underline, Headings, Lists, Alignment
- Add "Save to My Documents" button (inserts into `documents` table + uploads HTML content as a file to storage)
- Add export buttons: PDF (print), DOCX download
- **AI Chat per template**: Add a collapsible chat panel in the template dialog that calls a new edge function `template-assistant` (or reuse `notary-assistant` with modified access — currently admin/notary only, needs to allow authenticated clients too)
- The AI chat sends the template context (template title, filled fields, user situation) as system context so the AI can answer specific questions like "Do I need witnesses for this affidavit?"

### Edge Function Change: `notary-assistant/index.ts`
- Allow `client` role access (currently restricted to admin/notary) — OR create a new `client-assistant` edge function that uses the same system prompt but allows any authenticated user
- Better approach: Create `supabase/functions/client-assistant/index.ts` — same AI gateway call but accepts any authenticated user, adds template context to system prompt

---

## 4. Booking Intake: Document Count "More than 5" Option

**Problem:** `BookAppointment.tsx` line 1321 shows buttons [1-5] only for document count.

**Changes to `BookAppointment.tsx`:**
- Add a "5+" button that reveals a number input field
- When clicked, show `<Input type="number" min="6" max="50" />` for custom count
- Apply same pattern wherever document count selector appears

---

## 5. Multi-File Upload Across All Upload Points

**Current state:** `ClientPortal.tsx` and `BusinessPortal.tsx` already have `multiple` attribute on file inputs and loop through files. Good.

**Audit needed:**
- `BookAppointment.tsx` ID scan input (line 1341): Single file only — this is correct (one ID at a time)
- `AdminSettings.tsx` cert/seal upload: Single file — correct (one cert/seal)
- `AdminDocuments.tsx`: Check if admin upload supports multiple — add if not
- Any other `<input type="file">` without `multiple` where it makes sense

No major changes needed — existing multi-file upload works. Just verify `AdminDocuments.tsx`.

---

## 6. About Page

**New file: `src/pages/About.tsx`**
- Professional profile for Shane Goble
- Sections: Bio/intro, NNA Certification & Training, Document Specialist credentials, Service philosophy
- Professional headshot placeholder area
- Key credentials: NNA certified, Ohio commissioned, surety bonded, background-checked, RON-certified
- Experience highlights, service area (Franklin County / Greater Columbus)
- Call-to-action: Book appointment, Contact
- Link from nav (Index.tsx, all page headers)

**Route:** `/about` in `App.tsx`

---

## 7. "What Do I Need?" AI Quick Help Feature

**Problem:** Users want to type "I need to notarize a power of attorney for car title management for my mom" and get practical guidance.

### New Edge Function: `supabase/functions/client-assistant/index.ts`
- Open to any authenticated user (or even anonymous with rate limiting)
- System prompt: Ohio notary expert that returns practical instructions, required documents, tips, estimated costs, and which service to book
- Includes structured output: recommended service, documents needed, special requirements, estimated time, tips

### UI Integration
- Add a prominent "What do I need?" search/chat box on:
  - **Index.tsx**: Below hero section or in services section — a single text input with "Describe what you need..." placeholder
  - **Services.tsx**: At the top, before category tabs
  - **ClientPortal.tsx**: In a quick-action card
- Returns a formatted response card with: recommended service(s), what to bring, tips, and a "Book This Service" button

---

## 8. Zoom Integration for Consultations

**Problem:** Non-notarization services need basic video meetings (consultations, project discussions).

### Approach
- Use Zoom OAuth via connector if available, OR use Zoom meeting links
- Since full Zoom SDK integration is complex and requires Zoom marketplace app approval, the practical approach is:
  1. Store admin's Zoom Personal Meeting ID or recurring meeting link in `platform_settings`
  2. For consultation bookings, display "Join Zoom Meeting" button with the link
  3. On admin side, show scheduling integration

### Implementation
- Add `zoom_meeting_link` to `platform_settings` (via insert tool)
- On `ClientPortal.tsx` appointments tab: For consultation/meeting services, show "Join Zoom Meeting" button linking to the stored Zoom URL
- On `ServiceDetail.tsx` for consulting services: Add "Schedule a Zoom Consultation" CTA
- On booking confirmation: Include Zoom link for applicable services
- Admin can set/update Zoom link in `AdminSettings.tsx`

---

## 9. Partner Services (Will Creation, etc.)

**Problem:** Services like "Create a Will" should reference partner attorneys and potential notarization.

**Changes to `ServiceDetail.tsx`:**
- For estate planning category services, add a "Partner Services" section explaining that complex documents are created in partnership with licensed attorneys
- Add disclaimer: "Will drafting is performed by our legal partners. We provide notarization, witnessing, and coordination."
- Add referral/percentage note in admin context (not visible to clients)

---

## 10. Response Time Messaging

**Changes to multiple pages:**
- Add "Message us for a response within 24 hours (typically within 2 hours)" text to:
  - Contact section on Index.tsx
  - Chat tab in ClientPortal.tsx
  - Service pages with consultation options

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/About.tsx` | **CREATE** — Professional profile page |
| `src/pages/DocumentDigitize.tsx` | **CREATE** — OCR digitization SaaS page with rich text editor |
| `supabase/functions/ocr-digitize/index.ts` | **CREATE** — AI-powered OCR transcription |
| `supabase/functions/client-assistant/index.ts` | **CREATE** — Public-facing AI help for clients |
| `src/App.tsx` | Add `/about` and `/digitize` routes |
| `src/pages/Index.tsx` | Update nav, add About link, add "What do I need?" input, update heading/subtitle, response time note |
| `src/pages/DocumentTemplates.tsx` | Rich text editor, save to dashboard, AI chat per template, export options |
| `src/pages/BookAppointment.tsx` | Document count "5+" custom input option |
| `src/pages/ClientPortal.tsx` | Add Zoom meeting button, "What do I need?" card, link to digitize |
| `src/pages/ServiceDetail.tsx` | Partner services section for estate planning, Zoom CTA for consulting |
| `src/pages/Services.tsx` | Add "What do I need?" search box, nav updates |
| `src/pages/AppointmentConfirmation.tsx` | Zoom link for consultation appointments |
| `src/pages/admin/AdminSettings.tsx` | Zoom meeting link setting |
| `supabase/config.toml` | Add `ocr-digitize` and `client-assistant` function configs |
| `package.json` | Add TipTap dependencies |

### Dependencies to Install
- `@tiptap/react` `@tiptap/pm` `@tiptap/starter-kit` `@tiptap/extension-underline` `@tiptap/extension-text-align`

### Platform Settings Data Insert
```sql
INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES ('zoom_meeting_link', '', 'Zoom personal meeting link for consultations')
ON CONFLICT DO NOTHING;
```

### Gap Verification Checklist (to be verified after implementation)
1. OCR edge function processes images and returns formatted HTML
2. Rich text editor loads, edits, and saves successfully in both Digitize and Templates
3. Saved documents appear in client portal
4. AI client-assistant responds to free-text queries with practical guidance
5. Document count allows custom values > 5
6. About page accessible from nav and renders professional profile
7. Zoom link displays for consultation appointments
8. Template AI chat sends template context and returns relevant answers
9. All file upload inputs that should accept multiple files do so
10. Response time messaging appears on contact/chat surfaces

