

# Master Enhancement Plan — All 26 Features

This plan consolidates all recommended enhancements into a phased implementation across 8 workstreams. Each phase builds on the previous, with database migrations first, then edge functions, then UI.

---

## Phase 1: AI Tools Hub Upgrades (6 features)

### 1A. Database-backed Generation History
- New `tool_generations` table: `id, user_id, tool_id, fields (jsonb), result (text), created_at`
- RLS: users see only their own rows
- Replace localStorage history in `useFavoriteTools.ts` with Supabase queries
- Add "History" tab to AI Tools page showing past generations with search/re-run

### 1B. Improved Error Handling (429/402 mapping)
- Update `ToolRunner` in `AITools.tsx` to parse HTTP status codes from edge function responses
- Map `429` → "Rate limit reached, please wait" toast with countdown
- Map `402` → "Credits exhausted" toast with link to subscription plans
- Add retry-after header parsing for automatic retry delay

### 1C. Multi-turn Refinement
- Add "Refine" button below output that sends previous result + refinement prompt back to `ai-tools` edge function
- Store conversation context in component state (previous output + user refinement instruction)
- Update `ai-tools/index.ts` to accept optional `previousOutput` field and append to system prompt

### 1D. Ohio-Specific Notary Tools
- Add 5 new tools to `aiToolsRegistry.ts`:
  - Ohio RON Certificate Generator (acknowledgment/jurat with ORC citations)
  - Notary Journal Entry Drafter (per ORC §147.04 requirements)
  - Ohio Jurisdictional Acknowledgment/Jurat formatter
  - RON Session Summary Report generator
  - Notary Commission Renewal Checklist

### 1E. Template Pre-fills
- Add `presets` field to `AITool` interface in registry
- UI: dropdown above form fields to load saved presets
- Store custom presets per user in `tool_generations` table with `is_preset: true` flag

### 1F. Advanced Exports (PDF/DOCX)
- New `export-document` edge function that converts markdown to PDF using a Deno PDF library
- Add PDF and DOCX download buttons to the output panel
- Use HTML-to-PDF conversion with the rendered markdown content

---

## Phase 2: AI & Automation (4 features)

### 2A. AI Document Pre-Review
- New `ai-document-review` edge function that analyzes uploaded documents for:
  - Missing signatures/dates, expired dates, incomplete fields
  - Ohio compliance gaps (missing notary block, wrong venue)
- Add "AI Review" button to admin document detail view and client portal document tab
- Display findings as a checklist with severity badges

### 2B. Smart Scheduling AI
- New `ai-schedule-optimizer` edge function that analyzes appointment history to suggest optimal time slots
- Factors: historical demand by day/hour, travel distance patterns, service type duration
- Surface suggestions in `BookAppointment.tsx` as "Recommended slots" badges

### 2C. AI Signer FAQ Chatbot
- New public-facing chat widget component `SignerFAQBot.tsx`
- Uses existing `client-assistant` edge function pattern
- Pre-loaded with Ohio notary FAQ knowledge, document requirements, and pricing
- Embed on homepage and service detail pages as a floating widget

### 2D. Batch Document Processing
- New `ai-batch-process` edge function that processes multiple documents sequentially
- Admin UI: multi-select documents → "Batch AI Review" action
- Progress indicator showing per-document status
- Results summary table with pass/fail per document

---

## Phase 3: Client Experience (4 features)

### 3A. Real-time Session Status Tracking
- New `session_tracking` table: `id, appointment_id, status, shareable_token, updated_at`
- Public `/track/:token` route showing live session status (Waiting → In Progress → Complete)
- Generate shareable link when session starts, send to client via email
- Realtime subscription for instant status updates

### 3B. SMS Reminders via Twilio
- Connect Twilio connector
- New `send-sms-reminder` edge function using Twilio gateway
- Add phone number field to appointment booking (optional)
- Scheduled cron job to send reminders 24h and 1h before appointments
- Admin toggle in settings to enable/disable SMS

### 3C. Document Readiness Score
- New component `DocumentReadinessScore.tsx` displayed in client portal
- Analyzes uploaded documents against service requirements from `serviceConstants.ts`
- Visual progress ring: percentage complete with missing items listed
- Triggers before appointment to ensure clients arrive prepared

### 3D. Client Self-Rescheduling
- New `/reschedule/:confirmationNumber` public route
- Validates client identity via email + confirmation number
- Shows available time slots (respecting existing availability rules)
- Updates appointment record with `rescheduled_from` field populated
- Sends confirmation email via existing email infrastructure

---

## Phase 4: Revenue & Growth (3 features)

### 4A. Referral Portal
- New `referrals` table: `id, referrer_id, referee_email, status, reward_amount, created_at, converted_at`
- Client portal "Refer a Friend" tab with unique referral link generation
- Track conversions when referred email signs up and completes first appointment
- Admin view of referral metrics and reward management

### 4B. Upsell Engine
- New `service_upsells` table: `id, trigger_service, suggested_service, message, discount_percent`
- After booking confirmation, display contextual upsell cards (e.g., "Add Apostille service for 10% off")
- Admin UI to configure upsell rules per service type
- Track conversion rate of upsell offers

### 4C. Revenue Forecasting Dashboard
- New admin tab in Revenue page: "Forecast"
- Query historical appointment + payment data, group by month
- Linear regression projection for next 3 months using client-side calculation
- Recharts area chart with actual vs projected revenue
- Breakdown by service type and notarization type

---

## Phase 5: Admin & Operations (4 features)

### 5A. Notary Performance Scorecards
- New admin page `/admin/performance` (add to sidebar)
- Metrics per notary: appointments completed, avg session duration, client ratings, on-time rate
- Query from `appointments` + `notary_journal` tables
- Visual scorecards with sparkline trends using Recharts

### 5B. Ohio RON Compliance Reporting
- New admin page `/admin/compliance-report`
- Auto-generated monthly report: total RON sessions, KBA pass/fail rates, recording retention status, journal completeness
- Exportable as CSV/PDF for Ohio Secretary of State filing
- Alert badges for any compliance gaps detected

### 5C. Smart Task Assignment
- Enhance `AdminTaskQueue.tsx` with auto-assignment logic
- New `assign-task` edge function that considers: notary availability, current workload, service specialization, geographic proximity
- Admin can toggle between manual and smart assignment modes
- Assignment audit trail in existing audit_log

### 5D. Webhook Event Dashboard
- New admin page `/admin/webhooks` showing recent webhook events
- New `webhook_events` table: `id, source (stripe/signnow), event_type, payload (jsonb), status, processed_at, error`
- Update `stripe-webhook` and `signnow-webhook` edge functions to log events
- Filterable table with status indicators and payload inspection

---

## Database Migrations Summary

New tables required (7 total):
1. `tool_generations` — AI tool usage history + presets
2. `session_tracking` — Real-time appointment status sharing
3. `referrals` — Referral program tracking
4. `service_upsells` — Upsell configuration rules
5. `webhook_events` — Webhook event logging
6. `notary_performance_cache` — Materialized performance metrics
7. `compliance_reports` — Generated compliance report records

All tables will have RLS policies restricting access: admin-only for operational tables, user-scoped for client-facing tables.

---

## New Edge Functions Summary

1. `export-document` — Markdown to PDF/DOCX conversion
2. `ai-document-review` — Pre-notarization document scanning
3. `ai-schedule-optimizer` — Smart slot recommendations
4. `ai-batch-process` — Multi-document AI processing
5. `send-sms-reminder` — Twilio SMS delivery
6. `assign-task` — Smart notary task assignment

---

## New Pages/Routes Summary

1. `/track/:token` — Public session status tracker
2. `/reschedule/:confirmationNumber` — Client self-rescheduling
3. `/admin/performance` — Notary scorecards
4. `/admin/compliance-report` — Ohio RON compliance reports
5. `/admin/webhooks` — Webhook event dashboard

---

## Implementation Order

Phases are ordered by dependency and impact:
- **Phase 1** first (AI Tools Hub) — fixes the most-used feature, no new tables needed for 3 of 6 items
- **Phase 2** next (AI & Automation) — leverages Phase 1 patterns
- **Phase 3** (Client Experience) — requires Twilio connector setup
- **Phase 4** (Revenue) — independent, can parallel with Phase 3
- **Phase 5** (Admin) — builds on all data from previous phases

Estimated: ~15-20 implementation steps across all phases.

