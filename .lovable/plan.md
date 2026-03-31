

# Plan: Zoom Booking Fix, IONOS Email Reconnect, Integration Tests, Document Upload, and Admin Notary Management

This is a large multi-part request. Here is the breakdown:

---

## 1. Fix "Schedule Zoom" routing for consultations

**Problem:** Clicking "Schedule Zoom" links to `/book?service=Consultation`, which loads the full notary booking intake (notarization type selector, location, etc.). Consultations are Zoom calls — they should skip notarization type selection and location fields, and instead show a simplified scheduling flow (pick date/time, add notes, confirm).

**Changes:**
- **`src/pages/BookAppointment.tsx`** — Detect when `serviceType` is "Consultation" (or category is "consulting"). Auto-set `notarizationType` to a neutral value, skip the notarization type selector (Step 1), hide location/address fields, and streamline to: Service confirmed → Schedule date/time → Review & confirm. Show a note that "This consultation will take place via Zoom."
- **`src/pages/booking/bookingConstants.ts`** — Add "Consultation" to `DIGITAL_ONLY_SERVICES` set so `isDigitalOnly()` returns true, which prevents location fields from appearing.

---

## 2. IONOS Email credential update and mailbox functionality

**Credential update:** The IONOS secrets (IONOS_EMAIL_ADDRESS, IONOS_EMAIL_PASSWORD, IONOS_IMAP_HOST, IONOS_SMTP_HOST) need refreshing.

**What I need from you to update credentials:**
- **IONOS_EMAIL_PASSWORD** — The current password for shane@notardex.com. You can find this in your IONOS email account settings or the IONOS control panel (login.ionos.com → Email → Email Accounts).
- **IONOS_IMAP_HOST** — Typically `imap.ionos.com` (already set, confirm if changed).
- **IONOS_SMTP_HOST** — Typically `smtp.ionos.com` (already set, confirm if changed).
- **IONOS_EMAIL_ADDRESS** — Should be `shane@notardex.com` (already set, confirm if changed).

I will use the `add_secret` tool to prompt you for the updated password once you confirm.

**Mailbox functionality:** The current `ionos-email-sync` edge function is a stub — it has commented-out IMAP code and only does email-to-client matching. The admin mailbox UI (`AdminMailbox.tsx`) needs a working IMAP/SMTP backend.

**Changes:**
- **`supabase/functions/ionos-email/index.ts`** — Enhance to support send, reply, and folder listing via IONOS SMTP (using fetch to IONOS SMTP API or Deno-compatible SMTP library). For reading/syncing, implement polling via the existing email_cache table pattern.
- **`supabase/functions/ionos-email-sync/index.ts`** — Enhance sync to actually connect to IONOS IMAP and fetch new messages into `email_cache`. Use `npm:imapflow` (available in Deno edge functions via npm: specifier).
- Deploy both edge functions after updates.

---

## 3. Fix integration testing page accuracy

**Problem:** The integration test page may show stale or inaccurate results.

**Changes:**
- **`src/pages/admin/AdminIntegrationTest.tsx`** — Review and fix each test function:
  - **Database test** — Verify it actually queries a table and reports success/failure accurately.
  - **Storage test** — Test bucket access with a real list/upload operation.
  - **Email test** — Test the send-correspondence or ionos-email edge function with a real invocation.
  - **SignNow test** — Ensure error handling reports actual connection status.
  - **Stripe test** — Verify the get-stripe-config function responds correctly.
  - Add response time tracking and clearer pass/fail messaging.

---

## 4. Admin document upload with thumbnail previews

**Problem:** Admin cannot upload documents directly; only clients can. No thumbnail previews shown in the document list.

**Changes:**
- **`src/pages/admin/AdminDocuments.tsx`**:
  - Add an "Upload Document" button + dialog at the top. Allow admin to select a file, optionally link to a client (dropdown of profiles), and upload to `documents` storage bucket.
  - Insert a record in the `documents` table with `uploaded_by` set to the admin user or selected client.
  - Add thumbnail previews: For image files (jpg/png/gif/webp), show a small thumbnail (signed URL) in the document list instead of just the FileText icon. For PDFs, show a PDF icon badge.

---

## 5. Full admin notary management (add, edit, profile, availability, permissions)

**Problem:** Currently, notaries can only be added via email invite (they must sign up themselves). Admin wants to manually create notary accounts with full profile data.

**Changes:**
- **`src/pages/admin/AdminTeam.tsx`** — Major expansion:
  - **"Add Notary Manually" dialog**: Create a new user account via admin (using `supabase.auth.admin` is not available client-side, so we create an edge function). Collects: full name, email, phone, address, city/state/zip, commission number, commission expiration, E&O insurance info, bond details, profile image upload.
  - **Enhanced profile editing**: Add commission number, commission expiration, E&O policy number, E&O expiration, bond company, bond amount, digital seal upload fields to the edit dialog.
  - **Availability management**: Per-notary availability settings (link to `time_slots` table filtered by notary_id, or add notary_id to time_slots).
  - **Permissions panel**: Toggle which admin sections the notary can access.
  - **Contact button**: Quick-send email to notary via the correspondence system.
  - **Profile image**: Already supported via avatar upload — ensure it works.

- **New edge function `supabase/functions/admin-create-user/index.ts`**: Uses service role key to create a user in auth, insert profile, and assign the notary role. Validates admin caller.

- **Database migration**: Add notary-specific fields to `profiles` table (or create a `notary_profiles` table):
  - `commission_number` (text)
  - `commission_expiration` (date)
  - `eo_policy_number` (text)
  - `eo_expiration` (date)
  - `bond_company` (text)
  - `bond_amount` (numeric)
  - `seal_file_path` (text)

---

## 6. Admin user is also a notary — self-management

**Problem:** The admin (ShaneGoble@gmail.com) already has the admin role. They also need the notary role and their own notary profile management without creating a separate account.

**Changes:**
- **Database**: Assign the `notary` role to the admin user (INSERT into `user_roles` for existing admin user_id with role='notary').
- **`src/pages/admin/AdminTeam.tsx`**: Ensure the admin's own profile appears in the "Active Notaries" list (it will automatically once they have the notary role). The admin can click their own card to edit their notary profile, commission details, certifications, etc.

---

## Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/admin-create-user/index.ts` | Edge function to create users with service role |

## Files to Modify
| File | Changes |
|------|---------|
| `src/pages/BookAppointment.tsx` | Skip notarization type for consultations, show Zoom note |
| `src/pages/booking/bookingConstants.ts` | Add "Consultation" to DIGITAL_ONLY_SERVICES |
| `supabase/functions/ionos-email-sync/index.ts` | Implement real IMAP sync |
| `supabase/functions/ionos-email/index.ts` | Enhance SMTP send functionality |
| `src/pages/admin/AdminIntegrationTest.tsx` | Fix test accuracy |
| `src/pages/admin/AdminDocuments.tsx` | Add upload button + thumbnail previews |
| `src/pages/admin/AdminTeam.tsx` | Add manual notary creation, enhanced profile fields, availability, permissions, contact |

## Database Migrations
| Migration | Purpose |
|-----------|---------|
| Add notary-specific columns to profiles | commission_number, commission_expiration, eo_policy_number, eo_expiration, bond_company, bond_amount, seal_file_path |
| Add notary role for admin user | INSERT user_roles for admin with role='notary' |

