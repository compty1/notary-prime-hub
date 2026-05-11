## Goal
Three deliverables, then a publish-readiness pass:

1. **Booking lifecycle emails + admin notifications + audit entries** for booking, reschedule, and cancellation.
2. **End-to-end test flow** for the BlueNotary RON iframe that records each milestone (KBA, consent, completion).
3. **Admin verification page** that validates the RON Session hash-chain steps with pass/fail per session.
4. **Publish-readiness check** so the app is safe to ship to clients.

---

## 1. Booking lifecycle: emails, admin notifications, audit entries

Today `useAppointmentActions` already updates status, writes to `audit_log`, and best-effort calls `send-appointment-emails`. The gaps are:
- Initial **booking creation** path (`check_and_reserve_slot` / direct insert) does not always emit a `appointment_booked` email or admin notification.
- Reschedule and cancellation emails fire, but there is no dedicated **admin-side notification** entry (`useAdminNotifications` only listens to a fixed action list, missing `appointment_booked` / `appointment_rescheduled`).
- Audit entries for reschedule lack a structured `from → to` payload (old date/time vs new).

### Changes
- **Edge function `send-appointment-emails`**: add `email_type` cases `status_scheduled` (booking confirmation to client + admin) and `status_rescheduled` (client + admin) if missing; ensure it always BCCs the configured admin email from `platform_settings.admin_email`.
- **`src/lib/bookingLifecycle.ts`** (new helper, or extend existing): single `recordAppointmentEvent({ type, appointmentId, before, after, reason })` that:
  - Writes one row to `audit_log` with `entity_type='appointment'`, structured details `{ before, after, reason, actor }`.
  - Invokes `send-appointment-emails` with the right type.
  - Inserts a row into `audit_log` with `action='appointment_booked' | 'appointment_rescheduled' | 'appointment_cancelled'` so `useAdminNotifications` picks it up.
- **`useAppointmentActions`**: route `cancel`, `reschedule`, `confirm`, `complete`, `no_show` through the helper. Capture `before` (old `scheduled_date/time/status`) before update, then compute diff.
- **Booking creation paths** (`BookingScheduleStep`, `check_and_reserve_slot` callers, `RescheduleAppointment` page): call the helper with `type='booked'` or `type='rescheduled'` after success.
- **`useAdminNotifications`**: extend the action whitelist to include `appointment_booked`, `appointment_rescheduled`, plus formatters for both.
- **`AdminAppointments` detail dialog**: surface the per-appointment timeline using the existing `RequestActivityHistory` component, scoped to `entity_type='appointment'`.

---

## 2. End-to-end BlueNotary iframe test flow

Goal: an admin-runnable smoke test that walks through a real RON session shell against BlueNotary, recording each milestone and confirming KBA + consent + completion update correctly.

### New page: `/admin/ron-test` (`AdminRonTestFlow.tsx`)
- Wizard stepper (status badges for each step):
  1. **Provision test session** — create a `notarization_sessions` row with a synthetic signer + test appointment.
  2. **Load BlueNotary iframe** — pull `bluenotary_iframe_url` from `platform_settings`, render in sandboxed `<iframe>`, log `iframe_loaded` milestone.
  3. **Consent recorded** — admin clicks "Confirm consent shown"; writes `consent_recorded`, appends hash chain step via `appendHashChainByAppointment`.
  4. **KBA attempt + pass/fail** — admin can mark pass or fail; updates `kba_attempts`, `kba_status`, appends hash chain.
  5. **Document signed + seal applied** — appends `document_signed`, `notary_seal_applied`.
  6. **Session completed** — appends `session_completed`, sets session `status='completed'`.
- Right-side **milestone log**: live timeline of every step with timestamp and resulting hash, pulled from `ron_session_hash_chain` filtered by the test session id.
- **Final assertion panel**: green pass / red fail for:
  - Consent flag set on session row.
  - KBA status recorded and `kba_attempts <= 2`.
  - Session marked completed.
  - Hash chain `verifyHashChain()` returns `valid: true`.
- All actions write to `audit_log` with `action='ron_test_*'` for traceability.

### Supporting edge function (only if needed)
- `ron-test-postmessage` — small helper that receives the BlueNotary iframe `postMessage` events (when the platform exposes them) and forwards them as milestones; otherwise the manual stepper above is the source of truth (BlueNotary does not expose a public test webhook today).

---

## 3. Admin hash-chain verification page

### New page: `/admin/ron-verification` (`AdminRonHashVerification.tsx`)
- **Top bar**: aggregate counts (Total sessions, Verified, Broken, Empty chains).
- **Table** of recent `notarization_sessions` (filter by date range, status, signer, session id):
  - Columns: Session ID, Appointment, Started, Steps recorded, Last step, **Pass / Fail badge**.
  - "Verify" button per row → calls `verifyHashChain(sessionId)` and updates the badge in place.
- **Detail drawer** per session:
  - Ordered list of every `ron_session_hash_chain` entry with sequence #, step name, recorded `previous_hash`, `step_hash`, timestamp.
  - Highlights the first broken link (mismatch between `previous_hash` and the prior `step_hash`) in destructive color.
  - Pass / fail report card with: total steps, broken-at sequence (or `—`), recomputed-vs-stored chain root, and a **"Download report (CSV/JSON)"** button for compliance evidence.
- **Bulk verify** action runs `verifyHashChain` over the visible page and writes a single audit entry `action='ron_hash_chain_bulk_verified'` with the summary counts.
- Admin-only route; protected via existing `ProtectedRoute` + `has_role(auth.uid(), 'admin')` RLS check on `ron_session_hash_chain`.

Wire the new pages into `src/App.tsx` routes and into the admin sidebar (`useAdminMenuOrder` defaults / Admin nav).

---

## 4. Publish-readiness pass

Run before saying "ready for clients":

- **Database**: `supabase--linter` and resolve any remaining errors (warnings already documented as accepted).
- **RLS spot-check** for all tables touched by these changes (`audit_log`, `appointments`, `ron_session_hash_chain`, `notarization_sessions`).
- **Edge functions**: confirm CORS + JWT validation present on every function used by the new flows; redeploy any modified functions.
- **Auth emails**: confirm `auth-email-hook` is using the queue (re-scaffold if not).
- **Routes**: 404, robots.txt, sitemap include the new admin routes as `disallow` (they're private).
- **Smoke test** in the preview: book → reschedule → cancel an appointment, confirm 3 audit rows, 3 client emails, 3 admin notifications. Run the RON test wizard end to end. Open the verification page and verify a session.
- **Legal & branding**: confirm the visible disclaimers (Ohio ORC §147.63 / §147.66) still render on the RON pages, and that `notardex.com` branding is consistent.
- **Final**: surface the publish action so the user can ship.

---

## Files (new)
- `src/lib/bookingLifecycle.ts` (helper) — or extend the existing one
- `src/pages/admin/AdminRonTestFlow.tsx`
- `src/pages/admin/AdminRonHashVerification.tsx`
- `src/components/admin/HashChainTimeline.tsx`

## Files (edited)
- `src/hooks/useAppointmentActions.ts`
- `src/hooks/useAdminNotifications.ts`
- `src/pages/admin/AdminAppointments.tsx` (timeline mount)
- `src/pages/booking/BookingScheduleStep.tsx` (post-booking event)
- `src/pages/RescheduleAppointment.tsx`
- `src/App.tsx` + admin sidebar config
- `supabase/functions/send-appointment-emails/index.ts` (booked/rescheduled cases + admin BCC)

## Out of scope
- Building a new RON video provider integration. We only test the existing BlueNotary embed.
- Rewriting `RonSession.tsx`. We just append additional hash chain steps where missing.
