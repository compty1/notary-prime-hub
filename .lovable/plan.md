

# Plan: Admin-Managed Services Catalog + Remaining Workflow Gaps

## Current State
The platform has most features built (booking, templates, fee calculator, business portal, admin dashboard, RON session, apostille tracker, chat, etc.). However, there is **no dynamic services catalog** that the admin can manage. Services are hardcoded in `BookAppointment.tsx` (7 items), `Index.tsx` (4 cards), and `FeeCalculator.tsx`. The admin cannot add/edit/remove services, change descriptions, or set per-service pricing.

Additionally, several workflow items from the request are missing:
- No dedicated `/services` page listing all service categories
- No admin UI to manage the full service catalog (add/edit/remove services, set pricing, toggle active/inactive)
- No client-facing chat widget in ClientPortal
- No `explain-document` edge function for AI document summaries
- No Stripe payment integration
- No email/SMS sending (placeholder only)
- No e-seal verification page

## What This Plan Covers

### 1. Services Table + Admin Service Management
**Database:** Create a `services` table:
- `id`, `name`, `category` (text: "notarization", "verification", "document_services", "authentication", "business", "recurring", "consulting"), `description`, `short_description`, `price_from` (numeric), `price_to` (numeric), `pricing_model` (text: "per_seal", "per_document", "per_hour", "flat", "monthly", "custom"), `is_active` (boolean), `display_order` (int), `icon` (text), `created_at`, `updated_at`
- RLS: admins manage all, anyone can read active services
- Seed with all ~30 services from the user's list

**Admin page:** New `AdminServices.tsx` under `/admin/services`
- Table listing all services with inline edit for name, price, description, active toggle
- Add new service form
- Drag-reorder or display_order field
- Category filter tabs

### 2. Public Services Page
**New file:** `src/pages/Services.tsx` at `/services`
- Fetches active services from `services` table grouped by category
- Each service shows name, description, price range, CTA to book
- Categories: Core Notarization, Identity & Verification, Document Services, Authentication & International, Business & Volume, Recurring & Value-Add, Consulting

### 3. Dynamic Service Selection in Booking
**Modify:** `BookAppointment.tsx`
- Replace hardcoded `serviceTypes` array with a query to `services` table (active only)
- Show service description and price range when selected

### 4. Client Chat Widget
**Modify:** `ClientPortal.tsx`
- Add a "Chat" tab that uses the existing `chat_messages` table with Supabase realtime
- Client can send messages and see admin replies
- Simple message list + input

### 5. AI Document Explanation Edge Function
**New file:** `supabase/functions/explain-document/index.ts`
- Accepts document text, returns AI summary using Lovable AI (gemini-2.5-flash)
- Non-legal disclaimer included in response
- Add "Explain Document" button in ClientPortal documents tab

### 6. Navigation Updates
- Add `/services` to homepage nav and `App.tsx`
- Add "Services" admin sidebar item
- Update Index.tsx services section to pull from DB or link to `/services`

## Implementation Order
1. Database migration: create `services` table + seed data
2. `AdminServices.tsx` — full CRUD for services
3. `Services.tsx` — public services page
4. Update `BookAppointment.tsx` to use dynamic services
5. Add client chat widget to `ClientPortal.tsx`
6. Create `explain-document` edge function + UI button
7. Route and nav updates

## Files to Create
- `src/pages/admin/AdminServices.tsx`
- `src/pages/Services.tsx`
- `supabase/functions/explain-document/index.ts`

## Files to Modify
- `src/App.tsx` (new routes)
- `src/pages/admin/AdminDashboard.tsx` (sidebar item)
- `src/pages/BookAppointment.tsx` (dynamic services)
- `src/pages/ClientPortal.tsx` (chat tab + explain button)
- `src/pages/Index.tsx` (services link)

## Database Migration
One migration with:
- `services` table with RLS
- Seed ~30 services across all categories with realistic Ohio pricing

## Not in Scope (Already Built or Requires External Service)
- Stripe payments (requires enabling Stripe connector separately)
- Email/SMS (requires email domain setup or external service)
- E-seal verification page (lower priority, can be added next)

