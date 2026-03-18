

## Status Assessment

After reviewing all files across the codebase, **nearly everything from the 10-gap plan has been successfully implemented**. Here's what's done and what has one remaining gap:

### Completed (no action needed)
- **Gap 1** — Smart CTA routing in `Services.tsx` (INTAKE_ONLY, SAAS_LINKS, SUBSCRIPTION sets all present)
- **Gap 2** — All 4 new pages created: `ServiceRequest.tsx`, `VirtualMailroom.tsx`, `SubscriptionPlans.tsx`, `VerifyIdentity.tsx` + routes in `App.tsx`
- **Gap 3** — Specialized intake fields in `BookAppointment.tsx` for Witness, Certified Copy, Onboarding, Custom Workflow, Bulk, Scanning
- **Gap 4** — Intake-only services routed to `/request` in both `Services.tsx` and `ServiceDetail.tsx`
- **Gap 7** — `SubscriptionPlans.tsx` exists for business/API/partner services
- **Gap 8** — Scanning mode toggle exists in `BookAppointment.tsx`
- **Gap 9** — `service_requests` and `mailroom_items` tables created with RLS
- **Gap 10** — Admin "Requests" toggle added to `AdminAppointments.tsx`
- **Client Portal** — `service_requests` fetched, smart routing helpers, Requests tab all wired

### One Remaining Gap

**Gap 5 (partial):** `business_services` is in the `categoryOrder` array but has **no entry in `categoryLabels`**. This means any service in that category renders with no heading/description.

**Gap 6 (not implemented):** The **Reminders & Renewals UI** in the Client Portal was never built. The plan called for a section where users can set document expiry dates and configure email reminder alerts. Currently "Automated Reminders & Renewals" routes to `/portal` but there's no reminders configuration UI — just the existing Documents tab.

---

### Implementation Plan

**1. Add `business_services` label to `categoryLabels` in `Services.tsx`**
Add the missing entry so the category renders with a proper heading.

**2. Add Reminders section to Client Portal**
In `ClientPortal.tsx`, add a "Reminders" section within the Documents tab (or as a new tab) that:
- Lists documents with an optional expiry date field
- Lets users set a reminder date (e.g., 30/60/90 days before expiry)
- Stores reminder config in a lightweight way (could use the existing `documents` table with new columns, or a small `document_reminders` table)
- Shows upcoming expiries in a simple list

This requires a small DB migration to add a `document_reminders` table (columns: `id`, `user_id`, `document_id`, `expiry_date`, `remind_days_before`, `created_at`) with RLS.

### Files

| File | Action |
|------|--------|
| `src/pages/Services.tsx` | **EDIT** — Add `business_services` to `categoryLabels` |
| `src/pages/ClientPortal.tsx` | **EDIT** — Add reminders UI section |
| DB migration | **CREATE** — `document_reminders` table with RLS |

