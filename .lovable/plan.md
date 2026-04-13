

# Master Enhancement Plan — Consolidated & Expanded

This plan preserves ALL existing sprints (1-21) from all prior plan versions and adds new items. Nothing is removed.

---

## Unbuilt Items from Prior Plans (Must Complete First)

These were approved but never implemented:

| Item | Status |
|------|--------|
| Credential Vault (`user_credentials` table + `CredentialVault.tsx`) | Not started |
| Todo System (`user_todos` table + `TodoPanel.tsx`) | Not started |
| AI Service Workspace (edge function + workspace + hook + configs) | Not started |
| Category Tool Panels (6 files: Translation, Legal, Content, Business, Immigration, Research) | Not started |
| Admin Equipment Tab (`admin_equipment` table + `AdminEquipment.tsx`) | Not started |
| Vendor Products & Auto-Enrich (`vendor_products` table + edge functions) | Not started |
| E-Courses System (4 tables + admin/portal pages) | Not started |
| Accounting & Tax Center (`accounting_transactions` + `mileage_entries`) | Not started |
| Document Collaboration (4 tables + workspace) | Not started |
| Embeddable Widgets (BookNow, Availability, etc.) | Not started |
| Dispatch & Routing Engine | Not started |
| Notification & Messaging Hub | Not started |
| Micro-Tools (SignatureGenerator, StampPreview, FeeCalc, etc.) | Not started |
| Notary logo upload + transition fix | Not started |
| Event Bus (`platform_events`) | Not started |
| Per-service admin dashboard enhancements (~30 pages) | Not started |

---

## Bug Fix: Service Catalog CTA Routing

**Problem:** In `Services.tsx`, the `getServiceAction()` function falls through to `"/book"` with label `"Book Now"` for any service NOT in `INTAKE_ONLY_SERVICES`, `SAAS_LINKS`, or `SUBSCRIPTION_SERVICES`. This incorrectly routes non-notary services (e.g., "Business Formation", "RON Onboarding Consulting") to the notary booking scheduler.

**Fix:**
- Update `getServiceAction()` to check the service `category` against `NOTARY_CATEGORIES` FIRST
- Non-notary services that aren't in any special set should route to `/request?service=...` with label "Request Service" or "Get Started"
- Add missing services to `INTAKE_ONLY_SERVICES` set: "Business Formation", "RON Onboarding Consulting", "Workflow Audit & Automation", "Credential Evaluation"
- Also update `serviceFlowConfig.ts` entries: `i9-verification` should NOT use `intakeRoute: "book"` — it should use `"request"` since it's not a notary service

---

## New Sprint 22: Business Expansion Hub for Notaries & Professionals

### Content & Guides
Create a `BusinessExpansionHub.tsx` page at `/portal/business-growth` (also linked from admin) with:

**For Notaries:**
- Guide: "How to Get Business Clients as a Notary" — real strategies (title company outreach, real estate agent networking, hospital/nursing home partnerships, law firm relationships, signing services, Google Business Profile optimization)
- Guide: "Common Obstacles & What Worked" — curated from real practitioner experiences (Reddit, NNA forums): dealing with low-ball offers, competing with mobile apps, handling after-hours requests, marketing on a budget
- Template: Cold email generator — select target (title company, law firm, real estate agent, hospital, insurance company) and service offering, AI generates personalized outreach email
- Template: Follow-up email sequences
- Template: Service introduction letter
- Checklist: "Launch Your Notary Business in 30 Days"

**For Professionals (non-notary):**
- Guide: "Building a Client Base for Document Services" — LinkedIn outreach, referral systems, local business partnerships, online directories
- Guide: "Pricing Your Services Competitively"
- Template: Service proposal generator — select services from catalog, AI builds professional proposal
- Template: Client onboarding packet generator
- Common obstacles: finding first clients, scope creep, managing remote clients

**For Admin:**
- Combined view of all growth resources
- Analytics on which guides/templates are most used

### Database
- `growth_resources` table (id, title, slug, category, content_html, resource_type enum('guide','template','checklist','tool'), target_audience enum('notary','professional','both'), created_at)

### AI Edge Function Enhancement
- Add `mode: "outreach_email"` to `service-ai-copilot` — generates industry-specific outreach emails based on selected services and target audience

---

## New Sprint 23: Enhanced Document Anatomy System

### Expanded Callout Data
Update `DOCUMENT_ANATOMY` in `AnatomyDiagram.tsx` to include MORE granular callouts for each document type. Every single element should be explained:
- Add callouts for: margin requirements, paper size, ink color requirements, stapling/binding rules, page numbering, recording stamps area, clerk filing stamps area, notary journal cross-reference notation
- Add new document types: `deed_transfer`, `affidavit_general`, `living_will`, `healthcare_directive`, `trust_certification`, `commercial_lease`, `articles_of_incorporation`

### Per-Document Tool Modules
For each document anatomy entry, add contextual tools accessible from the resource page:

| Document | Tools |
|----------|-------|
| Acknowledgment | Certificate wording generator, venue auto-fill, signer capacity checker |
| Jurat | Oath script generator, sworn vs affirmed selector, oath administration checklist |
| Copy Certification | Vital records prohibition checker, page count calculator, certification statement builder |
| POA | POA type selector (durable/springing/healthcare/limited), witness requirement checker, principal capacity assessment guide |
| Corporate | Authority verification checklist, entity name format validator, representative capacity wording helper |
| Signature by Mark | Two-witness procedure guide, mark procedure script, accessibility considerations |
| Vehicle Title | Open title felony warning, odometer disclosure checker, HB 315 dealer exemption checker |
| Self-Proving Affidavit | Will execution checklist, witness qualification checker, simultaneous presence guide |

### UI Enhancements to Resources
- Add "Interactive Tools" section below each document example in the gallery
- Add "Practice Quiz" per document type — 5 multiple-choice questions testing knowledge of that document's requirements
- Add "Common Mistakes" panel per document — real-world errors notaries make with that document type
- Add "Related ORC Sections" expandable panel with links to full statute text
- Add print-friendly "Quick Reference Card" per document — single-page summary of all requirements

---

## New Sprint 24: Additional Service Dashboard Native Tools

Beyond the Sprint 10 per-service enhancements, add these specialized tools:

### Per-Service Specialized Builds

**Fingerprinting Dashboard:**
- FD-258 card field mapper (visual card layout with fillable fields)
- Ink quality checklist
- Rejection reason tracker (common FBI/BCI rejection reasons)
- Equipment maintenance log (linked to Equipment tab)

**Immigration Dashboard:**
- Country-specific document matrix (what's needed per country)
- USCIS processing time widget (current wait times)
- Consular appointment scheduler helper
- Document translation coordination panel (link to Translation dashboard)

**Real Estate Dashboard:**
- Signing package document counter with page-by-page tracker
- Closing cost breakdown calculator
- Title company contact directory
- E-recording status tracker

**Content Services Dashboard:**
- Editorial calendar with drag-drop scheduling
- Content brief generator (AI fills SEO keywords, audience, tone)
- Plagiarism/originality indicator
- Social media preview cards (how post looks on each platform)

**Court Forms Dashboard:**
- County-specific form finder
- Filing fee lookup by county and case type
- Deadline calculator (filing windows, response times)
- Required attachments checklist per form type

**Process Serving Dashboard:**
- Attempt log with GPS coordinates
- Affidavit of service auto-generator
- Skip trace integration panel
- Substituted service rules reference per county

---

## Implementation Order (Complete Sequence)

1. **Bug fix:** Service catalog CTA routing (Services.tsx + serviceConstants.ts + serviceFlowConfig.ts)
2. **Sprint 6:** Credential Vault (DB + component + wiring)
3. **Sprint 7:** Todo System (DB + component + wiring)
4. **Sprint 8:** AI Service Layer (edge function + configs + hook + workspace)
5. **Sprint 9:** Category Tool Panels (6 files)
6. **Sprint 10:** Per-service admin dashboard enhancements (batch by category)
7. **Sprint 11:** Vendor Products & Auto-Enrich
8. **Sprint 12:** Admin Equipment Tab
9. **Sprint 13:** Notary logo upload + page transition fix
10. **Sprint 14:** E-Courses system
11. **Sprint 15:** Accounting & Tax Center
12. **Sprint 16:** Document Collaboration
13. **Sprint 17:** Embeddable Widgets + Verification Badge
14. **Sprint 18:** Dispatch & Routing Engine
15. **Sprint 19:** Notification & Messaging Hub
16. **Sprint 20:** Micro-Tools
17. **Sprint 21:** Event Bus
18. **Sprint 22:** Business Expansion Hub (guides, templates, outreach tools)
19. **Sprint 23:** Enhanced Document Anatomy + per-document tools + quizzes
20. **Sprint 24:** Additional service dashboard native tools

---

## Database Migrations (16 total)

| # | Tables / Changes |
|---|-----------------|
| 1 | Shop tables (4) |
| 2 | Shop seed data |
| 3 | New service rows (~25) |
| 4 | Pricing/cross-sell rules |
| 5 | `user_credentials` |
| 6 | `user_todos` |
| 7 | `service_requests` + 3 columns, `service_job_files` |
| 8 | `vendors` + 2 columns, `vendor_products` |
| 9 | `admin_equipment` |
| 10 | `notary_pages.logo_path` |
| 11 | E-course tables (4) |
| 12 | `accounting_transactions`, `mileage_entries` |
| 13 | Document collaboration tables (4) |
| 14 | `dispatch_assignments`, `sla_timers` |
| 15 | `notification_templates`, `conversations`, `conversation_messages` |
| 16 | `platform_events`, `growth_resources` |

## New Files (~120+)

All prior file lists remain. Additional new files:
- `BusinessExpansionHub.tsx`, `OutreachEmailGenerator.tsx`, `GrowthGuideViewer.tsx`
- 7+ document-specific tool components (OathScriptGenerator, CertWordingGenerator, POATypeSelector, etc.)
- `DocumentQuiz.tsx`, `CommonMistakesPanel.tsx`, `QuickReferenceCard.tsx`
- Enhanced service dashboard sub-components for Fingerprinting, Immigration, Real Estate, Content, Court Forms, Process Serving

Nothing from any prior plan version is removed.

