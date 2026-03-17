

# Comprehensive Implementation Plan

## Overview
This plan addresses 7 workstreams: Join Platform page, admin template 404 fix, intake flow audit, AI response download/save, fee calculator travel distance upgrade, service-specific FAQs, and ServicePreQualifier audit.

---

## 1. Notary Provider "Join Platform" Page

**New file: `src/pages/JoinPlatform.tsx`**

Create a public page with:
- Hero section: "Join Our Notary Network" with platform overview
- Benefits grid: Flexible schedule, client pipeline, admin tools, revenue sharing
- Requirements: Ohio commission, NNA certification, background check, E&O insurance, RON certification (optional)
- How it works: Apply → Verify → Onboard → Start
- Application form: name, email, phone, commission number, state (default OH), years of experience, services offered (checkboxes), message textarea
- On submit: insert into `leads` table with `source = 'provider_application'`, `lead_type = 'notary'`, `status = 'new'`
- Provider FAQ accordion (5-6 questions about compensation, scheduling, platform fees)
- No auth required; needs an RLS policy for anon inserts with `source = 'provider_application'`

**Route:** Add `/join` to `App.tsx`
**Nav links:** Add "Join as Provider" to Index.tsx footer and About.tsx

**Database:** Add RLS policy on `leads` table:
```sql
CREATE POLICY "Allow anonymous provider applications" ON public.leads
FOR INSERT TO anon
WITH CHECK (source = 'provider_application' AND status = 'new' AND lead_type = 'notary');
```

---

## 2. Fix Admin Templates 404s

**Problem:** `AdminTemplates.tsx` links to Ohio SOS PDF URLs that may be broken or restructured.

**Fix in `src/pages/admin/AdminTemplates.tsx`:**
- Update all form URLs in the `ohioForms` array:
  - Change specific PDF URLs like `notary-application.pdf`, `notary-renewal.pdf`, `notary-change-form.pdf` to the main forms page: `https://www.ohiosos.gov/notary/forms/`
  - The RON URLs already point to the correct landing page
- Add `target="_blank"` and `rel="noopener noreferrer"` on all links (already present in current code via buttons with `onClick` opening `window.open`)
- Verify buttons use `window.open` correctly with the updated URLs

---

## 3. Intake Flow Audit — Service-Specific Fields & Location Logic

**Current issues identified:**
1. **Location fields shown for digital services incorrectly:** `isDigitalOnly()` checks category in `DIGITAL_ONLY_CATEGORIES` (recurring, consulting, document_services, business_services) OR service name in `DIGITAL_ONLY_SERVICES`. This is correct — consulting/document_services skip location. But "Closing Coordination" (consulting category) DOES need a location.
2. **Immigration fields only show for consulting services with "immigration"/"uscis" in name** — this is correct.
3. **No consulting-specific intake fields** for non-immigration consulting (RON Onboarding, Workflow Audits, Custom Workflow Design).

**Changes to `BookAppointment.tsx`:**

a) Add `LOCATION_REQUIRED_SERVICES` set:
```typescript
const LOCATION_REQUIRED_SERVICES = new Set([
  "Closing Coordination",
  "Bulk Notarization",
]);
```
Update `isDigitalOnly()` to return false for services in this set even if their category is digital-only.

b) Add consulting-specific intake fields in `renderIntakeFields()`:
- For RON Onboarding: "Current notary commission state" (select), "RON platform experience" (radio: none/some/experienced)
- For Workflow Audits / Custom Workflow Design: "Current workflow description" (textarea), "Number of monthly transactions" (input)
- These are guarded by `svcLower.includes("ron onboarding")`, `svcLower.includes("workflow")`, etc.

c) Add state variables for new fields:
```typescript
const [commissionState, setCommissionState] = useState("OH");
const [ronExperience, setRonExperience] = useState("");
const [workflowDescription, setWorkflowDescription] = useState("");
```

d) Include new fields in `buildIntakeNotes()`.

---

## 4. "What Do I Need?" — Download, Save, and Form References

**Changes to `WhatDoINeed` component in `Index.tsx`:**

After the result renders and loading is complete, add action buttons:
- **"Copy Response"** — copies `result` text to clipboard via `navigator.clipboard.writeText()`
- **"Download as PDF"** — opens a print dialog for the result card using `window.print()` with a print-specific CSS media query, or creates a new window with just the content
- **"Save as Text"** — creates a `.txt` blob and triggers download

Add these as a row of small buttons below the existing "Book Appointment" / "View All Services" buttons.

**Same changes to the duplicate `WhatDoINeed` in `Services.tsx`.**

**Refactor opportunity:** Extract `WhatDoINeed` into `src/components/WhatDoINeed.tsx` to avoid duplication (currently duplicated between Index.tsx and Services.tsx).

**Changes to `supabase/functions/client-assistant/index.ts`:**
Update the system prompt to add:
```
When discussing specific document types, mention that templates are available at the /templates page. Reference specific template names like "Power of Attorney", "Affidavit", "Travel Consent for Minor", "Bill of Sale" when relevant to the user's situation.

When listing required forms or certificates, format them as actionable items the user can find on our templates page.
```

---

## 5. Fee Calculator — Travel Distance from Hollywood Casino

**Changes to `src/pages/FeeCalculator.tsx`:**

a) Add Hollywood Casino starting point info:
```typescript
const HOLLYWOOD_CASINO = { lat: 39.9555, lng: -83.1145 };
```

b) Replace the plain "Travel Distance (miles)" number input with:
- An explanatory note: "Travel distance is calculated from our central meeting point at Hollywood Casino on West Broad Street, Columbus — a convenient, central location for fair and efficient travel fees for both notary and client."
- An `AddressAutocomplete` component for the meeting location (import from `@/components/AddressAutocomplete`)
- State for meeting address: `meetingAddress`, `meetingLat`, `meetingLon`
- Haversine distance calculation function:
```typescript
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};
```
- When user selects an address from autocomplete, geocode it (AddressAutocomplete already provides lat/lon from Nominatim) and auto-calculate distance
- Show calculated distance with manual override option
- Keep the existing number input as fallback/override: "Or enter distance manually"

c) Import `AddressAutocomplete` and add state for `meetingAddress`, `meetingCity`, `meetingState`, `meetingZip`.

---

## 6. Service-Specific FAQ Audit

**Problem:** `ServiceDetail.tsx` uses `categoryFaqs` keyed by category. The `consulting` category FAQs are ALL about immigration/USCIS, but consulting includes RON Onboarding, Workflow Audits, Closing Coordination — none immigration-related.

**Changes to `ServiceDetail.tsx`:**

a) Add a `serviceFaqs` map keyed by service name patterns, checked BEFORE `categoryFaqs`:
```typescript
const serviceFaqs: Record<string, { q: string; a: string }[]> = {
  "ron onboarding": [
    { q: "What equipment do I need for RON?", a: "A computer with webcam, microphone, stable internet, and a RON-compliant platform like OneNotary or Notarize." },
    { q: "How long is the RON onboarding process?", a: "Typically 1-2 weeks including platform setup, training, and practice sessions." },
    { q: "What states authorize RON?", a: "Over 40 states now authorize RON. Ohio has authorized RON under ORC §147.65-.66 since 2019." },
    { q: "Do I need a separate RON commission?", a: "Yes. Ohio requires a separate RON authorization in addition to your traditional notary commission." },
  ],
  "workflow": [
    { q: "What does a workflow audit include?", a: "We review your current document handling, signing, and notarization processes to identify inefficiencies and recommend improvements." },
    { q: "How long does a workflow audit take?", a: "Initial assessment takes 1-2 hours via Zoom. Full recommendations delivered within 3-5 business days." },
    { q: "Can you automate our notarization process?", a: "Yes. We can design custom workflows integrating digital document prep, scheduling, and RON platforms." },
  ],
  "closing coordination": [
    { q: "What does closing coordination include?", a: "We coordinate document preparation, scheduling, notarization, and delivery for real estate closings." },
    { q: "Do you work with title companies?", a: "Yes. We partner with title companies across Ohio for seamless closing experiences." },
    { q: "Can you handle out-of-state closings?", a: "We can notarize documents for out-of-state transactions if the signer is in Ohio, using RON for remote parties." },
  ],
  "pdf": [
    { q: "What PDF operations do you offer?", a: "Merge, split, compress, convert (Word to PDF, image to PDF), OCR text extraction, and form field creation." },
    { q: "Can you convert scanned documents to editable text?", a: "Yes. Our AI-powered OCR service transcribes scanned documents while preserving original formatting." },
    { q: "What about large files?", a: "We handle files up to 100MB. For larger files, contact us for custom solutions." },
  ],
  "storage": [
    { q: "How does document storage work?", a: "Documents are encrypted and stored in our secure cloud vault. Access them anytime from your client portal." },
    { q: "How long are documents retained?", a: "Documents are retained indefinitely while your account is active. Notary journal entries are kept per Ohio law (minimum 5 years)." },
    { q: "Can I access my vault anytime?", a: "Yes. Log into your client portal to view, download, or share your stored documents 24/7." },
  ],
  "immigration": [
    // Keep the existing consulting/immigration FAQs here
    { q: "What forms can a notary help with?", a: "A notary can administer oaths, witness signatures, and certify copies for USCIS forms including I-130, I-485, I-765, N-400, I-90, I-131, I-864, and DS-160." },
    { q: "Can a notary provide legal advice?", a: "No. A notary cannot provide legal advice, fill out forms for you, or represent you before USCIS. Consult an immigration attorney." },
    { q: "Which USCIS forms require notarization?", a: "Most forms with affidavits (like I-864 Affidavit of Support) require notarization. Translations also typically need a notarized certificate of accuracy." },
    { q: "What's the notary's role vs. an attorney?", a: "The notary verifies identity and witnesses signatures. An attorney provides legal advice and represents you." },
  ],
};
```

b) Update FAQ selection logic (around line 213):
```typescript
// Try service-specific FAQs first
const getServiceFaqs = () => {
  if (!service) return categoryFaqs.notarization;
  const nameLower = service.name.toLowerCase();
  for (const [key, faqs] of Object.entries(serviceFaqs)) {
    if (nameLower.includes(key)) return faqs;
  }
  return categoryFaqs[service.category] || categoryFaqs.notarization;
};
const faqs = getServiceFaqs();
```

c) Add missing category FAQs for `document_services`, `business`, `recurring`:
```typescript
document_services: [
  { q: "What file formats do you accept?", a: "PDF, Word (.doc/.docx), images (JPG, PNG, TIFF), and most common document formats." },
  { q: "How long does digitization take?", a: "Most documents are processed within 1-3 business days. Rush service is available." },
  { q: "Can you preserve original formatting?", a: "Yes. Our AI-powered OCR preserves headings, paragraphs, tables, lists, and formatting from the original." },
  { q: "How do I access my digitized documents?", a: "Digitized documents are saved to your secure vault in the client portal." },
],
business: [
  { q: "Do you offer volume discounts?", a: "Yes. Contact us for custom pricing on bulk notarization and recurring services." },
  { q: "Can I set up a recurring schedule?", a: "Yes. We offer subscription plans for businesses with regular notarization needs." },
  { q: "Do you support multiple authorized signers?", a: "Yes. Business accounts can register multiple authorized signers with verified identities." },
  { q: "What industries do you serve?", a: "Real estate, legal, healthcare, financial services, education, and more." },
],
recurring: [
  { q: "How does document storage work?", a: "Encrypted cloud storage accessible 24/7 from your client portal." },
  { q: "How long are documents retained?", a: "Documents are retained indefinitely while your account is active." },
  { q: "Can I access my vault anytime?", a: "Yes. Your portal is available 24/7 for viewing, downloading, and sharing documents." },
  { q: "How are compliance reminders configured?", a: "Set custom reminders for document renewals, filing deadlines, and notary commission expiration." },
],
```

d) Fix the immigration-specific content card (lines 421-438): Currently shows for ALL consulting services. Change condition to only show when service name includes "immigration" or "uscis":
```typescript
{service.category === "consulting" && (service.name.toLowerCase().includes("immigration") || service.name.toLowerCase().includes("uscis")) && (
```

e) Fix the consulting resources (line 46-48): Currently shows USCIS links for all consulting. Add service-specific resources:
```typescript
consulting: [
  { label: "Schedule Consultation", url: "/book?service=Consultation", icon: Monitor },
],
// Add a function to get resources based on service name, falling back to category
```

---

## 7. ServicePreQualifier Audit

**Problem:** `ServicePreQualifier.tsx` line 109-111 shows `immigrationSteps` for ALL consulting services, not just immigration ones.

**Fix in `ServicePreQualifier.tsx`:**
Change the steps selection logic:
```typescript
const steps = category === "authentication" ? apostilleSteps
  : (category === "consulting" && (serviceName.toLowerCase().includes("immigration") || serviceName.toLowerCase().includes("uscis"))) ? immigrationSteps
  : category === "verification" ? i9Steps
  : [];
```

Add consulting-specific pre-qualifier steps for RON Onboarding:
```typescript
const ronOnboardingSteps = [
  {
    title: "Do you currently hold a notary commission?",
    field: "has_commission",
    type: "radio" as const,
    options: [
      { value: "yes", label: "Yes, I'm a commissioned notary" },
      { value: "no", label: "No, I need to get commissioned first" },
    ],
  },
  {
    title: "Which state are you commissioned in?",
    field: "commission_state",
    type: "input" as const,
    placeholder: "e.g., Ohio",
  },
];
```

Update the selection:
```typescript
const steps = category === "authentication" ? apostilleSteps
  : (category === "consulting" && (serviceName.toLowerCase().includes("immigration") || serviceName.toLowerCase().includes("uscis"))) ? immigrationSteps
  : (category === "consulting" && serviceName.toLowerCase().includes("ron onboarding")) ? ronOnboardingSteps
  : category === "verification" ? i9Steps
  : [];
```

---

## Files Summary

| File | Action | Changes |
|------|--------|---------|
| `src/pages/JoinPlatform.tsx` | **CREATE** | Provider info + application page |
| `src/components/WhatDoINeed.tsx` | **CREATE** | Extract shared component with download/save/copy buttons |
| `src/App.tsx` | **EDIT** | Add `/join` route |
| `src/pages/admin/AdminTemplates.tsx` | **EDIT** | Fix Ohio SOS form URLs |
| `src/pages/BookAppointment.tsx` | **EDIT** | Add `LOCATION_REQUIRED_SERVICES`, consulting-specific intake fields |
| `src/pages/ServiceDetail.tsx` | **EDIT** | Service-specific FAQs, fix immigration content guard, add missing category FAQs, fix consulting resources |
| `src/pages/FeeCalculator.tsx` | **EDIT** | Hollywood Casino starting point, AddressAutocomplete, Haversine calc |
| `src/components/ServicePreQualifier.tsx` | **EDIT** | Fix consulting → immigration guard, add RON onboarding steps |
| `src/pages/Index.tsx` | **EDIT** | Replace inline WhatDoINeed with shared component, add /join footer link |
| `src/pages/Services.tsx` | **EDIT** | Replace inline WhatDoINeed with shared component |
| `src/pages/About.tsx` | **EDIT** | Add /join link |
| `supabase/functions/client-assistant/index.ts` | **EDIT** | Update system prompt with template references |

**Database migration:**
```sql
CREATE POLICY "Allow anonymous provider applications" ON public.leads
FOR INSERT TO anon
WITH CHECK (source = 'provider_application' AND status = 'new' AND lead_type = 'notary');
```

---

## Gap Verification Checklist

1. `/join` page renders with application form and inserts into leads table
2. Admin template links open valid Ohio SOS pages (no 404s)
3. Consulting services that are NOT immigration do NOT show immigration intake fields or pre-qualifier
4. Closing Coordination shows location fields despite being in consulting category
5. RON Onboarding shows commission-related intake questions
6. WhatDoINeed responses have Copy, Download PDF, and Save as Text buttons
7. AI assistant references /templates page when discussing specific document types
8. Fee calculator shows Hollywood Casino starting point, address autocomplete, and auto-calculated distance
9. Every service category has relevant FAQs (no immigration FAQs on Workflow Audits)
10. ServicePreQualifier only shows immigration steps for immigration consulting services
11. `document_services`, `business`, and `recurring` categories have their own FAQs

