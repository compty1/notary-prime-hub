

# Full User & Admin Flow Gap Analysis

## Complete Flow Mapping

### User Flow: Book → Upload Docs → Join Session → Get Notarized → Download
### Admin Flow: View Appointment → Advance Status → Launch RON → Administer Oath → Journal Entry → Seal & Verify

---

## CRITICAL GAPS (Blocks completing a notarization)

### 1. No "Launch RON Session" Button in Admin Appointments
Admin can advance status through `scheduled → confirmed → id_verification → kba_pending → in_session → completed`, but there is **no link to `/ron-session?id=...`** anywhere in AdminAppointments. The admin has no way to actually open the BlueNotary session page from the appointment management view.

**Fix:** Add a "Launch Session" button on RON appointments when status is `in_session` or `kba_pending`, linking to `/ron-session?id={appt.id}`.

### 2. No KBA Flow — Just a Checkbox
BlueNotarySession sets `kba_completed: true` automatically when saving (line 166), without any actual KBA process. There is no identity quiz, no third-party KBA provider integration, and no way for the admin to mark KBA as passed/failed independently.

**Fix:** Add a KBA status section in BlueNotarySession sidebar showing KBA pending/completed state, with manual toggle for admin to mark as verified. Add a note that this is a placeholder pending third-party integration (IDology/LexisNexis).

### 3. No ID Verification Step in Session
BlueNotarySession sets `id_verified: true` automatically (line 166). There's no UI for admin to review the signer's ID, compare it to the person on camera, or record ID details (type, number, expiration).

**Fix:** Add an ID Verification card in the BlueNotarySession sidebar with fields for ID type, ID number, expiration date, and a manual "ID Verified" toggle. Persist this to `notarization_sessions` and/or `notary_journal`.

### 4. Client Cannot Join RON Session
In ClientPortal, the "Join" button only appears when `isSessionNear(appt)` returns true (within 15 minutes of session time). The link goes to `/ron-session?id=...` but this page is designed as an **admin tool** (oath scripts, voice-to-notes, save session data). There is no client-facing session experience — no video call, no document signing, no KBA quiz.

**Fix:** Either:
- (a) Create a separate client RON session page that embeds the BlueNotary iframe without admin tools, or
- (b) Make BlueNotarySession role-aware — show admin tools only to admin/notary, show client view (checklist + iframe + status) to clients.

### 5. No Document-to-Appointment Linking During Booking
BookAppointment creates an appointment but never creates document records or links uploaded files to the appointment. Documents uploaded in ClientPortal have no `appointment_id` unless manually set by admin.

**Fix:** Add a document upload step in BookAppointment (Step 3 or 4) that uploads files to storage and creates `documents` records with the new `appointment_id`. Alternatively, add an "Attach Documents" action on appointment cards in ClientPortal.

### 6. No Payment Collection
Payments table exists, admin can view a receipt, but there is no mechanism to:
- Create a payment record when an appointment is completed
- Send an invoice to the client
- Accept online payment (Stripe placeholder exists but isn't wired)

**Fix:** When admin marks appointment as `completed` and saves journal entry, auto-create a `payments` record with `status: 'pending'` and the `fees_charged` amount. Add a "Mark as Paid" button in admin. For online payments, this is deferred to Stripe integration.

---

## HIGH GAPS (Major UX issues)

### 7. Admin Cannot See Client's Documents for an Appointment
AdminAppointments detail dialog shows appointment info and notes, but doesn't show which documents the client uploaded or their review status. Admin must navigate to AdminDocuments separately and manually correlate.

**Fix:** In the appointment detail dialog, query `documents` where `appointment_id = appt.id` OR `uploaded_by = appt.client_id` and display them with status badges.

### 8. No Appointment Status Notification to Client
When admin advances appointment status (e.g., `confirmed → id_verification`), the edge function is called but the client has no in-app notification. There's no toast, no badge, no real-time update in ClientPortal beyond the initial data fetch.

**Fix:** ClientPortal already subscribes to `client-chat` channel. Add a subscription to `appointments` table changes for the client's appointments so status changes appear in real-time.

### 9. BlueNotarySession Has No "Complete & Finalize" Workflow
After oath is administered and notes saved, there's no button to:
- Mark the appointment as `completed`
- Trigger the quick journal entry flow
- Mark documents as `notarized`
- Return to admin dashboard

The admin must manually go back to AdminAppointments and change status there.

**Fix:** Add a "Complete Session" button in BlueNotarySession that updates appointment status to `completed`, documents to `notarized`, and redirects to admin appointments (or opens an inline journal entry form).

### 10. No Document Upload in Booking Flow
The booking wizard has 4 steps (Type → Details → Schedule → Confirm) but no document upload step. Clients must upload separately from ClientPortal after booking.

**Fix:** Add an optional document upload section in Step 2 or Step 3 of BookAppointment, creating document records linked to the appointment.

---

## MEDIUM GAPS

### 11. Chat Messages Not Scoped to Appointment
Client chat messages have no `appointment_id` — they're just global messages between client and admin. No way to tie a conversation thread to a specific appointment.

### 12. No Reschedule Flow
ClientPortal has a "Reschedule" button linking to `/book?rebook={id}`, but BookAppointment doesn't read the `rebook` param to pre-fill data or update the existing appointment. It would create a new appointment instead.

### 13. No Appointment Reminder System
No cron job or scheduled function to send reminders before appointments. The `email_template_reminder` exists in settings but nothing triggers it.

### 14. Receipt Print Doesn't Work Well
The "Print Receipt" button calls `window.print()` which prints the entire page, not just the receipt dialog content. No print stylesheet exists.

### 15. No Admin Dashboard Link to RON Session
AdminOverview shows recent appointments but has no quick action to launch a RON session.

---

## Implementation Plan

### Phase 1: Make RON Sessions Actually Work (Critical)
1. **BlueNotarySession role-aware views** — admin sees full tools, client sees checklist + iframe
2. **Add ID Verification card** with ID type/number/expiration fields and manual toggle
3. **Add KBA status card** with manual pass/fail toggle (placeholder for provider)
4. **Add "Launch Session" button** in AdminAppointments for RON appointments
5. **Add "Complete & Finalize" button** that marks appointment completed, docs notarized, prompts journal entry

### Phase 2: Connect Documents to Appointments (Critical)
6. **Add "Attach Documents" feature** in ClientPortal appointment cards
7. **Show linked documents** in AdminAppointments detail dialog
8. **Auto-create payment record** when journal entry is saved on completion

### Phase 3: Real-time Client Experience (High)
9. **Add realtime subscription** for appointment status changes in ClientPortal
10. **Enable `appointments` table for realtime** via migration

### Phase 4: Booking Flow Enhancement (High)
11. **Handle `rebook` param** in BookAppointment to pre-fill and update existing appointment
12. **Add optional document upload** in booking Step 3

### Phase 5: Polish (Medium)
13. **Add print stylesheet** for receipt dialog
14. **Add "Launch Session" quick action** in AdminOverview for upcoming RON appointments

### Files to Create
- None (all changes are modifications to existing files)

### Files to Modify
- `src/pages/BlueNotarySession.tsx` — role-aware views, ID verification, KBA status, complete button
- `src/pages/admin/AdminAppointments.tsx` — launch session button, linked documents in detail, auto-payment on journal save
- `src/pages/ClientPortal.tsx` — attach docs to appointments, realtime appointment status subscription
- `src/pages/BookAppointment.tsx` — handle rebook param, optional doc upload
- `src/pages/admin/AdminOverview.tsx` — quick launch session action

### Database Changes
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;` (enable realtime for appointment status updates)

