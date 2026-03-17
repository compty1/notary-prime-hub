

# Extended Gap Analysis — Additional Items

Building on the existing plan (Phases 1-5), here are additional gaps found across all services, admin features, and public pages.

---

## CRITICAL — Functional Blockers

### 16. Documents UPDATE RLS Policy Missing
The `documents` table has no UPDATE policy for clients. The "Attach to Appointment" dropdown in ClientPortal calls `supabase.from("documents").update({appointment_id})` — this silently fails due to missing RLS.

**Fix:** Migration to add: `CREATE POLICY "Clients can update own documents" ON documents FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);`

### 17. Email Management Cannot Send Actual Emails
`AdminEmailManagement` only logs records to `client_correspondence`. The "reply" action saves a note but never sends an email. No outbound email edge function exists. The `process-inbound-email` function receives emails but there's no send counterpart.

**Fix:** Create a `send-correspondence` edge function that sends via Resend API. Add a "Send Reply" dialog in AdminEmailManagement that composes subject/body/to_address, calls the function, and logs the outbound record. Requires `RESEND_API_KEY` and `FROM_EMAIL` secrets.

### 18. Client Cannot See Correspondence
`client_correspondence` has RLS for client SELECT, but ClientPortal has zero UI for it. Clients can't see emails handled on their behalf.

**Fix:** Add a "Correspondence" section inside the Chat tab or as a new tab showing the client's correspondence records with status.

---

## HIGH — Major UX Gaps

### 19. Business Portal Team Management is Placeholder
`BusinessPortal.tsx` line ~140: "Team management coming soon." The `business_members` table and RLS exist but no UI to add/remove members.

**Fix:** Build team member invite (by email), list, and remove functionality using the `business_members` table.

### 20. Business Portal Billing History is Placeholder
Line ~147: "Monthly billing summaries will appear here." No implementation.

**Fix:** Query `appointments` and `payments` for the business owner and display history with totals.

### 21. Admin Cannot See Client Contact Info in Appointment Detail
Appointment detail dialog shows client_id but not name, phone, email, or address. Admin must navigate to AdminClients separately.

**Fix:** Join `profiles` data in the appointment detail query and display inline.

### 22. AdminDocuments Shows UUID Instead of Client Name
The documents list shows `uploaded_by` as a raw UUID. Admin has no idea whose document it is without cross-referencing.

**Fix:** Join `profiles` and display uploader name.

### 23. No "Mark as Paid" for Payments
Payments are auto-created with `status: 'pending'` when a session is completed, but there's no admin UI to mark them as `paid`, record payment method, or add a paid_at timestamp.

**Fix:** Add payment management — either in AdminAppointments detail or a dedicated payments admin section. Include "Mark Paid" button with method selector (cash, check, card, Zelle).

### 24. Apostille — Hardcoded $75 Fee, No Edit After Creation
`AdminApostille` create dialog hardcodes fee to `75` (line 144). No fee input field. No edit dialog for notes or fee after creation.

**Fix:** Add a fee input to the create dialog. Add inline note/fee editing for existing requests.

### 25. Client Cannot Track Apostille Requests
RLS allows clients to SELECT their own apostille requests, but ClientPortal has no apostille tracking section.

**Fix:** Add an "Apostille" section to ClientPortal showing request status, tracking number, and fee.

### 26. Seal Image URL Uses getPublicUrl on Private Bucket
`AdminSettings.tsx` line 47 calls `getPublicUrl` on the `documents` bucket which is private (`is_public: false`). The seal preview URL won't work.

**Fix:** Use `createSignedUrl` instead of `getPublicUrl` for the seal image preview.

---

## MEDIUM — Polish & Completeness

### 27. No Audit Log for Client/Correspondence/Payment Actions
Audit log only tracks: `appointment_status_changed`, `journal_entry_created`, `document_status_changed`, `ron_session_saved`. Missing: payment creation, email correspondence handling, apostille status changes, client profile updates.

**Fix:** Add audit log inserts for payment, correspondence, apostille, and profile actions across the relevant pages.

### 28. Chat Has No Unread Badge
ClientPortal chat tab shows no unread count. Clients don't know about new admin replies without clicking the tab.

**Fix:** Count unread messages (`is_admin = true AND read = false`) and display badge on the Chat tab trigger.

### 29. Chat Messages Cannot Be Marked as Read
`chat_messages` has a `read` column but no code ever sets it to `true`. There's also no UPDATE RLS policy for clients on `chat_messages`.

**Fix:** Add UPDATE RLS for clients on their own messages (or admin messages directed to them). Mark messages as read when the Chat tab is opened.

### 30. Lead-to-Client Conversion Not Linked
When a lead books an appointment or signs up, their lead status stays at whatever it was. No automatic detection or link between `leads` and `profiles`/`appointments`.

**Fix:** When a new appointment is created, check if the client's email matches a lead and auto-update lead status to `converted`.

### 31. No Appointment Cancellation Confirmation Email
ClientPortal has a cancel dialog that updates status to `cancelled` but sends no email notification to admin or confirmation to client.

**Fix:** Call `send-appointment-emails` with email_type `cancellation` after cancelling.

### 32. Fee Calculator Doesn't Pass Estimate to Booking
The "Book Appointment" button links to `/book` without passing calculated fee or service type. Client loses context.

**Fix:** Pass query params: `/book?type=in_person&estimate=${total}&docs=${documentCount}` and pre-fill in BookAppointment.

### 33. Document Builder Doesn't Save to Portal
DocumentBuilder generates documents client-side (print/PDF) but doesn't save them to the client's document storage. Generated documents can't be linked to appointments.

**Fix:** Add a "Save to My Documents" button that uploads the generated document to storage and creates a `documents` record.

### 34. Service Detail Page Doesn't Pre-Select Service in Booking
`ServiceDetail` "Book" button links to `/book` without passing the service name as a query param.

**Fix:** Link to `/book?service=${service.name}` and auto-select in BookAppointment.

### 35. No Max Appointments Per Day Enforcement
`AdminSettings` has `max_appointments_per_day` setting but BookAppointment doesn't check it. Overbooking is possible.

**Fix:** In BookAppointment, count existing appointments for the selected date and block booking if at max.

---

## Implementation Plan (Additions to Existing Phases)

### Phase 1 Additions (Critical)
- Add documents UPDATE RLS policy for clients
- Fix seal image preview (use signed URL instead of public URL)

### Phase 2 Additions (Email & Payment)
- Create `send-correspondence` edge function (needs `RESEND_API_KEY` secret)
- Add "Send Reply" action in AdminEmailManagement
- Add client correspondence view in ClientPortal
- Add "Mark as Paid" with method in AdminAppointments or new payments section

### Phase 3 Additions (Business Portal)
- Implement team member management in BusinessPortal
- Implement billing history in BusinessPortal

### Phase 4 Additions (Data Quality)
- Show client profile in appointment detail dialog
- Show uploader name in AdminDocuments
- Add fee input + note editing for AdminApostille
- Add apostille tracking to ClientPortal

### Phase 5 Additions (Polish)
- Add unread badge to Chat tab + mark-as-read
- Broader audit log coverage
- Auto-convert leads on matching email
- Cancellation email notification
- Fee Calculator → Booking param pass-through
- Document Builder "Save to Portal" button
- Service Detail → pre-select service in booking
- Enforce max appointments per day

### Database Changes
```sql
-- Documents UPDATE policy
CREATE POLICY "Clients can update own documents"
ON documents FOR UPDATE TO authenticated
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

-- Chat messages UPDATE policy for mark-as-read
CREATE POLICY "Users can update read status"
ON chat_messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id OR (is_admin = true))
WITH CHECK (auth.uid() = sender_id OR (is_admin = true));
```

### Edge Functions
- `send-correspondence/index.ts` — sends email via Resend, logs outbound record

### Secrets Needed
- `RESEND_API_KEY` — for outbound email sending
- `FROM_EMAIL` — sender address for outbound emails

### Files to Modify
- `src/pages/ClientPortal.tsx` — correspondence view, apostille tracking, chat unread badge, mark-as-read, cancellation email
- `src/pages/admin/AdminEmailManagement.tsx` — send reply action
- `src/pages/admin/AdminAppointments.tsx` — client profile in detail, mark-as-paid
- `src/pages/admin/AdminDocuments.tsx` — uploader name
- `src/pages/admin/AdminApostille.tsx` — fee input, note editing
- `src/pages/admin/AdminSettings.tsx` — fix seal preview signed URL
- `src/pages/BusinessPortal.tsx` — team management, billing history
- `src/pages/BookAppointment.tsx` — max appointments/day enforcement, accept fee/service params
- `src/pages/DocumentBuilder.tsx` — save to portal button
- `src/pages/FeeCalculator.tsx` — pass params to booking
- `src/pages/ServiceDetail.tsx` — pass service name to booking

