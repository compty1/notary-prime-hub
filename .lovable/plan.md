

# NotarDex: Ohio Notary Toolkit — Implementation Plan

## Overview

Build the NotarDex prototype as a full-featured, production-ready notary resource toolkit integrated into the admin dashboard. This replaces the current `AdminResources.tsx` page, combining all existing resource content with the new NotarDex modules.

## Architecture

**Single page replacement**: Rebuild `src/pages/admin/AdminResources.tsx` as the NotarDex toolkit with 6 tabs, merging existing content (service guides, compliance, external links, new notary guide) with the new modules (Form Vault with visual anatomy, Special Acts & Document Intelligence, Journal view, Sim Lab, Vehicle Title Masterclass, Representative Capacity).

**No new routes needed** — stays at `/admin/resources`.

## Tab Structure

```text
┌──────────────────────────────────────────────────────────┐
│  NotarDex — Ohio Notary Toolkit                          │
├──────────┬───────────┬──────────┬─────────┬──────┬───────┤
│Form Vault│Special    │Service   │Registry/│Sim   │Reference│
│          │Acts       │Guides    │Journal  │Lab   │& Law    │
└──────────┴───────────┴──────────┴─────────┴──────┴───────┘
```

## Tabs & Content

### 1. Form Vault (from prototype)
- Category filter pills: All, General, Corporate, Specialized, Vehicle, Correction
- 9+ certificate forms with card grid display
- Click-to-open modal with **visual certificate anatomy** (live preview with hotspot indicators showing venue, testimonium, signature, seal placement)
- Statutory requirements panel with ORC references
- Ohio tips sidebar
- "Copy to Clipboard" and "Download PDF" actions per form
- **Module 4 content**: Standard Acknowledgment, Updated Jurat (HB 315), Copy Certification exact statutory wording

### 2. Special Acts & Document Intelligence (from prototype + new modules)
- **Document Intelligence cards**: Warranty Deed, Will, Promissory Note, Healthcare Directive with key flags and notary role
- **Special Circumstances**: Signature by Mark (ORC 147.542), Alternative Signer (ORC 147.59), Venue Determination (ORC 147.07)
- **Module 2 — Vehicle Title Masterclass**: Dealer Exception filter (HB 315 / ORC 4505.06), Jurat requirement with oath script, compliance checklist (white-out, blank space felony trap, open title)
- **Module 3 — Representative Capacity**: Attorney-in-Fact, Corporate Officer, Trustee scenarios with scripts and certificate modifications
- **Module 5 — Accessibility**: Signature by Mark with 2-witness requirement, Designated Alternative Signer (ORC 147.59)
- Each item opens a detail modal with: statutory rule, recommended verbal script, step-by-step protocol

### 3. Service Guides (existing content preserved)
- All 10 existing `documentGuides` categories (Real Estate, Legal, Estate Planning, I-9, Apostille, Document Prep, RON, Business, Witness, Virtual Mailroom, Situational)
- Searchable accordion format with tags, steps, warnings, who-must-be-present

### 4. Registry / Journal (from prototype)
- Summary stat cards: Total Volume, Revenue Generated, Record New Act CTA
- Journal table with date, signer, act type, fee, status
- Export CSV and Sign Entry actions
- Pulls from existing `journal_entries` table when available, falls back to demo data

### 5. Sim Lab (from prototype)
- Training simulator with scenario-based questions
- Vehicle title traps, expired credentials, representative capacity edge cases
- Expand to 8+ scenarios covering all high-risk areas
- Pass/fail feedback with ORC explanations
- Progress tracking

### 6. Reference & Law (existing content merged)
- Compliance reminders (seal, journal, prohibited acts, ID, fees)
- New Notary Guide (8-step onboarding)
- External resources (Ohio SOS, ORC links, NNA, multi-state RON)
- Common mistakes to avoid

## Sidebar (Desktop)
- Notary Health Score with compliance percentage bar
- Credentials status indicator
- Venue Scout with auto-detected county
- Quick links to journal, certificates page, fee calculator

## Mobile
- Bottom navigation bar with 4 primary tabs (Vault, Acts, Journal, Sim)
- Remaining tabs accessible via "More" or horizontal scroll

## Key Technical Decisions
- All content is client-side data arrays (no DB dependency for reference content)
- Journal tab queries `journal_entries` table via Supabase if authenticated, otherwise shows demo data
- Certificate PDFs generated via browser print-to-PDF (existing pattern from NotaryCertificates page)
- Copy-to-clipboard for statutory language templates
- Responsive grid layouts matching existing admin dashboard patterns
- Uses existing UI components (Card, Tabs, Dialog, Badge, Button, Accordion)
- Admin-only route access preserved

## Files Modified
1. **`src/pages/admin/AdminResources.tsx`** — Complete rebuild as NotarDex toolkit (~1200 lines). All existing data arrays (documentGuides, complianceReminders, newNotaryGuide, externalResources) preserved and reorganized into the new tab structure. New data arrays added for forms, special circumstances, document intelligence, simulator levels, and vehicle title content.

No new routes, no DB migrations, no new components needed — this is a single-file rebuild that consolidates everything into one professional resource hub.

