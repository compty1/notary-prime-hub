

# Plan: Fix All Tracker Items + Google Calendar Integration

This plan covers all 13 items from CSV #1, all 33 items from CSV #2, the actionable items from both DOCX audit reports (~149 issues, many already resolved or infrastructure-only), and Google Calendar integration on the admin dashboard.

---

## What's Already Implemented (Skip List)

Many DOCX items are already resolved in the codebase:
- JSON-LD structured data (LocalBusiness, FAQPage, BreadcrumbList, Notary)
- Dark mode toggle, Back-to-Top button, Error Boundary, Breadcrumbs
- Recording consent flag in RON sessions, KBA 2-attempt limit trigger
- Legal glossary (LegalGlossaryProvider), Fee Calculator page
- security.txt file, Cookie consent, Rate limiting on lead forms
- RON eligibility checker, Pre-signing checklist, Tech check component
- ID scan assistant, Service pre-qualifier
- Favicon.svg already exists in `/public/`

Items that are **infrastructure-only** (DNS, OCSP, HTTP/3, HSTS, Brotli, IPv6, DNSSEC, CDN, WAF) cannot be fixed in application code -- these require hosting/DNS provider configuration and are noted but excluded.

---

## Phase 1: Critical Ohio Compliance Fixes (CSV Items)

**Items:** RON recording consent verification, Journal completeness check, KBA limit enforcement

**Changes:**
1. **`RonSession.tsx`** -- Add a blocking consent gate: if `recording_consent` is false, prevent session start with a modal requiring explicit checkbox + timestamp before proceeding
2. **`AdminJournal.tsx`** -- Add a compliance banner that queries completed appointments without matching journal entries and shows a warning count with links to create entries
3. **`RonSession.tsx`** -- Add visible UI feedback showing current KBA attempt count (e.g., "Attempt 1 of 2") and a clear error state when limit is reached

---

## Phase 2: Service Data Completeness (CSV Items)

**Items:** 11 services missing FAQs, 2 missing descriptions, 11 missing turnaround times

**Changes:**
1. **Database** -- Bulk insert default FAQs for all 11 services missing them (3-5 per service covering common questions)
2. **Database** -- Update Blog Post Writing and Newsletter Design with detailed 50+ word descriptions
3. **Database** -- Set `estimated_turnaround` for all 11 services (e.g., "Same day", "2-3 business days", "1-2 weeks")

---

## Phase 3: Platform Entity Fixes (CSV Items)

**Items:** Auth & Security (MFA placeholder), Payments (Refund processing), CRM (HubSpot sync)

**Changes:**
1. **MFA** -- Already deferred per project roadmap. Update the platform entity status in `platformEntities.ts` to reflect "deferred" rather than "needs_attention"
2. **Refund processing** -- Add a refund initiation UI to AdminRevenue: a "Refund" button on paid invoices that calls a new `process-refund` edge function using the existing Stripe secret
3. **HubSpot sync** -- Already deferred per project roadmap. Update entity status to "deferred"

---

## Phase 4: RON Session Flow & SEO (CSV Items)

**Items:** RON Session Flow unimplemented steps, signing platform placeholder, SEO meta tags, mobile responsiveness

**Changes:**
1. **`RonSession.tsx`** -- Replace the placeholder signing platform section with a functional link-based workflow: generate a SignNow signing link via the existing `signnow` edge function and display it in an iframe or as a redirect
2. **SEO** -- Add `usePageMeta()` with unique title, description, and OG tags to the ~29 public pages that lack them. Create a batch update across all pages in `src/pages/`
3. **Mobile audit** -- Add responsive breakpoint fixes to admin tables (horizontal scroll), dialog widths (max-w-screen), and the sidebar (auto-collapse at 768px)

---

## Phase 5: Workspace Desk Features (CSV #2 -- 20 items)

**Items:** All "Workspace Desk" tracker items covering content workspace features

**Changes:**
1. **`AdminContentWorkspace.tsx`** -- This page already exists. Enhance it with:
   - Content listing with filtering by status (draft/published), search, and sorting
   - Content creation form with title, body (using existing RichTextEditor), category, status
   - Database table `content_posts` (title, body, status, category, author_id, hero_image_url, published_at, created_at, updated_at)
   - AI content generation using existing Lovable AI gateway (pre-defined prompts: "Write blog post about...", "Generate FAQ for...")
   - Image upload to existing `documents` storage bucket
   - Live preview panel with conditional rendering
   - AI style matching via existing `ai-style-match` edge function
   - Integration with services catalog (link content to services)
   - Performance: lazy load RichTextEditor, add skeleton loading

**Database migration:** Create `content_posts` table with RLS policies restricting to admin/notary roles.

---

## Phase 6: Google Calendar Integration + Live Dashboard Calendar

**Approach:** Since there's no Google Calendar connector available, we'll build a custom integration using Google Calendar API with OAuth2 credentials stored as secrets.

**Changes:**
1. **Edge function `google-calendar-sync/index.ts`** -- Handles:
   - Reading events from Google Calendar API
   - Writing new appointments to Google Calendar
   - Checking calendar conflicts before booking
   - Uses stored OAuth2 refresh token to maintain access

2. **Edge function `google-calendar-callback/index.ts`** -- OAuth2 callback handler for initial authorization

3. **`AdminOverview.tsx`** -- Add a live calendar widget:
   - Weekly/monthly view showing appointments from both the database and Google Calendar
   - Color-coded events (notarizations vs personal blocks)
   - Click-to-view appointment details
   - "Sync Now" button to force refresh
   - Real-time updates via Supabase realtime on appointments table

4. **`AdminSettings.tsx`** -- Add Google Calendar connection section:
   - "Connect Google Calendar" button that initiates OAuth2 flow
   - Status indicator (connected/disconnected)
   - Sync frequency settings

5. **`AdminAvailability.tsx`** -- Add conflict detection:
   - Before creating availability slots, check Google Calendar for conflicts
   - Show Google Calendar events alongside time slots

6. **Booking flow** -- When an appointment is confirmed, automatically create a Google Calendar event with all details (client name, service type, RON/in-person, confirmation number)

**Secrets needed:** `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`

---

## Phase 7: DOCX Audit -- UX & Content Fixes (Actionable Items)

**Changes to `Index.tsx` (Landing Page):**
1. Add "No credit card required" microcopy under hero CTA
2. Add "Requirements Checklist" icon row in hero (ID, Camera, Internet)
3. Add estimated response time ("Typical response: < 2 hours") on contact section
4. Add "Why Notar?" microcopy section explaining the name
5. Add witness requirements info to service cards that need it
6. Update H1 to include "Ohio" keyword for SEO
7. Add RON vs In-Person fee differentiation section

**Changes to `BookAppointment.tsx`:**
1. Add document destination state/county field
2. Add ID expiration date validation field
3. Add document type categorization step
4. Add "Does your document require witnesses?" checkbox
5. Add conflict-of-interest attestation checkbox
6. Add "Do not sign until on camera" microcopy

**Changes to `Footer.tsx`:**
1. Add physical address and phone number
2. Add "Insured and Bonded" badge
3. Add Ohio SOS Notary Search link
4. Ensure phone numbers use `tel:` protocol
5. Add "Notary Network / Work With Us" link

**Changes to `AppointmentConfirmation.tsx`:**
1. Add "What happens next" detailed steps
2. Add "Prepare for your session" checklist
3. Add CalendarDownload component (already exists)

**New page: `SignerRights.tsx`:**
- Signer Bill of Rights page per notary ethics best practices
- Right to refuse remote notarization
- Right to choose in-person alternative

**Changes to `About.tsx`:**
- Add commission expiration display (dynamic badge)
- Add E&O insurance and bond status
- Rewrite jargon-heavy copy to human-centric language

---

## Phase 8: DOCX Audit -- Security & Technical Fixes

**Changes to `index.html`:**
1. Set `<html lang="en-US">` explicitly
2. Add Organization JSON-LD schema
3. Add `fetchpriority="high"` to hero image
4. Add `<link rel="preconnect">` for Google Fonts

**Changes to forms:**
1. Add `autocomplete` attributes to all form fields (name, email, tel)
2. Add `autocomplete="off"` for sensitive PII fields (SSN-related)
3. Ensure all `<img>` tags have explicit width/height

**Changes to `index.css`:**
1. Add `font-display: swap` to any @font-face declarations
2. Add `:active` state transitions on CTA buttons

**Content policy pages (`TermsPrivacy.tsx` or new pages):**
1. Add "Key Terms" plain-English summary at top of TOS
2. Add data retention/journal retention policy section (10-year per Ohio ORC)
3. Add refund/cancellation policy
4. Add foreign language document policy

---

## Phase 9: Update Build Tracker Items

After all fixes are implemented:
1. Bulk update all 13 CSV #1 items to "resolved" with `resolved_at` timestamps
2. Bulk update all 33 CSV #2 items -- resolve completed ones, update notes on deferred ones
3. Add new tracker items for any infrastructure-only issues that require hosting provider action (DNS, HSTS, etc.) with category "infrastructure" and notes explaining they need external configuration

---

## Summary

| Phase | Scope | Files | Priority |
|-------|-------|-------|----------|
| 1. Ohio Compliance | 3 critical items | RonSession, AdminJournal | Immediate |
| 2. Service Data | 3 content items | Database inserts | High |
| 3. Platform Entities | 3 entity fixes | platformEntities, edge function | Medium |
| 4. RON Flow + SEO | 4 items | RonSession, ~29 pages | High |
| 5. Workspace Desk | 20 feature items | ContentWorkspace, migration | Medium |
| 6. Google Calendar | New integration | 2 edge functions, 3 pages | High |
| 7. UX/Content Fixes | ~40 DOCX items | Index, Booking, Footer, etc. | Medium |
| 8. Security/Technical | ~20 DOCX items | index.html, CSS, forms | Medium |
| 9. Tracker Updates | Bookkeeping | Database updates | Low |

