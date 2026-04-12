

# NotarDex Admin Dashboard & Tooling — Implementation Plan

This plan covers the key implementations from the 50-page build specification, cross-referenced against existing admin pages. Many modules already exist but need enhancement; several new modules are required.

## What Already Exists (No Action Needed)
AdminOverview, AdminAppointments, AdminClients, AdminCRM, AdminDocuments, AdminTemplates, AdminJournal, AdminRevenue, AdminFinances, AdminServices, AdminLeadPortal, AdminUsers, AdminAuditLog, AdminChat, AdminEmailManagement, AdminProcessServing, AdminApostille, AdminLoanSigning, AdminRonRecordings, AdminPerformance, AdminTeam, AdminSettings (6 tabs), AdminTaskQueue, AdminProcessFlows, AdminBuildTracker, AdminServiceRequests, AdminVendors, AdminPrintJobs, etc.

---

## Phase 1: Dynamic Pricing Engine (New Page)

**Route:** `/admin/pricing` — New sidebar entry under "Finance"

**New file:** `src/pages/admin/AdminPricing.tsx`

### Sub-tabs:
1. **Service Base Prices** — Editable table of all services with Basic/Standard/Premium tier columns, inline editing, save to `services` table
2. **Speed Multipliers** — Cards for Standard (1.0x), Priority (1.25x), Rush (1.5x), Emergency (2.0x) with editable values, min lead time, category applicability, active toggle. Stored in `platform_settings` as JSON
3. **Volume Discounts** — Table: tier name, min/max qty, discount %, applicable categories. 4 default tiers (10%/15%/20%/25%)
4. **Loyalty Tiers** — 4 tiers (New/Returning/Loyal/VIP) with qualification criteria and discount %. Read-only display of current client distribution
5. **Promotions** — CRUD cards with name, date range, discount %, optional promo code, applicable services, recurring toggle
6. **Geographic Surcharges** — Table of 6 zones with editable surcharge amounts
7. **Price Calculator** — Admin-facing simulator: select service, tier, qty, speed, loyalty tier, promo code → shows itemized breakdown

**Database:** New `pricing_rules` table for promotions/surcharges. Speed multipliers and volume discounts stored in `platform_settings` as JSON keys.

---

## Phase 2: Order Management System (New Page)

**Route:** `/admin/orders` — New sidebar entry under "Operations"

**New file:** `src/pages/admin/AdminOrders.tsx`

### Features:
1. **List View** — DataTable with columns: Order #, Client, Service(s), Status (Badge), Priority (Badge), Total, Due Date. Filters: status, category, date range, client search
2. **Kanban View** — 7-column board (Pending → Assigned → In Progress → Under Review → Delivered → Completed → Cancelled) with drag-and-drop status changes
3. **Order Detail Sheet** — Slide-over panel with: client info, line items, pricing breakdown, payment status, documents, notes (internal + client-visible), status timeline, action buttons
4. **Create Order** — Dialog with service/tier/qty selection, client picker, priority, notes

**Database:** New `orders` table with status enum, `order_items` table, `order_notes` table. RLS: admin full access, client own-records only.

---

## Phase 3: Admin Settings Enhancements

**File:** `src/pages/admin/AdminSettings.tsx` — Add 2 new tabs

### New Tab: "Pricing & Tax"
- Ohio sales tax rate (default 0% for professional services)
- Tax-exempt service flags
- Tax ID / EIN display
- Platform commission % (for contractor payouts)
- Default payment terms (Net 15/30/45)
- Refund policy window (days)

### New Tab: "Legal"
- Editable refund policy text (Textarea)
- Contractor agreement template text
- Service disclaimer text
- Data retention policy display (10-year for RON per ORC)

---

## Phase 4: Enhanced Admin Overview KPIs

**File:** `src/pages/admin/AdminOverview.tsx` — Add missing KPI cards

### New KPIs (from spec):
- Revenue Today (with vs-last-week trend)
- Active Orders count
- Pending Assignments count
- Average Delivery Time
- Client Satisfaction (avg rating)
- Contractor Utilization %

### New Section: Alert Panel
- Overdue orders (past due date)
- Unassigned orders
- Expiring credentials (commission, E&O, bond)
- Low contractor availability

### New Section: Quick Actions
- Buttons: New Order, Generate Invoice, Send Notification

---

## Phase 5: Analytics Dashboard (New Page)

**Route:** `/admin/analytics` — New sidebar entry under "Operations"

**New file:** `src/pages/admin/AdminAnalytics.tsx`

### Tabs:
1. **Revenue** — Line chart (revenue over time), bar chart (by category), pie chart (by tier). Global date range picker
2. **Services** — Bar chart (orders by service), performance ranking table
3. **Clients** — Segment breakdown pie chart, LTV histogram, new clients this month
4. **Geographic** — Orders by zone table, travel fee revenue
5. **Financial** — P&L summary, outstanding receivables, contractor payout summary

---

## Phase 6: Contractor Management (New Page)

**Route:** `/admin/contractors` — New sidebar entry under "Operations"

**New file:** `src/pages/admin/AdminContractors.tsx`

### Features:
- Contractor directory table (name, specializations, availability, active orders, avg rating)
- Contractor profile detail panel (bio, certifications, performance metrics, earnings history)
- Invite contractor flow (email-based)
- Assignment history per contractor

**Database:** New `contractors` table, `contractor_assignments` table.

---

## Phase 7: Global Admin Controls (Settings Additions)

Add to existing `platform_settings`:
- `auto_assignment_enabled` — Toggle auto-assignment of orders to contractors
- `contractor_acceptance_window_hours` — Default 2 hours
- `default_payout_schedule` — Weekly/biweekly/monthly
- `platform_commission_rate` — Default 30%
- `min_platform_fee` — Default $5
- `loyalty_program_enabled` — Toggle
- `volume_discounts_enabled` — Toggle
- `geographic_surcharges_enabled` — Toggle
- `rush_pricing_enabled` — Toggle
- `promo_codes_enabled` — Toggle
- `order_auto_number_prefix` — Default "NTR"
- `invoice_auto_number_prefix` — Default "INV"
- `contractor_self_registration_enabled` — Toggle
- `client_review_moderation` — Toggle (require admin approval before publishing)

---

## Database Migrations Summary

### New Tables:
1. `pricing_rules` — type, name, value, conditions, date range, promo code, is_active
2. `orders` — order_number, client_id, status, priority, subtotal, total, stripe refs
3. `order_items` — order_id, service_id, tier, qty, unit_price, line_total, specs
4. `order_notes` — order_id, author_id, content, is_internal
5. `contractors` — user_id, specializations, hourly_rate, commission_rate, is_available, stripe_connect_id
6. `contractor_assignments` — order_id, contractor_id, status, payout_amount

### New Settings Seeds:
- 15+ new `platform_settings` keys for pricing/order/contractor controls

### Routes & Sidebar:
- Add `/admin/pricing`, `/admin/orders`, `/admin/analytics`, `/admin/contractors` to `AdminDashboard.tsx` sidebar and `App.tsx` routes

---

## Technical Notes

- All new tables get RLS policies (admin full access, contractors own-records, clients own-records)
- All status changes logged to existing `audit_log` via `logAuditEvent()`
- Kanban drag-and-drop uses existing patterns (no new dependencies needed — CSS grid approach)
- Charts use existing `recharts` dependency
- All new pages follow existing lazy-load pattern in `App.tsx`
- New settings use existing `useSettings` hook and `platform_settings` table

