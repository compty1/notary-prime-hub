

# Comprehensive Codebase Audit — Gaps, Errors & Fixes

## Honest Assessment
After reviewing all major files, edge functions, database schema, RLS policies, and frontend pages, I identified **~85 real, actionable issues** across the project. These range from critical security gaps to minor branding inconsistencies. Inflating to 600 would require inventing non-issues — here are the genuine findings.

---

## Category 1: Remaining OneNotary → SignNow Migration Gaps (14 issues)

| # | File | Issue |
|---|------|-------|
| 1 | `src/pages/RonInfo.tsx:147` | Still says "Notar uses **OneNotary** as our certified RON platform" |
| 2 | `src/pages/RonInfo.tsx:308` | Lists "**OneNotary** — Platform-integrated KBA with full RON workflow" |
| 3 | `src/pages/admin/AdminResources.tsx:262` | Guide titled "OneNotary RON Session Setup & Execution" |
| 4 | `src/pages/admin/AdminResources.tsx:263` | Tags include "OneNotary" |
| 5 | `src/pages/admin/AdminResources.tsx:266` | Step says "create a OneNotary session" |
| 6 | `src/pages/admin/AdminResources.tsx:269` | Step says "via OneNotary" |
| 7 | `src/pages/admin/AdminResources.tsx:274` | Step says "OneNotary auto-generates the recording" |
| 8 | `src/pages/admin/AdminResources.tsx:277` | Step says "via OneNotary or email" |
| 9 | `src/pages/admin/AdminResources.tsx:487` | Says "Choose an approved RON technology provider (like OneNotary)" |
| 10 | `src/pages/admin/AdminResources.tsx:513` | External link titled "OneNotary RON Platform" pointing to onenotary.us |
| 11 | `src/pages/admin/AdminJournal.tsx:237` | Placeholder text says "KBA + OneNotary fees" |
| 12 | `src/App.tsx:23` | Variable still named `OneNotarySession` (cosmetic but confusing) |
| 13 | `src/pages/OneNotarySession.tsx` | File still named OneNotarySession.tsx |
| 14 | `src/pages/OneNotarySession.tsx:23` | Component function still named `OneNotarySession` |

---

## Category 2: Security Issues (12 issues)

| # | Issue |
|---|-------|
| 15 | **SignNow webhook has no signature verification** — `signnow-webhook/index.ts` accepts any POST with no HMAC/signature check. Attacker can forge webhook events. |
| 16 | **KBA API key stored in platform_settings** — `AdminSettings.tsx:337` stores KBA API key in a table readable by anon users (RLS allows public SELECT). Should be a server secret. |
| 17 | **CORS headers too permissive on webhook** — `signnow-webhook/index.ts:6` has `Access-Control-Allow-Origin: *`. Webhooks don't need CORS at all. |
| 18 | **No rate limiting on edge functions** — All edge functions accept unlimited requests. |
| 19 | **ID number stored in plain text** — `notary_journal.id_number` stores signer ID numbers without encryption. |
| 20 | **No input validation with Zod** — `signnow/index.ts` uses manual validation instead of Zod schema validation per edge function guidelines. |
| 21 | **No input validation on webhook** — `signnow-webhook/index.ts` parses `req.json()` with no schema validation. |
| 22 | **refresh_token action exposes access_token in response** — Line 273 returns the raw access_token to the client, which could be logged. |
| 23 | **No CSRF protection on auth forms** — Login/signup forms have no CSRF tokens. |
| 24 | **Session timeout check uses getSession()** — `AuthContext.tsx:47` uses `getSession()` which reads from local storage, not the server. Should use `getUser()` for actual server-side validation. |
| 25 | **signOut preserves unknown localStorage keys** — Only removes keys starting with `sb-` but other auth-related state could persist. |
| 26 | **ONENOTARY_API_TOKEN secret still exists** — Old secret should be removed from the secrets configuration. |

---

## Category 3: Database & Data Integrity (10 issues)

| # | Issue |
|---|-------|
| 27 | **No foreign keys on any table** — All tables show "No foreign keys" meaning referential integrity is not enforced at DB level. `appointments.client_id` could reference a non-existent user. |
| 28 | **notarization_sessions upsert uses `onConflict: "appointment_id"`** — But there's no unique constraint on `appointment_id` in the schema, so upsert may create duplicates. |
| 29 | **Missing index on `payments.client_id`** — Frequent queries filter by client_id but no index exists. |
| 30 | **Missing index on `documents.appointment_id`** — Queried frequently in session completion flow. |
| 31 | **Missing index on `chat_messages.sender_id`** — Used in RLS policy and queries. |
| 32 | **No DB trigger for `updated_at` columns** — Schema mentions `update_updated_at_column()` function exists but "There are no triggers in the database" — so `updated_at` columns never auto-update. |
| 33 | **`platform_fee` vs `platform_fees` column confusion** — `notary_journal` has BOTH `platform_fee` and `platform_fees` columns. Revenue dashboard uses both, creating confusion. |
| 34 | **Payments table has no appointment foreign key** — `appointment_id` is nullable with no FK constraint. |
| 35 | **No cascade delete from appointments** — Deleting an appointment leaves orphaned documents, payments, sessions. |
| 36 | **`notary_payouts.platform_fees`** — Was supposed to be renamed but still exists with old name in schema. |

---

## Category 4: Frontend Bugs & UX Issues (18 issues)

| # | Issue |
|---|-------|
| 37 | **OneNotarySession.tsx error handling in handleDocUpload** — The `catch` block at line 237 catches errors from `reader.onload` setup, not from the async callback inside it. Errors inside `reader.onload` are swallowed. |
| 38 | **FileReader error event not handled** — No `reader.onerror` handler in `handleDocUpload`. |
| 39 | **Revenue chart net profit line uses `--accent` color** — `accent` in this theme is a light gray, making the line invisible. Should use `--primary`. |
| 40 | **5 stat cards in a 4-column grid** — `AdminRevenue.tsx:252` uses `lg:grid-cols-4` but has 5 stat cards, causing awkward wrapping. |
| 41 | **formatDate in Revenue parses dates inconsistently** — `formatDate(p.created_at)` at line 381 passes a full ISO timestamp but function expects date strings. Works but fragile. |
| 42 | **No loading state for client portal tabs** — Portal tabs don't show skeleton loaders during data fetch. |
| 43 | **Voice recognition not cleaned up** — `OneNotarySession.tsx` starts recognition but doesn't stop it on unmount if still listening. |
| 44 | **No error boundary around SignNow API calls** — If SignNow is down, the RON session page shows generic error instead of meaningful fallback. |
| 45 | **Invite form shows even after invite was already sent** — The condition at line 602 hides it for "confirmed" status but if webhook updates to "in_session", the form reappears. |
| 46 | **`sessionStatus` defaults to "waiting"** — But this isn't a valid `appointment_status` enum value, causing type mismatches. |
| 47 | **Missing Suspense fallback for lazy-loaded admin pages** — Admin sub-routes are lazy-loaded but wrapped in ErrorBoundary, not Suspense. The parent Suspense covers it but may show full-page loader for tab switches. |
| 48 | **No pagination on payments table** — `AdminRevenue.tsx` loads ALL payments with no pagination or virtual scrolling. |
| 49 | **CSV export doesn't escape commas** — `exportCSV` at line 109 joins with commas but doesn't escape values containing commas (e.g., signer names, notes). |
| 50 | **Client portal chat shows all admin messages** — RLS policy `Clients can view admin replies` allows seeing ALL admin messages (`is_admin = true`), not just ones directed to them. |
| 51 | **Touch targets override on select items** — CSS rule `min-height: 44px` on `[data-radix-collection-item]` may cause oversized dropdown items. |
| 52 | **Duplicate print styles** — Two `@media print` blocks in `index.css` (lines 280 and 313) with conflicting rules. |
| 53 | **AnimatePresence with key={location.pathname}** — Re-mounts entire page on query param changes on same path, causing unnecessary re-renders. |
| 54 | **No debounce on admin settings save** — Rapid clicks on "Save Changes" can trigger multiple parallel upserts. |

---

## Category 5: Edge Function Issues (11 issues)

| # | Issue |
|---|-------|
| 55 | **`signnow-webhook` CORS headers missing required headers** — Uses shorter header list than recommended (missing `x-supabase-client-platform` etc.). |
| 56 | **`stripe-webhook` has no actual signature verification** — Comment says "For production, verify webhook signature" but code just does `JSON.parse(body)`. |
| 57 | **`stripe-webhook` uses `.like()` to match payment intent** — `like("notes", `%${pi.id}%`)` is fragile — if notes contain similar strings, wrong payment could be updated. |
| 58 | **`get-stripe-config` doesn't validate auth** — Returns publishable key to any caller with no auth check. (Acceptable since it's a public key, but inconsistent.) |
| 59 | **SignNow `download_document` returns JSON but signed PDF is binary** — The endpoint returns a PDF binary, but the function tries to `.json()` parse it, which will fail. |
| 60 | **No retry logic on SignNow API calls** — Transient failures cause immediate user-facing errors. |
| 61 | **`send_invite` uses hardcoded `from_email: "noreply@notardex.com"`** — This email may not be verified in SignNow, causing delivery failures. |
| 62 | **Token refresh doesn't persist the new token** — `refresh_token` action returns the new access token but doesn't update the `SIGNNOW_API_TOKEN` secret. Manual intervention needed. |
| 63 | **`create_signing_link` doesn't validate response** — No check on whether the response contains a valid link. |
| 64 | **Edge functions use `esm.sh` imports** — Per guidelines, `npm:` specifiers are preferred for stability. |
| 65 | **Missing `stripe-signature` from CORS allow-headers** — `stripe-webhook/index.ts:4` includes it but `corsHeaders` is used inconsistently. |

---

## Category 6: TypeScript & Code Quality (8 issues)

| # | Issue |
|---|-------|
| 66 | **Excessive `any` type usage** — `appointments`, `profiles`, `entries` all typed as `any[]` across admin pages. |
| 67 | **`(session as any).signnow_document_id`** — Type assertion used because types.ts may not be updated with renamed column. |
| 68 | **`status: "completed" as any`** — Multiple casts to `any` for enum values, suggesting type definitions don't match DB enums. |
| 69 | **Unused imports** — `OneNotarySession.tsx:13` imports `Play, Video` but they may not be used in admin view. |
| 70 | **No TypeScript strict mode** — `tsconfig.app.json` may not have `strict: true`. |
| 71 | **QueryClient has no default options** — `App.tsx:70` creates QueryClient with no staleTime, retry, or error handling defaults. |
| 72 | **`useEffect` missing dependencies** — `OneNotarySession.tsx:111` has `[appointmentId]` but uses `isAdminOrNotary` inside. |
| 73 | **Memory leak potential** — `AuthContext.tsx` `fetchRoles` is called in `onAuthStateChange` listener but has no abort/cleanup if component unmounts mid-flight. |

---

## Category 7: Missing Features & Incomplete Flows (8 issues)

| # | Issue |
|---|-------|
| 74 | **No email verification enforcement** — Auth is configured but no UI feedback if user hasn't verified email. |
| 75 | **ForgotPassword page imported as `ResetPassword`** — Route works but naming is confusing for maintenance. |
| 76 | **No 404 handling for `/services/:serviceId`** — Invalid service IDs show empty page instead of not-found state. |
| 77 | **ServiceRequest guest fields unused** — `guestName`, `guestEmail`, `guestPassword` state variables declared but never rendered in the form. |
| 78 | **No document download from SignNow in UI** — Edge function has `download_document` action but no UI button to trigger it. |
| 79 | **KBAVerification component imported but gated** — `AdminAppointments.tsx:18` imports it but it's behind a toggle with no clear entry point. |
| 80 | **No webhook registration automation** — Admin must manually copy webhook URL and paste into SignNow dashboard. Could automate via SignNow API. |
| 81 | **No session recording storage** — Ohio ORC §147.66 requires RON recordings stored for 10 years. No mechanism to store/retrieve SignNow recordings. |

---

## Category 8: Compliance Risks (5 issues)

| # | Issue |
|---|-------|
| 82 | **Commission expiry doesn't block RON sessions** — Settings page shows warning but doesn't prevent starting new RON sessions when commission is expired. |
| 83 | **No signer location verification** — ORC requires signer to be in a jurisdiction recognizing Ohio RON. No IP geolocation or attestation collected. |
| 84 | **KBA failure count not tracked** — ORC says terminate after 2 failed KBA attempts. No counter in the system. |
| 85 | **Journal entry doesn't record session recording reference** — Required by ORC §147.66 but `notary_journal` has no column for recording URL/ID. |

---

## Recommended Implementation Priority

**Critical (do first):**
- Issues 15-16 (security: webhook signature, API key in public table)
- Issues 59 (download_document broken)
- Issues 1-14 (OneNotary branding remnants — confusing for users)
- Issue 32 (updated_at triggers not attached)

**High priority:**
- Issues 27-28 (foreign keys, upsert constraint)
- Issues 33, 36 (column naming confusion)
- Issues 81-85 (Ohio compliance gaps)
- Issue 50 (chat message RLS too broad)

**Medium priority:**
- Issues 37-38, 43, 45-46, 48-49 (frontend bugs)
- Issues 55-58, 60-62 (edge function hardening)
- Issues 66-73 (TypeScript quality)

**Low priority:**
- Issues 51-54 (minor UX)
- Issues 74-80 (missing features)

