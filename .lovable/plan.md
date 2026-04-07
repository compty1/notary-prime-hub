

# NotarDex Complete Instruction Manual — Generation Plan

## What Will Be Built

A comprehensive Word document (~40-50 pages) covering every part of the NotarDex platform with screenshots embedded as placeholder descriptions (since screenshots cannot be directly embedded in a script-generated DOCX without pre-saved image files). The document will use color-coded sections, tables, and step-by-step numbered instructions.

## Document Structure (20 Sections)

### Part I: Platform Overview
1. **Welcome & Platform Architecture** — Tech stack, navigation structure, role-based access (admin/notary/client), URL map of all 87 pages
2. **Getting Started** — Account creation, login, password reset, email verification, MFA setup, cookie consent

### Part II: Public-Facing Pages
3. **Homepage & Navigation** — Hero section, "What Do I Need?" AI assistant, service cards, FAQs, testimonials, footer links, navbar dropdowns (Services/Solutions/Tools)
4. **Services Catalog** — All 14 categories with descriptions, 40+ individual services, intake-only vs bookable vs SaaS tool routing logic
5. **Solution Pages** — For Notaries, Hospitals, Real Estate, Law Firms, Small Business, Individuals
6. **Public Tools** — Fee Calculator (pricingEngine.ts), RON Eligibility Checker, E-Seal Verifier, Notary Certificates Reference, Templates Library

### Part III: Booking & Appointment Flow
7. **Booking Wizard (4 Steps)** — Service selection, category-specific intake fields (destination country for apostille, property address for real estate, employer for I-9), schedule selection with slot availability, guest signup, pricing breakdown, review & confirm
8. **Appointment Confirmation** — Confirmation number (NTR-YYYYMMDD-XXXXXX), email notifications via send-appointment-emails edge function, calendar download, reschedule flow

### Part IV: RON Session Workflow
9. **RON Session (4 Phases)** — Session Setup (link sharing, platform selection from 8 providers), Verify ID/KBA (12 accepted ID types, 2-attempt KBA limit), Administer Oath (4 oath scripts), Finalize (journal entry, e-seal, payment)
10. **Session Compliance** — Ohio ORC §147.64-66 requirements, recording consent gate, 15-minute inactivity timeout, witness verification, e-sign consent, session pause/resume

### Part V: Client Portal
11. **Portal Overview** — 14-tab dashboard (Overview, Appointments, Documents, Chat, Payments, Reviews, Services, Apostille, Correspondence, Reminders, AI Tools, Service Requests, Leads, Referrals), onboarding checklist, quick actions, document readiness score
12. **Portal Features** — Document upload (wizard + QR mobile upload), appointment management (cancel/reschedule), payment processing (Stripe), chat with staff, AI document analysis, apostille requests, document reminders

### Part VI: Business Portal
13. **Business Portal** — Organization management, authorized signers, team documents, bulk operations

### Part VII: AI Tools & Document Services
14. **AI Tools Hub (56 Tools)** — 5 categories (Documents & Generation, Analysis & Insights, Communication, Compliance & Legal, Creative & Strategy), tool runner interface, generation history, favorites
15. **Standalone AI Tools** — AI Writer, AI Extractors, AI Knowledge Base, DocuDex Editor (TipTap), Grant Generator, Resume Builder, Signature Generator, Document Builder, Document Digitization

### Part VIII: Admin Panel
16. **Admin Dashboard (33 Sidebar Items)** — Overview with stats, Appointments management (1,124 lines), Clients, Business Clients, Service Requests, Content Workspace, DocuDex Pro, Process Flows, Task Queue, Services Catalog editor
17. **Admin Operations** — Availability management, Documents, Templates & Forms, Apostille tracking, Journal entries, Revenue dashboard, Performance metrics, Compliance Report
18. **Admin Communications & CRM** — Email Management (IONOS SMTP/IMAP), Lead Portal (5-stage pipeline), CRM Hub (7-stage pipeline with Kanban), Live Chat, Client Emails, Mailbox (IONOS sync), Automated Emails
19. **Admin System** — Team & Invites (notary recruitment), User Management (role assignment), Audit Log, Build Tracker (AI analyst), Integration Testing, Webhooks, Settings (pricing/compliance/integrations/seal/credentials)

### Part IX: Edge Functions & Integrations
20. **47 Edge Functions Reference** — Grouped by domain: Auth (admin-create-user, auth-email-hook), AI (7 functions), Email (6 functions), Payments (4 functions), Documents (4 functions), CRM (5 functions), Sessions (3 functions), Notifications (5 functions), Calendar (1 function), etc.

## Technical Details

- **File format:** DOCX via Node.js `docx` library
- **Page count estimate:** 40-50 pages
- **Screenshots:** Since we can't embed live screenshots into the DOCX programmatically from browser tool memory, each section will include descriptive placeholders with exact URLs where each page can be viewed (e.g., notary-prime-hub.lovable.app/services)
- **Tables:** Route maps, edge function reference, service catalog, AI tools catalog, database table reference
- **Color scheme:** Navy headers (#1B3A5C), green sub-headers (#2D6A4F), gold accents (#F5A623) matching brand

## Implementation Steps

1. Generate the full DOCX using a Node.js script with the `docx` library
2. Convert to PDF and render pages as images for QA
3. Verify formatting, table alignment, and content completeness
4. Deliver as downloadable artifact

