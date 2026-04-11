

# NotarDex Master Implementation Plan — Full Service Expansion

## Scope Summary

The uploaded document specifies **93 services** across **20 categories** that need to be built or enhanced, plus supporting admin tools, database tables, and AI integrations. This is a massive undertaking — roughly 30-40 new database tables, 25+ new admin pages, and 15+ client-facing pages.

Given Lovable's per-message constraints, this must be executed in **phases across multiple messages**. Each phase will focus on a category cluster, creating the database migrations first, then the admin UIs, then wiring into the existing service ecosystem.

---

## Architecture Strategy

All new services will follow the existing patterns:
- **Database**: New tables per service domain, all referencing `appointments(id)` and `client_id` where applicable. RLS policies with admin-write, user-read-own.
- **Service Catalog**: Insert rows into the existing `services` table for each new service.
- **Routing**: New admin pages lazy-loaded in `App.tsx` under the `/admin` parent route.
- **Service Requests**: All services create records in `service_requests` with a `service_type` discriminator — no redundant order tables.
- **Pricing**: Rules stored in `pricing_rules` table with appropriate `rule_type`.

---

## Phase 1: Core Notary Enhancements (Sections 2.1–2.9)

**Database migrations:**
- `ron_recordings` table (session recordings archive)
- `loan_signing_packages` + `scanback_tracking` tables
- `i9_verifications` table
- `print_jobs` table
- Surcharge rules seeded into `pricing_rules`

**Admin UI builds:**
- AdminJournal: Add Batch Entry tab, Fee Cap Check badge, PDF Export
- AdminOverview: RON Dashboard tab with real-time session cards
- New `/admin/ron-recordings` page (recording archive)
- New `/admin/loan-signing` page (Packages, Scanbacks, Title Companies tabs)
- New `/admin/i9-verifications` page (guided I-9 workflow)
- New `/admin/scanbacks` page (scanback services dashboard)
- AdminDocuments: Print Queue section
- AdminSettings: Surcharge management (after-hours, weekends, holidays)
- Witness Management section in AdminSettings

**Client-facing:**
- Travel Fee Estimator on BookAppointment page
- Auto-surcharge display on booking confirmation

---

## Phase 2: Document & Field Services (Section 3: 10 services)

**Database migrations:**
- `fingerprint_sessions`, `live_scan_planning`, `process_serving_cases`
- `skip_trace_requests`, `vital_records_requests`, `scrivener_jobs`
- `translation_requests`, `courier_jobs`

**Admin UI builds:**
- `/admin/fingerprinting` — FD-258 session log + supply inventory
- `/admin/live-scan-planning` — ROI calculator + readiness checklist
- `/admin/process-serving` — Kanban case board + affidavit generator
- `/admin/skip-tracing` — request queue + result builder
- `/admin/vital-records` — pipeline tracker + agency directory
- `/admin/scrivener` — UPL-compliant form typing workflow
- `/admin/translations` — translator directory + affidavit generator
- `/admin/courier` — job board + chain of custody
- Enhance AdminApostille with status pipeline + client tracking URL
- Enhance DocumentDigitize with batch processing + OCR queue

---

## Phase 3: Admin/VA, Translation & Language, Identity Services (Sections 4–6)

**Database migrations:**
- `virtual_assistant_tasks`, `data_entry_projects`
- `interpreter_directory`
- `background_checks`, `id_verifications`, `identity_certificates`

**Admin UI builds:**
- `/admin/va-tasks` — VA task management dashboard
- `/admin/data-entry` — data entry projects tracker
- `/admin/interpreters` — interpreter referral directory
- `/admin/background-checks` — BCI/FBI workflow
- `/admin/id-verification` — batch mobile ID verification
- `/admin/identity-certificates` — certificate generation + registry
- Enhance `/admin/translations` with Translator Management tab, language pricing matrix, quality tiers
- Translation Package Builder (client + admin views)

---

## Phase 4: Courier/Filing, Real Estate, Print Marketplace (Sections 7–9)

**Database migrations:**
- `recorder_filings`, `sos_filings`
- `property_photography`, `lockbox_services`, `open_house_support`
- `tenant_document_services`, `property_condition_reports`, `move_inspections`
- `signing_ceremonies`, `document_recording_packages`
- `print_orders`, `print_products`, `print_templates`, `print_vendors`
- `print_vendor_routing_rules`, `design_files`, `shipping_labels`

**Admin UI builds:**
- `/admin/recorder-filings` — county recorder filing tracker
- `/admin/sos-filings` — SOS filing pipeline
- `/admin/photography` — property photography service
- `/admin/real-estate-support` — lockbox, open house, tenant docs, inspections
- `/admin/print-orders` — print marketplace order management
- `/admin/print-products` — product catalog CRUD
- `/admin/print-vendors` — vendor directory + routing rules

---

## Phase 5: Court Forms, Business Services, Immigration, Identity/Security, Tech/Automation, Marketing, Personal Services (Sections 10–16)

**Database migrations:**
- `court_form_jobs`, `permit_filings`, `compliance_calendars`, `compliance_events`
- Immigration-safe service tables
- Tech/automation service tables
- Marketing/branding service tables

**Admin UI builds:**
- `/admin/court-forms` — court form typing with UPL compliance
- `/admin/permits` — business license/permit filing
- `/admin/compliance-calendars` — compliance calendar builder
- Remaining category admin dashboards following the established pattern

---

## Phase 6: UX Consulting & Financial Operations Tools (Sections 17–18)

These are primarily AI-tool-based services that extend the existing AI Tools Hub:
- Add 15 UX consulting tool definitions to `aiToolsRegistry.ts`
- Add 20 financial operations tool definitions to `aiToolsRegistry.ts`
- Register all new tool IDs in the `ai-tools` edge function's `TOOL_IDS` set
- Create appropriate system prompts and field schemas for each tool

---

## Cross-Cutting Work (All Phases)

1. **Service catalog seeding**: INSERT all ~93 services into the `services` table with correct categories, pricing, icons, and descriptions
2. **Sidebar navigation**: Add new admin routes to the admin sidebar component
3. **Service detail pages**: Ensure each new service has `service_requirements` and `service_workflows` entries
4. **Booking integration**: Add new service types to BookAppointment service type dropdown
5. **Client portal**: Surface relevant service statuses in the client portal
6. **Pricing rules**: Seed `pricing_rules` for each service

---

## Execution Order

I will implement this in order: **Phase 1 first** (core notary — highest revenue impact), then phases 2-6 sequentially. Each phase will be one or more messages depending on complexity.

**Shall I proceed with Phase 1?**

---

## Technical Notes

- All new tables get RLS policies: admin full CRUD, authenticated users read/write own records
- All admin pages follow the existing pattern: lazy-loaded, `PageShell` wrapper, shadcn/ui data tables
- New service rows use the existing `services` table schema (no new catalog tables)
- All fee calculations respect Ohio statutory caps where applicable
- UPL compliance gates are mandatory for any document preparation service

