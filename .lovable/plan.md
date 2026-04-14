

# Service Flows Comprehensive Audit & Remediation Plan

## Key Findings

### 1. SERVICE FLOW GAPS

**`serviceFlowConfig.ts` covers only 12 of 42 registry services** — 30 services in the registry have no flow config (no steps, no document checklists, no turnaround time). And the DB has 139 active services vs 42 in the registry.

Missing flow configs for active registry services:
- `standard-translation`, `certified-translation`, `court-certified-translation`, `credential-evaluation`
- `business-subscriptions`, `api-integration`, `white-label-partner`
- `ron-onboarding-consulting`, `workflow-audit`
- `email-management`, `registered-agent`
- `data-entry`, `travel-arrangements`
- `blog-writing`, `social-media-content`, `newsletter-design`
- `market-research`, `lead-generation`
- `email-support`, `live-chat-support`
- `website-content-updates`, `ux-audit`
- `document-digitization` (exists but marked `hasAdminDashboard: false`)
- `fingerprinting`, `process-serving`, `courier`, `background-check`, `passport-photo`, `kyc-verification`

### 2. FILE UPLOAD IS NON-FUNCTIONAL

`ServiceIntakeForm.tsx` line 161-165: File upload field shows "File upload will be available after submission" placeholder. Process Serving, Background Check, and other services list `type: "file"` fields that don't actually upload anything. This is a critical gap for services like Process Serving where documents to serve are required.

### 3. CROSS-SELL RULES MISSING FOR CORE SERVICES

55 cross-sell rules exist but **28 core active services** (notarization, court_forms, authentication, real_estate, translation, etc.) have zero cross-sell rules. The `CrossSellPanel` component exists and works but is never shown on most intake form success screens.

### 4. SERVICE DESCRIPTIONS / SHORT DESCRIPTIONS

2 active services have NULL `short_description`:
- Apostille Coordination (authentication)
- Newsletter/Magazine Production (publishing)

### 5. SERVICE WORKFLOWS MISSING FROM DB

73+ active services have NO `service_workflows` entries. This means the `ServiceDetailPanel` component renders "No specific requirements or workflow steps configured" for those services. Affected categories: all court_forms (9), all compliance (5), all creative (3), all financial (5), all operations_hr (6), all print (22), all publishing (3), all real_estate (3), all sales_cx (7), all subscription (3).

### 6. ADMIN DASHBOARD GAPS

- **`ServiceAdminDashboard`** reusable component exists but is **never used** in any admin page. All admin pages use custom implementations instead.
- No admin pages for: compliance services (5), creative services (3), financial services (5), digital_legacy (1), operations_hr (6), most sales_cx (7), subscription plans (3), most print services.
- `AdminServiceRequests.tsx` exists as a catch-all but lacks service-specific tools/views.

### 7. INTAKE PAGES HAVE MINIMAL CONTENT

All 43 service intake pages use the same bare pattern:
- Title + 1-line description + field list + single price string
- **No packages/tiers** (e.g., Basic/Standard/Rush)
- **No add-ons** section (e.g., "Add expedited processing +$25")
- **No FAQ** section
- **No "What to Expect" / turnaround info** even though `serviceFlowConfig` has this data
- **No document checklist display** even though the data exists
- **No cross-sell panel** after submission

Only `EstatePlanningServices.tsx` and `RealEstateClosingsServices.tsx` have rich content pages with process steps, pricing tables, coverage areas, and bundles.

### 8. PRICING NOT CONNECTED TO PRICING ENGINE

`pricingQuoteGenerator.ts` exists with travel zones, rush multipliers, RON fees, and statutory caps, but it's never invoked from any intake form. The `estimatedPrice` on intake pages is a hardcoded string.

---

## Implementation Plan

### Phase 1: Fix Critical Bugs (3 items)

1. **Make file upload functional** in `ServiceIntakeForm.tsx` — upload to Supabase `documents` bucket, store URL in `intake_data`
2. **Connect `CrossSellPanel`** to intake form success screen so recommendations show after submission
3. **Fill 2 missing `short_description` values** via DB insert

### Phase 2: Enrich Service Intake Pages (43 pages)

For each of the 43 service intake pages, enhance with:
- **Service packages/tiers** (e.g., Standard / Rush / Premium) where applicable
- **Add-ons** section with checkboxes and pricing
- **"What to Expect"** section pulling from `serviceFlowConfig` data
- **Document checklist** rendering (what clients need to prepare)
- **FAQ** section with 3-5 common questions per service
- **Turnaround time** display

Priority services to enrich first (highest traffic):
1. RON / In-Person / Mobile Notarization (booking flow, not intake)
2. Fingerprinting, Process Serving, Apostille, Business Formation
3. Estate Planning, Loan Signing, Court Forms
4. Translation services, Document services

### Phase 3: Add Missing Service Flow Configs (30 services)

Add entries to `serviceFlowConfig.ts` for all 30 missing registry services, including proper steps, document checklists, turnaround times, and post-actions.

### Phase 4: Seed Cross-Sell Rules (28 services)

Insert cross-sell rules for the 28 core services missing them. Examples:
- Apostille → Certified Translation, Consular Legalization
- Divorce Filing → Process Serving, Notarization, Custody Package
- Business Formation → Registered Agent, Business Subscription
- Mobile Notarization → Estate Plan Bundle, Loan Signing

### Phase 5: Seed Service Workflows in DB (73 services)

Insert `service_workflows` step data for the 73 active services with no workflow steps, so `ServiceDetailPanel` shows real content.

### Phase 6: Admin Dashboard for Uncovered Categories

Create lightweight admin views for categories without dedicated dashboards:
- Compliance services admin
- Financial services admin
- Creative services admin
- Operations/HR admin
- Sales/CX admin

These can use the existing `ServiceAdminDashboard` reusable component.

### Phase 7: Connect Pricing Engine to Intake

Wire `pricingQuoteGenerator.ts` into notarization and document service intake forms to show dynamic pricing based on signer count, document count, rush, travel zone, etc.

---

## Technical Details

### Files to Create
- `src/components/services/ServicePackages.tsx` — reusable tier/package selector
- `src/components/services/ServiceAddOns.tsx` — add-on checkboxes with pricing
- `src/components/services/ServiceFAQ.tsx` — FAQ accordion per service
- `src/components/services/ServiceChecklist.tsx` — document checklist display
- `src/components/services/ServiceTimeline.tsx` — "What to Expect" steps view
- 5-6 new admin pages for uncovered categories

### Files to Modify
- `src/components/services/ServiceIntakeForm.tsx` — file upload, cross-sell, packages, add-ons, FAQ, checklist, timeline integration
- All 43 `src/pages/services/*.tsx` — add service-specific packages, add-ons, FAQs
- `src/lib/serviceFlowConfig.ts` — add 30 missing flow configurations
- `src/App.tsx` — add routes for new admin pages

### Database Changes
- Insert ~140 cross-sell rules for 28 services
- Insert ~350 service_workflow steps for 73 services
- Update 2 services with missing short_descriptions

### Estimated Scope
- ~50 files modified, ~6 files created
- ~200 DB inserts (cross-sell + workflows)
- No schema changes needed

