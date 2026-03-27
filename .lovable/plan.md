

# 200 Additional Gaps & Fixes — Round 2

Building on the previous 200 gaps already addressed/planned. These are net-new issues found across the codebase.

---

## Routing & Navigation (1-20)

1. No `<Route>` for `/builder` uses `PageShell` — `DocumentBuilder` may render without Navbar/Footer
2. `/request` route is not protected — unauthenticated users can access `ServiceRequest` but submission requires `user.id`, causing silent failure
3. `/subscribe` route is not protected — `SubscriptionPlans` Stripe checkout will fail without auth
4. `/mobile-upload` has its own login form instead of redirecting to `/login` with a return URL
5. No route for `/business` referenced in `ServiceDetail` categoryResources — leads to 404
6. `ServiceDetail` references `/document-builder` URL but route is `/builder`
7. `AnimatedRoutes` re-renders all routes on every pathname change due to `key={location.pathname}` on Routes — causes unnecessary unmount/remount of persisted layouts
8. No wildcard catch inside `/admin/*` — unknown admin sub-routes fall through to top-level `*` (NotFound) without admin layout
9. `AppointmentConfirmation` has no `PageShell` — renders custom nav instead of shared Navbar
10. `OneNotarySession` has no `PageShell` — renders custom nav
11. `MobileUpload` has its own custom nav — inconsistent with `PageShell`
12. `ClientPortal` has its own custom nav — inconsistent with `PageShell`
13. `BusinessPortal` likely has custom nav (pattern matches ClientPortal)
14. No redirect from `/portal` to `/admin` if user has admin/notary role — they must manually navigate
15. `BookAppointment` doesn't redirect authenticated admin/notary away from booking for themselves
16. Tab query parameter `?tab=documents` referenced in `AppointmentConfirmation` link but `ClientPortal` doesn't read URL params to set initial tab
17. No loading fallback text on `PageLoader` — just an animated bar with no context
18. `ScrollToTop` scrolls on every route change even when user clicks back button — loses scroll position
19. `ErrorBoundary` wraps admin routes but not portal tabs — a crash in one portal tab takes down the whole portal
20. No `<meta name="description">` set per route — all pages share the same default

## Data Fetching & State Management (21-45)

21. `ClientPortal` fires 10 parallel queries on mount without React Query — no caching, no stale-while-revalidate, no automatic retry
22. `AdminOverview` auto-refreshes every 60 seconds with full re-fetch — no delta/incremental approach
23. `AdminNotificationCenter` polls every 30 seconds — duplicates the `AdminOverview` 60-second polling
24. `BookAppointment` fetches `platform_settings` on every mount — no caching across page navigations
25. `AdminAppointments` re-fetches all data when any filter changes — no local filtering of already-fetched data
26. `AdminChat` fetches ALL chat messages with no pagination — will degrade with volume
27. `AdminJournal` fetches ALL journal entries with no pagination — same concern
28. `AdminOverview` fetches ALL appointments for charts (`allApptData`) — no limit, could be thousands
29. `ClientPortal` fetches ALL appointments, documents, payments — no pagination
30. `AdminClients` likely fetches all profiles — no pagination
31. `AdminAuditLog` likely has no pagination
32. `platform_settings` is fetched independently in `BookAppointment`, `AdminSettings`, `AdminOverview`, `ClientPortal`, `AppointmentConfirmation` — 5+ separate fetches of the same table
33. `AdminAppointments.fetchData` is called inside `useEffect` dependency array that includes `filter` — but `fetchData` is not memoized with `useCallback`
34. `AdminOverview` revenue only comes from `notary_journal.fees_charged` — ignores `payments` table entirely
35. `AdminAppointments` realtime channel re-subscribes when `filter` changes — previous channel may not be cleaned up
36. `ClientPortal` realtime channels don't clean up properly on user change (dependency is `[user]` but channels reference `user.id` closure)
37. `AdminTeam` avatar signed URLs expire after 1 hour — no refresh mechanism
38. `AdminSettings` seal preview URL expires after 1 hour — no refresh mechanism
39. `BookAppointment` has 100+ lines of state declarations (40+ `useState` calls) — needs refactoring into a reducer or form library
40. `AdminAppointments` stores `profiles` as full array and searches with `.find()` on every render — O(n) per row
41. No global loading state indicator in admin layout — individual pages show their own skeletons
42. `BookAppointment` `useEffect` dependencies include `pricingSettings` for slot fetch — refetches slots when pricing changes (unrelated)
43. `submitBooking` in `BookAppointment` called from `setTimeout` after signup — may execute with stale state
44. `fetchData` in `AdminAppointments` defined as regular function inside component — recreated every render
45. No error recovery UI on failed data fetches in admin pages — errors logged to console only

## Form Validation & Input (46-70)

46. `AdminAppointments` create dialog — no date validation (allows past dates)
47. `AdminAppointments` create dialog — no time format validation
48. `AdminJournal` — no validation that `id_expiration` date is in the future for new entries
49. `AdminJournal` — fee fields accept negative numbers
50. `ClientPortal` apostille form — `document_count` accepts negative and zero via HTML input
51. `ClientPortal` review form — no minimum comment length when comment is provided
52. `ClientPortal` reminder form — no validation that `expiry_date` is in the future
53. `ServiceRequest` — no file upload capability for supporting documents
54. `BookAppointment` — `witnessCount` is a string, never converted to number for validation
55. `BookAppointment` — `translationPageCount` is a string, no min/max validation
56. `AdminTeam` invite email — no format validation before submission
57. `AdminAvailability` — `updateSlotTime` allows setting end_time before start_time
58. `AdminRevenue` payment amount field — no minimum value validation
59. `ContactForm` on Index page — `phone` field has no format validation
60. `JoinPlatform` application form — phone/email fields have no client-side validation
61. `LoanSigningServices` lead form — no email format validation
62. `AdminSettings` — pricing fields (base_fee, travel_fee) accept negative values
63. `AdminSettings` — commission expiration date can be set to a past date
64. `AdminBusinessClients` — no EIN format validation (should be XX-XXXXXXX)
65. `BookAppointment` — `customDocCount` allows toggling to a text input but no numeric enforcement on the text field
66. `AdminJournal` — certificate photo upload doesn't link uploaded URLs back to the journal entry `certificate_photos` field
67. `BookAppointment` ID scan — `file.size > 10MB` check but no file type validation (could scan a .zip)
68. `BookAppointment` document scan — no file type validation (accepts any file)
69. `AdminAppointments` — `estimated_price` field in create dialog accepts empty string, stored as NaN
70. `AdminChat` — message input has no character limit

## Security & Access Control (71-90)

71. `ServiceRequest` page accessible without auth but submits `client_id: user.id` — will crash if `user` is null
72. `MobileUpload` shows a login form with credentials sent directly to Supabase — no brute force protection
73. `explainDocument` sends full document text to edge function — no size limit, could send huge files
74. `AdminAppointments` status change sends raw fetch to edge function with inline auth — not using standardized helper
75. `AdminAppointments` create appointment sends raw fetch with inline auth — same issue
76. `BookAppointment` ID scan and doc scan use raw fetch with inline auth — not using standardized helper
77. `ClientPortal` chat allows sending messages to any staff user — no validation that recipient is actually a staff member
78. No CSRF protection on any form submissions
79. `AdminClients` can create profiles with `crypto.randomUUID()` as `user_id` — orphaned records with no auth user
80. `OneNotarySession` — `completeAndFinalize` creates e-seal verification without checking if one already exists for this appointment
81. `OneNotarySession` — journal entry creation doesn't prevent duplicates if finalize is clicked twice
82. `AdminAppointments` — quick journal entry doesn't prevent duplicates if dialog submitted twice
83. `AdminChat` — admin can see all messages from all clients, including messages sent to other admins
84. Document download in portal — no audit log entry when client downloads a document
85. `AdminTeam` — delete invite doesn't require confirmation
86. `BookAppointment` — `localStorage` stores booking data including address in plain text
87. No content-type validation on storage uploads — only file extension checked
88. `AdminSettings` — seal image upload has no file type restriction (could upload non-image)
89. `AdminJournal` — certificate photos uploaded to `documents` bucket under `certificates/` path but no separate RLS for this prefix
90. No rate limiting on chat message sending — client can spam messages

## UI/UX Issues (91-130)

91. `AdminOverview` — E&O and Bond alert banners use hardcoded `bg-amber-50 text-amber-800` — not dark-mode aware
92. `AdminOverview` — commission alert dynamically generates class but E&O/Bond alerts don't use same pattern
93. `AppointmentConfirmation` — no booking reference number displayed (just "Appointment Confirmed!")
94. `AppointmentConfirmation` — no confirmation email status indicator
95. `AppointmentConfirmation` — notary profile fetches first admin/notary found — may not be the assigned notary
96. `ClientPortal` — "Edit Profile" dialog has no cancel button
97. `ClientPortal` — `showPaymentForm` doesn't reset when switching tabs
98. `ClientPortal` — correspondence tab has no "Compose" button — clients can only view, not send
99. `ClientPortal` — service requests tab has no cancel button for pending requests
100. `ClientPortal` — reminders tab reminder form doesn't validate document_id exists
101. `AdminAppointments` — receipt dialog prints entire page content (verified: still uses `window.print()`)
102. `AdminAppointments` — no appointment detail view accessible from the list (requires clicking multiple actions)
103. `AdminAvailability` — specific date override exists in DB schema (`specific_date` field) but UI doesn't expose it
104. `AdminAvailability` — no visual calendar showing which days have slots
105. `AdminChat` — no search/filter for conversations
106. `AdminChat` — no message timestamp formatting (raw `created_at` display)
107. `AdminChat` — no file attachment support (field exists in schema: `attachment_url`)
108. `AdminJournal` — certificate photos uploaded but URLs never saved back to the `certificate_photos` JSON field
109. `AdminJournal` — no PDF export option (only CSV)
110. `AdminJournal` — search only filters by signer_name and document_type — not by date, service type, or notes
111. `AdminServices` — no drag-and-drop reordering (display_order exists but no UI to change it)
112. `AdminRevenue` — no chart or visualization of revenue data
113. `AdminRevenue` — no date range filter for payment history
114. `AdminApostille` — no inline status timeline (like portal has)
115. `AdminTemplates` — upload exists but download/preview for stored templates not verified
116. `AdminLeadPortal` — CSV import has no column mapping UI
117. `AdminLeadPortal` — no lead detail view
118. `AdminBusinessClients` — no member management UI (table exists)
119. `AdminDashboard` — no user avatar/profile dropdown in header
120. `AdminDashboard` — no breadcrumb showing current page
121. `OneNotarySession` — no session timer showing elapsed time
122. `OneNotarySession` — no browser compatibility check before starting
123. `OneNotarySession` — no recording consent UI
124. `OneNotarySession` — client view only shows participant link but no session progress
125. `FeeCalculator` — no "Book Now" CTA linking to booking with pre-filled estimate
126. `DocumentDigitize` — no progress indicator during OCR processing
127. `VirtualMailroom` — no pagination for mail items
128. `SubscriptionPlans` — no comparison table between plan tiers
129. `RonEligibilityChecker` — result not linkable/shareable (no URL state)
130. Index page — no service icon dynamic resolution; all fallback to `FileText`

## Edge Function & API Issues (131-155)

131. `AdminAppointments` line 208-218 — status change email still uses raw `fetch()` instead of `supabase.functions.invoke()`
132. `AdminAppointments` line 364-373 — admin-created appointment email uses raw `fetch()` instead of invoke
133. `BookAppointment` line 270-271 — ID scan uses raw `fetch()` to `scan-id`
134. `BookAppointment` line 293-294 — doc scan uses raw `fetch()` to `detect-document`
135. `ClientPortal` line 230-231 — `explain-document` call uses raw `fetch()`
136. `send-appointment-emails` called with `appointment_id` in some places and `appointmentId` in others — inconsistent payload
137. `send-correspondence` called with `to_address` in some places and `to` in others
138. No timeout/AbortController on any raw `fetch()` calls to edge functions
139. `AdminAppointments` review request email calls both `client_correspondence.insert` AND `send-correspondence` — double email risk
140. `onenotary` edge function called with no timeout — UI hangs if OneNotary API is down
141. `create-payment-intent` edge function — not verified if it handles missing Stripe secret key gracefully
142. `stripe-webhook` — webhook signature verification is commented out
143. `process-inbound-email` — no verification of sender domain
144. `send-appointment-reminders` — no cron job configured to actually trigger it
145. `discover-leads` — no error handling in the edge function for rate-limited scraping
146. `ocr-digitize` — no file size limit enforcement in the edge function
147. `translate-document` — no validation of language pair support
148. Edge functions return raw error messages to the client — may leak internal details
149. No unified error response format across edge functions
150. `notary-assistant` and `client-assistant` — no response streaming for long AI responses (blocks UI)
151. `detect-document` — no validation that input is actually an image
152. `scan-id` — no validation that input is actually an ID image
153. `explain-document` — no text length limit before sending to AI
154. `send-correspondence` — no check for Resend API key presence before attempting send
155. `get-stripe-config` — returns raw Stripe config without validating key existence

## Database & Data Integrity (156-175)

156. No FK constraint `apostille_requests.client_id` → `profiles.user_id`
157. No FK constraint `chat_messages.sender_id` → `profiles.user_id`
158. No FK constraint `chat_messages.recipient_id` → `profiles.user_id`
159. No FK constraint `client_correspondence.client_id` → `profiles.user_id`
160. No FK constraint `document_reminders.document_id` → `documents.id`
161. No FK constraint `document_reminders.user_id` → `profiles.user_id`
162. No FK constraint `mailroom_items.client_id` → `profiles.user_id`
163. No FK constraint `reviews.client_id` → `profiles.user_id`
164. No FK constraint `reviews.appointment_id` → `appointments.id`
165. No FK constraint `service_requests.client_id` → `profiles.user_id`
166. No FK constraint `service_requirements.service_id` → `services.id`
167. No FK constraint `service_workflows.service_id` → `services.id`
168. No unique constraint on `reviews(client_id, appointment_id)` — allows duplicate reviews
169. `leads` table has no index on `email` — slow lookups for conversion tracking
170. `chat_messages` has no index on `recipient_id` — slow for admin message filtering
171. No cascade delete on `documents` when `appointments` are deleted
172. No cascade delete on `payments` when `appointments` are deleted
173. `handle_new_user` trigger not attached per `<db-triggers>` showing "no triggers"
174. `updated_at` triggers not attached to any table per `<db-triggers>`
175. No seed data for `platform_settings` — new deployments have no default pricing/fees

## Dark Mode & Theme (176-185)

176. `AdminOverview` — E&O/Bond alert uses `bg-amber-50` without dark variant
177. `AdminAppointments` — receipt dialog content uses hardcoded light colors
178. `ClientPortal` — document pipeline step icons use conditional colors without dark variants
179. `OneNotarySession` — checklist cards use `bg-primary/5` which may not be visible in dark mode
180. `AppointmentConfirmation` — checklist background `bg-primary/5` — low contrast in dark mode
181. `AdminAvailability` — slot cards have no dark mode styling
182. `AdminTeam` — certification badge colors not dark-mode aware
183. `AdminLeadPortal` — intent score badge colors likely hardcoded
184. `FeeCalculator` — result card styling may not adapt to dark mode
185. `ServiceDetail` — pre-qualifier card backgrounds may not be dark-mode aware

## Accessibility (186-195)

186. `AdminChat` — conversation list has no keyboard navigation
187. `AdminChat` — no ARIA labels on conversation items
188. `ClientPortal` — tab triggers lack descriptive `aria-label` (show abbreviations like "Appts", "Docs")
189. `BookAppointment` — step navigation buttons lack `aria-label` ("Previous"/"Next" but no context)
190. `BookAppointment` — notarization type selection buttons use `button` element but no `role="radio"` pattern
191. `OneNotarySession` — voice toggle button has no `aria-pressed` state
192. `AdminJournal` — oath switch has no associated label with `htmlFor`
193. `Index` page — AnimatedCounter has no `aria-live` region for screen readers
194. `AdminOverview` — chart components have no `aria-label` or fallback text
195. `AdminDashboard` — sidebar menu items lack `aria-current="page"` on active item

## Performance (196-200)

196. `AdminOverview` fetches ALL appointments with no limit for chart data — O(n) chart rendering
197. `Index` page fetches services and reviews on every visit — no caching
198. `ClientPortal` creates 4 realtime channels per user — each with its own WebSocket overhead
199. `BookAppointment` calls `navigator.geolocation.getCurrentPosition` on mount even when not needed (in_person not yet selected)
200. `AdminAppointments` re-subscribes to realtime on every `filter` change — channel leak risk

---

## Implementation Plan

### Migration: Add missing FKs, indexes, and constraints
- Add FK constraints for all orphaned references (gaps 156-167)
- Add unique constraint on `reviews(client_id, appointment_id)` (gap 168)
- Add indexes on `leads.email`, `chat_messages.recipient_id` (gaps 169-170)
- Attach `handle_new_user` and `updated_at` triggers (gaps 173-174)
- Seed `platform_settings` with defaults (gap 175)

### Standardize edge function calls
- Replace remaining raw `fetch()` calls in `AdminAppointments` (2 locations), `BookAppointment` (2 locations), and `ClientPortal` (1 location) with `supabase.functions.invoke()` or `callEdgeFunction()`
- Standardize payload key names (`appointmentId` everywhere, `to_address` everywhere)
- Add AbortController with 30s timeout to all edge function calls

### Fix routing issues
- Wrap `ServiceRequest`, `SubscriptionPlans`, `DocumentBuilder` in `ProtectedRoute`
- Fix `/business` URL reference in `ServiceDetail` to point to `/business-portal`
- Fix `/document-builder` URL to `/builder`
- Add `PageShell` wrapper to `AppointmentConfirmation`, `OneNotarySession`, `MobileUpload`
- Read `?tab=` query param in `ClientPortal` to set initial tab

### Fix form validation
- Add date/time validation to `AdminAppointments` create dialog
- Add minimum value enforcement on all numeric inputs
- Add email format validation on `AdminTeam` invite, `LoanSigningServices` form
- Fix `AdminJournal` certificate photo upload to write URLs to `certificate_photos` field
- Add file type validation on ID scan and doc scan inputs

### Fix dark mode gaps
- Update `AdminOverview` E&O/Bond alerts with dark variants
- Update `AdminAvailability`, `AdminTeam`, `AdminLeadPortal` badge colors
- Add dark mode classes to `AppointmentConfirmation` and `OneNotarySession` cards

### Add accessibility attributes
- Add `aria-label` to all abbreviated tab triggers
- Add `role="radiogroup"` and `role="radio"` to booking type selection
- Add `aria-pressed` to voice toggle
- Add `aria-live="polite"` to AnimatedCounter
- Add `aria-current="page"` to active sidebar items

### Performance
- Limit `AdminOverview` appointment query to last 12 months
- Add React Query wrapping for `platform_settings` with 5-min stale time
- Consolidate `ClientPortal` realtime channels into a single multiplexed channel
- Remove eager geolocation request from `BookAppointment`

### Files touched (~35 files)
- Core: `App.tsx`, `ClientPortal.tsx`, `BookAppointment.tsx`, `AppointmentConfirmation.tsx`
- Admin: `AdminOverview.tsx`, `AdminAppointments.tsx`, `AdminChat.tsx`, `AdminJournal.tsx`, `AdminAvailability.tsx`, `AdminTeam.tsx`, `AdminLeadPortal.tsx`, `AdminServices.tsx`, `AdminRevenue.tsx`, `AdminDashboard.tsx`, `AdminSettings.tsx`
- Session: `OneNotarySession.tsx`
- Public: `ServiceDetail.tsx`, `ServiceRequest.tsx`, `MobileUpload.tsx`, `Index.tsx`, `FeeCalculator.tsx`
- Utils: `edgeFunctionAuth.ts`
- DB: 1 migration file

