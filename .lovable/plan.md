

# Comprehensive Service Flow Implementation Plan — All 60 Items

This plan covers every identified gap across the entire service delivery pipeline: from discovery through booking, confirmation, portal management, and admin fulfillment. Nothing is omitted.

---

## PHASE 1: Critical Booking Bugs (BookAppointment.tsx)

### 1.1 Fix duplicate step rendering
Lines 881 and 1009 render notarial steps 2 and 3 **unconditionally**, causing overlapping UI (two service selectors, two date pickers) when a non-notarial service is selected. Line 1137 renders step 4 unconditionally too.

**Fix:** Change `{step === 2 && (` to `{!isNonNotarial && step === 2 && (` at line 881. Same pattern at lines 1009 and 1137.

### 1.2 Fix service pre-selection race condition
Line 218: `if (preService && serviceTypes.includes(preService))` runs in a `useEffect` depending on `serviceTypes`, but the initial render uses `fallbackServiceTypes` which won't contain DB service names. The effect re-runs when `serviceTypes` updates (line 230 dependency), so it *should* work on second pass. However, it also re-runs on every `searchParams` change, and `serviceCategories` may still be empty when `serviceType` is set, causing `requiresNotarizationType` to return `true` (line 108: `return !cat || ...`), showing the wrong step 1.

**Fix:** Move pre-selection into the `.then()` callback at line 126 after `setServiceCategories` populates, ensuring category data is available when the service is selected.

### 1.3 Guest validation on review step
`canProceed()` returns `true` unconditionally on the review step (lines 630, 644). Guests can click "Confirm Booking" with empty fields and get a runtime toast error.

**Fix:** On the last step, if `!user`, require `guestName.trim()`, valid `guestEmail`, and `guestPassword.length >= 6`.

### 1.4 Digital-only services show location fields
Non-notarial step 2 (line 812) shows location fields when `notarizationType === "in_person"`, which is always true for non-notarial services. But services like Document Storage Vault, Cloud Storage, Virtual Mailroom are fully digital.

**Fix:** Add a `DIGITAL_ONLY_CATEGORIES` set (`recurring`, some `document_services`) and skip location fields for those.

### 1.5 Rebook doesn't clear date/time
`handleRebook` sets step directly without clearing `date` and `time` state, so old values persist and slot availability isn't reloaded.

**Fix:** Clear `date`, `time`, and `availableSlots` before setting the step.

### 1.6 No lead-time warning message
When selected date+time is within `min_booking_lead_hours`, the Next button disables silently with no explanation.

**Fix:** Show a warning message: "Please select a time at least X hours from now."

---

## PHASE 2: Services Page Fixes (Services.tsx)

### 2.1 "Get Started" loses service context
Line 167: `<Link to="/book">` doesn't pass service name.

**Fix:** Change to `` <Link to={`/book?service=${encodeURIComponent(s.name)}${!["notarization","authentication"].includes(s.category) ? "&type=in_person" : ""}`}> ``

### 2.2 Add service search
With 35+ services, users must scroll. Add a search input above category tabs that filters by name/description.

### 2.3 Mobile category tab overflow
8 tabs with `flex-wrap` may look cramped on mobile. Add horizontal scroll on small screens.

---

## PHASE 3: ServiceDetail Enhancement (ServiceDetail.tsx)

### 3.1 Category-specific external resource links
Replace static Quick Links sidebar (lines 226-244) with a dynamic map keyed by `service.category`:
- **authentication**: Ohio SOS apostille page, Hague Conference member list, embassy finder
- **verification**: USCIS I-9 page, E-Verify, acceptable documents list (Lists A/B/C)
- **notarization**: RON eligibility checker, Ohio notary statutes, notary guide
- **consulting** (immigration): USCIS forms portal, common forms reference (I-130, I-485, I-765, N-400, I-90, I-131, I-864, DS-160)
- **document_services**: Document templates, document builder
- **business**: Business portal, loan signing partnership

### 3.2 Service-specific FAQ sections
Add an accordion FAQ section per category:
- **Immigration**: "What forms can a notary help with?", "Can a notary provide legal advice?", "Which USCIS forms require notarization?", "What's the notary's role vs. an attorney?"
- **Apostille**: "What is an apostille?", "How long does processing take?", "Hague vs non-Hague?", "What documents can be apostilled?"
- **I-9**: "When must the I-9 be completed?", "Acceptable documents?", "Can I-9 be done remotely?"
- **RON**: "What is RON?", "Am I eligible?", "What do I need?"
- **General**: "What is notarization?", "What ID do I need?", "How much does it cost?"

### 3.3 Legal disclaimers for sensitive categories
Immigration, estate planning, and real estate categories show: "This service does not constitute legal advice. Consult an attorney for specific legal questions."

### 3.4 Estimated timeline badges
Show in the hero section: "Same day" for notarization, "5-10 business days" for apostille/authentication, "Within 3 days of hire" for I-9/verification, "Varies" for consulting.

### 3.5 Preparation checklist in sidebar
Render the service's `service_requirements` as an interactive checklist card in the sidebar so users can prepare before booking.

### 3.6 Complexity indicator
Show Simple/Moderate/Complex badge and estimated appointment duration per service category.

### 3.7 Visual workflow timeline
Replace plain numbered workflow steps with an interactive vertical timeline with icons, durations, and client-vs-notary action indicators.

### 3.8 Service bundle suggestions
Suggest complementary services in sidebar (e.g., "Booking Apostille? You may also need Translation Coordination").

### 3.9 AI chat bubble
Add a floating "Have Questions?" button that opens an inline chat using the existing `notary-assistant` edge function, pre-seeded with service context.

---

## PHASE 4: Service-Specific Intake Fields (BookAppointment.tsx)

### 4.1 Conditional intake fields based on category
After service selection, show additional fields that get stored as structured JSON in the appointment `notes`:
- **Apostille/Authentication**: Destination country (with Hague/non-Hague indicator), document count, urgency level
- **Immigration/Consulting**: USCIS form number dropdown (I-130, I-485, I-765, N-400, I-90, I-131, I-864, I-20, DS-160), case type (Family, Employment, Humanitarian, Naturalization)
- **Real Estate/Closing**: Property address, title company, lender name
- **I-9/Employment Verification**: Employer name, new hire start date, List A or List B+C document selection
- **Business services**: Company name, estimated monthly volume

### 4.2 Live cost estimator in booking flow
Show a sticky footer bar with running cost estimate as user selects options (reuse existing `FeeCalculator` logic).

### 4.3 Saved preferences for returning clients
After first booking, save preferences (preferred type, typical address) and auto-fill on next visit with "Same setup as last time?" prompt.

### 4.4 Smart document-to-service recommendation
Enhance `DocumentWizard` integration: user uploads document, `detect-document` AI recommends exact service(s), one-click "Book This" button.

---

## PHASE 5: Confirmation Page (AppointmentConfirmation.tsx)

### 5.1 Service-specific "What to bring" checklists
Replace generic checklist (lines 165-177) with category-aware items:
- **RON**: Computer with camera/mic, stable internet, valid photo ID, documents in digital format
- **In-Person**: Valid photo ID, original documents, payment method
- **Apostille**: Original notarized documents, Ohio SOS request form, prepaid return envelope, destination country info
- **Immigration**: All USCIS forms completed, certified translations, passport/ID, supporting evidence
- **I-9**: List A document OR List B+C documents, employer's I-9 form
- **Real Estate**: Closing documents from title company, valid photo ID, wire transfer confirmation

### 5.2 "What happens next" section
Add timeline of next steps: "Your notary will confirm within 2 hours", "Upload documents via your portal", "Expect a confirmation email."

### 5.3 Upload documents button
Add "Upload Your Documents" button linking to `/portal?tab=documents`.

### 5.4 Service bundle cross-sell
Show relevant complementary services on confirmation page.

---

## PHASE 6: Client Portal Enhancements (ClientPortal.tsx)

### 6.1 Wire document delete
Add trash icon button on each document card. On click, show AlertDialog confirmation, then delete from storage bucket and `documents` table. Wire the existing `deletingDocId` state (line 75).

### 6.2 Apostille form enhancement
Add destination country dropdown (Hague/non-Hague indicator), urgency selector, and document count to the apostille intake form (lines 698-730). Requires DB migration to add `destination_country` (text, nullable) and `document_count` (integer, default 1) columns to `apostille_requests`.

### 6.3 Apostille status timeline
Add visual progress bar for apostille tracking: `Intake → Payment → SOS Submission → Processing → Shipped → Delivered`.

### 6.4 Payment cards show service name
Join payment records to appointments to display which service each payment is for.

### 6.5 "Pay Now" for pending payments
Wire the existing `PaymentForm` component to accept a specific amount from a pending payment record, instead of opening a generic Stripe form.

### 6.6 Service detail link from portal
Add "View Details" button linking to `/services/${svc.id}` alongside the existing "Book Now" button in the services tab.

### 6.7 Post-appointment service tracker
For services with post-session processing (apostille, consular legalization), show real-time tracker:
```text
✓ Session Completed → ✓ Documents Prepared → ● Submitted to SOS → ○ Processing → ○ Returned
```

---

## PHASE 7: Admin Dashboard Enhancements

### 7.1 Payment request sends email notification (AdminRevenue.tsx)
After `sendPaymentRequest` inserts a pending payment (line 119-136), also insert a `client_correspondence` record and invoke the `send-correspondence` edge function to email the client.

### 7.2 Review request after completion (AdminAppointments.tsx)
When admin changes appointment status to "completed", show a "Request Review" button that sends correspondence with link to `/portal?tab=reviews`.

### 7.3 Admin document delete (AdminDocuments.tsx)
Add delete button with AlertDialog confirmation. Remove from storage bucket then delete DB record.

### 7.4 AdminApostille enhancements (AdminApostille.tsx)
- Display destination country column (from new DB field)
- Add link to Ohio SOS apostille online submission portal
- Add SOS cover letter template generation
- Add shipping label upload field

### 7.5 Cancellation policy display
Show cancellation policy text from `platform_settings` in the cancel confirmation dialog.

---

## PHASE 8: Dynamic Content & Templates

### 8.1 Homepage dynamic services (Index.tsx)
Replace hardcoded 4 services with DB query from `services` table (top 4-6 active services by `display_order`).

### 8.2 Homepage dynamic testimonials (Index.tsx)
Fetch recent 5-star reviews from `reviews` table joined with `profiles` for display names.

### 8.3 Document templates from DB (DocumentTemplates.tsx)
Wire to read from DB table if available, falling back to hardcoded templates.

### 8.4 BlueNotary route cleanup
Route `/bluenotary-session` exists but nothing links to it. Either integrate as alternative RON provider or remove dead route.

### 8.5 RON session fallback
If OneNotary API key isn't configured, show a friendly "RON not configured" message instead of errors.

---

## PHASE 9: New Components & Edge Functions

### 9.1 ServicePreQualifier component
New `src/components/ServicePreQualifier.tsx`: A 2-3 screen mini-wizard triggered between ServiceDetail "Book Now" and BookAppointment for complex services. E.g., for Apostille: "Is your document notarized?" → "Destination country?" → "Urgency?" Auto-populates booking fields.

### 9.2 RON TechCheck component
New `src/components/TechCheck.tsx`: Pre-session test for webcam, microphone, and internet speed. Shows green/yellow/red indicators. Accessible from confirmation page and portal.

### 9.3 Automated appointment reminders
New edge function `supabase/functions/send-appointment-reminders/index.ts`: Sends email at 24h and 1h before appointment with service-specific preparation checklist. Can be triggered by cron or scheduled invocation.

---

## PHASE 10: Immigration Service Content

### 10.1 USCIS forms reference data
Add comprehensive reference for common forms a notary assists with:
- I-130 (Petition for Alien Relative)
- I-485 (Adjustment of Status / Green Card)
- I-765 (Employment Authorization Document)
- N-400 (Naturalization / Citizenship)
- I-90 (Renew Green Card)
- I-131 (Travel Document / Advance Parole)
- I-864 (Affidavit of Support)
- I-20 (Certificate of Eligibility for Student Status)
- DS-160 (Online Nonimmigrant Visa Application)

### 10.2 Notary role clarification
Clear statement on ServiceDetail for immigration services: "A notary can administer oaths, witness signatures, and certify copies. A notary cannot provide legal advice, fill out forms for you, or represent you before USCIS."

### 10.3 Per-form document checklists
Required supporting documents for each form type displayed in the intake flow.

### 10.4 Multilingual service note
"We provide service in English. For translations, please bring your own certified translator or request our Translation Coordination service."

---

## Database Migration Required

```sql
ALTER TABLE apostille_requests
  ADD COLUMN destination_country text,
  ADD COLUMN document_count integer NOT NULL DEFAULT 1;
```

---

## Files to Create or Modify

| File | Changes |
|------|---------|
| `src/pages/BookAppointment.tsx` | Phases 1, 4 — rendering guards, race condition fix, guest validation, digital-only check, intake fields, cost estimator, preferences |
| `src/pages/Services.tsx` | Phase 2 — pass service name, search, mobile tabs |
| `src/pages/ServiceDetail.tsx` | Phase 3 — resources, FAQs, disclaimers, timelines, checklist, complexity, visual workflow, bundles, AI chat |
| `src/pages/AppointmentConfirmation.tsx` | Phase 5 — service-specific checklists, next steps, upload link, cross-sell |
| `src/pages/ClientPortal.tsx` | Phase 6 — doc delete, apostille form, status timeline, payment improvements, service tracker |
| `src/pages/admin/AdminRevenue.tsx` | Phase 7.1 — email notification on payment request |
| `src/pages/admin/AdminAppointments.tsx` | Phase 7.2 — review request prompt |
| `src/pages/admin/AdminDocuments.tsx` | Phase 7.3 — delete button |
| `src/pages/admin/AdminApostille.tsx` | Phase 7.4 — destination country, SOS tools |
| `src/pages/Index.tsx` | Phase 8.1-8.2 — dynamic services and reviews |
| `src/pages/DocumentTemplates.tsx` | Phase 8.3 — DB-driven templates |
| `src/components/ServicePreQualifier.tsx` | Phase 9.1 — new pre-qualification wizard |
| `src/components/TechCheck.tsx` | Phase 9.2 — new RON tech check |
| `supabase/functions/send-appointment-reminders/index.ts` | Phase 9.3 — new reminder edge function |

**Total: 60 distinct items across 14 files, 1 DB migration, 2 new components, 1 new edge function.**

