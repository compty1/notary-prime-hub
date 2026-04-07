
# Plan: Feature Completeness (Gaps 156–200) — COMPLETED

## Summary of Changes

### Batch 1: Real-time Appointments (Gap 158) ✅
- Already implemented — ClientPortal.tsx subscribes to appointment updates via Supabase Realtime

### Batch 2: Client Feedback + NPS (Gaps 173, 188) ✅
- Added NPS score (0-10) to `ClientFeedbackForm` with color-coded buttons
- DB migration: added `nps_score` column to `client_feedback` table
- Integrated feedback form inline on completed appointments in `PortalAppointmentsTab`

### Batch 3: Invoice-Payment Connection (Gaps 163, 164) ✅
- Added `appointmentId` prop to `InvoiceGenerator` for appointment linking

### Batch 4: Document Notifications + Follow-ups (Gaps 172, 187) ✅
- Created `send-document-notification` edge function for status change emails
- Created `send-followup-sequence` edge function (3-email post-session sequence)

### Batch 5: Duration Estimates + Waitlist UI (Gaps 166, 170) ✅
- Added estimated session duration display to `BookingScheduleStep`
- Added "Join Waitlist" button when no slots available, writes to `waitlist` table

### Batch 6: Referral Analytics + Welcome Emails (Gaps 181, 195) ✅
- Enhanced `ReferralPortal` with conversion rate, monthly trend, and 4-stat dashboard
- Created `send-welcome-sequence` edge function (3-email onboarding series)

### Batch 7: Bulk Upload + Templates in Portal (Gaps 168, 171) ✅
- Integrated `BulkDocumentUpload` component into `PortalDocumentsTab`
- Added "Templates" link button for client access to document templates

### Batch 8: Geographic Enforcement (Gap 196) ✅
- Already implemented — BookAppointment.tsx validates service area with haversineDistance

---

# Plan: API & Edge Functions Hardening (Gaps 131–155) — COMPLETED

## Summary of Changes

### CORS Fix (Gaps 131-related) ✅
- Fixed broken `@supabase/supabase-js/cors` imports in `send-document-notification`, `send-followup-sequence`, and `send-welcome-sequence`
- Replaced with manual corsHeaders per project convention

### Input Validation (Gaps 148, 151, 155) ✅
- `send-document-notification`: Added Zod schema validation for all inputs
- `send-followup-sequence`: Added Zod UUID validation for appointmentId/clientId
- `send-welcome-sequence`: Added Zod email/UUID validation
- `admin-create-user` (Gap 151): Added Zod schema with disposable email domain blocking
- `process-refund`: Added Zod validation with enum for refund reasons

### Idempotency (Gap 149) ✅
- `process-refund`: Added idempotency_key support — checks audit_log for duplicate refund attempts before processing

### Retry Logic (Gap 134) ✅
- `send-appointment-emails`: Added exponential backoff retry (up to 2 retries) for failed email sends, skipping retries on 4xx client errors

### Access Control (Gap 153) ✅
- `build-analyst`: Restricted to admin-only access using `has_role` RPC check (was previously accessible to any authenticated user or anon key)

### Execution Logging (Gap 147) ✅
- Added timing logs (`Date.now()` start/end) to `send-document-notification`, `send-followup-sequence`, `send-welcome-sequence`, and `process-refund`

### Error Sanitization ✅
- All modified edge functions now return generic "Internal server error" instead of leaking error details to clients

## Already Addressed (no changes needed)
- Gap 132 (Rate limiting): `build-analyst` already has in-memory rate limiter; AI gateway handles rate limiting for AI functions
- Gap 133 (Token limit): `notary-assistant` already validates max 50 messages × 50k chars via Zod
- Gap 138 (Stripe webhook): Already uses proper signature verification
- Gap 140 (scan-id file size): Already has 10MB limit via Zod
- Gap 146 (ai-batch-process concurrency): Already caps at 20 docs, processes sequentially
- Gap 148 (create-payment-intent amount): Already validates positive, max $50k, 2 decimal places
