

# Plan: Client Dashboard Restyle, Virtual Mailroom Enhancement, and Previous Plan Gap Completion

## Gaps from Previous Plans (Not Yet Implemented)

These items were approved but never built:
1. **AdminProcessFlows.tsx** — Centralized process flows + email template hub
2. **SessionWaitingRoom.tsx** — Real-time party waiting room for RON sessions
3. **ClientPortal "Active Session" banner** — Live session awareness on portal overview
4. **serviceFlows.ts automation metadata** — Enriching flow steps with email/trigger links

---

## Part 1: Client Dashboard Visual Restyle

Restyle `ClientPortal.tsx` to match the provided mockup's visual language while preserving ALL existing tabs and functionality.

### Changes to Overview Tab
- Replace the current flat stat cards with the mockup's colored icon-background style (blue/purple/green/orange icon backgrounds with larger stat numbers)
- Restyle the Onboarding Checklist to use dashed-border items with completion states, orange progress bar, and "Getting Started" header with progress fraction badge
- Add a right-column layout on desktop (2/3 + 1/3 grid): left side gets Onboarding + Upcoming Appointments, right side gets Document Readiness + AI Wizard card + Quick Help card
- Restyle the AI Document Wizard quick action as a gradient card (indigo-to-violet) with decorative Zap icon
- Add a "Need Help?" amber callout card linking to support chat
- Add a search bar in the portal header (cosmetic, filters appointments/documents)
- Restyle appointment list items with calendar icons, cleaner status badges, and hover states

### Navigation & Header
- Keep existing tab-based navigation (do NOT switch to sidebar — preserves mobile compatibility)
- Add user avatar initials + name in the header bar
- Add notification bell with unread count badge in header
- Apply the mockup's clean white backgrounds, rounded-2xl cards, slate-50 page background

### What is NOT changed
- All 14 existing tabs remain: Overview, Appointments, Documents, Status, Chat, Correspondence, Payments, Apostille, Requests, Reminders, Reviews, Services, AI Tools, Referral
- All existing functionality (cancel appointments, upload docs, payments, reviews, etc.) is untouched
- All existing data fetching, real-time subscriptions, and dialogs remain

### Files Modified
- `src/pages/ClientPortal.tsx` — Restyle overview tab layout, header, stat cards
- `src/components/PortalOnboardingChecklist.tsx` — Restyle to match mockup's dashed-border items with action buttons
- `src/components/PortalQuickActions.tsx` — Update colors to match mockup's style
- `src/components/DocumentReadinessScore.tsx` — Restyle with indigo accent, cleaner progress bar

---

## Part 2: Virtual Mailroom Enhancement

Enhance `VirtualMailroom.tsx` with features from the provided mailroom mockup while keeping existing DB integration with `mailroom_items` table.

### New Features
- **Split-pane layout**: Left panel = mail list with search/filter, right panel = selected item detail view
- **Mail detail panel**: Shows sender info, scanned document preview placeholder, AI summary section
- **AI summarize**: Button to call `notary-assistant` edge function to summarize mail item content, stores result in `mailroom_items.notes` column
- **Action center**: Forward to client (changes status to "forwarded"), archive, mark as read — already exist but get better UI
- **Draft response**: Button that navigates to DocuDex with pre-populated response content
- **Urgency/type badges**: Display mail type (Legal, Invoice, Personal) and urgency indicators
- **Stats header**: Show total items, new count, scanned count

### Layout
```text
┌──────────────────────────────────────────────────┐
│ Header: "Virtual Mailroom" + stats + filters     │
├──────────────────┬───────────────────────────────┤
│ Mail List        │ Mail Detail / Processor       │
│ (scrollable)     │ - Scanned preview area        │
│                  │ - AI Intelligence Report      │
│ [search bar]     │ - Action Center               │
│ [filter tabs]    │   (Forward, Archive, Draft)   │
│                  │                               │
│ [mail items]     │                               │
└──────────────────┴───────────────────────────────┘
```

### Files Modified
- `src/pages/VirtualMailroom.tsx` — Complete restyle with split-pane layout, AI summarize, detail view

---

## Part 3: Centralized Process Flows & Automation Hub (Previously Planned)

### New Admin Page: `/admin/process-flows`

Create `src/pages/admin/AdminProcessFlows.tsx` showing ALL service flows, automated steps, and email templates in one view.

**Layout:**
- Summary cards: total flows, total automated steps, total email templates, gap count
- Accordion per service flow from `serviceFlows.ts` — each step shows implementation status, linked automations, email template references
- "Email Templates" tab showing all email templates (per-service from `services.email_templates`, global from `platform_settings`, auth templates) with inline preview and edit
- Sync mechanism: editing a global template prompts to update matching per-service templates

### Enrich `serviceFlows.ts`
Add `automations` and `emailTemplateKey` fields to `FlowStep` type. Tag each step with its edge function triggers and email template keys.

### Files
- **New**: `src/pages/admin/AdminProcessFlows.tsx`
- **Modified**: `src/pages/admin/build-tracker/serviceFlows.ts` — add automation metadata
- **Modified**: `src/App.tsx` — add `/admin/process-flows` route
- **Modified**: `src/pages/admin/AdminDashboard.tsx` — add "Process Flows" sidebar item

---

## Part 4: Session Waiting Room (Previously Planned)

### New Component: `SessionWaitingRoom.tsx`

Real-time waiting room shown before RON session begins.

- Party status board: notary, signer(s), witnesses — shows "Connecting", "In Lobby", "Ready"
- Readiness checklist: ID uploaded, documents ready, tech check passed
- Auto-advance when all parties ready
- Uses Supabase Realtime on `session_tracking` table

### Client Portal Active Session Banner

Add to ClientPortal overview tab: when client has an appointment with status "in_session", show "Your session is active — Join Now" banner linking to `/ron-session`.

### Files
- **New**: `src/components/SessionWaitingRoom.tsx`
- **Modified**: `src/pages/RonSession.tsx` — integrate waiting room as pre-session phase
- **Modified**: `src/pages/ClientPortal.tsx` — add Active Session banner to overview

---

## Execution Order

1. Restyle ClientPortal overview tab + header (Part 1)
2. Restyle supporting components (Onboarding, QuickActions, DocumentReadiness)
3. Enhance VirtualMailroom with split-pane + AI summarize (Part 2)
4. Create AdminProcessFlows + enrich serviceFlows.ts (Part 3)
5. Create SessionWaitingRoom + integrate into RonSession + ClientPortal banner (Part 4)
6. Wire new routes and admin navigation
7. Verify build

## All Files

| File | Action |
|---|---|
| `src/pages/ClientPortal.tsx` | Restyle overview, add header search/avatar/bell, Active Session banner |
| `src/components/PortalOnboardingChecklist.tsx` | Restyle to mockup design |
| `src/components/PortalQuickActions.tsx` | Update styling |
| `src/components/DocumentReadinessScore.tsx` | Restyle with indigo accent |
| `src/pages/VirtualMailroom.tsx` | Split-pane layout, AI summarize, detail view |
| `src/pages/admin/AdminProcessFlows.tsx` | **New** — Process flows + email template hub |
| `src/pages/admin/build-tracker/serviceFlows.ts` | Enrich with automation metadata |
| `src/components/SessionWaitingRoom.tsx` | **New** — Real-time waiting room |
| `src/pages/RonSession.tsx` | Integrate waiting room phase |
| `src/App.tsx` | Add `/admin/process-flows` route |
| `src/pages/admin/AdminDashboard.tsx` | Add "Process Flows" to sidebar |

