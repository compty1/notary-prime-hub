

# Comprehensive Enhancement Plan — All Uploaded Documents

This plan layers enhancements from all 5 uploaded documents over the existing build. Nothing is removed. The theme is preserved.

---

## Document Summary

1. **ServiceFlow-2.pdf** — Full-stack audit (security, architecture, frontend, testing, infra, docs) with prioritized gap analysis and remediation plans
2. **services.pdf** — Complete service catalog screenshots showing ~60+ services across categories (Identity, Document, Authentication, Translation, Business, Admin, Content, Research, Customer Service, Technical Support, UX) with pricing and CTAs
3. **Shop Integration Blueprint** — 3-layer notary package shop system (/shop with 4 tiers: Starter $79, Professional $179, Business Builder $349, Authority $699), dashboard widgets, content-embedded touchpoints, add-on marketplace (16 SKUs), cart/checkout
4. **Service Package System (XLSX)** — Package tier data, SKU details, and pricing matrix
5. **Module Expansion Mockups** — UI mockups for Estate Planning, Business Contracts, Real Estate Closings, Dynamic Booking System, Client Portal, and Content Library modules

---

## Sprint 1: Notary Shop System (Shop Blueprint — Highest Revenue Impact)

### 1A. Database Tables
- `shop_packages` (id, tier_name, slug, tagline, physical_price, digital_price, complete_price, badge, persona_match, features JSONB, sort_order)
- `shop_addons` (id, name, category, price, description, compatible_tiers TEXT[], is_active)
- `shop_cart_items` (id, user_id, item_type, item_id, variation, quantity, created_at)
- `shop_orders` (id, user_id, items JSONB, total, status, stripe_session_id, created_at)
- Seed 4 package tiers + 16 add-ons from the blueprint

### 1B. Shop Pages (New Routes)
- `/shop` — Landing with hero, persona quick-filter bar, 4-tier comparison cards, trust signals, social proof
- `/shop/packages` — Full tier comparison grid
- `/shop/[tier]` — Individual package page (variation toggle: Physical/Digital/Complete, deliverables checklist, accordion, upsell comparison, add-on selector, price breakdown)
- `/shop/add-ons` — 16-item grid with category filter tabs (Supplies, Digital Tools, Branding, Marketing)
- `/shop/cart` — Cart page with item management
- `/shop/checkout` — Stripe checkout integration

### 1C. Dashboard Contextual Widgets (Layer 2)
- `ShopRecommendationWidget.tsx` — Smart cards in notary dashboard triggered by account status (e.g., "No journal set up" → Journal add-on)
- `PackageStatusWidget.tsx` — Active package display with reorder capability

### 1D. Content-Embedded Touchpoints (Layer 3)
- `ProductCalloutCard.tsx` — Reusable component for embedding product recommendations in resource/guide pages
- Wire into existing resource pages contextually

---

## Sprint 2: Expanded Service Catalog (services.pdf — ~30 New/Enhanced Services)

### New Service Categories & Intake Pages
These services appear in the catalog but lack dedicated intake pages:

**Translation & Language (4 new):**
- `/services/standard-translation`, `/services/certified-translation`, `/services/court-certified-translation`, `/services/credential-evaluation`

**Business & Volume (3 new):**
- `/services/business-subscriptions`, `/services/api-integration`, `/services/white-label-partner`

**Recurring & Value-Add (3 new):**
- `/services/virtual-mailroom`, `/services/template-library`, `/services/document-storage-vault` (enhance existing)

**Consulting & Training (2 new):**
- `/services/ron-onboarding-consulting`, `/services/workflow-audit`

**Business Services (3 new):**
- `/services/email-management`, `/services/certified-doc-prep-agencies`, `/services/registered-agent`

**Administrative Support (2 new):**
- `/services/data-entry`, `/services/travel-arrangements`

**Content Creation (3 new):**
- `/services/blog-writing`, `/services/social-media-content`, `/services/newsletter-design`

**Research (2 new):**
- `/services/market-research`, `/services/lead-generation`

**Customer Service (2 new):**
- `/services/email-support`, `/services/live-chat-support`

**Technical Support (1 new):**
- `/services/website-content-updates`

**UX Services (1+ new):**
- `/services/ux-audit`

Each uses the existing `ServiceIntakeForm` scaffold and registers in `services` table + `service_registry.ts`.

---

## Sprint 3: Module Expansion (Mockups PDF)

### 3A. Estate Planning Services Page Enhancement
- Enhance `/services/estate-planning` with the mockup layout: POA, Living Wills, Healthcare Directives, Trust Certifications as numbered service items with ORC references
- Service time estimate display, pricing from $25/notarization

### 3B. Business Contracts Module
- New/enhanced `/services/business-contracts` page matching mockup: Articles of Incorporation, Operating Agreements, Partnership Agreements, Commercial Leases, Vendor Contracts, Corporate Resolutions
- Starting at $25/notarization, 20-40 min estimate

### 3C. Real Estate Closings Module
- Enhanced `/services/real-estate-closings` with 4-step process flow (Title Company Contact → Document Review → Mobile Closing → Return & Confirm)
- Service list: Mortgage Closings, Deed Transfers, Refinance Signings, Title Affidavits, Seller Packages, HELOC Signings
- Starting at $150/signing, 7-County Central Ohio coverage

### 3D. Dynamic Booking System Enhancement
- Enhance booking calendar with week/day/month view matching mockup
- Zone-based travel integration, buffer management, real-time availability
- Smart duration logic per service type

### 3E. Client Portal Enhancement
- Document tracking with stage progress bars
- Payment history timeline
- Compliance dashboard for client-facing view

### 3F. Content Library Module
- `/resources` hub with FAQs, ORC references, educational blog, guides
- Wire shop touchpoints (Layer 3) into content pages

---

## Sprint 4: Audit Remediation (ServiceFlow-2.pdf — Priority Items Only)

The audit document is a generic full-stack audit. Many items (RBAC, RLS, secrets management, CSP headers) are **already implemented** in the current build. This sprint addresses gaps that are actually applicable:

### 4A. Frontend Enhancements
- Add `ErrorBoundary` wrappers to major route sections (FE-009)
- Add skeleton/loading states to data-heavy pages (FE-008)
- Enhance form validation with inline error messages on all intake forms (FE-007)
- Accessibility pass: ensure ARIA labels on interactive elements, keyboard navigation on shop pages (FE-003)

### 4B. API & Edge Function Hardening
- Add Zod input validation to any edge functions missing it (SEC-003 — most already have it)
- Verify rate limiting on sensitive endpoints (SEC-002 — already implemented on most)
- Add health check edge function for monitoring (INFRA-005)

### 4C. Documentation
- Add inline JSDoc comments to scaffold components and hooks
- Add README section for service scaffold usage pattern

---

## Sprint 5: Cross-Wiring & Integration Polish

### 5A. Service Registry Update
- Add all new services from Sprint 2 to `serviceRegistry.ts` (~25 new entries)
- Update `ServicesMenu` navigation to include new categories

### 5B. Cross-Sell Rules Expansion
- Seed ~20 additional cross-sell rules for new services (e.g., Translation → Apostille, Business Formation → Registered Agent)

### 5C. Pricing Rules Seeding
- Add `pricing_rules` rows for all new services with correct fee ranges from the catalog

### 5D. Shop ↔ Service Integration
- Wire shop package purchases to unlock service tiers/discounts
- "Authority" tier purchasers get priority scheduling flag on appointments

---

## Database Migrations Summary

| Migration | Changes |
|-----------|---------|
| 1 | `shop_packages`, `shop_addons`, `shop_cart_items`, `shop_orders` tables with RLS |
| 2 | Seed 4 package tiers, 16 add-ons from blueprint |
| 3 | Insert ~25 new service rows into `services` table |
| 4 | Seed corresponding `pricing_rules` and `cross_sell_rules` |

---

## New Files Summary (~45 new components/pages)

- **Shop system:** ~10 pages/components (ShopLanding, PackagePage, AddOnMarketplace, Cart, Checkout, TierComparisonGrid, ProductCalloutCard, ShopRecommendationWidget, PackageStatusWidget, AddOnCard)
- **Service intake pages:** ~25 new pages using ServiceIntakeForm scaffold
- **Module enhancements:** ~5 enhanced pages (EstateePlanning, BusinessContracts, RealEstateClosings, BookingCalendar, ClientPortal)
- **Infrastructure:** ErrorBoundary wrappers, skeleton states, health check function
- **Service registry:** Updated with ~25 new entries

---

## Implementation Order

1. **Shop system first** (highest revenue impact, new capability)
2. **Service catalog expansion** (uses existing scaffold, fast to build)
3. **Module expansions** (enhance existing pages per mockups)
4. **Audit remediation** (polish and hardening)
5. **Cross-wiring** (final integration pass)

No existing services, components, or routes are removed. All work layers on top of the current build.

