

# Comprehensive Implementation Plan — External Orders, SignNow Integration, Document Examples, Settings Sync & Pricing

## Summary

This plan covers 8 major workstreams: (1) Manual/external order entry from Fiverr and other platforms, (2) SignNow automated email tracking and status integration, (3) Real notarized Ohio document example images in Resources and Service Guides, (4) Document anatomy completion in Resources, (5) Link auditing in References, (6) Mobile/Online notary process instructions in Templates & Forms, (7) Settings-to-site global sync, and (8) Pricing adjustments for mobile and online notary services.

---

## 1. Manual Order Entry & External Platform Import

**What**: Add an "External Order" feature to AdminServiceRequests so orders from Fiverr, Upwork, or other platforms can be tracked alongside native orders.

**Implementation**:
- Add a "New External Order" button and dialog to `AdminServiceRequests.tsx` with fields: Client Name, Client Email, Platform (dropdown: Fiverr, Upwork, Direct, Other), Platform Order ID, Service Type, Amount Paid, Payment Status (Paid on Platform / Pending), Notes, and a paste-friendly "Import from clipboard" parser
- Database migration: add columns to `service_requests` table — `source_platform` (text, default 'notardex'), `external_order_id` (text, nullable), `external_payment_status` (text, nullable), `external_payment_amount` (numeric, nullable)
- Add a "Paste Order Details" textarea that parses structured text (Fiverr order confirmations) using regex to auto-fill fields
- Add CSV import for bulk external orders
- Display platform badge on each order row in the table
- External orders with "Paid on Platform" skip Stripe but still track in revenue reports

---

## 2. SignNow Automated Email Tracking & Status Integration

**What**: Account for emails SignNow sends automatically (signing invitations, completion notifications) and track document status from SignNow across the platform.

**Implementation**:
- Add a `signnow_documents` tracking table: `id`, `appointment_id`, `document_name`, `signnow_document_id`, `status` (draft/pending/signed/completed/declined), `invite_sent_at`, `viewed_at`, `signed_at`, `completed_at`, `signnow_emails_sent` (jsonb array of email events)
- Update `signnow-webhook/index.ts` to capture `document.complete`, `invite.sent`, `document.update` events and update the tracking table + insert into `crm_activities`
- Create a "SignNow Status" panel in the appointment detail view showing: document status timeline, emails sent by SignNow (invite, reminder, completion), signer actions
- Add SignNow document status to `PortalAppointmentsTab` so clients see real-time signing progress
- Add SignNow email events to the Admin Automated Emails dashboard as "External Emails (SignNow)" section so admins see the full communication picture
- Update `AdminProcessFlows` ProcessFlowsTab to include SignNow steps in service flows (e.g., "Document Sent via SignNow → Signer Invited → Signed → Completed")

---

## 3. Real Notarized Ohio Document Example Images

**What**: Add actual images showing real Ohio notarized documents (with PII redacted) as visual examples in Resources, NotaryGuide, NotaryCertificates, and AdminResources.

**Implementation**:
- Generate high-fidelity example document images programmatically (SVG/Canvas rendered to PNG) for: Acknowledgment certificate, Jurat certificate, Copy Certification, POA acknowledgment, Corporate acknowledgment, Signature by Mark, Vehicle Title notarization, Self-Proving Affidavit
- Each image shows: filled-in certificate language, notary seal placement, signature lines, venue, date — all with realistic Ohio formatting and "[SAMPLE — NOT A LEGAL DOCUMENT]" watermark
- Store images in `public/images/documents/` as static assets
- Add image gallery/lightbox to each document type in:
  - `Resources.tsx` — new "Document Examples" resource card linking to a gallery page
  - `NotaryGuide.tsx` — inline example image for each document category
  - `NotaryCertificates.tsx` — example completed certificate for each type
  - `AdminResources.tsx` Form Vault — anatomy diagram image for each form entry
  - `AdminResources.tsx` Service Guides — step-by-step images showing the process

---

## 4. Document Anatomy Completion in Resources

**What**: The AdminResources Form Vault has `anatomy` data for each form but needs visual anatomy diagrams (annotated images with callout arrows).

**Implementation**:
- Create an `AnatomyDiagram` component that renders a document image with numbered callout markers overlaid at specific positions
- Each callout links to the existing `anatomy` record descriptions
- Add anatomy diagrams to all 10 form entries in the Form Vault
- Add a "Document Anatomy" section to the public Resources page with simplified versions for client education
- Include print-friendly CSS so anatomy diagrams render cleanly when printed

---

## 5. Link Auditing in References

**What**: Verify all external links in AdminResources Reference & Law tab point to live pages.

**Implementation**:
- Audit all hardcoded links in AdminResources.tsx (Ohio SOS, ORC citations, NNA, etc.)
- Replace any broken or outdated links with current URLs
- Add `target="_blank" rel="noopener noreferrer"` to all external links
- Verify links: ohiosos.gov/notary, Ohio Revised Code sections (§147.xx, §4505.06), NNA resources
- Add a small "Link Health" indicator in the Reference tab showing last-verified date

---

## 6. Mobile & Online Notary Process Instructions in Templates & Forms

**What**: Add detailed step-by-step instructions for both mobile (in-person travel) and online (RON via SignNow) notary processes in the Form Vault, including real example images.

**Implementation**:
- Add two new accordion sections to each form entry in AdminResources: "Mobile Notary Process" and "Online (RON) Process"
- **Mobile process steps**: Pre-appointment checklist, travel/venue setup, ID verification procedure, document review, signing ceremony, journal entry, seal application, payment collection
- **RON process steps**: Platform login (SignNow), tech check, KBA verification, credential analysis, document presentation, e-signature, e-seal application, recording start/stop, journal entry
- Include example images for each step showing the SignNow interface, seal placement, etc.
- Add print/download capability: "Print Process Guide" button that generates a clean PDF-style printable view with all steps and images
- Add certificate download: each form entry already has `certificateText` — add a "Download Certificate Template" button that generates a formatted DOCX/PDF with proper Ohio formatting

---

## 7. Settings-to-Site Global Sync

**What**: Many settings exist in `platform_settings` but aren't consumed by the site components (e.g., `business_hours`, `notary_phone`, `support_email`, `site_name`, etc.).

**Implementation**:
- Create a `useSettings` hook that fetches and caches `platform_settings` on app load (with 5-min TTL)
- Update these components to consume settings:
  - `Footer.tsx` — phone, email, business hours, copyright text, social links, disclaimer
  - `Navbar.tsx` — site name, logo path
  - `PageShell.tsx` / `usePageMeta` — default meta title/description from settings
  - `BookAppointment.tsx` — booking_enabled gate, min lead hours, max appointments
  - `ClientPortal.tsx` — portal_welcome_message, tab visibility toggles
  - `CookieConsent.tsx` — cookie_consent_enabled toggle
  - `Index.tsx` (homepage) — business name, phone, tagline
  - `Maintenance.tsx` — maintenance_mode gate
- Populate missing settings values in the database (see Section 8)

---

## 8. Pricing Adjustments — Mobile & Online Notary

**What**: Update platform_settings with market-accurate pricing using SignNow's pay-as-you-go model for RON and fair mileage-based pricing for mobile.

**Database updates** (via insert tool, not migration):
| Setting Key | Current | New Value | Rationale |
|---|---|---|---|
| `base_fee_per_signature` | 10 | 5 | Ohio statutory max per ORC §147.08 |
| `ron_platform_fee` | 25 | 25 | SignNow pay-as-you-go session fee |
| `kba_fee` | 10 | 15 | KBA credential analysis cost |
| `travel_fee_minimum` | 25 | 35 | Minimum mobile dispatch fee (market rate) |
| `travel_fee_per_mile` | (missing) | 0.70 | IRS 2025 mileage rate ($0.70/mi) |
| `rush_fee` | (missing) | 50 | Same-day/next-day mobile priority |
| `after_hours_fee` | (missing) | 35 | Evenings/weekends surcharge |
| `apostille_fee` | 50 | 75 | SOS filing + processing + return shipping |
| `witness_fee` | 10 | 15 | Per-witness appearance fee |
| `mobile_base_service_fee` | (new) | 75 | Base fee for mobile notary visit (includes first 2 seals) |
| `ron_base_service_fee` | (new) | 25 | Base fee for RON session (includes first seal) |
| `printing_fee_per_page` | (new) | 0.50 | Document printing at mobile signings |
| `scan_back_fee` | (new) | 10 | Scan and email documents back after mobile signing |

Also populate missing general settings:
- `site_name` = "NotarDex"
- `site_tagline` = "Professional Ohio Notary Services"
- `support_email` = "shane@notardex.com"  
- `support_phone` = "(614) 300-6890"
- `copyright_text` = "© 2026 NotarDex. All rights reserved."
- `booking_enabled` = "true"
- `registration_enabled` = "true"
- `chat_enabled` = "true"
- `ai_tools_enabled` = "true"
- Other feature toggles defaulting to "true"

---

## Technical Details

### New Database Tables
1. `signnow_documents` — tracks SignNow document lifecycle per appointment
2. Migration adds `source_platform`, `external_order_id`, `external_payment_status`, `external_payment_amount` columns to `service_requests`

### New/Modified Components
- `src/hooks/useSettings.ts` — global settings provider hook
- `src/components/ExternalOrderDialog.tsx` — manual order entry form
- `src/components/SignNowStatusPanel.tsx` — document status timeline
- `src/components/AnatomyDiagram.tsx` — annotated document diagrams
- `src/components/ProcessGuide.tsx` — printable mobile/RON process guide

### New Static Assets
- `public/images/documents/` — 8-10 example document PNGs generated programmatically

### Modified Files (key ones)
- `AdminServiceRequests.tsx` — external order entry
- `AdminResources.tsx` — anatomy diagrams, process guides, link audit
- `Resources.tsx` — document examples section
- `NotaryGuide.tsx` — inline example images
- `NotaryCertificates.tsx` — completed certificate examples
- `Footer.tsx` — settings consumption
- `signnow-webhook/index.ts` — enhanced event tracking
- ~15 components updated for settings sync

### Edge Function Updates
- `signnow-webhook` — capture email events and document status changes
- `signnow` — add document status query endpoint

### Estimated Scope
- 2 database migrations
- ~15 settings data inserts
- ~8 new components
- ~20 file modifications
- 8-10 generated document images

