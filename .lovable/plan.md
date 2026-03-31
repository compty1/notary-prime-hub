

# Consolidated Final Plan — Full Gap Analysis + All Prior Items

After thorough analysis of the entire active codebase, here is what's **already implemented** and what **remains as net-new work**. Nothing from prior plans is removed.

---

## Already Implemented (Confirmed in Code)

**Booking & Scheduling:** 4-step booking engine with stepper | RON vs In-Person toggle (step 1) | Urgency tiers (standard/rush/same_day) | Document count field | Witness count/mode fields | Address autocomplete (Nominatim) | Holiday blocking | Past-date prevention (DB trigger) | Double-booking prevention (DB trigger) | Session persistence (localStorage 24h) | Rebook from past appointments | Lead-time warning | Guest signup flow | ID scan + doc scan in booking | Geolocation "Use My Location" | beforeunload warning

**Client Portal:** Full portal with appointments, documents, chat, service requests, payments, reviews tabs | Cancel/Reschedule buttons (links to `/book?rebook=`) | Document upload + replace | Tech check | Profile editing | QR code for mobile upload | Payment form | Close account flow | Progress tracker ("Pizza Tracker") | Document wizard

**RON Session:** Manual mode with link pasting for 8 platforms | KBA/ID verification step | Oath administration with scripts (acknowledgment, jurat, oath, affirmation) | Journal entry creation | E-seal generation | Invoice auto-generation | Session recording consent | IP capture | Commission expiry blocking

**Appointment Confirmation:** ICS download | Category-specific checklists (RON, in-person, apostille, immigration, I-9, real estate) | "Do NOT sign beforehand" in in-person checklist | Cross-sell suggestions | Notary profile display | Confirmation number

**Content & Education:** FAQ section (5 questions including RON, ID requirements, timing, area) | Legal Glossary Tooltips (50+ terms) | How It Works 3-step | Industry Insights section | RON Info page | Notary Guide | Fee Calculator with after-hours/rush/witness toggles | Document Wizard + ServicePreQualifier | Service detail pages | Loan Signing page

**Trust & Compliance:** Trust bar (ORC §147, Franklin County, $25k Bond, Same-Day) | About page with NNA Certified, Background Checked, E&O, RON Certified | Testimonials with star ratings | 7-county service area | Terms & Privacy with ORC references | UPL disclaimer in Terms §5 | Cancellation policy | Fee caps (ORC §147.08) | RON recording consent (ORC §147.66)

**Navigation/UX:** Sticky Navbar | Back-to-Top | Smooth scrolling | Scroll-to-top on route | Breadcrumbs | Command palette | Dark mode | Cookie consent | Offline indicator | Error Boundary | Custom 404 | Empty states | Skeleton loading | Print styles | Favicon | `tel:` links in Footer and About | Loading spinners on submit buttons

**Admin:** Full admin dashboard with appointments, clients, documents, journal, revenue, services, team, leads, email management, audit log, integration tests, task queue, content workspace, availability management, settings (including travel_radius_miles, after_hours_fee, fees)

---

## Existing Plan Phases 1–9 (Unchanged)

All items from the current `.lovable/plan.md` remain exactly as-is: Phase 1 (Bug Fixes), Phase 2 (Email/IONOS), Phase 3 (Legal Glossary — done), Phase 4 (Pizza Tracker — done), Phase 5 (AI ID Assistant — done), Phase 6 (Sign-Preview Wizard — done), Phase 7 (Google Calendar), Phase 8 (Notary Link-Method Workflow), Phase 9 (800 Gaps).

---

## Existing Plan Phases 10–14 (Unchanged from prior plans)

**Phase 10:** UPL disclaimer in Footer, No-Show/Travel fee policy in Terms, Mental capacity statement, Payment methods display, Business hours in Footer.

**Phase 11:** Mobile FAB, Conversion event tracking (analytics.ts), Pre-appointment document upload in portal, Pre-signing warning in BookingReviewStep, ASAP availability badge.

**Phase 12:** Out-of-service area rejection, Dynamic travel fee display, After-hours surcharge engine in review step, Facility signing workflow, Signer capacity selection, Multi-party coordination, Notarial refusal documentation, Witness requirement logic gate.

**Phase 13:** ID requirements education, RON vs In-Person comparison cards, GNW vs Loan Signing distinction, Mobile notary value proposition, Travel fee transparency content, Top-of-funnel Resources page, Ohio fee cap + witness info in FAQ.

**Phase 14:** Auto-scroll to form errors, inputMode optimization, Font scaling px→rem, Responsive fixes for small viewports, Post-submission next steps, Pre-appointment signer checklist, Self-service rescheduling.

---

## Phase 15: Newly Discovered Active Gaps (From Full Build Analysis)

### 15A. Contact Form Missing `inputMode` Attributes
**Severity:** Medium
**Files:** `src/pages/Index.tsx` (lines 482-488), `src/pages/BookAppointment.tsx`, `src/pages/ServiceRequest.tsx`
**Gap:** No `inputMode` attributes on any form fields across the entire codebase. Phone fields lack `inputMode="tel"`, email fields lack `inputMode="email"`, zip codes lack `inputMode="numeric"`.
**Fix:** Already in Phase 14B — confirm all active forms are covered including Index contact form, booking intake, service request, portal profile edit.

### 15B. No `openingHoursSpecification` for All Days in JSON-LD
**Severity:** Medium
**File:** `src/pages/Index.tsx` (line 171-173)
**Gap:** The JSON-LD schema only specifies Mon-Wed 10-7. Missing Thu, Fri, Sat, Sun.
**Fix:** Expand `openingHoursSpecification` array to cover all 7 days matching actual business hours.

### 15C. Contact Form Lacks Privacy Micro-Copy
**Severity:** Low
**File:** `src/pages/Index.tsx` (lines 480-488)
**Gap:** No small text under phone field explaining "Used only for appointment coordination."
**Fix:** Add `<p className="text-xs text-muted-foreground">` below phone input.

### 15D. Contact Form Success Message Lacks Specific Timeline
**Severity:** Medium
**File:** `src/pages/Index.tsx` (line 155)
**Gap:** Toast says "We'll get back to you within 24 hours" but the section text says "within 2 hours during business hours." The toast should match: "We'll get back to you within 2 hours during business hours."
**Fix:** Update toast description string.

### 15E. Booking Review Step Missing After-Hours Surcharge Display
**Severity:** High
**File:** `src/pages/booking/BookingReviewStep.tsx`
**Gap:** The FeeCalculator has after-hours toggle, but the actual booking review step only shows rush/same_day surcharges — no after-hours surcharge is calculated or displayed based on selected time slot. Already in Phase 12C.
**Fix:** Already planned in Phase 12C.

### 15F. No Travel Distance/Fee Estimate in Booking Review
**Severity:** High
**File:** `src/pages/booking/BookingReviewStep.tsx`
**Gap:** While `travel_fee_minimum` is shown as a flat number, there's no dynamic distance-based calculation using the address entered. `travel_distance_miles` column exists in DB but is never populated during booking. Already in Phase 12B.
**Fix:** Already planned in Phase 12B.

### 15G. Booking Flow Doesn't Validate Service Area
**Severity:** High
**File:** `src/pages/BookAppointment.tsx`
**Gap:** `travel_radius_miles` is configurable in admin settings, and user latitude/longitude are captured via geolocation, but they're never compared. A user outside the service area can book with no warning. Already in Phase 12A.
**Fix:** Already planned in Phase 12A.

### 15H. No Signer Capacity Field in Booking
**Severity:** Medium
**File:** `src/pages/booking/BookingIntakeFields.tsx`
**Gap:** No dropdown for Individual/Representative/Attorney-in-Fact/Corporate Officer/Trustee. Already in Phase 12E.
**Fix:** Already planned in Phase 12E.

### 15I. Appointment Confirmation Missing "Next Steps" Timeline
**Severity:** Medium
**File:** `src/pages/AppointmentConfirmation.tsx`
**Gap:** Has checklists but no numbered "What happens next" timeline (e.g., "1. Check email for confirmation 2. Upload docs 3. Prepare ID"). Already in Phase 14E.
**Fix:** Already planned in Phase 14E. Add a numbered steps section above the checklist.

### 15J. No "Do Not Sign" Warning in BookingReviewStep
**Severity:** High
**File:** `src/pages/booking/BookingReviewStep.tsx`
**Gap:** The confirmation page checklist says "do NOT sign beforehand" but the review step (last thing user sees before booking) does not. Already in Phase 11D.
**Fix:** Already planned in Phase 11D.

### 15K. Missing Notarial Act Type Mapping
**Severity:** Medium
**File:** `src/pages/booking/BookingIntakeFields.tsx`
**Gap:** Services are not mapped to their notarial act type (Acknowledgment, Jurat, Oath, Copy Certification). This affects oath script auto-selection in RON sessions. The RON session has oath scripts but they must be manually selected. Already in Phase 12 (notarial act type column).
**Fix:** Add `notarial_act_type` mapping in `serviceConstants.ts` and auto-select in RON session.

### 15L. Portal Appointments Tab Missing Confirmation Number
**Severity:** Low
**File:** `src/pages/portal/PortalAppointmentsTab.tsx`
**Gap:** Appointment cards don't show the confirmation number (NTR-YYYYMMDD-XXXXXX) which is generated by DB trigger.
**Fix:** Display `appt.confirmation_number` in appointment cards.

### 15M. No Post-Service Review Prompt
**Severity:** Medium
**File:** `src/pages/portal/PortalAppointmentsTab.tsx`
**Gap:** Past completed appointments show a "Rebook" button but no prompt to leave a review. The ClientPortal has review form infrastructure but no proactive prompt on completed appointments.
**Fix:** Add a "Leave a Review" button next to "Rebook" for completed appointments that don't already have a review.

### 15N. Admin Refusal Workflow Not Implemented
**Severity:** Medium
**File:** `src/pages/admin/AdminAppointments.tsx`
**Gap:** No "Refuse Notarization" button with reason field. Already in Phase 12G.
**Fix:** Already planned in Phase 12G. Add refusal action, log to audit, notify client.

### 15O. Booking Price Calculation Missing Witness Fee for Non-Witness Services
**Severity:** Low
**File:** `src/pages/BookAppointment.tsx` (lines 161-164)
**Gap:** Witness fees are calculated but only when `witnessCount > 0`. The witness count/mode fields only show when the service name contains "witness". For documents like Wills that need witnesses but aren't named "witness service," there's no prompt. Already in Phase 12H.
**Fix:** Already planned in Phase 12H.

### 15P. No "Reschedule" in Portal — Only Link to Rebook
**Severity:** Low
**File:** `src/pages/portal/PortalAppointmentsTab.tsx` (line 103)
**Gap:** The "Reschedule" button actually links to `/book?rebook=<id>` which pre-fills and creates a new flow. This works, but the original appointment isn't cancelled first — user must also cancel manually. Already partially addressed in Phase 14G.
**Fix:** Chain cancellation of original + rebook in Phase 14G.

### 15Q. AILeadChatbot Not Included in PageShell
**Severity:** Medium
**File:** `src/components/PageShell.tsx`
**Gap:** The `AILeadChatbot` component exists but is NOT rendered in `PageShell` or anywhere in the app. It's a dead component.
**Fix:** Import and render `<AILeadChatbot />` in `PageShell.tsx` so it appears on all public pages.

### 15R. `openingHoursSpecification` Incomplete in JSON-LD
**Severity:** Medium (SEO)
**File:** `src/pages/Index.tsx` (lines 171-173)
**Gap:** Only Mon-Wed specified. Google Search Console will flag this.
**Fix:** Add all 7 days with correct hours.

### 15S. No Service Duration Estimates on Service Cards
**Severity:** Medium
**File:** `src/pages/Services.tsx`, `src/pages/Index.tsx`
**Gap:** Service cards don't show estimated duration (e.g., "~15 min"). The `services` DB table has `estimated_turnaround` but it's not displayed on cards.
**Fix:** Fetch and display `estimated_turnaround` as a badge on service cards.

### 15T. Booking Doesn't Populate `travel_distance_miles` in DB
**Severity:** Medium
**File:** `src/pages/BookAppointment.tsx` (line 371)
**Gap:** The `appointments` table has a `travel_distance_miles` column but `submitBooking` never sets it. The user's lat/lon are captured but never used for distance calculation.
**Fix:** Calculate Haversine distance from `userLat/userLon` to office coords (from `platform_settings`) and include in the insert payload.

### 15U. Footer Missing UPL Disclaimer
**Severity:** Critical
**File:** `src/components/Footer.tsx`
**Gap:** Terms §5 has the UPL disclaimer but the Footer does not show it. Already in Phase 10A.
**Fix:** Already planned in Phase 10A.

### 15V. Footer Missing Business Hours
**Severity:** Medium
**File:** `src/components/Footer.tsx`
**Gap:** No hours of operation displayed. Already in Phase 10E.
**Fix:** Already planned in Phase 10E.

### 15W. Footer Missing Payment Methods
**Severity:** Medium
**File:** `src/components/Footer.tsx`
**Gap:** No accepted payment info. Already in Phase 10D.
**Fix:** Already planned in Phase 10D.

---

## Database Migration (Combined — Phases 12+15)

```sql
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS signing_capacity text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS entity_name text,
  ADD COLUMN IF NOT EXISTS signer_title text,
  ADD COLUMN IF NOT EXISTS facility_name text,
  ADD COLUMN IF NOT EXISTS facility_contact text,
  ADD COLUMN IF NOT EXISTS facility_room text,
  ADD COLUMN IF NOT EXISTS after_hours_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS travel_fee_estimate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signer_count integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS witness_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS witness_source text DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS notarial_act_type text,
  ADD COLUMN IF NOT EXISTS refusal_reason text,
  ADD COLUMN IF NOT EXISTS refused_at timestamptz;
```

---

## All New Files to Create

| File | Purpose | Phase |
|------|---------|-------|
| `src/components/MobileFAB.tsx` | Floating call button for mobile | 11A |
| `src/lib/analytics.ts` | GA4 event tracking wrapper | 11B |
| `src/hooks/useScrollToError.ts` | Auto-scroll to validation errors | 14A |
| `src/components/PreSigningChecklist.tsx` | Signer preparation checklist | 14F |
| `src/pages/Resources.tsx` | Content hub / blog landing page | 13F |

## All Files to Modify

| File | Changes | Phase |
|------|---------|-------|
| `src/components/Footer.tsx` | UPL disclaimer, hours, payment methods | 10A-E |
| `src/components/PageShell.tsx` | Add MobileFAB + AILeadChatbot | 11A, 15Q |
| `index.html` | GA4 script placeholder | 11B |
| `src/pages/Index.tsx` | ASAP badge, contact form inputMode, privacy micro-copy, JSON-LD hours fix, response time toast fix, service duration badges | 11E, 15B-D, 15S |
| `src/pages/TermsPrivacy.tsx` | No-show policy, mental capacity | 10B-C |
| `src/pages/BookAppointment.tsx` | Service area validation, travel distance calc, signer capacity, facility fields, after-hours surcharge, multi-party, analytics events | 12A-H, 15T |
| `src/pages/booking/BookingIntakeFields.tsx` | Facility fields, signer capacity dropdown, witness logic gate | 12D-F, 12H |
| `src/pages/booking/BookingReviewStep.tsx` | Travel fee display, surcharge, no-show warning, pre-signing warning, payment methods, act type badge | 11D, 12B-C |
| `src/pages/ClientPortal.tsx` | Pre-appointment document upload | 11C |
| `src/pages/AppointmentConfirmation.tsx` | Next steps timeline | 14E |
| `src/pages/NotaryGuide.tsx` | ID requirements education | 13A |
| `src/pages/FeeCalculator.tsx` | GNW vs Loan Signing, travel fee table | 13C-E |
| `src/pages/Services.tsx` | Duration estimates, GNW/LSA distinction | 13C, 15S |
| `src/pages/admin/AdminAppointments.tsx` | Refusal workflow | 12G |
| `src/pages/portal/PortalAppointmentsTab.tsx` | Confirmation number display, review prompt, reschedule chain | 15L-M, 15P |
| `src/lib/serviceConstants.ts` | Notarial act type mapping | 15K |
| `src/App.tsx` | Add `/resources` route | 13F |
| `src/index.css` | px→rem audit, responsive fixes | 14C-D |

## Implementation Priority

1. **Phase 10** — Legal compliance (Footer UPL, no-show policy, payments, hours)
2. **Phase 11** — Conversion (MobileFAB, analytics, chatbot activation, pre-signing warning)
3. **Phase 12** — Business logic (service area, travel fee, surcharges, capacity, facilities, refusal)
4. **Phase 15Q** — Quick win: activate AILeadChatbot in PageShell
5. **Phase 15B-D** — Quick wins: JSON-LD fix, privacy micro-copy, toast message fix
6. **Phase 15K-M** — Quick wins: notarial act mapping, confirmation numbers, review prompts
7. **Phase 13** — Content & SEO (ID education, Resources page, GNW vs LSA)
8. **Phase 14** — UX polish (scrollToError, inputMode, rem scaling, responsive fixes)
9. **Phase 15S-T** — Service duration display, travel distance calculation

