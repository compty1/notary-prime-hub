

# Comprehensive Gap & Error Fix Plan

## Critical Issues Found

### A. Routing: ComingSoon on `/` instead of Index
**File:** `src/App.tsx` line 105
- `/` renders `ComingSoon`, not `Index`. The actual homepage is at `/home`. This means visitors see a "Launching Soon" page. Either swap the routes (make `/` show Index and `/coming-soon` show ComingSoon) or redirect `/` to `/home`.

### B. Dark-on-Dark Text Readability (User-Reported)
**Root Cause:** `bg-gradient-hero` uses navy tones in both light and dark mode (line 131 of `index.css`). Pages using it with `text-primary-foreground` (white) are OK. But the **light mode** gradient is also dark navy (`hsl(224 63% 11%)`) — meaning light mode looks almost identical to dark mode on hero sections. This is by design for the dark navy brand, but several sections use `text-foreground` (which is dark navy in light mode = invisible on dark navy gradient).

**Affected pages (hero sections with `bg-gradient-hero` + `text-primary-foreground` — mostly OK):**
- `SubscriptionPlans.tsx` — line 107: `text-primary-foreground` ✓
- `ServiceDetail.tsx` — line 385-386: `text-primary-foreground` ✓
- `RonInfo.tsx`, `LoanSigningServices.tsx`, `NotaryGuide.tsx` — need verification

**Fix:** Ensure ALL text inside `bg-gradient-hero` sections uses `text-primary-foreground` (white) or `text-primary-foreground/70` for muted text, never `text-foreground` or `text-muted-foreground`. Audit all 9 files using `bg-gradient-hero`.

### C. DarkModeToggle Default State
**File:** `src/components/DarkModeToggle.tsx`
- Defaults to `prefers-color-scheme: dark` when no localStorage theme exists. Most users will see dark mode. For a professional notary site launching publicly, light mode should be the default.

### D. Stripe Payment Flow Not Complete
1. **SubscriptionPlans.tsx** calls `create-payment-intent` but doesn't use the returned `clientSecret` — it just shows a toast saying "Payment initiated" without actually rendering a Stripe checkout form. The `PaymentForm` component exists but isn't used here.
2. **create-payment-intent** requires authentication — subscription checkout from a new user who just signed up may fail if session isn't ready.
3. **STRIPE_WEBHOOK_SECRET** — verify it's configured to receive live webhook events at the correct URL.

### E. Console Error: AILeadChatbot ref warning
**File:** `src/components/AILeadChatbot.tsx` — Function component given ref in `ComingSoon.tsx`. Needs `React.forwardRef` or ref removal.

---

## Category 1: Routing & Navigation (5 items)

1. **Swap `/` and `/home` routes** — Make Index the default, move ComingSoon to `/coming-soon`
2. **Navbar links check** — "Book Now" in navbar links to `/book`, verify service dropdown links work
3. **Footer second "Privacy" link** — verify `/terms` has anchor sections
4. **Admin breadcrumbs** — verify Breadcrumbs component renders on admin sub-pages
5. **Portal deep-link hash sync** — verify `#documents`, `#chat` etc. work on `/portal`

## Category 2: Text Readability / Theme (12 items)

6. **Audit all `bg-gradient-hero` sections** for text color correctness (9 files)
7. **Light mode default** — change DarkModeToggle fallback to light
8. **ComingSoon page** — feature cards use `glass-card` with dark background, text uses `text-foreground` which may be dark navy on dark bg — needs `text-primary-foreground` or explicit light text
9. **SubscriptionPlans hero** — `text-primary-foreground/70` contrast check
10. **RonInfo hero text** — verify readability
11. **NotaryGuide hero text** — verify readability
12. **NotaryProcessGuide hero text** — verify readability
13. **LoanSigningServices hero text** — verify readability
14. **JoinPlatform hero text** — verify readability
15. **RonEligibilityChecker hero text** — verify readability
16. **ServiceDetail hero badges** — `text-primary-foreground/60` and `border-primary-foreground/20` may be too faint
17. **Legal disclaimer** — `bg-amber-50 text-amber-800` doesn't adapt to dark mode (line 397-400 of ServiceDetail)

## Category 3: Stripe & Payments (8 items)

18. **SubscriptionPlans** — wire `clientSecret` from `create-payment-intent` response into `PaymentForm` component to render actual Stripe Elements checkout
19. **PaymentForm** — verify `get-stripe-config` returns valid publishable key with new live keys
20. **create-payment-intent** — uses `getUser()` not `getClaims()` for auth; update to use `getClaims()` per edge function auth guidelines
21. **stripe-webhook** — verify `STRIPE_WEBHOOK_SECRET` is set, ensure webhook URL is registered in Stripe dashboard
22. **Payment receipt display** — ClientPortal payments section uses `payments` table; verify RLS allows client reads
23. **Invoice generation** — `InvoiceGenerator.tsx` exists but verify it's wired to actual invoice data
24. **Stripe test vs live key validation** — add guard in `create-payment-intent` to log if test key used
25. **Refund flow** — `stripe-webhook` handles `charge.refunded` but no admin UI for initiating refunds

## Category 4: Edge Function Auth (6 items)

26. **create-payment-intent** — uses `supabase.auth.getUser()` instead of `getClaims()` per best practices
27. **send-appointment-emails** — verify auth header forwarding
28. **send-correspondence** — verify auth header pattern
29. **client-assistant** — verify response format matches what frontend expects (`data.choices[0].message.content` vs `data.reply`)
30. **scan-id** — verify edge function exists and handles `imageBase64` body correctly
31. **edgeFunctionAuth.ts streaming** — timeout never cleared for successful streams, could cause premature abort on slow connections

## Category 5: Service Catalog & Detail (10 items)

32. **Services page** uses raw REST API fetch instead of `supabase.from()` — inconsistent with rest of app, bypasses RLS context
33. **Service icon fallback** — many services map to `FileText` via the `iconMap`; add more specific icon mappings
34. **Pricing suffix** — verify `/seal`, `/doc`, `/hr` suffixes display correctly from `pricing_model` field
35. **ServiceDetail** — `getServiceAction` for intake-only services links to `/request?service=...`; verify `ServiceRequest` reads the query param
36. **"Often Paired With" bundle** — `getBundleServiceId` searches by name substring which could return wrong service
37. **Service requirements/workflows** — data may be empty; ServiceDetailPanel shows "No specific requirements" message
38. **Pre-qualifier modal** — only shown for `authentication`, `consulting`, `verification` categories
39. **ServiceDetail AI chat** — uses `supabase.functions.invoke` but `client-assistant` may expect streaming response format
40. **Category resource links** — `customer_service` has `/home#contact` link which should be `/#contact` or `/home#contact`
41. **Service search** — `useDebounce` used but search filters both name and description; verify it works with special characters

## Category 6: Booking Flow (8 items)

42. **Service type pre-selection** — `useSearchParams` reads `?service=...` but verify it matches service names exactly (case-sensitive)
43. **Guest signup during booking** — creates account then books; race condition if session isn't ready immediately
44. **BookingScheduleStep timezone suffix** — verify "(ET)" appears on time slots
45. **Guest password visibility toggle** — verify Eye/EyeOff toggle implemented in BookingReviewStep
46. **Travel distance calculation** — `DEFAULT_OFFICE` is hardcoded `{ lat: 39.9612, lng: -82.9988 }`; should pull from platform_settings
47. **Booking email trigger** — verify `send-appointment-emails` is called after appointment creation
48. **Appointment validation trigger** — `validate_appointment_date` prevents past dates; verify it doesn't block same-day bookings
49. **Booking form state persistence** — `BOOKING_STORAGE_KEY` used for localStorage persistence; verify cleanup after successful booking

## Category 7: Client Portal (9 items)

50. **Apostille tracking tab** — `PortalApostilleTab.tsx` needs verification it's imported and rendered
51. **Payment receipts section** — verify payments table queried with correct `client_id` filter
52. **Document upload** — verify storage bucket `documents` has correct RLS for authenticated users
53. **Chat file attachment** — `PortalChatTab` uploads to `documents` bucket at `chat/{userId}/...` path; verify storage RLS allows this path
54. **Correspondence compose** — verify "New Message" calls `send-correspondence` edge function correctly
55. **Service request status filter** — verify dropdown filters work
56. **Deliverable download** — verify signed URL generation for `deliverable_url`
57. **Tab deep linking** — verify URL hash synchronization works both ways
58. **Empty states** — verify all tabs show meaningful empty states when no data exists

## Category 8: Admin Dashboard (12 items)

59. **AdminOverview chart colors** — still uses hardcoded `#2563eb` etc. instead of brand palette
60. **AdminOverview** — uses `select("*")` for many queries; should use specific columns for performance
61. **Commission renewal reminder** — verify `AdminSettings` or `AdminOverview` shows warning banner
62. **Admin team assignment** — `AdminServiceRequests` has `editAssignedTo` dropdown; verify it saves correctly
63. **Admin deliverable upload** — verify file upload to storage and URL update works
64. **SLA auto-calculation** — verify SLA deadline is set when status changes to `in_progress`
65. **Admin journal search** — verify search filters work across `signer_name`, `document_type`, `notes`
66. **Admin journal PDF export** — verify print view generates correctly
67. **Admin chat canned responses** — verify dropdown populates message input
68. **Admin calendar view** — verify `AdminAppointments` calendar toggle renders month grid
69. **Admin notification sound** — verify browser Notification API permission request
70. **Audit log insert policy** — currently only `service_role` can insert; `logAuditEvent` uses `auth.uid()` RPC but client calls may fail for unauthenticated actions

## Category 9: RON Session & Compliance (8 items)

71. **E-seal without uploaded docs** — verify fallback document record creation in `RonSession.tsx`
72. **Signer IP capture** — verify `ipify` fetch runs on session start
73. **Journal sequential numbering** — verify `journal_number` serial column works
74. **Commission expiry blocking** — verify RON sessions check commission dates
75. **OhioComplianceNotice placement** — verify component shown on booking, RON, and service detail pages
76. **Recording consent timestamp** — verify `recording_consent_at` is saved
77. **KBA 2-attempt limit** — `enforce_kba_limit` trigger exists; verify UI respects this
78. **Session timeout** — `session_timeout_minutes` column exists; verify countdown UI

## Category 10: Identity Verification (4 items)

79. **VerifyIdentity** — verify `supabase.functions.invoke("scan-id")` call format matches edge function
80. **ID scan result persistence** — verify results saved to profile or separate table
81. **scan-id edge function** — verify it exists and processes `imageBase64` correctly
82. **ID verification status display** — verify admin can see verification status

## Category 11: Email & Notifications (5 items)

83. **Service request notification** — verify `send-correspondence` called after successful insert in `ServiceRequest.tsx`
84. **Booking confirmation email** — verify `send-appointment-emails` called in `BookAppointment.tsx`
85. **Email send log** — verify `email_send_log` records are created
86. **IONOS credentials** — verify IMAP/SMTP secrets are set for email sync
87. **Admin email management** — verify email cache loads and displays correctly

## Category 12: Security & Auth (7 items)

88. **Remember Me** — verify `Login.tsx` checkbox affects `persistSession` behavior
89. **Session timeout warning** — verify 30s modal appears and "Stay Signed In" works
90. **Re-auth before account deletion** — verify password confirmation dialog works
91. **Failed login audit** — verify `logAuditEvent("login_failed")` succeeds (RPC uses `auth.uid()` which may be null for unauthenticated users)
92. **RLS on public_reviews** — table has NO RLS policies; this is a data exposure risk
93. **audit_log insert** — `log_audit_event` RPC uses `auth.uid()` but failed login has no auth context — will insert `null` user_id
94. **Password strength meter** — verify `SignUp.tsx` has visual strength indicator

## Category 13: Performance & SEO (6 items)

95. **`select("*")` queries** — AdminOverview, ClientPortal, and other pages fetch all columns; replace with specific columns
96. **Suspense fallback** — verify branded `PageLoader` with loading-bar animation
97. **Dynamic meta description** — verify `usePageTitle` sets both `<title>` and `<meta description>`
98. **ARIA improvements** — verify `aria-live="polite"` on toast container (sonner.tsx)
99. **Color contrast** — teal `#1B998B` on white has ~4.1:1 ratio; may need darkening for small text
100. **Image lazy loading** — verify hero image and other large images use `loading="lazy"`

## Category 14: Data Seeding & Integrity (5 items)

101. **Platform settings seeding** — verify `office_latitude`, `office_longitude`, `max_travel_miles`, `witness_fee`, `apostille_fee` exist
102. **Service requirements data** — verify core services have requirements/workflows populated
103. **Duplicate services** — verify migration successfully deleted 26 duplicates
104. **`public_reviews` table** — has no RLS; either add policies or remove table
105. **Triggers verification** — DB shows "no triggers" despite migrations creating them; verify triggers are active

---

## Implementation Priority

**Batch A (Critical — blocks launch):**
Items 1, 6-7, 18-19, 70, 88-94, 104-105

**Batch B (High — broken functionality):**
Items 20-26, 31, 42-49, 59, 62-65, 71-78, 83-84, 91

**Batch C (Medium — UX & completeness):**
Items 2-5, 8-17, 27-30, 32-41, 50-58, 66-69, 79-82, 85-87, 95-103

**Total: 105 distinct gaps/errors identified across 14 categories.**

