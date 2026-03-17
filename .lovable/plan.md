

# Extended Gap Analysis — Complete List

After inspecting every file in the project, here are **all identified gaps** organized by category, including the 35 previously found plus additional ones discovered.

---

## CRITICAL (Broken/Non-functional)

1. **Progressive signup loses booking data** — `BookAppointment.tsx:231-241` returns after `signUp()` without creating the appointment. Booking data is lost after email verification.
2. **No `handle_new_user` trigger exists** — The function `handle_new_user()` exists but "There are no triggers in the database." New signups don't create profiles or get the `client` role assigned. All RLS-protected queries fail for new users.
3. **Rebook URL parameter ignored** — `ClientPortal.tsx:247` links to `/book?rebook=${appt.id}` but `BookAppointment.tsx` never reads `useSearchParams`.
4. **Email function uses `inviteUserByEmail`** — `send-appointment-emails:236` sends auth invites instead of notification emails. Fails silently for existing users.
5. **RON session notes never saved** — `BlueNotarySession.tsx` has notes/oath state but no save button and no database call. Oath timestamp (ORC §147.53 compliance data) is lost on navigation.
6. **BlueNotary session has no appointment context** — No appointment ID passed via URL. Cannot show client info, load correct session, or save data back.
7. **No double-booking detection** — `BookAppointment.tsx` fetches time_slots by day_of_week but never checks existing appointments on the selected date. Multiple clients can book the same slot.
8. **No location input for in-person bookings** — Simple text input with no geolocation, address auto-fill, or meeting spot suggestions. No distance/travel fee calculation.
9. **No dynamic pricing calculator** — No pricing breakdown anywhere. Receipt hardcodes "$5.00 per signature."
10. **No `platform_settings` table** — No way to configure pricing, BlueNotary iframe URL, API keys, or notary base address.
11. **No revenue/profit dashboard** — No `AdminRevenue.tsx`. No profit tracking per session. `notary_journal` lacks financial columns.

---

## MAJOR (Missing Features / Significant Gaps)

12. **AdminOverview stats are wrong** — Line 26 limits to 20 records, then calculates `stats.total` from those 20. Should use `count: "exact"` with `head: true`.
13. **Availability page can't edit slot times** — `AdminAvailability.tsx` can add/delete/toggle but cannot edit `start_time` or `end_time`. All new slots default to 09:00-17:00.
14. **AdminDocuments has no actions** — Read-only. No approve/reject buttons, no download, no link to appointment.
15. **No client profile editing** — `ClientPortal.tsx` displays name but no way to edit profile (name, phone, address, zip).
16. **No appointment reschedule** — Client portal has cancel but no reschedule. Users must cancel and rebook.
17. **Admin appointments missing notes editing** — No way to view or edit `notes` or `admin_notes` on appointments.
18. **Quick journal doesn't auto-fill from AI data** — Line 97 hardcodes `service_performed: "acknowledgment"` regardless of actual service type or document analysis results.
19. **No password reset / forgot password** — Login page has no "Forgot password?" link. No reset flow.
20. **No audit log writing anywhere** — `audit_log` table exists with RLS but no code writes to it. Zero actions logged.
21. **`notarization_sessions` table completely unused** — Table has fields for `bluenotary_session_url`, `id_verified`, `kba_completed`, `started_at`, `completed_at` but nothing reads/writes it.
22. **Documents table not linked to booking** — `BookAppointment.tsx` handles doc scan via AI but never uploads the actual document file to storage or creates a `documents` record.
23. **Admin can't edit or delete journal entries** — `AdminJournal.tsx` only creates entries. No edit or delete.
24. **No pagination on any admin list** — Appointments, clients, journal, documents, audit logs all load without pagination.
25. **`canProceed()` doesn't validate in-person location** — Step 3 only checks `date && time`. Location is not required for in-person bookings.

---

## MODERATE (UX, Logic, Data)

26. **Mobile navigation incomplete on Index** — Line 76-78: mobile hamburger only shows "Book Now." No Sign In, Guide, RON Info, or FAQ links.
27. **Time slots show raw format** — Available slots display `slot.start_time` as `HH:MM:SS`. Should be `h:mm A` (e.g., "9:00 AM").
28. **Suggested slots may include past time slots today** — `findNearestSlots` line 116 compares `checkDate < new Date()` at midnight granularity. Today's past slots could appear.
29. **SignUp success doesn't redirect** — After signup, user stays on the signup page. Should redirect to a confirmation page or login.
30. **No email search in Admin Clients** — Searches by name and phone but not email.
31. **Receipt prints entire page** — `window.print()` prints everything, not just the receipt dialog content.
32. **No confirmation state after cancel** — Client portal only shows a brief toast after cancellation.
33. **Admin sidebar "Client View" button has no icon** — Line 73 shows text only; when collapsed, the button is empty.
34. **`useCallback` imported but unused** — `BookAppointment.tsx` line 1 imports `useCallback` but doesn't use it.
35. **Voice recognition appends duplicate transcripts** — `BlueNotarySession.tsx` line 41: `setNotes((prev) => prev + " " + transcript)` includes interim results, causing duplicated words.

---

## ADDITIONAL GAPS (New Findings)

36. **No sign-out redirect** — `AuthContext.tsx:80` calls `signOut()` but never navigates to `/` or `/login`. User stays on the current page (which may show a blank protected route).
37. **Login doesn't redirect admins to `/admin`** — Both admins and clients redirect to `/portal`. Admin should go to `/admin`.
38. **No form validation on BookAppointment** — No email format validation, no password strength indicator, no name length check on progressive signup fields.
39. **AI assistant has no conversation history persistence** — Messages are lost on page navigation or refresh. No localStorage or database persistence.
40. **No loading/disabled state on cancel button** — `ClientPortal.tsx:274` cancel button has no loading indicator during the async operation.
41. **Appointment status type mismatch** — `cancelAppointment` casts `status: "cancelled" as any` (line 57), indicating TypeScript type doesn't match the enum values.
42. **No date formatting on appointment displays** — Dates show raw `YYYY-MM-DD` format throughout (e.g., "2026-03-20" instead of "March 20, 2026").
43. **No admin notes display in client-facing views** — Appointments show `notes` but admin_notes are invisible to admin in the appointment list cards.
44. **Time zone handling absent** — `new Date(\`${appt.scheduled_date}T${appt.scheduled_time}\`)` creates dates in local time zone. No explicit timezone handling for Ohio (ET).
45. **No appointment detail/expand view in admin** — Appointments only show service type, client name, date. No way to see notes, location, or linked documents without a separate dialog.
46. **`selectedAppointment` default "none" causes insert error** — `AdminJournal.tsx:148` has `<SelectItem value="none">None</SelectItem>` but line 87 passes `selectedAppointment || null`. If user selects "none", it passes string "none" as appointment_id UUID, which will fail FK validation.
47. **No file size or type validation on ID/doc uploads** — `handleIdScan` and `handleDocScan` accept any file without checking size (could crash on 50MB files).
48. **Document scan accepts `image/*,.pdf` but sends as base64 image** — PDF files sent as `data:image/jpeg;base64` to the AI gateway will be misinterpreted.
49. **Edge functions use inconsistent `serve` imports** — `scan-id` and `detect-document` use `serve` from `std@0.168.0`, while `send-appointment-emails` uses `Deno.serve`. Should be consistent.
50. **No error boundary in the app** — No React error boundary wrapping routes. A crash in any component kills the entire app.
51. **No SEO meta tags** — `index.html` likely has minimal meta. NotaryGuide and RonInfo are content-heavy pages that need proper meta descriptions for search.
52. **No sitemap or structured data** — No `sitemap.xml`, no JSON-LD structured data for local business (Google My Business integration opportunity).
53. **Footer phone number is placeholder** — Index.tsx line 156: `(614) 555-1234` is a fake number. Should be configurable or real.
54. **Footer email is placeholder** — Footer likely has `shane@shanegoble.com` which may not be real. Should come from settings.
55. **No CORS restriction on edge functions** — All edge functions use `"Access-Control-Allow-Origin": "*"`. Should restrict to the app domain in production.
56. **AI assistant doesn't render markdown** — `AdminAIAssistant.tsx:167` uses `whitespace-pre-wrap` but the AI returns markdown (headers, bold, lists). Should render as formatted HTML.
57. **No rate limiting on client-side AI calls** — Users can spam ID scan, doc scan, or AI assistant with no debounce or throttle.
58. **Booking flow doesn't save document file to storage** — The `documents` storage bucket exists but nothing uploads to it. Documents scanned during booking are analyzed but not stored.
59. **No terms of service or privacy policy** — A business handling personal ID data and legal documents needs these. No links anywhere.
60. **No cookie consent banner** — If analytics are added later, GDPR/CCPA compliance requires consent.
61. **No admin bulk actions** — Cannot select multiple appointments to update status, export, or delete at once.
62. **Admin clients dialog doesn't show email** — `AdminClients.tsx:124-180` shows contact info but email comes from auth (not profiles), so it's never displayed.
63. **No appointment confirmation page** — After booking, user is redirected to `/portal` with a toast. No dedicated confirmation page with appointment details, calendar invite download, etc.
64. **No calendar invite (.ics) download** — After booking, clients should be able to add the appointment to their calendar.
65. **No admin notification for new bookings** — When a client books, Shane gets no notification (no email, no in-app alert, no push notification).
66. **RON session join link doesn't pass appointment ID** — `ClientPortal.tsx:167,197` links to `/ron-session` without any query params. Session page can't load specific appointment data.
67. **No loading state on admin status change** — `AdminAppointments.tsx:71-84` `updateStatus` has no loading indicator; user can click multiple times.
68. **Notary Guide and RON Info pages have no back navigation on mobile** — No mobile-friendly back button or breadcrumb.
69. **No real-time updates on admin pages** — Appointments, documents, and clients don't use Supabase realtime. Admin must refresh to see new bookings.
70. **`time_slots` viewable only by authenticated users** — RLS policy line: `Roles: {authenticated}`. Unauthenticated users browsing `/book` cannot see available slots until they sign up (blocks progressive signup flow).
71. **No accessibility attributes** — Interactive elements lack `aria-label`, `role`, and focus management. Buttons like the notarization type selector are `<button>` without proper radio group semantics.
72. **Testimonials are hardcoded** — Index.tsx has 3 static testimonials. No way to manage them from admin or pull from a database.
73. **FAQ is hardcoded** — No admin management of FAQ entries.
74. **Service type "Other" has no description field** — If client selects "Other" for service type, there's no prompt to describe what they need.
75. **No appointment limits per day** — No maximum booking cap. If Shane can only handle 8 appointments/day, nothing prevents a 9th booking.
76. **No booking lead time** — Clients can book an appointment 5 minutes from now. Should have a minimum lead time (e.g., 2 hours).
77. **Batch notarization count not validated server-side** — Client sends `documentCount` in notes as text. No DB column or server validation.
78. **No admin dashboard quick actions** — Overview page is read-only stats + table. No quick links to "create journal entry", "view today's appointments", etc.
79. **Journal entry doesn't link back to client profile** — `notary_journal.signer_name` is free text, not linked to `profiles`. Can't navigate from journal to client.
80. **No dark mode toggle** — App has dark mode CSS vars but no user-facing toggle.
81. **`signOut` doesn't clear query client cache** — After sign out, stale data from the previous session may persist in React Query cache.
82. **Booking doesn't check if date is in the past** — `min` attribute on date input is client-side only. No server-side validation.
83. **No webhook for appointment status changes** — No automated side effects when status changes (e.g., email on confirmation, email on completion).
84. **Admin dashboard has no breadcrumbs** — Nested admin pages don't show current location in the nav hierarchy.
85. **No export functionality for journal entries** — No CSV, PDF, or print for ORC §147.551 compliance reporting.
86. **No commission expiration tracking** — No field or alert for Shane's notary commission expiration date.
87. **cron job for emails may not work** — Migration uses `pg_cron` and `pg_net` which may not be enabled on the database. No error handling if these extensions are missing.
88. **`appointment_emails` FK to `appointments` causes cascade issues** — If an appointment is deleted, related `appointment_emails` records cascade behavior is undefined.
89. **No HTTPS enforcement note** — RON sessions require secure connections per ORC §147.65. No verification that the session is running over HTTPS.
90. **Storage bucket `documents` has no RLS policies visible** — Bucket exists but no storage policies shown. Uploads may fail or be publicly accessible.
91. **No phone number input formatting** — Profile phone field accepts any text. No masking or validation for US phone format.
92. **AI Assistant doesn't scope to admin** — The edge function uses anon key auth but has no check that the caller is an admin. Any authenticated user could call it directly.
93. **No session timeout/auto-logout** — No idle timeout for admin sessions handling sensitive legal documents.
94. **Index page service type toggle has no effect on booking** — Clicking In-Person vs RON on the landing page changes description text but doesn't pass the selection to `/book`.

---

## Implementation Plan (5 Phases)

### Phase 1: Critical Database & Auth Fixes
- Migration: Create `handle_new_user` trigger, `platform_settings` table with seed data, add columns to `appointments` (`client_address`, `travel_distance_miles`, `estimated_price`) and `notary_journal` (`platform_fees`, `travel_fee`, `net_profit`). Make `time_slots` readable by anonymous users.
- Fix progressive signup (store booking in localStorage, create after verify)
- Fix rebook param reading
- Fix double-booking detection
- Fix `selectedAppointment` "none" value in journal

### Phase 2: Location, Pricing, Platform Settings
- Create `AdminSettings.tsx` for pricing and platform config
- Create `calculate-distance` edge function
- Smart location input with geolocation and address auto-fill in BookAppointment
- Dynamic pricing calculator with itemized breakdown
- Update BlueNotarySession to load iframe URL from settings and accept appointment ID param
- Save RON session notes and oath data to database
- Wire up `notarization_sessions` table

### Phase 3: Admin Features & Revenue
- Create `AdminRevenue.tsx` with profit dashboard
- Fix AdminOverview stats (use `count: "exact"`)
- Add notes editing to AdminAppointments
- Add approve/reject/download to AdminDocuments
- Add inline time editing to AdminAvailability
- Add edit/delete to AdminJournal
- Add journal export (CSV/PDF)
- Write audit log entries on key actions
- Add pagination to all admin lists
- Add admin notification for new bookings (realtime)
- Render markdown in AI assistant responses
- Add bulk actions for appointments

### Phase 4: Client Experience & Auth
- Add profile editing to ClientPortal
- Add reschedule dialog to ClientPortal
- Add password reset flow (forgot password)
- Fix mobile navigation on Index
- Format time slots to readable format (h:mm A)
- Format dates throughout app (human-readable)
- Fix SignUp redirect after success
- Fix signOut to redirect + clear cache
- Add appointment confirmation page with .ics download
- Pass appointment ID to RON session link
- Pass service type from Index to BookAppointment
- Add booking lead time minimum
- Add daily appointment cap
- Add file size/type validation on uploads
- Fix PDF handling in document scan
- Fix voice recognition duplicate transcripts

### Phase 5: Polish, Security & Compliance
- Add React error boundary
- Add SEO meta tags and structured data
- Add terms of service / privacy policy pages
- Fix print receipt CSS (print-specific stylesheet)
- Add loading states to all async buttons
- Add accessibility attributes (aria-label, roles)
- Fix placeholder phone/email in footer (use settings)
- Restrict CORS on edge functions
- Add admin-only check on AI assistant edge function
- Add commission expiration tracking
- Add dark mode toggle
- Persist AI assistant conversation history
- Add rate limiting/debounce on AI calls
- Validate cron job extensions exist

### Files to Create
- `src/pages/admin/AdminSettings.tsx`
- `src/pages/admin/AdminRevenue.tsx`
- `src/pages/AppointmentConfirmation.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/components/ErrorBoundary.tsx`
- `supabase/functions/calculate-distance/index.ts`
- 1 migration file

### Files to Edit
- `src/pages/BookAppointment.tsx`
- `src/pages/BlueNotarySession.tsx`
- `src/pages/ClientPortal.tsx`
- `src/pages/Index.tsx`
- `src/pages/Login.tsx`
- `src/pages/SignUp.tsx`
- `src/pages/NotaryGuide.tsx`
- `src/pages/RonInfo.tsx`
- `src/pages/admin/AdminAppointments.tsx`
- `src/pages/admin/AdminOverview.tsx`
- `src/pages/admin/AdminAvailability.tsx`
- `src/pages/admin/AdminDocuments.tsx`
- `src/pages/admin/AdminJournal.tsx`
- `src/pages/admin/AdminAIAssistant.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminClients.tsx`
- `src/pages/admin/AdminAuditLog.tsx`
- `src/contexts/AuthContext.tsx`
- `src/App.tsx`
- `index.html`

