

# Notary Page System — Comprehensive Bug, Gap & Enhancement Audit

I'll generate a detailed CSV with every bug, gap, incomplete integration, and enhancement opportunity across the entire notary page system (admin editor, portal editor, public page, directory, booking integration, referral tracking, etc.).

## What the CSV will cover

Based on my audit of all relevant files (`AdminNotaryPages.tsx`, `PortalNotaryPageTab.tsx`, `NotaryPage.tsx`, `NotaryDirectory.tsx`, `BookAppointment.tsx`, `AppointmentConfirmation.tsx`, and routing/types), I've identified issues across these categories:

1. **Data & Schema Bugs** — Missing validations, slug uniqueness not enforced client-side, HSL color values incompatible with `<input type="color">`, no file-type validation on gallery uploads in portal
2. **Routing & Navigation Gaps** — No canonical URL handling, no redirect from old URLs, PageShell wrapping causes double navbar on notary pages
3. **Booking Integration Issues** — `ref` param stores raw `user_id` (UUID leak), booking doesn't pass `notary_id` to appointment, referral tracking incomplete
4. **Admin Editor Gaps** — No slug duplicate check, no unsaved changes warning, `fetchNotaryUsers` loads ALL profiles not just notary-role users, no bulk actions, no page analytics
5. **Portal Editor Gaps** — Cannot create own page (must contact admin), no slug editing, no live preview, platform services capped at 20 with `slice(0,20)`, no auto-save
6. **Public Page Issues** — No Open Graph meta tags, no structured reviews/ratings, gallery photos not resolved from storage paths, nav service scroll targets may not match section IDs, no testimonials section, hardcoded "Ohio" in schema.org
7. **Directory Issues** — No pagination (loads all), no map view, no sort options, no distance-based filtering
8. **Security Concerns** — User UUID exposed in `ref` param, no rate limiting on public page fetches, signed URLs with 10-year expiry
9. **SEO & Compliance** — Missing `robots` meta for draft pages, no sitemap integration, no Ohio compliance badge on public pages
10. **Enhancement Opportunities** — Contact form, testimonials, availability calendar widget, analytics dashboard, A/B theme testing, review collection

## Technical approach

- Generate a Python script that writes a comprehensive CSV to `/mnt/documents/`
- Each row includes: ID, Category, Severity, Title, Description, Affected Files, Current Behavior, Expected Behavior, Fix Implementation Steps, Testing Steps, Expected Outcome
- Target: 150-300 items (every real issue found, no padding)

## Files involved (read-only audit of)
- `src/pages/admin/AdminNotaryPages.tsx`
- `src/pages/portal/PortalNotaryPageTab.tsx`
- `src/pages/NotaryPage.tsx`
- `src/pages/NotaryDirectory.tsx`
- `src/pages/BookAppointment.tsx`
- `src/pages/AppointmentConfirmation.tsx`
- `src/App.tsx` (routing)
- `src/integrations/supabase/types.ts` (schema)

