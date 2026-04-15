

# Enterprise Tools — Full Implementation Plan

## Overview

Build 15 enterprise-grade professional tools with premium UI/UX from the Notar_Updates blueprint. Nothing exists yet — all tables, edge functions, components, pages, and routes must be created. Each tool gets a polished, feature-rich interface following the Block Shadow design system (24px corners, bold typography, semantic theming).

---

## Phase 1: Database & Storage Infrastructure

**Single migration** — 8 tables + 1 storage bucket + indexes + RLS:

1. **`ai_document_grades`** — Stores AI compliance grading results (score, grade letter, findings jsonb, compliance standard)
2. **`ofac_sdn_list`** — Treasury SDN sanctions data cache with GIN trigram index for fuzzy name search
3. **`construction_projects`** — Lien project tracking (name, address, owner, contractor, contract amount, dates, status)
4. **`lien_waivers`** — Individual waivers per project (4 AIA types, claimant, amount, through-date, status workflow)
5. **`trust_documents`** — Estate trust records (name, type, grantor, trustee, status)
6. **`trust_assets`** — Assets within trusts grouped by category (6 categories, value, institution, address)
7. **`bulk_dispatch_requests`** — B2B batch signing tracking (total/processed/failed rows, status, error log)
8. **`client_brand_kits`** — White-label branding (logo, colors, font, tagline, is_default)

All tables have RLS scoped to `auth.uid()`. Storage bucket `compliance_documents` created as private.

---

## Phase 2: NPM Dependencies

- `pdf-lib` — client-side PDF page stamping (Exhibit Stamper)
- `papaparse` — CSV parsing (B2B Dispatch, OFAC sync)
- `jszip` — ZIP bundling (Digital Vault audit packages)
- `html2pdf.js` — HTML-to-PDF export from TipTap templates

---

## Phase 3: Edge Functions (7 new)

1. **`analyze-document`** — Sends document text to Lovable AI (`google/gemini-2.5-flash`) with Ohio ORC 147 compliance system prompt. Returns score (0-100), grade letter (A-F), categorized findings with severity, saves to `ai_document_grades`.
2. **`sync-ofac-data`** — Downloads Treasury SDN CSV, parses pipe-delimited format, upserts into `ofac_sdn_list`.
3. **`search-uspto`** — Proxies USPTO OpenData API for patent search results.
4. **`decode-vin`** — Proxies free NHTSA VIN Decoder API, validates 17-char format.
5. **`search-corporate`** — Proxies OpenCorporates free API for entity/officer lookup.
6. **`fetch-visa-bulletin`** — Fetches State Department Visa Bulletin HTML, parses structured data.
7. **`generate-audit-hash`** — SHA-256 hashing with chain-of-custody from `notarization_sessions`.

---

## Phase 4: Core Engine

### Data Files
- **`apostilleStateData.ts`** — All 50 states + DC: SOS name/address/phone/email, fee, processing time, electronic acceptance, walk-in availability
- **`documentTemplates.ts`** — 12 HTML templates with `{{placeholder}}` tokens: acknowledgment, jurat, copy certification, corporate resolution, 4 lien waiver types, apostille cover letter, trust schedule A, translation affidavit, odometer disclosure
- **`templateRenderer.ts`** — Token replacement engine + brand kit header/footer injection

### DocumentGeneratorModal (`src/components/enterprise/DocumentGeneratorModal.tsx`)
- Template selector with category grouping
- Auto-populated data binding form from calling tool
- Live TipTap preview with real-time token replacement
- Brand kit selector (if user has kits)
- Export: "Download PDF" (html2pdf.js), "Print", "Save to Vault"
- Legal disclaimer auto-appended to every document

### EnterpriseLayout (`src/components/enterprise/EnterpriseLayout.tsx`)
- Consistent header with icon + title + breadcrumbs
- Collapsible legal disclaimer banner
- Quick-action bar linking to Brand Settings, Digital Vault, AI Grader

---

## Phase 5: Frontend Pages (15 tools with premium UI)

### Tool 1: AI Document Grader
- Drag-drop PDF upload zone (max 10MB), client-side text extraction via `pdf-lib`
- Animated circular score gauge (0-100) with gradient colors + grade letter overlay
- Risk level badge with pulse animation for Critical findings
- Sortable findings DataTable: Category, Issue, Severity (color badges), Recommendation
- Compliance breakdown accordion by ORC section
- Grade history tab with past analyses
- **Bonus**: Batch upload queue, comparison view (side-by-side two grades)

### Tool 2: KYC/OFAC Search
- Full-width search with 300ms debounce and typeahead
- Sync status card (last sync date, record count, "Sync Now" admin button)
- Red alert card for matches (name highlighted, confidence %, SDN details, aliases)
- Green confirmation card for no-match with clearance certificate export
- Fuzzy matching visualization (Levenshtein distance)
- **Bonus**: Bulk name search via CSV upload, search history, watchlist

### Tool 3: USPTO/IP Hub
- Search bar with recent suggestions, card grid results (3-col responsive)
- Expandable detail drawer per patent (full abstract, claims, citations)
- Filters sidebar: patent type, date range, assignee
- **Bonus**: Patent timeline visualization, research folder bookmarks, PDF report export

### Tool 4: Notarial Certificate Generator
- Two-panel layout: form (left) + live preview (right)
- State dropdown (50 states, Ohio default), county autocomplete for Ohio
- Certificate type selector: 5 large icon cards (Acknowledgment, Jurat, Copy Cert, Oath, Witnessing)
- Dynamic multi-signer rows (up to 10), ID type from existing `OHIO_ACCEPTED_ID_TYPES`
- Live preview renders ORC-compliant statutory text from `ohioCompliance.ts`
- RON toggle adds technology provider fields per ORC §147.62
- **Bonus**: Commission expiration warning, save as reusable template, multi-signer support

### Tool 5: Legal Exhibit Stamper
- Drag-drop multi-PDF upload with sequential labeling (A, B, C...)
- Visual position selector (4-quadrant clickable diagram)
- Color swatches (Red/Blue/Black) + custom hex, font size slider
- Side-by-side before/after preview with page navigation
- Uses `pdf-lib` for client-side PDF manipulation
- **Bonus**: Custom stamp text (ATTACHMENT, APPENDIX, SCHEDULE), Bates numbering mode, watermark mode, date stamps, batch ZIP download

### Tool 6: Digital Vault & Audit Trail
- DataTable of completed RON sessions from `notarization_sessions`
- Detail drawer with vertical chain-of-custody timeline (Created → ID Verified → KBA → Signed → Sealed → Completed)
- SHA-256 hash certificate card with copy button
- Hash verification input (paste hash → visual match/mismatch)
- "Download Audit Package" via `jszip` (metadata JSON + hash cert + document links)
- **Bonus**: Bulk hash generation, QR code per hash, retention policy display, audit report PDF

### Tool 7: Auto Fleet/VIN Decoder
- 17-character VIN input with real-time validation + character counter
- Decoded results in chip grid: Year, Make, Model, Body, Fuel, Engine, Drive, Doors, GVWR
- "Generate Odometer Disclosure" → DocumentGeneratorModal with VIN data
- Fleet history in localStorage
- **Bonus**: Batch VIN decode (paste multiple), recall lookup link, title status indicator, fleet grouping by client

### Tool 8: Construction Lien Command Center
- Master-detail with `react-resizable-panels` (30/70 split)
- Project list with search/filter, financial summary cards (Contract Amount, Waivers Issued, Remaining Balance)
- Waiver DataTable with 4 AIA types, status pipeline (Draft → Sent → Signed → Filed)
- Waiver creation drawer with type selector (4 large cards)
- "Generate Waiver" → DocumentGeneratorModal with appropriate template
- **Bonus**: Financial pie/bar charts, project timeline Gantt bar, deadline alerts, project duplication, notes thread

### Tool 9: Trust Asset Scheduler
- Trust card grid showing name, type badge, grantor, trustee, asset count, total value
- Trust detail view with assets grouped in accordion by category (6 categories)
- Asset entry form per trust, formatted currency values
- Category subtotals + grand total estate value
- "Generate Schedule A" → DocumentGeneratorModal
- **Bonus**: Beneficiary designation notes, trust comparison view, export full trust package PDF, duplicate for amendments

### Tool 10: B2B Bulk Dispatch
- CSV drag-drop upload with "Download Template" link
- Column mapping UI if headers mismatch (visual drag-connect)
- Validation table: every row with green ✓ or red ✗ + error tooltip, error summary bar
- Progress bar during batch processing with row-by-row status
- Batch history DataTable from `bulk_dispatch_requests`
- **Bonus**: Duplicate detection, re-process failed rows, export results CSV, batch analytics (success rate, common errors)

### Tool 11: Corporate Compliance/BOI
- Entity search with jurisdiction filter, results as company cards
- Officer mapping section per company (name, title, appointment date)
- BOI report form with beneficial owner rows (dynamic add/remove)
- "Generate BOI Report" → DocumentGeneratorModal
- Manual entry fallback for entities not found
- **Bonus**: Filing deadline tracker, multi-entity management, annual report reminders, Ohio SOS portal link

### Tool 12: Immigration & Visa Hub
- Auto-fetched visa bulletin displayed in two tables (Family/Employment)
- Color-coded dates: Current (green), Retrogressed (red), Advanced (blue)
- Translation Affidavit Generator form (language, translator, credentials)
- USCIS forms checklist accordion (I-130, I-485, I-765, N-400, etc.)
- Quick links to existing translation service intake pages
- **Bonus**: Month-over-month bulletin comparison, priority date calculator, country-specific backlog notes

### Tool 13: 50-State Apostille Matrix
- Searchable DataTable of all 50 states + DC (SOS office, fee, processing, electronic, walk-in)
- State detail drawer with full contact info + notes
- Fee calculator: state + document count + rush = itemized total
- "Generate Cover Letter" → DocumentGeneratorModal with selected state SOS info
- **Bonus**: State comparison mode (2-3 side-by-side), document compatibility matrix, export as CSV, bookmark frequent states

### Tool 14: Brand Kit Settings
- Brand kit card grid from `client_brand_kits` with logo thumbnail + color swatches
- Create/edit form: logo upload, company name, tagline, color pickers (primary/secondary), font selector with live preview
- "Set as Default" toggle (one per user)
- Live preview card showing document header/footer with applied branding
- **Bonus**: Brand kit duplication, color contrast checker, brand guidelines PDF export

### Tool 15: Enterprise Dashboard Landing
- Hero section with animated gradient
- 4 KPI stat cards (Documents Graded, Active Projects, Trusts Managed, Batches Processed)
- 14-tool card grid grouped by category with usage counts
- Recent activity feed (last 10 actions across all tools)

---

## Phase 6: Routing & Navigation

**`App.tsx`** — 16 new lazy imports + routes under `/admin/enterprise/*`, all `ProtectedRoute adminOnly`.

**`AdminDashboard.tsx`** — New "Enterprise Tools" sidebar group with 15 items positioned between "Documents & Tools" and "Field Services".

---

## Phase 7: Implementation Order

1. Migration: 8 tables + storage bucket + indexes + RLS
2. NPM: Install 4 packages
3. Data files: `apostilleStateData.ts`, `documentTemplates.ts`, `templateRenderer.ts`
4. Edge functions: All 7 deployed
5. Core components: `EnterpriseLayout.tsx`, `DocumentGeneratorModal.tsx`
6. Pages batch 1 (no DB): CertificateGenerator, ExhibitStamper, ApostilleMatrix, IPHub, AutoFleetDesk, EnterpriseDashboard
7. Pages batch 2 (DB): AIGrader, KYCSearch, DigitalVault, LienCommandCenter, TrustScheduler, B2BDispatch, CorporateCompliance, ImmigrationHub, BrandSettings
8. Routing: App.tsx + AdminDashboard.tsx sidebar
9. TypeScript validation: zero errors

**~35 files created, 2 files modified, 1 migration, 4 npm packages**

