

# Professional Sites & Profit Share — Phases 1–4 Implementation

## Summary
Implement the first 4 phases (43 items) of the professional sites plan: database schema, portal customization, public site rendering, and profit share engine.

---

## Phase 1: Database Schema (PRO-0001 to PRO-0015)

**Migration 1 — Core tables and columns:**
- Add columns to `notary_pages`: `accent_color`, `font_family`, `nav_services` (jsonb), `gallery_photos` (jsonb), `professional_type` (text, default 'notary'), `profit_share_enabled` (bool), `profit_share_percentage` (decimal)
- Add columns to `appointments`: `referral_source` (text), `referral_professional_id` (uuid, FK profiles.user_id)
- Add columns to `payments`: `referral_professional_id` (uuid, FK profiles.user_id)
- Create `profit_share_config` table (professional_user_id, service_id FK, share_percentage, min_platform_fee, is_active, approved_by, approved_at, timestamps)
- Create `profit_share_transactions` table (professional_user_id, service_id, appointment_id, payment_id FK, gross_amount, platform_fee, professional_share, status, period_start/end, paid_at, notes, timestamps)
- Create `professional_service_enrollments` table (professional_user_id, service_id FK, custom_price_from/to, custom_description, custom_short_description, is_active, show_on_site, show_in_nav, display_order, timestamps)

**Migration 2 — RLS, indexes, triggers:**
- RLS on all 3 new tables (own-row for professionals, full CRUD for admin via `has_role`)
- Indexes on `profit_share_transactions(professional_user_id, status)`, `professional_service_enrollments(professional_user_id, service_id)`, `appointments(referral_professional_id)`
- Trigger on `profit_share_config` to enforce minimum platform fee
- Trigger on `payments` (AFTER UPDATE to 'paid' with referral) to auto-create profit share transaction

**No data migration needed** — we extend `notary_pages` in place rather than creating a separate `professional_pages` table (avoids backward compatibility issues, PRO-0102 solved by design).

---

## Phase 2: Portal Site Customization (PRO-0016 to PRO-0026)

**Update `PortalNotaryPageTab.tsx`:**
- Add **Nav Service Selector** card — multi-checkbox list of enrolled services, stored in `nav_services` jsonb, max 6 items
- Add **accent_color** picker + **font_family** selector (Inter, Merriweather, Roboto, Playfair Display, Open Sans)
- Add **gallery photos** section (up to 6 images) using same signed-URL upload pattern
- Expand service description from single-line Input to Textarea with character count
- Add **custom pricing controls** for mobile notary (travel fee/mile, minimum travel fee, max radius) with platform floor enforcement
- Add **platform fee floor UI** — read-only "Platform Minimum" badge next to price fields, prevent save if below floor
- Add **Profit Dashboard card** — Total Earnings, Platform Fees, Your Profit, Pending from `profit_share_transactions`
- Add **Service Enrollment Request** dialog — shows all platform services, professional checks desired ones, creates `professional_service_enrollments` with `is_active=false`
- Save new fields (`accent_color`, `font_family`, `nav_services`, `gallery_photos`, `professional_type`) in `handleSave`
- Rename tab label dynamically based on role

---

## Phase 3: Public Site Rendering (PRO-0027 to PRO-0035)

**Update `NotaryPage.tsx`:**
- Render **dynamic navbar** from `nav_services` — horizontal service links with smooth scroll to sections
- Apply **theme_color, accent_color, font_family** via CSS custom properties on the page container
- Add **gallery section** between About and Services if `gallery_photos` has entries
- Render **service cards with custom pricing** from `professional_service_enrollments` (fallback to `services_offered` jsonb)
- Add **referral tracking** — "Book Now" button passes `?ref=<user_id>` to `/book`
- Add **professional type badge** (Commissioned Notary, Signing Agent, etc.)
- Add **JSON-LD LocalBusiness** schema with services and areas
- Add **/professionals** route to App.tsx (reuse NotaryDirectory pattern with type filter)

**Update `BookAppointment.tsx`:**
- Read `?ref=` param from URL, store as `referral_professional_id` on appointment creation

---

## Phase 4: Profit Share Engine (PRO-0036 to PRO-0043)

**Database function** `calculate_profit_share(p_payment_id, p_professional_id)`:
- Looks up `profit_share_config` for the service
- Calculates: platform_fee = max(min_platform_fee, gross × (1 - share%/100))
- Professional share = gross - platform_fee
- Inserts into `profit_share_transactions` (idempotent — checks existing)

**Default configuration:**
- 70% professional / 30% platform for human services
- Notarization: professional keeps $5/act statutory fee, platform keeps RON/KBA/processing
- Platform base fees enforced as floors (RON $25, KBA $15, Stripe 2.9%+$0.30)

**Trigger enhancement:**
- The payment trigger (from Phase 1) calls `calculate_profit_share` when payment status → 'paid' AND `referral_professional_id` IS NOT NULL

**Dispute flow:**
- `profit_share_transactions.status` supports: `pending`, `paid`, `disputed`
- Professional can flag disputed (UI in Phase 2 profit dashboard)

---

## Files Created/Modified

| Action | File |
|--------|------|
| Create | Migration SQL (2 migrations) |
| Modify | `src/pages/portal/PortalNotaryPageTab.tsx` — full customization expansion |
| Modify | `src/pages/NotaryPage.tsx` — dynamic nav, colors, gallery, referral |
| Modify | `src/pages/BookAppointment.tsx` — referral param handling |
| Modify | `src/App.tsx` — add /professionals route |
| Modify | `src/integrations/supabase/types.ts` — auto-updated |

## Technical Notes
- Extends `notary_pages` rather than creating separate table to maintain backward compatibility
- All RLS uses `has_role()` SECURITY DEFINER pattern
- Profit share trigger uses SECURITY DEFINER to bypass RLS
- Ohio $5/act cap enforced in profit share calculation
- Platform fee floors are non-negotiable and enforced at both UI and DB level

