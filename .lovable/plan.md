

# Continued Service Audit — Remaining Gaps

After reviewing all 34 active services, the current routing logic, `ServiceDetail.tsx` CTAs, `Services.tsx` card links, `BookAppointment.tsx` intake fields, and `App.tsx` routes, here are the **additional gaps** not covered by the previous plan.

---

## Gap 1: Services.tsx Card CTAs Still Uniform

**Problem:** `Services.tsx` line 227 builds `bookUrl` identically for every service — always pointing to `/book?service=X`. The `ServiceDetail.tsx` sidebar has smart CTA logic (SaaS vs Book vs Get Started), but the **service listing cards** do not. A user clicking "Get Started" on Virtual Mailroom from the services grid still goes to `/book`.

**Fix:** Mirror the `getServiceAction()` routing logic from `ServiceDetail.tsx` into `Services.tsx` so card CTAs route correctly (e.g., Virtual Mailroom → `/mailroom`, PDF Services → `/digitize`, Storage → `/portal`).

---

## Gap 2: No `/request`, `/mailroom`, `/subscribe`, `/verify-id` Routes or Pages

**Problem:** The previous plan called for 4 new pages but none exist yet. `App.tsx` has no routes for them.

**Fix:** Create all 4 pages and add routes:
- `ServiceRequest.tsx` (`/request`) — generic intake form for non-booking services
- `VirtualMailroom.tsx` (`/mailroom`) — mailroom dashboard
- `SubscriptionPlans.tsx` (`/subscribe`) — tier selection for business services
- `VerifyIdentity.tsx` (`/verify-id`) — self-service KYC using existing `scan-id` edge function

---

## Gap 3: Missing Intake Fields for Several Services in BookAppointment

**Problem:** `BookAppointment.tsx` has specialized fields for translation, apostille, immigration, I-9, closing coordination, and RON consulting — but these services still route to `/book` and have **no specialized fields**:

| Service | Missing Fields |
|---------|---------------|
| Witness Services | Number of witnesses, virtual/in-person toggle, document type |
| Certified Copy Facilitation | Document name, issuing authority, copy count |
| Employment Onboarding Support | Employee count, HR contact, documents per employee |
| Custom Workflow Design | Current tools, team size, budget range |
| Bulk Notarization Packages | Monthly volume estimate, document types, schedule preference |
| Document Scanning & Digitization | Physical vs digital toggle (physical = needs appointment, digital = go to `/digitize`) |

**Fix:** Add conditional intake field blocks in `BookAppointment.tsx` for each of these services, keyed on `serviceType`.

---

## Gap 4: Intake-Only Services Still Force Date/Time Selection

**Problem:** Services like Apostille, Background Check, Clerical Doc Prep, Document Cleanup, Form Filling, Certified Doc Prep, Registered Agent, and Consular Legalization currently route through `/book` which requires selecting a date and time slot. These services don't need appointments — they need information intake only.

**Fix:** The `ServiceRequest.tsx` page (Gap 2) handles this. Route these services there instead. Update both `ServiceDetail.tsx` and `Services.tsx` CTA logic.

Intake-only services to route to `/request`:
- Apostille Facilitation
- Consular Legalization Prep
- Background Check Coordination
- Clerical Document Preparation
- Document Cleanup & Formatting
- Form Filling Assistance
- Certified Document Prep for Agencies
- Registered Agent Coordination
- Email Management & Correspondence (both categories)
- Notarized Translation Coordination

---

## Gap 5: `business_services` Category Not in Services.tsx Category List

**Problem:** The `categoryOrder` array in `Services.tsx` doesn't include `business_services`, so "Email Management & Correspondence" (category: `business_services`) won't render in the grid.

**Fix:** Either add `business_services` to `categoryOrder` with a label, or merge it into `recurring` since a duplicate already exists there.

---

## Gap 6: ClientPortal Missing Reminders/Renewals Tab

**Problem:** "Automated Reminders & Renewals" and "Document Retention & Compliance" are subscription services, but there's no UI in the client portal for configuring reminders or viewing compliance status.

**Fix:** Add a "Reminders" section to the client portal Documents tab (or a new tab) where users can set expiry dates on documents and configure email reminders.

---

## Gap 7: Subscription Services Have No Subscription Management

**Problem:** "Business Subscription Plans", "API & Integration Services", and "White-Label Partner Programs" route to `/book` but are subscription/application services. No pricing tiers, plan selection, or application form exists.

**Fix:** The `SubscriptionPlans.tsx` page (Gap 2) handles Business Subscription Plans and API. White-Label should route to `/join` (partner application, which already exists).

---

## Gap 8: Document Scanning Service Needs Physical/Digital Branch

**Problem:** "Document Scanning & Digitization" currently routes to `/digitize` which handles digital uploads. But physical document scanning requires an in-person appointment to drop off or have someone come scan.

**Fix:** On the ServiceDetail page for this service, add a branch: "I have digital files" → `/digitize`, "I have physical documents" → `/book?service=Document+Scanning`.

---

## Gap 9: `service_requests` and `mailroom_items` Tables Don't Exist

**Problem:** Previous plan specified these tables but the migration was never executed.

**Fix:** Create migration with both tables + RLS policies.

---

## Gap 10: Admin Has No View for Service Requests

**Problem:** If we create `/request` for intake-only services, the admin needs a way to view and manage these submissions (separate from appointments).

**Fix:** Add an "Admin Service Requests" page or a tab within `AdminAppointments` that shows `service_requests` entries with status management.

---

## Implementation Summary

| File | Action |
|------|--------|
| `src/pages/ServiceRequest.tsx` | **CREATE** — Intake form with service-specific fields for 10 intake-only services |
| `src/pages/VirtualMailroom.tsx` | **CREATE** — Mail dashboard with inbox, forwarding, archive |
| `src/pages/SubscriptionPlans.tsx` | **CREATE** — Tier cards for business/API subscriptions |
| `src/pages/VerifyIdentity.tsx` | **CREATE** — Self-service KYC using scan-id edge function |
| `src/App.tsx` | **EDIT** — Add 4 new routes |
| `src/pages/Services.tsx` | **EDIT** — Smart CTA routing on service cards (mirror ServiceDetail logic) |
| `src/pages/ServiceDetail.tsx` | **EDIT** — Route intake-only services to `/request`, scanning branch, subscription routing |
| `src/pages/BookAppointment.tsx` | **EDIT** — Add intake fields for Witness, Certified Copy, Onboarding, Custom Workflow, Bulk, Scanning |
| `src/pages/ClientPortal.tsx` | **EDIT** — Add reminders/renewals section for document expiry tracking |
| `src/pages/admin/AdminAppointments.tsx` | **EDIT** — Add "Service Requests" tab showing non-appointment intakes |
| DB migration | **CREATE** — `service_requests` + `mailroom_items` tables with RLS |

**Database:**
```sql
-- service_requests: for non-appointment intake submissions
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  intake_data JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- + RLS: clients create/view own, admins manage all

-- mailroom_items: virtual mailroom entries
CREATE TABLE public.mailroom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  sender TEXT,
  subject TEXT NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scanned_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  forwarding_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- + RLS: clients view own, admins manage all
```

