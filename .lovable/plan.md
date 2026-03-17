

# Comprehensive Platform Enhancement Plan

This is a large scope covering 7 major workstreams. Given the complexity, I recommend implementing in phases across multiple messages. Here is the full plan.

---

## Phase 1: Smart Document Upload & Guided Selection

**Problem**: Clients don't know what documents they need for notarization.

**Changes**:
- **New component**: `src/components/DocumentWizard.tsx` — A step-by-step guided wizard that asks plain-language questions ("What are you trying to get notarized?", "Is this for real estate?", "Is this for court?") and recommends the correct document type, required IDs, and any additional forms.
- **AI-powered detection**: When a client uploads a document, call the existing `detect-document` edge function to auto-identify the document type and display a plain-English explanation of what it is, what's needed, and next steps.
- **Integrate into `BookAppointment.tsx`**: Replace the plain service-type dropdown with the wizard for first-time users; show helpful tooltips and descriptions for each service type.
- **Integrate into `ClientPortal.tsx`**: After upload, auto-trigger document detection and show a card explaining "This looks like a Power of Attorney — here's what you need to know."

## Phase 2: Client Portal Expansion (Messaging, Payments, Reviews)

**Problem**: Client portal is limited to appointments, documents, status, and basic chat.

**Changes to `ClientPortal.tsx`**:
- **Expand tabs** from 4 to 7: Appointments, Documents, Messages, Payments, Reviews, Services, Status
- **Messages tab**: Full direct messaging with the admin/notary, threaded by service/appointment, with the ability to ask questions about services and get status updates. Uses existing `chat_messages` table.
- **Payments tab**: View payment history, outstanding invoices, and payment status. Requires new `payments` table (id, client_id, appointment_id, amount, status, method, paid_at, invoice_url, created_at).
- **Reviews tab**: Leave reviews for completed appointments. Requires new `reviews` table (id, client_id, appointment_id, rating, comment, created_at).
- **Services tab**: Browse available services with AI chat per service to discuss requirements.

**Database migration**:
- Create `payments` table with RLS (clients view own, admins manage all)
- Create `reviews` table with RLS (clients create/view own, admins view all, public can view)

## Phase 3: Email Import & Management Infrastructure

**Problem**: Need to connect, import, and manage client emails to complete services.

**Changes**:
- **Enhance `AdminEmailManagement.tsx`**: Add email import functionality — ability to paste/forward emails, bulk import from CSV, and connect to an email inbox (placeholder for future IMAP/API integration).
- **Add client-side email view**: In `ClientPortal.tsx` Messages tab, show correspondence items from `client_correspondence` table alongside chat messages in a unified inbox.
- **Edge function**: Create `supabase/functions/process-inbound-email/index.ts` — webhook endpoint for Resend inbound email forwarding (parses sender, subject, body, matches to client, creates `client_correspondence` record).

## Phase 4: Service-Specific Infrastructure

**Problem**: Each service has unique processes, requirements, legal considerations, and workflows that need dedicated handling.

**Database migration** — New `service_requirements` table:
- id, service_id (FK to services), requirement_type (document | id | form | legal_note), description, is_required, display_order, ohio_statute_ref

**New `service_workflows` table**:
- id, service_id, step_number, step_name, step_description, requires_client_action, requires_admin_action

**Changes**:
- **New component**: `src/components/ServiceDetailPanel.tsx` — Shows service-specific requirements, expected outcomes, legal references, required documents, and step-by-step workflow. Used in both client booking flow and admin dashboard.
- **AI Chat per service**: In the client portal Services tab, each service gets a contextual AI chat button that calls the existing `notary-assistant` edge function with service-specific context (Ohio laws, requirements, expected outcomes, content format needs).
- **Admin side**: `AdminServices.tsx` enhanced to manage requirements and workflows per service.

## Phase 5: Lead Portal

**Problem**: Need real-time leads for Ohio notarization services from public sources.

**Database migration** — New `leads` table:
- id, source (text), source_url, name, phone, email, business_name, address, city, state, zip, lead_type (individual | business), service_needed, intent_score (high | medium | low), status (new | contacted | qualified | converted | closed), notes, contacted_at, created_at, updated_at

**New `lead_sources` table**:
- id, name, source_type (public_records | directory | social | marketplace | manual), url, last_scraped_at, is_active, config (jsonb)

**New page**: `src/pages/admin/AdminLeadPortal.tsx`
- Real-time lead dashboard with filters by source, intent score, status, service type
- Click-to-call (tel: links), one-click schedule (pre-fills BookAppointment), quick notes
- Lead cards showing: name, phone, email, source, intent signal, service needed, location
- Pipeline view: New → Contacted → Qualified → Converted
- CSV import/export for manual lead lists

**Lead source integrations** (via edge functions):
- `supabase/functions/fetch-leads/index.ts` — Aggregator function that:
  - Searches Google Places API for "notary needed" queries in Ohio (requires API key placeholder)
  - Parses Ohio Secretary of State public records (web scraping placeholder)
  - Monitors Craigslist/Facebook Marketplace for "notary" mentions (placeholder)
  - Each source returns normalized lead data

**Admin Dashboard nav**: Add "Lead Portal" entry to sidebar.
**Route**: `/admin/leads`

## Phase 6: Appointment Status Email Notifications

**Changes**:
- **Update `AdminAppointments.tsx`**: When status changes, call the `send-appointment-emails` edge function with the new status.
- **Update edge function**: Add status-change email templates (confirmed, in_session, completed, cancelled).

## Phase 7: Leaked Password Protection + Final DB Fixes

**Database**:
- Re-attach the `handle_new_user` trigger (still missing per db-triggers)
- Enable realtime on `chat_messages`
- Scope notary journal RLS to `created_by = auth.uid()`

**Auth**:
- Enable leaked password protection via `cloud--configure_auth`

---

## Summary of New Files
- `src/components/DocumentWizard.tsx`
- `src/components/ServiceDetailPanel.tsx`
- `src/pages/admin/AdminLeadPortal.tsx`
- `supabase/functions/process-inbound-email/index.ts`
- `supabase/functions/fetch-leads/index.ts`
- 2-3 database migrations (new tables, trigger, RLS)

## Summary of Modified Files
- `src/App.tsx` (new routes)
- `src/pages/ClientPortal.tsx` (expanded tabs: messages, payments, reviews, services)
- `src/pages/BookAppointment.tsx` (document wizard integration)
- `src/pages/admin/AdminDashboard.tsx` (lead portal nav item)
- `src/pages/admin/AdminEmailManagement.tsx` (import features)
- `src/pages/admin/AdminAppointments.tsx` (status change emails)
- `src/pages/admin/AdminServices.tsx` (requirements/workflow management)

## Implementation Order
1. Phase 7 (DB fixes + leaked password) — foundation
2. Phase 2 (new tables: payments, reviews) — enables client portal expansion
3. Phase 4 (service tables) — enables service-specific features
4. Phase 5 (lead tables) — enables lead portal
5. Phase 1 (Document Wizard) — UI component
6. Phase 3 (Email infrastructure) — edge function + UI
7. Phase 6 (Status emails) — edge function update
8. All UI changes across ClientPortal, BookAppointment, AdminDashboard, new pages

This is a substantial build. I recommend implementing phases 7, 2, 4, and 5 (database + core infrastructure) first, then building the UI components on top.

