

# Implementation Plan: Admin Messaging, Service Flow Audit, and Document Lists

## 1. Admin "Message Client" from Appointments

**Problem:** No quick way to contact a client directly from the appointment view or detail dialog.

**Changes to `AdminAppointments.tsx`:**
- Add a "Message" button in the appointment card action bar (next to Details, Receipt)
- Add a "Message Client" button in the appointment detail dialog
- Clicking opens a small compose dialog pre-filled with client email and appointment context (service type, date)
- Uses existing `send-correspondence` edge function + inserts `client_correspondence` record
- Also add a "Message" quick action to `AdminClients.tsx` if not present

**New state:** `messageAppt` for the compose dialog, with `messageSubject` and `messageBody` fields.

---

## 2. Service Intake Flow Audit — Fix Inappropriate Fields

**Problem:** Many non-physical services (PDF Services, Document Scanning, Form Filling, etc.) show location/address fields because only `recurring` and `consulting` are in `DIGITAL_ONLY_CATEGORIES`. The `document_services` and `business_services` categories are missing.

**Current categories and what they need:**

| Category | Services | Needs Location? | Needs Notarization Type? | Special Intake? |
|----------|----------|-----------------|--------------------------|-----------------|
| `notarization` | RON, In-Person, Witness, Certified Copy | Yes (in-person) | Yes | No (standard) |
| `authentication` | Apostille, Consular Legalization, Translation Coord | Yes (docs pickup) | Yes | Destination country, urgency |
| `verification` | I-9, ID/KYC, Employment Onboarding, Background Check | Yes (I-9 in-person) | No | Employer, start date |
| `consulting` | RON Onboarding, Workflow Audits, Custom Workflow, Closing Coord, Immigration Doc Packaging | No (remote consult) | No | USCIS form (immigration), property (closing) |
| `document_services` | PDF Services, Scanning, Cleanup, Form Filling, Clerical Prep, Certified Doc Prep | **No** (currently shows location) | No | No |
| `business` | Bulk Notarization, Subscriptions, API, White-Label, Registered Agent | Mixed | No | Company name |
| `business_services` | Email Management | **No** | No | No |
| `recurring` | Vault, Mailroom, Reminders, Templates, Retention | No (already handled) | No | No |

**Fix in `BookAppointment.tsx`:**
- Add `document_services` and `business_services` to `DIGITAL_ONLY_CATEGORIES`
- For `consulting` category: show location only for "Closing Coordination" (real estate needs physical presence), keep others digital
- For `verification`: I-9 and Employment Onboarding need location; ID/KYC and Background Check can be remote
- For `business`: Bulk Notarization needs location; others are digital — add specific services to `DIGITAL_ONLY_SERVICES`

**Intake field refinements:**
- `document_services`: Remove all intake fields (no destination country, no employer, etc.) — just service + date/time + notes
- `consulting` with "Closing Coordination": Show property address + title company fields
- `consulting` with "Immigration": Show USCIS form + case type (already works)
- `verification` with "I-9": Keep employer + start date (already works)
- `verification` with "Background Check" or "ID/KYC": No special intake needed — skip employer fields

---

## 3. Explain List A, B, C Documents for I-9

**Problem:** The I-9 checklist and confirmation page mention "List A document" and "List B + List C document" without explaining what those are.

**Changes to `AppointmentConfirmation.tsx` and `BookAppointment.tsx`:**

Update the I-9 checklist to include specific document examples:

```
List A Documents (prove both identity AND work authorization — need ONE):
• U.S. Passport or Passport Card
• Permanent Resident Card (Green Card)
• Employment Authorization Document (EAD / I-766)
• Foreign passport with I-94 and endorsement

OR bring BOTH:

List B Documents (prove identity — need ONE):
• Driver's license or state ID
• School ID with photo
• Voter registration card
• U.S. military card

AND List C Documents (prove work authorization — need ONE):
• Social Security card (unrestricted)
• Birth certificate (U.S.)
• Certification of Birth Abroad (FS-545 or DS-1350)
```

Add this as an expandable info section in:
1. `AppointmentConfirmation.tsx` — when checklist is I-9 type
2. `BookAppointment.tsx` — in the `renderIntakeFields()` when category is `verification` or service includes "I-9"
3. `ServiceDetail.tsx` — in the FAQ section for verification category (already has FAQ but needs List A/B/C detail)

---

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/admin/AdminAppointments.tsx` | Add "Message Client" button + compose dialog |
| `src/pages/BookAppointment.tsx` | Fix `DIGITAL_ONLY_CATEGORIES` and `DIGITAL_ONLY_SERVICES`, refine intake field conditions, add I-9 document list |
| `src/pages/AppointmentConfirmation.tsx` | Expand I-9 checklist with List A/B/C details |
| `src/pages/ServiceDetail.tsx` | Add List A/B/C explanation to verification FAQ |

