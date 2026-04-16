

# Comprehensive Build Audit — 800+ Gaps & Bugs Across Build, Flow, Services, Admin, Backend

## Discovery Summary

- **294 pages, 268 routes, 60 edge functions, 169 services, 188 platform settings**
- **Critical gaps found:**
  - `pricing_rules` table is **empty (0 rows)** despite seeding plan — pricing engine has no data
  - `EmailVerificationGate` component exists but is **never imported/used** anywhere
  - Shop tables (`shop_packages`, `shop_addons`) only have 5 frontend references — UI not fully wired to DB
  - **283 of 294 pages** lack `ErrorBoundary` wrappers (only 11 do)
  - **1144** `: any` type annotations across the codebase
  - **5 god-files** > 700 LOC: `BookAppointment` (1019), `AdminSettings` (992), `ClientPortal` (892), `AdminCRM` (737), `AdminProcessFlows`
  - **Security scan: 4 errors/warnings** — Realtime channel auth missing, vendors/vendor_products/pricing_rules over-exposed
  - **Service registry has 41 entries vs 46 service pages vs 47 routes vs 169 DB rows** — four sources of truth, all out of sync
  - **23 unit tests total, 0 e2e tests** for a production platform handling Ohio RON compliance

---

## Plan: 800 Items Across 12 Sprints

### Sprint A — Critical Security & Data Integrity (60 items)
- A-01..04: Fix 4 security scan findings (Realtime channel auth, vendors RLS, vendor_products RLS, pricing_rules RLS, platform_settings anon access)
- A-05..10: Move `pg_trgm` and other extensions out of `public` schema
- A-11..15: Replace `USING (true)` permissive policies with scoped checks
- A-16..30: Audit all 188 `platform_settings` keys for sensitive-by-naming exposure (commission #, seal paths, office coords)
- A-31..45: Add column-level RLS or views to hide cost/margin/wholesale fields from non-admin reads
- A-46..60: Seed `pricing_rules` with full price matrix for 169 services (zone × service-type × surcharge)

### Sprint B — Auth, Verification & Account Hardening (55 items)
- B-01..10: Wire `EmailVerificationGate` into `/book`, `/portal/documents`, `/portal/correspondence`, `/ron-session`, `/payment`
- B-11..20: Add MFA enforcement guards to `/admin/*`, `/ron-session`, financial routes (currently inconsistent)
- B-21..30: Implement signup verification interstitial + resend logic + grace-period messaging
- B-31..40: Session timeout warnings (15-min idle), refresh-token rotation status UI, ActiveSessions revoke
- B-41..55: Password strength meter on all 3 password inputs, breach-check via HIBP k-anon, lockout after 5 failures

### Sprint C — Booking Engine Refactor & Flow Bugs (75 items)
- C-01: Refactor `BookAppointment.tsx` (1019 LOC, 50+ useState) into `useReducer` + extracted step components
- C-02..15: Fix race conditions in slot reservation; unify `check_and_reserve_slot` RPC usage across all entry points
- C-16..25: Reschedule flow — conflict detector, fee calculation, notify counterparties, calendar resync
- C-26..35: Cancellation flow — reason capture, refund automation tier, waitlist auto-promote
- C-36..45: Mobile booking — geolocation opt-in, 50-mile radius enforcement display, distance-based fee preview
- C-46..55: Multi-signer flow (2-witness gating for Signature-by-Mark per Ohio compliance)
- C-56..65: Add-on selection during booking (apostille, courier, translation, witness)
- C-66..75: Confirmation page — calendar export (.ics), SMS opt-in, prep checklist, document upload prompt

### Sprint D — Client Portal Completeness (65 items)
- D-01: Refactor `ClientPortal.tsx` (892 LOC) — split data fetching into per-tab hooks
- D-02..10: Per-section error boundaries with retry buttons (currently fails entire portal on one query error)
- D-11..20: Skeleton loaders for all 9 portal tabs (only ~5 have them)
- D-21..30: Documents tab — bulk select, ZIP download, share link with expiry, e-sign request
- D-31..40: Chat tab — typing indicators, read receipts, file attachments, search history
- D-41..50: Appointments tab — past-session recording playback, journal entry view, certificate download
- D-51..60: Correspondence tab — formal letter request form, status tracking, PDF generation
- D-61..65: Mount `PackageStatusWidget` + `ShopRecommendationWidget` on overview tab (already created, not mounted)

### Sprint E — Admin Suite Completion (90 items)
- E-01..10: Add `ErrorBoundary` to all 116 admin pages (currently inconsistent)
- E-11..25: Standardize Block-Shadow design across admin (some pages use plain Card, breaks brand)
- E-26..40: Admin sidebar — restore drag-drop persistence, add badges for queues, group by domain
- E-41..50: AdminAppointments — bulk reschedule, kanban view, SLA breach alerts, deadline timer
- E-51..65: AdminCRM (737 LOC refactor) — split lead/contact/deal modules, fix scoring sync
- E-66..75: AdminFinances — P&L drill-down, contractor payout batch, refund audit trail
- E-76..85: AdminAnalytics — funnel viz, cohort retention, service-mix revenue, NPS chart
- E-86..90: AdminAuditLog — search, filter by action/entity, CSV export, retention policy display

### Sprint F — Service Catalog Consolidation (95 items)
- F-01..10: Reconcile 4 sources of truth: `services` table (169) ↔ `serviceRegistry.ts` (41) ↔ `/services/*` pages (46) ↔ `App.tsx` routes (47)
- F-11..30: Audit each of 169 DB services — orphaned (no page), missing intake form, missing pricing rule
- F-31..50: Add missing intake pages for orphaned services (~25 estimated)
- F-51..70: Add `ServiceFlowConfig` entries for all 46 service pages (currently incomplete)
- F-71..85: Add cross-sell rules for 22 services missing recommendations
- F-86..95: ServiceDetail page — schema markup, reviews aggregate, related services, pricing transparency

### Sprint G — Shop System Wiring (45 items)
- G-01..10: Wire `ShopLanding` → `shop_packages` DB query (currently hardcoded?)
- G-11..15: Wire `ShopAddons` → `shop_addons` filter/sort/category tabs
- G-16..20: `ShopCart` real-time sync via `shop_cart_items` + cross-tab broadcast
- G-21..25: `ShopCheckout` Stripe session error handling, abandoned-cart recovery, promo codes
- G-26..30: `stripe-webhook` — receipt email, cart-cleared confirmation, fulfillment trigger
- G-31..35: Fulfillment dashboard for shop orders (admin-side, currently missing)
- G-36..40: Add-on attach during booking flow (D-56 wires this back to shop)
- G-41..45: Authority-tier perk surfacing — priority badge in admin views, "skip the line" indicator for client

### Sprint H — Edge Function Hardening (60 items)
- H-01..15: Audit all 60 functions for Zod input validation (estimated ~20 missing)
- H-16..25: Add rate limiting to public endpoints (`submit-lead`, `discover-leads`, `scan-id`)
- H-26..35: HMAC verify on all webhooks (`signnow-webhook`, `stripe-webhook` already done; audit others)
- H-36..45: DLQ pattern on all webhook receivers + retry workers
- H-46..55: Edge function logs surfaced in `AdminPlatformHealth` with error budgets
- H-56..60: Cold-start optimization — shared imports, KV cache for settings

### Sprint I — Compliance & Ohio RON (55 items)
- I-01..10: Audit all journal entries for `ORC §147.141` per-document requirement enforcement
- I-11..20: 10-year retention scheduler — `cron`-style cleanup, deletion audit log, legal hold flag
- I-21..30: KBA attempt counter UI + 2-attempt hard cap per `ORC §147.66`
- I-31..40: Recording consent gating — block session start without explicit opt-in capture
- I-41..50: Refusal log workflow — admin review queue, ORC-cite dropdown, client notification
- I-51..55: Vital records blocking — bind to `notarial_act_type` enum + audit trail

### Sprint J — UI/UX Polish & Performance (95 items)
- J-01..30: Skeleton loaders on remaining 137 data-heavy pages
- J-31..50: Empty-state components with CTA on all list views (currently mixed)
- J-51..70: Keyboard navigation pass — focus traps in dialogs, escape handling, tab order
- J-71..80: Mobile responsiveness audit — sidebar collapse, table-to-card transforms, sticky CTAs
- J-81..90: Image optimization — convert PNGs to WebP, lazy-load below-fold, CDN headers
- J-91..95: Bundle analysis — code-split routes, tree-shake icons, defer analytics

### Sprint K — Code Quality & Type Safety (80 items)
- K-01..30: Replace 1144 `any` types with proper interfaces (top 30 hottest files)
- K-31..50: Eliminate 13 `XXX/HACK/TODO` markers
- K-51..60: Refactor god-files (`BookAppointment`, `ClientPortal`, `AdminSettings`, `AdminCRM`, `AdminProcessFlows`)
- K-61..70: Extract repeated patterns into hooks (`usePagedQuery`, `useRealtimeTable`, `useFormDraft`)
- K-71..80: Standardize `formatDate`, `formatCurrency`, `formatPhone` — eliminate local duplicates

### Sprint L — Testing & Observability (75 items)
- L-01..15: Vitest unit tests for `pricingEngine`, `bookingEngine`, `ohioCompliance`, `formValidation`
- L-16..30: Playwright e2e suites — booking happy path, RON session, payment, admin auth
- L-31..40: Integration tests for edge functions (Deno test runner)
- L-41..55: Sentry-style error tracking — wire to `audit_log` table + admin dashboard
- L-56..65: Structured logging in all 60 edge functions with `correlation_id`
- L-66..75: Synthetic monitoring — `health-check` cron from external poller, status page

---

## Implementation Order

| Phase | Sprint | Focus | Items |
|---|---|---|---|
| 1 | A + B | Security + Auth (must-fix blockers) | 115 |
| 2 | I + H | Compliance + Edge function hardening | 115 |
| 3 | C + D | Booking + Portal flow fixes | 140 |
| 4 | F + G | Catalog reconciliation + Shop wiring | 140 |
| 5 | E | Admin suite completion | 90 |
| 6 | J + K | UX polish + code quality | 175 |
| 7 | L | Testing + observability | 75 |

**Total: 850 items** (target ≥800)

Each sprint is delivered as a single batch with DB migrations grouped, edge function deploys batched, and a verification report after.

I will start with **Sprint A (Critical Security)** upon approval — fixing the 4 security findings, seeding `pricing_rules`, and tightening RLS — since downstream sprints depend on a clean security baseline.

