

# Plan: Complete All Remaining Gaps — Email, Integrations, Certificates, Content Workspace, and 60+ Items

This is a very large scope covering email formatting, integration verification, notarial certificate resources, content workspace enhancement, and 60+ tracked gap items. Due to the volume, this will be executed in prioritized batches across multiple implementation rounds.

---

## Batch 1: Email Rich Text Fix + Integration Verification

### 1A. Email body_text fallback rendering
**Problem**: When `body_html` is null and only `body_text` exists, the mailbox shows content in a `<pre>` monospace block (line 592 of AdminMailbox.tsx). Client Emails (AdminClientEmails.tsx) already renders via `sanitizeHtml` with prose styling, so that's fine.

**Fix**: Replace the `<pre>` fallback in AdminMailbox.tsx with a styled `<div>` that wraps plain text with proper line breaks, using `whitespace-pre-wrap` and the sans-serif font — matching how modern email clients render plain-text messages.

### 1B. Verify HubSpot integration
- Confirm `hubspot-sync` reads `HubSpot_Service_Key` (already done)
- Verify AdminSettings shows connection status badge (already done)
- Add HubSpot Deal bidirectional sync: extend `hubspot-sync` edge function with `push_deal` and `pull_deals` actions, wire into CRM Deals tab

### 1C. Verify Stripe integration
- SubscriptionPlans.tsx already has PaymentForm with Stripe Elements
- Add: Subscription management UI (cancel/upgrade), refund workflow button in AdminRevenue (already partially there)
- Verify `process-refund` edge function works with Stripe API

### 1D. Google Calendar integration
- `google-calendar-sync` edge function exists
- Verify secrets: needs `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REFRESH_TOKEN`
- Wire calendar sync button into AdminAppointments and AdminSettings

---

## Batch 2: Notarial Certificates Resource Pages

### 2A. Create comprehensive notarial certificate reference content
Add a new section to the Resources page (or a dedicated `/notary-certificates` page) with detailed guides for each certificate type:

1. **Ohio Acknowledgment Certificate** — When to use, statutory language (ORC §147.55), common pitfalls (signer must appear personally, cannot notarize own signature), sample format, special circumstances (corporate acknowledgments, representative capacity)
2. **Ohio Jurat Certificate** — Oath/affirmation requirement, when the signer must sign in the notary's presence, statutory language, differences from acknowledgment, common errors
3. **Ohio Copy Certification by Notary** — What can/cannot be certified, prohibited vital records, proper procedure
4. **Ohio Signature Witnessing** — Requirements, when needed, format
5. **Ohio Protest Certificate** — Commercial paper protests, rarely used but required knowledge
6. **RON-Specific Certificate Modifications** — Electronic seal requirements, session recording notation, technology platform identification

Each entry: 3000+ characters, organized with headings, bullet lists, callout boxes, and Ohio ORC citations. Include PDF download button using browser print-to-PDF.

### 2B. PDF Download
Add a "Download as PDF" button per certificate guide that uses `window.print()` with print-optimized CSS media queries — matching the existing `NotarizationCertificate` pattern.

---

## Batch 3: Content Workspace Enhancement

### 3A. Service-specific content creation
Expand AdminContentWorkspace to include service-specific templates and generation:
- Add a "Service Templates" tab with pre-built content structures for each service category (blog, social media, email campaigns, SEO content, etc.)
- Each template includes industry-standard formatting, required length guidelines, and AI generation prompts tailored to the service type
- Rich text editor already in place (TipTap via RichTextEditor component)
- Add word count display, readability score, SEO keyword density

### 3B. Project analysis and management
Add a "Projects" tab to Content Workspace:
- Track content projects linked to service requests
- Show analysis of current project status (word count, completion %, quality indicators)
- AI-powered enhancement recommendations via `notary-assistant` edge function
- Missing elements detection (no CTA, no keywords, too short, etc.)
- Plan management per project with milestones

---

## Batch 4: Critical & High Priority Gap Items

### Security (Critical)
- **Input Sanitization Audit**: Verify all `dangerouslySetInnerHTML` uses go through `sanitizeHtml`/`sanitizeEmailHtml` — already done in most places, audit remaining
- **IDOR Prevention**: Verify all document/appointment URLs use signed tokens, not raw UUIDs — existing pattern in place, audit edge cases
- **Session Security**: Add `refreshSession()` token rotation after login in AuthContext
- **Password Strength Enforcement**: Add zxcvbn or regex validation in SignUp/AccountSettings
- **Rate Limiting on Public Forms**: Add client-side throttle + edge function rate limit headers on `submit-lead`, booking forms

### Compliance (Critical)
- **Recording Storage Compliance**: Add 10-year retention policy indicator, verify `set_retention_expires_at` trigger works
- **Witness Threshold Detection**: Enforce witness count validation in booking flow based on document type (Wills need 2 per ORC §2107.03)
- **Ohio Document Eligibility Logic**: Already has `ohioDocumentEligibility.ts` — verify it blocks vital records
- **E-Sign Consent Step**: Already has `ESignConsent.tsx` — verify it's in the RON flow
- **Click-Wrap Terms Agreement**: Add checkbox + timestamp recording before document signing
- **Commission Renewal Reminders**: Add cron-based reminder check against notary commission expiry dates
- **Age Verification**: Add 18+ age confirmation gate in booking flow
- **Oath Type Determination**: Already has service-to-act-type mapping — verify jurat oath script selection
- **Jurisdictional Validation**: Verify signer location is within Ohio jurisdiction for RON

### High Priority Features
- **Stripe Subscription Management**: Add plan change/cancel UI in SubscriptionPlans page
- **Payment Receipt Generation**: Generate PDF receipt after payment using print-to-PDF pattern
- **Invoice PDF Generation**: Extend InvoiceGenerator with PDF export
- **Booking Draft Auto-Save**: Add localStorage auto-save in BookAppointment flow
- **CRM Deals Table**: Already exists in AdminCRM — verify CRUD works
- **Admin Dashboard Analytics**: Add KPI cards to AdminOverview (appointments this week, revenue MTD, pending docs)
- **Notary Assignment Algorithm**: Already has `notaryAssignment.ts` — verify it's wired into appointment creation
- **Appointment Rescheduling Flow**: Already has RescheduleAppointment page — verify flow works
- **Email Template Designer**: Already exists as component — verify it's accessible
- **Notary Session Guide Panel**: Already exists as NotarySessionGuide — verify integration in RON flow
- **Native CRM Dashboard**: Already built at /admin/crm — verify all tabs work
- **Focus Management**: Add focus trap to modals, auto-focus first input in forms
- **Refund Workflow**: Already has refund button in AdminRevenue + `process-refund` edge function

---

## Batch 5: Medium & Low Priority Items

### UX
- **High Contrast Mode**: Add `forced-colors` CSS support + toggle in settings
- **Touch Targets 44px**: Audit and fix all interactive elements < 44px
- **Skip to Main Content**: Already referenced in memory — verify implementation
- **Color Contrast Audit**: Verify all text meets WCAG AA 4.5:1 ratio
- **Session Timeout Warning**: Already has SessionTimeoutWarning component — verify it's mounted
- **Reduced Motion Support**: Already has `prefers-reduced-motion` support — verify
- **Error Recovery UX**: Add retry buttons on failed data fetches
- **Loading State Improvements**: Add skeleton loaders to remaining pages
- **Client Portal Dashboard Redesign**: Improve layout with quick-action cards
- **Session Guide Progress Tracking**: Add step progress indicator to NotarySessionGuide
- **Special Instructions Field**: Add textarea to booking form for special instructions

### Features
- **Multi-Signer Config**: Add signer count and co-signer fields to booking
- **Client Document Expiry Alerts**: Cron check for expiring document IDs
- **Document Version History**: Already has `document_versions` table — add UI
- **Client Feedback System**: Already has ClientFeedbackForm — verify integration
- **Multi-Language Support**: Scaffold i18n with Spanish translations for key pages
- **API Rate Monitoring Dashboard**: Add admin page showing edge function metrics
- **Document OCR Enhancement**: Improve `ocr-digitize` edge function
- **Email Template Versioning**: Add version tracking to template saves
- **Offline Mode for Mobile**: Add service worker with basic caching

### SEO
- **Sitemap Auto-Generation**: Already has `/sitemap.xml` — verify all routes included
- **JSON-LD Structured Data**: Add schema.org markup via `seoSchemas.ts`
- **Canonical URLs**: Add `<link rel="canonical">` to all pages
- **Dynamic Copyright Year**: Update Footer to use `new Date().getFullYear()`

### Performance
- **Database Query Optimization**: Verify indexes exist on high-traffic columns
- **Edge Function Cold Start**: Add keep-alive pings for critical functions
- **Page Speed Optimization**: Lazy-load below-fold images, code-split large pages

### Workflow
- **CRM Auto-Activity on Events**: Already has triggers `crm_log_payment` and `crm_log_appointment_status`
- **Automated Backup Verification**: Add health check for backup status

---

## Technical Details

### Files Created
- `src/pages/NotaryCertificates.tsx` — Comprehensive certificate reference page with PDF download
- Route added in `App.tsx`
- Link added in `Resources.tsx`

### Files Modified (Key)
- `src/pages/admin/AdminMailbox.tsx` — Rich text fallback for plain-text emails
- `src/pages/admin/AdminContentWorkspace.tsx` — Service templates, project analysis, word count
- `src/pages/admin/AdminOverview.tsx` — Analytics KPI cards
- `src/pages/SubscriptionPlans.tsx` — Subscription management
- `src/pages/admin/AdminRevenue.tsx` — Receipt PDF generation
- `src/pages/BookAppointment.tsx` — Draft auto-save, special instructions, witness detection
- `src/components/Footer.tsx` — Dynamic copyright year
- `supabase/functions/hubspot-sync/index.ts` — Deal sync actions
- `supabase/functions/process-refund/index.ts` — Verify Stripe integration
- Multiple admin pages — Empty states, loading skeletons, focus management

### Execution Order
1. Email rich text fix (quick win)
2. Notarial certificates page with PDF download
3. Content workspace enhancement
4. Critical security & compliance items
5. High-priority features
6. Medium/low items in batches
7. SEO, performance, and polish

