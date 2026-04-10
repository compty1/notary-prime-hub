

# Professional Sites & Profit Share — Full Implementation

## Status: Phases 1–14 Complete

---

## Phase 1: Database Schema ✅
- Extended `notary_pages` with branding fields (accent_color, font_family, nav_services, gallery_photos, professional_type)
- Created `profit_share_config`, `profit_share_transactions`, `professional_service_enrollments` tables
- Added referral tracking columns to `appointments` and `payments`
- Full RLS, indexes, and triggers implemented

## Phase 2: Portal Site Customization ✅
- Nav service selector (max 6 items)
- Color picker + font family selector
- Gallery photos (up to 6)
- Service description editor with character count
- Platform fee floor enforcement UI
- Profit dashboard card
- Service enrollment request form

## Phase 3: Public Site Rendering ✅
- Dynamic navbar from nav_services
- Custom color/font rendering via CSS custom properties
- Gallery section
- Service cards with custom pricing
- Referral tracking via ?ref= parameter
- Professional type badge
- JSON-LD LocalBusiness schema

## Phase 4: Profit Share Engine ✅
- `calculate_profit_share()` PostgreSQL function
- Auto-trigger on payment status → paid
- Default 70/30 split with configurable overrides
- Ohio $5/act statutory fee enforcement
- Platform fee floors (RON $25, KBA $15, Stripe 2.9%+$0.30)

## Phase 5: Admin Management Hub ✅
- `/admin/professionals` route with full management dashboard
- Professionals tab: publish/unpublish, feature, profit share toggle
- Enrollments tab: approve/deactivate service enrollments
- Profit Config tab: per-professional, per-service share % and min platform fee
- Payouts tab: mark as paid, CSV export, pending/paid totals
- Admin sidebar link added

## Phase 6: Pricing Controls ✅
- Fee breakdown card in portal showing Ohio statutory fees, RON/KBA/Stripe minimums
- Platform fee floor enforcement via DB trigger (`enforce_enrollment_price_floor`)
- Custom pricing validation prevents below-platform pricing
- RON fees displayed as non-editable in portal

## Phase 7: Service Tools ✅
- Service enrollment system with admin approval workflow
- Professional can request services and set custom pricing/descriptions
- Enrollments tracked with show_on_site and show_in_nav flags

## Phase 8: Notary-Specific Features ✅
- Notary profit tracking via profit_share_transactions
- Ohio $5/act fee cap enforcement at payment and pricing levels
- Journal integration with profit tracking (session_id linkage)
- Professional type "notary" and "mobile_notary" supported

## Phase 9: Non-Notary Professionals ✅
- Professional types: signing_agent, doc_preparer, virtual_assistant, other
- Professional type selector in portal
- Public page renders type-specific badges and labels

## Phase 10: Wiring ✅
- Referral param in booking URL (?ref=user_id)
- Service request referral tracking via appointments.referral_professional_id
- Payment intent includes referral_professional_id metadata
- Stripe webhook captures referral and sets on payment record
- Booking confirmation shows referring professional with link
- DB trigger auto-creates profit_share_transaction on paid payment with referral

## Phase 11: Reporting ✅
- Professional earnings dashboard in portal (gross, fees, profit, pending)
- Profit history table with date, amounts, status (last 50 transactions)
- Admin payouts tab with CSV export
- Platform revenue tracking in admin stats cards

## Phase 12: Edge Functions ✅
- `create-payment-intent` updated with referralProfessionalId
- `stripe-webhook` updated to capture referral_professional_id from metadata
- Profit share auto-triggered via DB trigger (no separate edge function needed)

## Phase 13: UI Components ✅
- Referral link generator with copy buttons (page link + direct booking link)
- QR code for professional page (using qrcode.react)
- Profit history table component
- Fee breakdown card
- Admin profit config dialog
- Professional directory with type filter

## Phase 14: Gap Items ✅
- NotaryDirectory expanded for all professional types with filter
- `/professionals` route serves same directory
- Booking flow validates professional can provide service (via referral tracking)
- Professional page QR code in portal
- Referral link generator in portal
- Dark mode support (inherits from design system)
- Mobile responsive (Tailwind responsive classes throughout)

## Files Modified/Created

| File | Action |
|------|--------|
| `src/pages/admin/AdminProfessionals.tsx` | Created — Full admin management hub |
| `src/pages/NotaryDirectory.tsx` | Rewritten — Supports all professional types with filter |
| `src/pages/portal/PortalNotaryPageTab.tsx` | Enhanced — QR code, referral links, profit history, fee breakdown |
| `src/pages/NotaryPage.tsx` | Enhanced — Dynamic nav, themes, gallery, referral tracking |
| `src/pages/BookAppointment.tsx` | Enhanced — Referral param handling |
| `src/pages/AppointmentConfirmation.tsx` | Enhanced — Shows referring professional |
| `src/pages/admin/AdminDashboard.tsx` | Enhanced — Added Professionals sidebar link |
| `src/App.tsx` | Updated — Added AdminProfessionals route |
| `supabase/functions/create-payment-intent/index.ts` | Updated — Referral tracking in metadata + payments |
| `supabase/functions/stripe-webhook/index.ts` | Updated — Captures referral from metadata |
| Database migrations | Schema, RLS, triggers, functions |
