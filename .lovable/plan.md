

# Comprehensive Gap Analysis & Fix Plan

After thorough review of all pages, routes, database schema, edge functions, and admin features, here are all remaining gaps organized by severity.

---

## CRITICAL — Blocks Core Functionality

### 1. Email Regex Bug in LoanSigningServices.tsx (Line 58)
The regex uses double-escaped backslashes (`/^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/`) which will never match a valid email. Every loan signing inquiry submission will be rejected.

**Fix:** Change to `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### 2. No RESEND_API_KEY Secret Configured
The `send-appointment-emails` edge function checks for `RESEND_API_KEY` and logs "no API key" when missing. No confirmation emails are actually sent. Also missing `FROM_EMAIL`.

**Fix:** Add `RESEND_API_KEY` and `FROM_EMAIL` secrets, or clearly surface to admin that emails are in "log only" mode.

### 3. send-appointment-emails Not Reading Admin Email Templates
The edge function has hardcoded email HTML templates. It does not read the `email_template_confirmation`, `email_template_reminder`, or `email_template_followup` keys from `platform_settings` that the admin can edit. The admin's template edits have zero effect.

**Fix:** Update the edge function to fetch templates from `platform_settings` and use them when present, falling back to hardcoded defaults.

---

## HIGH — Significant UX/Functional Issues

### 4. OG Image Points to Lovable Default
`index.html` line 15: `og:image` is `https://lovable.dev/opengraph-image-p98pqg.png` — a generic Lovable image, not branded.

**Fix:** Replace with a proper branded image or remove.

### 5. Admin Sidebar Active State Incomplete
`NavLink` component uses exact matching (`end` prop only on `/admin` index). Nested routes like `/admin/settings` don't highlight correctly because the `NavLink` component may not handle prefix matching for all items.

**Fix:** Verify `NavLink` implements `isActive` with `end={false}` for nested routes and `end={true}` only for the index route. Currently line 57 sets `end={item.url === "/admin"}` which is correct — need to verify the NavLink component itself.

### 6. Admin Dashboard Header Hardcoded
Line 95: `"Shane Goble Notary — {isAdmin ? "Admin" : "Notary"}"` — not pulled from `platform_settings`.

**Fix:** Fetch business name from `platform_settings` or leave as-is (low priority since it's an internal panel).

### 7. No `notary_phone` / `notary_email` Platform Settings Seeded
The homepage defaults to `(614) 300-6890` and `shane@shanegoble.com` but these keys may not exist in the DB, meaning admin can't update them from settings.

**Fix:** Add a migration to seed `notary_phone` and `notary_email` into `platform_settings` if they don't already exist.

### 8. No Contact Info Fields in AdminSettings
Admin settings has fields for commission, pricing, and integrations, but no explicit fields for `notary_phone` and `notary_email` — admin can't edit contact info.

**Fix:** Add phone/email inputs to the Business Settings card in AdminSettings.

---

## MEDIUM — Polish & Completeness

### 9. BookAppointment Confirmation Email Fire-and-Forget
The booking flow calls `supabase.functions.invoke("send-appointment-emails")` but doesn't handle errors or inform the user if the email fails.

**Fix:** Add error handling after the invoke call.

### 10. `e_seal_verifications` Type Cast
`VerifySeal.tsx` uses an `ESealRecord` interface but the underlying Supabase query uses `as any` because the table isn't in the generated types. This was partially addressed but should be verified.

### 11. No Accessibility Improvements
Missing `aria-label` on icon-only buttons (mobile menu, dark mode toggle). Screen readers won't understand these elements.

**Fix:** Add `aria-label` to all icon-only Button components.

### 12. Services Page Footer Missing
The Services page has no footer — just ends after the CTA. All other public pages have a consistent footer.

**Fix:** Add the standard footer to Services.tsx.

### 13. RonEligibilityChecker and LoanSigningServices Missing Footer
Same issue — no footer section on these pages.

### 14. DocumentTemplates Page — No Footer
Same gap.

### 15. FeeCalculator Page — Verify Footer
Need to check if footer exists.

### 16. NotaryGuide Page — Verify Footer
Need to check.

### 17. Canonical URL May Not Match Actual Domain
`index.html` uses `https://shanegoblenotary.com` as canonical — if this isn't the actual published domain, it could hurt SEO.

### 18. No Admin Content Editor for Homepage Sections
Admin can edit settings but not the homepage hero text, testimonials, FAQs, or industry insights. These are all hardcoded.

**Fix:** This is a large feature — defer to future iteration. Note in plan but don't implement now.

---

## LOW — Nice to Have

### 19. No Bulk Actions in Admin Lead Portal
No select-all or bulk delete/archive for leads.

### 20. No Print Stylesheet
Journal entries, templates don't have print-optimized CSS.

### 21. No CAPTCHA on Public Forms
Contact form and signup have no bot protection beyond the 60-second rate limit.

### 22. Missing `robots.txt` Restriction Updates
Current `robots.txt` should block `/admin` and `/portal` paths to prevent indexing.

### 23. Booking Page — No Min Lead Time Enforcement
`min_booking_lead_hours` setting exists but isn't enforced in the booking UI (users can book for today/tomorrow without restriction).

---

## Implementation Plan

### Phase 1: Fix Critical Bugs
1. **Fix email regex** in `LoanSigningServices.tsx` line 58
2. **Add `RESEND_API_KEY` secret** — prompt user to provide it, or add a note that emails are in preview mode
3. **Update edge function** to read email templates from `platform_settings` with fallback to defaults

### Phase 2: Fix High-Priority Gaps
4. **Add `notary_phone` / `notary_email` fields** to AdminSettings Business Settings card
5. **Seed platform_settings** with `notary_phone`, `notary_email` if not present
6. **Replace OG image** placeholder or add a note about custom branding

### Phase 3: Add Consistency
7. **Add footer** to Services.tsx, LoanSigningServices.tsx, RonEligibilityChecker.tsx, DocumentTemplates.tsx (reuse homepage footer pattern)
8. **Add `aria-label`** to icon-only buttons across all pages
9. **Add error handling** for confirmation email invoke in BookAppointment.tsx

### Phase 4: Low Priority
10. Check and enforce `min_booking_lead_hours` in booking flow
11. Verify `robots.txt` blocks admin/portal paths (already done from prior work)

### Files to Modify
- `src/pages/LoanSigningServices.tsx` — fix regex
- `src/pages/admin/AdminSettings.tsx` — add phone/email fields
- `src/pages/Services.tsx` — add footer
- `src/pages/RonEligibilityChecker.tsx` — add footer
- `src/pages/DocumentTemplates.tsx` — add footer
- `src/pages/BookAppointment.tsx` — error handling on email invoke
- `supabase/functions/send-appointment-emails/index.ts` — read templates from DB
- Migration SQL — seed `notary_phone` and `notary_email` settings

### Database Changes
- Insert `notary_phone` and `notary_email` into `platform_settings` (ON CONFLICT DO NOTHING)

### Secrets Needed
- `RESEND_API_KEY` — required for actual email delivery
- `FROM_EMAIL` — sender address for emails

