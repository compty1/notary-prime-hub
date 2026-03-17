

# Implementation Plan: Full Feature Suite for Notary Platform

This is a very large scope covering ~15 major features. To implement everything successfully within the platform's constraints (React/Vite frontend + Lovable Cloud backend), I'll organize this into 6 implementation phases.

## What Already Exists
- Client portal with appointments, profile editing, tech check
- Admin dashboard with overview, appointments, clients, availability, documents, journal, revenue, resources, AI assistant, audit log, settings
- Booking flow with ID scan, document detection, smart scheduling, pricing
- RON session with BlueNotary iframe, oath scripts, voice-to-notes
- Storage bucket for documents, RLS policies in place

## Phase 1: Enhanced Client Portal (Secure Document Storage + Status Tracking)

**Files:** `src/pages/ClientPortal.tsx`

- Add document upload section (upload to `documents` storage bucket, insert into `documents` table)
- Add document status tracker with visual pipeline: Intake → Review → Payment → Notarization → Delivery
- Add "My Documents" section showing all uploaded docs with download capability
- Add "Frequently Used Documents" section (stored docs that can be re-used)
- Add QR code generator (using `qrcode` library) that encodes a URL for mobile upload/ID verify/session join

## Phase 2: Document Templates Library + Guided Builder + Ohio Forms

**New files:**
- `src/pages/admin/AdminTemplates.tsx` — Admin template library page
- `src/pages/DocumentTemplates.tsx` — Client-facing template page
- `src/pages/DocumentBuilder.tsx` — TurboTax-style guided form builder

**Templates to include** (generic, non-legal-advice):
- Travel consent form
- General affidavit
- Identity statement / verification
- Bill of sale (vehicle, general property)
- General agreement / contract
- Oath/affirmation certificate

Each template: title, description, fillable fields (name, date, address), preview, and PDF generation using browser print/CSS.

**Ohio Notary Forms & Resources** (expand `AdminResources.tsx`):
- Add tabs: "Forms Library", "New Notary Guide", "External Resources"
- Include direct links to Ohio Secretary of State notary forms (all working URLs to actual PDF forms)
- Include step-by-step guide for new notaries: how to get commissioned, required training, seal requirements, bond info
- Include links to Ohio Revised Code sections, NNA resources, Ohio Notary Association
- Add comprehensive notarization flow instructions with decision trees

## Phase 3: Fee Calculator + Dynamic Pricing + Apostille Workflow

**New files:**
- `src/pages/FeeCalculator.tsx` — Public fee calculator page
- `src/pages/admin/AdminApostille.tsx` — Apostille workflow tracker

**Fee Calculator:**
- Interactive calculator for: notarization fees, travel fees (by distance), rush fees, witness fees, apostille courier fees
- Uses platform_settings for pricing data
- Publicly accessible (no login required)

**Dynamic Pricing enhancements** in `BookAppointment.tsx`:
- Rush/priority appointment option with configurable surcharge
- After-hours pricing tiers
- Auto-calculated travel fees based on distance

**Apostille Workflow:**
- Track apostille requests: intake → payment → submission to SOS → shipping → delivery
- Status tracking with estimated timelines

**Database:** New `apostille_requests` table

## Phase 4: AI Document Features + Live Chat + Document Pre-Check

**New files:**
- `src/pages/admin/AdminChat.tsx` — Admin live chat / document review queue
- `supabase/functions/explain-document/index.ts` — AI document explanation edge function

**AI Document Explanation:**
- Upload a document → AI summarizes it, highlights key sections, explains field meanings
- Uses Lovable AI (gemini-3-flash-preview) via edge function
- Non-legal disclaimer always shown

**Automated Document Pre-Check** (enhance existing flow):
- Expand `detect-document` edge function to also flag missing signatures, incomplete fields, confirm ID requirements
- Show pre-check results in client portal before appointment

**Live Chat:**
- Simple real-time chat using Supabase realtime on a new `chat_messages` table
- Clients can ask questions and upload documents for pre-review
- Admin sees chat queue in dashboard

**Database:** New `chat_messages` table with realtime enabled

## Phase 5: Business Client Dashboard + KYC + Multi-Document Bundles

**New files:**
- `src/pages/BusinessPortal.tsx` — Business client dashboard
- `src/pages/admin/AdminBusinessClients.tsx` — Admin business client management

**Business features:**
- Bulk document upload
- Document history per organization
- Team accounts (multiple users under one business profile)
- Monthly billing summary view

**KYC for businesses:**
- Business verification form: EIN, articles of incorporation upload, authorized signers list
- Verification status tracking

**Multi-Document Workflow Bundles:**
- Pre-configured bundles: Real estate packet, estate planning set, business formation set
- Each bundle lists required documents with checklist
- Bundle pricing with discount

**Database:** New `business_profiles` table, `business_members` table, `document_bundles` table

## Phase 6: Navigation + Route Updates + Polish

**Modified files:** `src/App.tsx`, `src/pages/admin/AdminDashboard.tsx`

- Add all new routes
- Update admin sidebar with new navigation items (Templates, Apostille, Chat, Business Clients)
- Add public routes: `/templates`, `/builder`, `/fee-calculator`, `/business-portal`
- Add nav items to landing page

---

## Database Changes Summary

New tables needed:
1. `apostille_requests` — intake, status, tracking, shipping info
2. `chat_messages` — sender_id, message, attachment_url, created_at (realtime enabled)
3. `business_profiles` — business_name, ein, verification_status, created_by
4. `business_members` — business_id, user_id, role
5. `document_bundles` — name, description, document_list (jsonb), price

New platform_settings entries:
- rush_fee, after_hours_fee, witness_fee, apostille_fee

## Technical Approach

- **PDF generation**: Use browser `window.print()` with print-optimized CSS for templates — no external library needed
- **QR codes**: Add `qrcode.react` dependency for mobile scan-to-upload
- **AI features**: Lovable AI via edge functions (gemini-3-flash-preview), non-streaming for document explanation
- **Real-time chat**: Supabase realtime subscriptions on `chat_messages`
- **File uploads**: Existing `documents` storage bucket with RLS
- **All Ohio form links**: Direct URLs to Ohio Secretary of State PDFs and NNA resources

## Estimated New/Modified Files

- ~8 new page components
- ~2 new edge functions  
- ~5 new database tables
- ~15 modified existing files

This is a large implementation. Shall I proceed with all phases?

