

# Implementation Plan — 475-Bug Fix Mega-Plan

This plan addresses all 475 identified bugs across 10 implementation batches. Given the scope, each batch groups related fixes to maximize impact per step.

---

## Batch 1: Critical Widget Conflicts & Auth Fixes (Bugs 1, 2, 6, 7, 28, 38, 62, 167)

**Files**: `App.tsx`, `PageShell.tsx`, `MobileFAB.tsx`, `SignerFAQBot.tsx`, `Navbar.tsx`

- Remove `SignerFAQBot` from `App.tsx` (line 233) — `AILeadChatbot` in `PageShell` already serves this role (Bug 1)
- Adjust `MobileFAB` bottom position to `bottom-28` to avoid overlap with chatbot (Bug 2, 167)
- Wrap `/ai-tools` route in `ProtectedRoute` (Bug 6)
- Make `SignerFAQBot` handle unauthenticated users gracefully — show login prompt instead of calling edge function (Bug 7)
- Add CSRF header (`X-Requested-With`) to `AILeadChatbot` edge function call (Bug 28)
- Fix Navbar "Tools" dropdown link from `/ai-writer` to `/ai-tools` (Bug 38)
- Conditionally render `CommandPalette` only for authenticated users (Bug 62)

---

## Batch 2: Security & Data Protection (Bugs 5, 8, 9, 17, 18, 30, 31, 32, 33, 36, 40, 42, 45, 126-155)

**Database migration** to fix foreign keys:
- Change `referrals.referrer_id` FK from `auth.users(id)` to reference `profiles(user_id)` (Bug 8)
- Change `tool_generations.user_id` FK from `auth.users(id)` to reference `profiles(user_id)` (Bug 9)
- Tighten `session_tracking` RLS SELECT policy — restrict to matching `shareable_token` via request header or remove `USING (true)` (Bug 17, 31)
- Add auth/cron-secret check to `send-sms-reminder` edge function (Bug 18)

**File changes**:
- `RescheduleAppointment.tsx`: Return generic "Not found" message for both email and confirmation mismatches (Bug 32); add attempt counter (max 5) via state (Bug 30); use `sessionStorage` instead of `localStorage` for `pendingBooking` (Bug 33)
- Validate phone E.164 format in `send-sms-reminder` before Twilio call (Bug 36)
- Add `.eq("client_id", user.id)` to appointment cancellation in `ClientPortal.tsx` (Bug 40)
- Remove auto email capture from `AILeadChatbot` — require explicit consent (Bug 42)
- Add CSP meta tag to `index.html` (Bug 45)
- Sanitize admin notes before storage (Bug 137); validate file types on upload (Bug 134)
- Add admin role check to `admin-create-user` edge function (Bug 133)
- Add `style` removal from `sanitize.ts` ALLOWED_ATTR (Bug 153)
- Add rate limiting to `submit-lead` edge function (Bug 155)

---

## Batch 3: Critical Logic Fixes (Bugs 3, 10, 11, 12, 13, 14, 15, 24, 25, 27, 37, 41, 47, 56, 58, 59, 71)

**`ReferralPortal.tsx`** (Bugs 3, 58, 59):
- Generate a per-user referral code (crypto.randomUUID().slice(0,8)) on first load if none exists
- Show referral link only when valid code available

**`AdminPerformance.tsx`** (Bugs 10, 11, 24):
- Add `id` to appointments select query
- Join `profiles` table to show notary names instead of UUIDs
- Remove unused `Button` import

**`DocumentReadinessScore.tsx`** (Bug 12):
- Remove `|| uploadedDocuments.length > 0` short-circuit
- Implement proper keyword matching per requirement type

**`RevenueForecast.tsx`** (Bug 13):
- Guard division by zero: `const denom = n * sumX2 - sumX * sumX; if (denom === 0) return flatProjection;`

**`AdminComplianceReport.tsx`** (Bug 14): Add `setLoading(true)` at start of useEffect
**`AdminWebhooks.tsx`** (Bug 15): Add `setLoading(true)` at start of useEffect

**`BookAppointment.tsx`** (Bugs 27, 37, 47, 56, 71):
- Fix pending booking restore to include all intake fields (Bug 27)
- Add ref-based guard for double-submit prevention (Bug 37)
- Clear form state before navigation after successful booking (Bug 47)
- Replace `as any` casts with proper status types (Bug 56)
- Remove inline rush fee addition (rely on pricingBreakdown.total) (Bug 71)

**`SignerFAQBot.tsx`** (Bug 41): Cap messages to last 20

---

## Batch 4: UX & Navigation Fixes (Bugs 34, 38, 39, 46, 51, 53, 61, 67, 68, 69, 70, 87, 90, 101, 118)

- Fix admin route access for notary role — audit `adminOnly` flags (Bug 34)
- Fix Google OAuth redirect to `/portal` (Bug 39)
- Fix admin sidebar active route highlighting — remove `end` prop for non-index items (Bug 46)
- Client Portal: use controlled `value` + `onValueChange` for tabs (Bug 51)
- Add pagination to webhook events (Bug 53)
- Remove `target="_blank"` from internal `<Link>` in BookingReviewStep (Bug 61)
- Add Tools section to mobile hamburger menu (Bug 67)
- Add "Dark Mode" label to mobile toggle (Bug 68)
- Replace `<Input type="time">` with slot-based selector in RescheduleAppointment (Bug 69)
- Add PDF/DOCX export buttons to ToolRunner using window.print() (Bug 70)
- Group Client Portal tabs — use "More" dropdown for secondary tabs (Bug 87)
- Fix `confirmPassword` minLength to 8 in SignUp (Bug 90)
- Filter past time slots when booking today's date (Bug 101)
- Track user interaction dirty flag for beforeunload in BookAppointment (Bug 118)

---

## Batch 5: Performance & Data Optimization (Bugs 35, 48, 49, 50, 55, 66, 79, 116, 127, 128, 130, 156, 164, 165, 172, 174, 180)

- Add `.limit(1000)` and pagination to all admin data queries (Bugs 35, 49, 66, 130, 156, 164, 165, 174, 180)
- Include all payment statuses in RevenueForecast, annotate in UI (Bug 48)
- Use Ohio timezone-aware dates in compliance report (Bug 50)
- Pass payment data from AdminRevenue to RevenueForecast as props (Bug 55)
- Add `filter: "client_id=eq.{userId}"` to ClientPortal realtime subscription (Bug 79)
- Reduce `staleTime` to 60s for admin pages (Bug 116)
- Paginate AdminChat messages per user (Bug 127)
- Add user filter to AdminChat realtime channel (Bug 128)
- Add visibility API check to AdminOverview auto-refresh (Bug 172)

---

## Batch 6: Edge Function Hardening (Bugs 16, 20, 21, 131, 140, 142, 151)

- Add Zod input validation to `ai-schedule-optimizer`, `assign-task`, `ai-batch-process`, `export-document` (Bug 21)
- Add server-side file size validation to `scan-id` (Bug 131)
- Strip sensitive headers from `discover-leads` responses (Bug 140)
- Add platform_settings RLS for admin-only reads (Bug 142)
- Truncate webhook payloads >50KB before storage (Bug 151)
- Improve `export-document` to use browser print dialog with styled HTML (Bug 16)
- Add History tab to AI Tools page querying `tool_generations` (Bug 20)

---

## Batch 7: Compliance & Ohio RON (Bugs 136, 143, 149, 196, 201, 243, 251)

- Add explicit recording consent to RON session ESign consent text (Bug 136)
- Implement soft delete for journal entries (archived flag) per ORC §147.551 (Bug 143)
- Add signer location capture in RON session (Bug 149)
- Make refusal reason required for appointment refusals (Bug 196)
- Add vital records check to RON session (Bug 201)
- Verify journal CSV export includes all ORC-required fields (Bug 243)
- Display KBA attempt count in admin appointment view (Bug 251)

---

## Batch 8: Shared Utilities & Code Quality (Bugs 78, 91, 106, 107, 108, 109, 122, 157, 158, 236)

- Create shared `formatDate`/`formatTime` utilities in `lib/utils.ts`, replace all duplicates (Bugs 78, 157, 158)
- Extract `getPasswordStrength` to `lib/security.ts` (Bug 91)
- Remove empty `className=""` props (Bug 106)
- Remove unused `showSignup` state from BookAppointment (Bug 107)
- Standardize Logo usage across pages (Bug 108)
- Replace `any[]` with proper interfaces for top 50 occurrences (Bug 109)
- Fix RevenueForecast to use actual month numbers as x-values (Bug 122)
- Add `console.error` to all empty catch blocks (Bug 236, 120+ instances)

---

## Batch 9: UX Enhancements (Bugs 82-105 medium, 170-225 high, 226-375 medium)

Key items from medium/high severity:
- Add debounce to ToolCatalog search (Bug 98)
- Add Google Calendar debounce for AdminOverview (Bug 173)
- Fix dark mode flash — add theme script to index.html `<head>` (Bug 183)
- Add phone validation using existing `phoneValidation.ts` to Index contact form (Bug 170, 289)
- Add geolocation request only for in-person bookings (Bug 171, 88)
- Add `prefers-reduced-motion` support globally (Bug 226)
- Fix Cookie Consent dismiss vs accept behavior (Bug 168, 169)
- Add suppression list check before admin emails (Bug 208)
- Add empty state for 0 RON sessions in compliance report (Bug 86)
- Summarize compliance gaps instead of per-session listing (Bug 22)
- Add admin 404 catch-all route (Bug 260) — already exists at line 216
- Add step aria-labels for booking accessibility (Bug 306, 346)

---

## Batch 10: Low Severity & Polish (Bugs 376-475)

- Add PNG favicon sizes for iOS/Android (Bug 380)
- Add `manifest.json` for PWA support (Bug 284)
- Add `robots.txt` admin route blocking (Bug 393)
- Add `loading="lazy"` to below-fold images (Bug 113)
- Dynamic footer year (verify Bug 378 — already dynamic)
- Add OpenGraph image meta tag (Bug 308)
- Add structured review data to JSON-LD (Bug 419)
- Add `upgrade-insecure-requests` meta tag (Bug 60)
- Remove console.warn in AdminSettings (Bug 89)
- Fix heading hierarchy in ServiceDetail (Bug 431)

---

## Database Migration Summary

Single migration covering:
1. Fix `referrals.referrer_id` FK → `profiles(user_id)`
2. Fix `tool_generations.user_id` FK → `profiles(user_id)`
3. Tighten `session_tracking` RLS policy
4. Add `archived` column to `notary_journal` for soft delete
5. Add `referral_code` generation trigger for referrals table
6. Add check constraint on `payments.amount > 0`

---

## Estimated Scope

- **10 implementation batches**
- **~60-70 files modified**
- **1 database migration**
- **Priority**: Batches 1-3 are critical and should be done first

