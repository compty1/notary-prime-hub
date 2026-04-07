

# Plan: Feature Completeness (Gaps 156–200)

## Audit of Current State

After code review, several items are **already implemented** or partially done:
- **Gap 174 (Social login)**: Google OAuth already working via `lovable.auth.signInWithOAuth("google")` in Login.tsx and SignUp.tsx
- **Gap 159 (Document versioning)**: Memory mentions `document_versions` table exists in schema, but no UI uses it
- **Gap 166 (Waitlist)**: Memory mentions `waitlist` table exists, but no UI integration
- **Gap 163 (Invoice generator)**: `InvoiceGenerator` component exists but isn't connected to payment flow
- **Gap 173 (Client feedback)**: `ClientFeedbackForm` component exists but isn't integrated into any page

**35 genuine gaps remain.** Grouped into 8 implementation batches, prioritized by user impact:

---

## Batch 1: Real-time Appointment Status (Gap 158)

**Migration**: Enable Realtime on `appointments` table
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
```

**File: `src/pages/portal/PortalAppointmentsTab.tsx`**
- Add Supabase Realtime subscription on `appointments` table filtered by client_id
- Auto-update appointment list when status changes (no manual refresh needed)

**File: `src/pages/ClientPortal.tsx`**
- Pass a `refetch` callback from the parent query to PortalAppointmentsTab so Realtime events trigger data refresh

---

## Batch 2: Client Feedback Integration (Gap 173) + NPS (Gap 188)

**File: `src/pages/portal/PortalAppointmentsTab.tsx`**
- Show `ClientFeedbackForm` inline on completed appointments that haven't been rated yet
- Add NPS question (0-10 scale) to the existing feedback form

**Migration**: Create `client_feedback` table if not exists
```sql
CREATE TABLE IF NOT EXISTS public.client_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id),
  client_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  nps_score int CHECK (nps_score >= 0 AND nps_score <= 10),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;
-- Clients can insert/read their own feedback
CREATE POLICY "clients_own_feedback" ON public.client_feedback
  FOR ALL TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
-- Admins can read all
CREATE POLICY "admins_read_feedback" ON public.client_feedback
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

---

## Batch 3: Invoice → Payment Flow Connection (Gap 163) + Receipt Email (Gap 164)

**File: `src/pages/admin/AdminRevenue.tsx`**
- Add "Generate Invoice" button on appointment rows that integrates `InvoiceGenerator`
- After payment completion, trigger receipt email via existing `send-correspondence` edge function

**File: `src/components/InvoiceGenerator.tsx`**
- Add `appointmentId` prop to link invoice to appointment record
- Save generated invoice metadata to `payments` table

---

## Batch 4: Document Status Notifications (Gap 172) + Automated Follow-ups (Gap 187)

**Edge function: `supabase/functions/send-document-notification/index.ts`**
- Trigger email when document status changes (uploaded → approved → notarized)
- Use existing IONOS email infrastructure

**Migration**: Add trigger on `documents` table for status changes
```sql
CREATE OR REPLACE FUNCTION notify_document_status_change() ...
```

**Edge function: `supabase/functions/send-followup-sequence/index.ts`**
- After session completion, enqueue 3-email sequence: thank you (immediate), feedback request (24h), referral invitation (72h)
- Use existing `enqueue_email` + `process-email-queue` infrastructure

---

## Batch 5: Appointment Duration Estimation (Gap 170) + Waitlist UI (Gap 166)

**File: `src/pages/booking/BookingScheduleStep.tsx`**
- Display estimated session duration based on service type and document count
- Pull duration estimates from `services` table

**File: `src/pages/BookAppointment.tsx`**
- When no slots available, show "Join Waitlist" button
- Insert into existing `waitlist` table with client notification preference

**Migration**: Create waitlist table if not exists
```sql
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  service_type text NOT NULL,
  preferred_date date,
  preferred_time text,
  status text DEFAULT 'waiting',
  notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_own_waitlist" ON public.waitlist
  FOR ALL TO authenticated USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());
```

---

## Batch 6: Referral Tracking Dashboard (Gap 181) + Onboarding Email (Gap 195)

**File: `src/components/ReferralPortal.tsx`**
- Add tracking analytics: referral count, conversion rate, reward status
- Query `referrals` table for stats

**Edge function: `supabase/functions/send-welcome-sequence/index.ts`**
- On new user signup, enqueue a 3-email welcome series
- Triggered via database trigger on `profiles` table insert

---

## Batch 7: Bulk Document Upload for Clients (Gap 171) + Document Templates Access (Gap 168)

**File: `src/pages/portal/PortalDocumentsTab.tsx`**
- Integrate existing `BulkDocumentUpload` component into client portal documents tab
- Add "Use Template" button linking to `/templates` for client-accessible templates

---

## Batch 8: Scheduling Optimization UI (Gap 178) + Geographic Enforcement (Gap 196)

**File: `src/pages/booking/BookingScheduleStep.tsx`**
- Call existing `ai-schedule-optimizer` edge function to suggest optimal time slots
- Display AI-recommended slots with a "Recommended" badge

**File: `src/pages/BookAppointment.tsx`**
- For mobile notary bookings, validate that client address is within service area (50-mile radius from Columbus)
- Show warning/block if outside service area using existing `haversineDistance` from `geoUtils.ts`

---

## Skipped Items (out of scope or require external services)

| Gap | Reason |
|---|---|
| 156 (SMS reminders) | Requires Twilio/SMS provider — needs separate secret setup |
| 157 (Push notifications) | Requires FCM/Web Push infrastructure — separate effort |
| 160 (Multi-language) | Major i18n effort — separate project phase |
| 175 (SSO) | Enterprise feature — requires SAML infrastructure |
| 176 (Webhook config UI) | AdminWebhooks page already exists |
| 177 (API key management) | Enterprise feature |
| 179 (White-label portal) | Major customization effort |
| 182 (A/B testing) | Requires analytics infrastructure |
| 190 (Real-time DocuDex) | Requires CRDT/multiplayer infrastructure |
| 174 (Social login) | Already implemented with Google OAuth |

---

## File Summary

| File | Changes |
|---|---|
| `src/pages/portal/PortalAppointmentsTab.tsx` | Realtime subscription, feedback form integration |
| `src/pages/ClientPortal.tsx` | Realtime refetch callback |
| `src/components/ClientFeedbackForm.tsx` | Add NPS score field |
| `src/components/InvoiceGenerator.tsx` | Connect to appointment/payment flow |
| `src/pages/admin/AdminRevenue.tsx` | Invoice generation button |
| `src/pages/portal/PortalDocumentsTab.tsx` | Bulk upload + template access |
| `src/pages/booking/BookingScheduleStep.tsx` | Duration display, AI suggestions |
| `src/pages/BookAppointment.tsx` | Waitlist, geographic enforcement |
| `src/components/ReferralPortal.tsx` | Tracking analytics dashboard |
| **New edge functions** | `send-document-notification`, `send-followup-sequence`, `send-welcome-sequence` |
| **Migrations** | `client_feedback`, `waitlist` tables, Realtime on appointments |

