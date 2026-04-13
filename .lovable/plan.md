

# NotarDex 107-Service Integration Blueprint — Implementation Plan

This document covers layering the Complete Integration Blueprint (50 pages, 107 services) over the existing ecosystem. Nothing is removed. The theme is unchanged. All new work plugs into existing tables, hooks, and patterns.

---

## What Already Exists (No Changes Needed)

The database already has most foundational tables referenced in the blueprint: `services` (with 90+ rows), `service_requests`, `pricing_rules`, `notification_queue`, `audit_log`, `appointments`, `payments`, `profiles`, `documents`, `journal_entries`, `i9_verifications`, `loan_signing_packages`, `scanback_tracking`, `apostille_requests`, `tool_generations`, `witnesses`, `fingerprint_sessions`, `translation_requests`, `vital_records_requests`, `process_serving_cases`, `court_form_jobs`, `scrivener_jobs`, `print_jobs`, `print_orders`, `real_estate_services`, `sos_filings`, `recorder_filings`, `skip_trace_requests`, `mileage_logs`, `profit_share_config`, `profit_share_transactions`, `crm_activities`, `deals`, `leads`, and 50+ more. Admin pages exist for most services. The service registry, booking engine, compliance engine, CRM, payment processing, and document pipeline are all operational.

---

## Sprint 1: Cross-Service Wiring Enhancements

**Goal**: Strengthen the 6 shared engines the blueprint defines so every service plugs in consistently.

### 1A. Reusable Service Scaffold Components (4 new files)

| File | Purpose |
|------|---------|
| `src/components/services/ServiceIntakeForm.tsx` | Dynamic form renderer — accepts `serviceSlug`, field config array, renders form with file upload, pricing sidebar, consent checkboxes. Submits to `service_requests` with JSONB metadata |
| `src/components/admin/ServiceAdminDashboard.tsx` | Reusable admin DataTable — accepts `serviceType`, column defs, detail component. Status filter tabs, search, date range, CSV export, inline status update with audit_log write |
| `src/components/services/CrossSellPanel.tsx` | Post-completion recommendation cards from `cross_sell_rules` table, sorted by relevance |
| `src/hooks/useServiceScaffold.ts` | Unified hook: `useServiceRequest` CRUD, `useCrossSell` queries, status change with notification enqueue |

### 1B. Database: `cross_sell_rules` table + seed data

- Create `cross_sell_rules` table (trigger_service_type, recommended_service_type, relevance_score, display_message, is_active)
- Seed ~30 cross-sell rules mapping service completions to recommendations

### 1C. Enhanced PricingCalculator

- Enhance existing `src/components/services/PricingCalculator.tsx` (or create if missing) to read `pricing_rules` per service, apply travel zone, rush surcharge, bulk discount, tax, and enforce ORC fee caps
- Wire to `platform_settings` for tax rate and fee cap values

### 1D. Document Pipeline Components (enhance existing)

- `src/components/documents/DocumentPipeline.tsx` — master stage UI (Upload → Scan → Review → Generate → Sign → Deliver)
- `src/components/documents/DocumentReviewPanel.tsx` — side-by-side original + extracted data for admin review
- `src/components/documents/DocumentDelivery.tsx` — client-facing download + email delivery
- These wrap existing document upload/storage patterns without replacing them

---

## Sprint 2: Core Notary Service Enhancements (Services 4.1–4.9)

These services mostly **exist** and need enhancement:

### 2A. RON Dashboard Enhancement
- Build `/admin/ron` dashboard with real-time session cards (Active, Scheduled, Completed, Revenue)
- Add post-session compliance checklist (7 mandatory items per ORC) gating completion
- Fee auto-calc: `(acts × $30) + $10 tech fee + tax`

### 2B. Loan Signing Package Manager
- Enhance `AdminLoanSigning.tsx` with package type selector (5 types), type-specific doc checklists
- Scanback Tracker with due-date color coding (green/yellow/red) and late alerts
- Title Company Directory CRUD at `/admin/title-companies`

### 2C. I-9 Verification 5-Step Wizard
- Enhance `AdminI9Verifications.tsx` with guided wizard: Select Employer → Employee Info → Document Verification (List A vs B+C validator) → Section 2 → PDF Generation
- Batch scheduling for employers with multiple employees

### 2D. Witness Services Module
- Enhance using existing `witnesses` table
- Add conflict-of-interest checker, availability calendar, fee tracking
- Witness assignment panel for estate planning and RON sessions

### 2E. New: Oath/Affirmation Administration
- New table: `oath_records`
- Oath vs Affirmation type selector with ORC §147.03 statutory language templates
- 8-step workflow with auto journal entry creation
- Admin page at `/admin/oath-administration`

### 2F. New: Certified Copy Services
- New table: `certified_copies`
- Side-by-side comparison tool, certification stamp generator
- Per-copy fee at $5.00 (ORC §147.08 cap)
- Admin page at `/admin/certified-copies`

### 2G. Document Printing & Prep Enhancement
- Enhance existing print system with page counter, per-page fee calculator ($0.25 BW / $0.75 color + $10 prep)
- Collation tool with drag-and-drop ordering
- Client intake at `/services/document-printing`

### 2H. Travel Fee & Mileage System
- New table: `travel_zones` (5 default zones seeded)
- Travel Zone Manager at `/admin/travel-zones`
- Travel Fee Estimator on booking page (distance calc from Jefferson, OH)
- Mileage Log Dashboard at `/admin/mileage` with IRS deduction tracking ($0.67/mile)

---

## Sprint 3: Document & Identity Services (Phase 2 — 14 Services)

All **new builds** following the service scaffold pattern:

| # | Service | Admin Page | Client Intake |
|---|---------|------------|---------------|
| 5.1 | Clerical Document Preparation | `/admin/clerical-doc-prep` | `/services/clerical-document-preparation` |
| 5.2 | Document Cleanup & Formatting | `/admin/document-cleanup` | `/services/document-cleanup` |
| 5.3 | Form Filling Assistance | `/admin/form-filling` | `/services/form-filling` |
| 5.4 | PDF Services (6 tools) | `/admin/pdf-services` | `/services/pdf-services` |
| 5.5 | Document Scanning & Digitization | `/admin/document-scanning` | `/services/document-scanning` |
| 5.6 | Document Translation | Enhance existing `AdminTranslations` | `/services/document-translation` |
| 5.7 | Apostille Coordination | Enhance existing `AdminApostille` | `/services/apostille-coordination` |
| 5.8 | Apostille Facilitation | Enhance `AdminApostille` tab | `/services/apostille-facilitation` |
| 5.9 | Consular Legalization Prep | New admin tab | `/services/consular-legalization` |
| 5.10 | KYC/ID Verification | New page | `/services/kyc-verification` |
| 5.11 | Background Check Coordination | Enhance existing `AdminBackgroundChecks` | `/services/background-check` |
| 5.12 | Passport Photo Service | New page | `/services/passport-photo` |
| 5.13 | Ink Fingerprinting | Enhance existing `AdminFingerprinting` | `/services/fingerprinting` |
| 5.14 | Interpreter Services | New page | `/services/interpreter` |

Each service gets:
- A row in the `services` table (if not already present)
- Pricing rules in `pricing_rules`
- Cross-sell rules in `cross_sell_rules`
- Service-specific intake form using `ServiceIntakeForm` scaffold
- Admin dashboard using `ServiceAdminDashboard` scaffold
- Route in `App.tsx` with lazy loading

New tables needed:
- `country_requirements` (for apostille/consular — 50+ country profiles)
- `passport_photo_jobs`, `interpreter_sessions` (lightweight tracking)

---

## Sprint 4: Legal Support & Business Services (Phase 3 — 15 Services)

Services like estate planning support, contract review, court form packages, business formation, paralegal support, etc. Most have existing admin pages — this sprint wires them into the unified scaffold with proper intake forms, UPL guards, and cross-sell.

Key new components:
- `UPLGuard.tsx` wrapper — mandatory legal disclaimer for all legal support intake forms (ORC §4705.07)
- Enhanced court form admin pages with county-specific form selectors
- Business formation wizard (LLC, Corp, DBA) with SOS filing integration

---

## Sprint 5: Marketplace & Specialty Services (Phase 4 — 20+ Services)

Contractor marketplace wiring, specialty services (skip tracing, process serving, mediation coordination, tax prep referrals, etc.). Most admin pages already exist. This sprint:
- Registers remaining services in `services` table
- Adds contractor assignment flows via existing `contractor_assignments` table
- Builds client-facing intake pages for services lacking them
- Wires all to `ServiceIntakeForm` → `ServiceAdminDashboard` → `PaymentEngine` → `CrossSellPanel`

---

## Sprint 6: Global Settings Admin Panel & Compliance Engine

### 6A. Global Settings Panel Enhancement
- Enhance existing `/admin/settings` with 6 structured tabs from the blueprint (Platform Identity, Service Controls, Pricing Engine, Notification Templates, Compliance Settings, Integration Keys)
- Seed missing `platform_settings` keys for tax rate, fee caps, travel multiplier, rush surcharge, bulk discount thresholds
- Test connection buttons for each integration

### 6B. Compliance Engine Components
- `ComplianceWatchdog.tsx` — background credential expiration monitor with persistent admin banner
- `ComplianceScorecard.tsx` — dashboard widget (commission, E&O, bond, NNA, background check status)
- `FeeCapsValidator.tsx` — called by PricingCalculator, enforces $5 in-person / $30 RON / $10 tech fee caps
- `JournalComplianceChecker.tsx` — validates journal entries against ORC §147.04
- Admin compliance dashboard at `/admin/compliance` (enhance existing `AdminComplianceReport`)

### 6C. AI Service Completion Engine Enhancement
- Enhance existing `tool_generations` table usage
- `SmartIntake.tsx` — auto-fill from client history
- `QualityChecker.tsx` — AI review of generated documents
- `SmartSuggestionEngine.tsx` — next-best-action recommendations

---

## Database Migrations Summary

| Migration | Tables/Changes |
|-----------|---------------|
| 1 | `cross_sell_rules`, `travel_zones` (new), `oath_records` (new), `certified_copies` (new) |
| 2 | `country_requirements` (new), `passport_photo_jobs` (new), `interpreter_sessions` (new) |
| 3 | Add `service_type` slug column to `services` if missing, seed new service rows |
| 4 | Seed `pricing_rules` for all 107 services, seed `cross_sell_rules` (~30 rules), seed `travel_zones` (5 zones), seed `country_requirements` (50+ countries) |
| 5 | Add missing `platform_settings` keys for pricing engine, compliance, notification templates |

---

## New Files Summary (~35 new components/pages, ~15 enhanced)

- 4 scaffold components (ServiceIntakeForm, ServiceAdminDashboard, CrossSellPanel, useServiceScaffold)
- 5 compliance components (Watchdog, Scorecard, FeeCapsValidator, UPLGuard, JournalComplianceChecker)
- 4 document pipeline components (Pipeline, ReviewPanel, Delivery, SignatureManager)
- ~14 new service intake pages under `/services/`
- ~8 new or enhanced admin pages
- 2 new core notary modules (oath_records, certified_copies)
- Travel zone system (admin + booking integration)
- AI service engine enhancements (SmartIntake, QualityChecker)

---

## Implementation Approach

Due to the scale (107 services across 6 sprints), implementation will proceed sprint-by-sprint. Each sprint produces working, tested code before moving to the next. The scaffold components (Sprint 1) are built first since every subsequent service depends on them. No existing services, components, tables, or routes are removed. All new work layers on top. The existing theme (Block Shadow design system, rounded-[24px] cards, font-black headings) is preserved throughout.

