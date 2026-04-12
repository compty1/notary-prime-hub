

# Comprehensive Pricing Overhaul & Gap Analysis Plan

## Summary
Update the platform's pricing engine, fee calculator, and service pricing catalog to match the Central Ohio Competitive Pricing Audit 2026 recommendations, then generate a CSV of all remaining gaps from both documents.

## What Changes

### 1. Pricing Engine Overhaul (`src/lib/pricingEngine.ts`)
Update `DEFAULT_SETTINGS` and `PricingInput`/`PricingBreakdown` to reflect the audit's recommended model:

- **RON fees**: Change from $25 platform + $15 KBA to **$30/act** (ORC statutory max) + **$10 tech fee/session** = $40 total (or $45 bundled all-in)
- **Zone-based travel** (from West Jefferson 43162):
  - Zone 1 (0-15 mi): $25
  - Zone 2 (15-30 mi): $40
  - Zone 3 (30-45 mi): $55
  - Zone 4 (45+ mi): $55 + $1.50/mi beyond 45
- **New add-on surcharges**: Jail/prison ($75 + zone travel), hospital/nursing (+$20), government facility (+$20), POA surcharge ($25), holiday ($50), weekend ($0 — competitive advantage), wait time ($20/15-min), printing/doc set ($15), scanback ($15), courier ($25), I-9 verification ($45), estate bundle ($100 flat), extra signer ($5)
- **Loan signing packages**: Standard $125, Purchase $150, Reverse Mortgage $175
- **Cancellation/no-show policy fees**: <2hr cancel $40, 2-24hr cancel $25, no-show $50, loan no-show full charge, wait time $20/15min, rescheduling free with 4+ hrs notice
- **Witness fee**: $15/witness (up from $10)
- **Rush fee**: $25 (down from $35)
- **Apostille**: $175 (up from $75)

### 2. Service Pricing Catalog (`src/lib/servicePricing.ts`)
Update ~15 existing service prices to match audit recommendations:
- Mobile Notary: $45-$60 (Zone 1-2 total cost)
- RON: $40-$45 all-in
- Loan Signing: $125-$175
- After-Hours: $35 (not $25-$50)
- Rush: $25 (not $35-$75)
- Witness: $15 (not $10)
- I-9: $45 (not $25-$50)
- Apostille: $175 (not $75-$150)
- Hospital/Facility: $65-$100 (act + travel + $20 surcharge)
- Jail/Prison: $100-$150 ($75 surcharge + zone travel)
- Add new services: Estate Plan Bundle ($100 flat), Scanback ($15), Document Printing ($15/set), Courier Delivery ($25), Wait Time Fee ($20/15min), Cancellation Fee ($25-$40), No-Show Fee ($50)

### 3. Fee Calculator Enhancement (`src/pages/FeeCalculator.tsx`)
- Replace mileage-based travel with **zone selector** (Zone 1-4) with auto-detection from address
- Add **facility type** selector: Standard, Hospital/Nursing, Jail/Prison, Government
- Add **loan signing mode** toggle with package selection
- Add **estate plan bundle** option
- Display cancellation/no-show policy summary
- Show competitive positioning badges ("Below Market", "Free Weekends")

### 4. Pricing Menu Enhancement (`src/pages/PricingMenu.tsx`)
- Add "Cancellation & No-Show Policy" section
- Add "Payment Methods" section (cards, cash, Zelle, Venmo, CashApp, Apple/Google Pay)
- Add "Service Area & Travel Zones" visual section
- Add competitive positioning callouts from audit Section 8

### 5. Pricing Engine Tests (`src/test/pricingEngine.test.ts`)
- Update tests to match new default values (RON $30+$10, witness $15, rush $25, zones)
- Add tests for zone-based travel, facility surcharges, loan signing packages

### 6. Brand Validation
- Brand file (`src/lib/brand.ts`) already uses "Notar" consistently
- Verify the teamLead name matches audit ("Shane LeCompte" in audit vs "Shane Goble" in brand.ts — will flag for user decision)

### 7. Generate Comprehensive Gap CSV
Python script producing `/mnt/documents/notar_implementation_gaps_v2.csv` covering:
- All Implementation Plan items (GAP-P0 through GAP-P3) mapped against current codebase status
- Items already implemented (RBAC, audit trail, input validation, migrations, health-check edge function, CSRF, rate limiting, error boundaries, accessibility basics)
- Items out-of-scope for Lovable architecture (Docker, CI/CD GitHub Actions, Prometheus, k6, BullMQ, Redis, Pino logging)
- Remaining actionable items with specific implementation steps

## Technical Details

**Files modified:**
- `src/lib/pricingEngine.ts` — new interfaces, zone logic, surcharges, loan packages
- `src/lib/servicePricing.ts` — ~20 price adjustments + ~7 new service entries
- `src/pages/FeeCalculator.tsx` — zone selector, facility type, loan mode, policy display
- `src/pages/PricingMenu.tsx` — policy sections, payment methods, zone map
- `src/test/pricingEngine.test.ts` — updated test suite

**Files created:**
- `/mnt/documents/notar_implementation_gaps_v2.csv` — comprehensive gap analysis

**No database changes required** — all pricing is driven by the engine defaults + `platform_settings` table overrides.

