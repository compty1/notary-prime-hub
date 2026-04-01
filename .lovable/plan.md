

# Build Tracker Overhaul + AI Assistant + Email Management Tab

## Overview
Fix broken/incomplete build tracker functionality, add AI-powered analysis chat, comprehensive entity/flow diagnostics, auto-importing plan history, and a dedicated Automated Email Management tab with live preview, tag insertion, and bulk template editing.

## Current Issues Identified

1. **Re-analyze button** only checks for stale `resolved_at` — does nothing meaningful for most users
2. **Refresh button** only refetches `build-tracker-items`, does NOT refresh plans or other tab data
3. **Service flows are hardcoded** — no dynamic analysis of actual codebase state
4. **Plan History is manual-only** — no auto-import capability
5. **No AI reasoning** — no chat or analysis engine
6. **No entity/function registry** — doesn't enumerate platform capabilities (email, calendar, payments, etc.)
7. **Email template designer** exists but is limited to 3 templates, no tag insertion, no automated email catalog

---

## Phase 1: Fix Core Build Tracker Issues

### 1a. Fix Refresh to work across all tabs
- Change `Refresh` button to invalidate ALL build-tracker query keys: `build-tracker-items`, `build-tracker-plans`
- Add `refetchPlans` from `usePlans()` to main component
- **File**: `AdminBuildTracker.tsx`

### 1b. Fix Re-analyze button with real analysis
Replace the current stub with a comprehensive analysis that:
- Flags stale resolved items (existing)
- Cross-references service flow steps against tracker items to find missing gaps
- Checks for duplicate/overlapping items and flags them
- Identifies items with no category or impact area and auto-categorizes them using `autoCategorize()`
- Generates a toast summary of findings and auto-creates new tracker items for discovered gaps
- **File**: `AdminBuildTracker.tsx`, new utility in `constants.ts`

### 1c. Fix query invalidation chain
- All mutation hooks (`useInsertItem`, `useBulkInsert`, `useUpdateItem`, etc.) should also invalidate `build-tracker-plans` when relevant
- **File**: `hooks.ts`

---

## Phase 2: Platform Entity Registry & Function Analyzer

### New tab: "Platform Functions"
A comprehensive registry of every platform capability organized by domain:

**Entities tracked:**
- Email Management (IONOS sync, automated emails, templates, deliverability)
- Services Catalog (14+ categories, fuzzy search, detail pages)
- Appointments (booking flow, scheduling, reminders, rescheduling)
- Calendar Integration (availability, time slots, double-booking prevention)
- Payments (Stripe, invoicing, receipts, refunds)
- Document Management (upload, OCR, templates, versioning, e-seal)
- RON Sessions (tech check, KBA, recording, compliance)
- CRM & Leads (pipeline, deals, activities, proposals)
- Client Portal (dashboard, chat, documents, appointments)
- Business Portal (registration, members, verification)
- Admin Dashboard (overview, journal, revenue, audit log)
- AI Services (extractors, style-match, compliance watchdog, writer)
- Authentication (signup, login, roles, MFA status)
- Notifications (email reminders, session timeout, document expiry)

Each entity shows: status (healthy/needs attention/missing), sub-components, related tracker items, last analysis timestamp, and a "Diagnose" button that runs flow-specific checks.

**Files**: New `src/pages/admin/build-tracker/PlatformFunctionsTab.tsx`, new `src/pages/admin/build-tracker/platformEntities.ts`

---

## Phase 3: AI Build Analyst Chat

### New tab: "AI Analyst"
An AI chat interface specialized in:
- UX design, development, functionality analysis
- Brand psychology and sales optimization
- Notarization law and compliance (Ohio ORC §147)
- Marketing strategy and conversion optimization
- Architecture and code quality assessment

**Implementation:**
- New edge function `build-analyst` using Gemini 2.5 Pro
- System prompt loaded with: platform entity registry, service flow definitions, current tracker item summary, page registry, and Ohio notary compliance requirements
- Chat sends full context of current build state with each message
- AI can construct implementation plans (auto-parsed and saved to `build_tracker_plans`)
- AI can suggest new tracker items, which admin can one-click accept
- Conversation stored in `chat_messages` with a special `conversation_type = 'build_analyst'` or similar approach
- Responses rendered with `react-markdown` for structured output

**Files**: 
- New `src/pages/admin/build-tracker/AIAnalystTab.tsx`
- New `supabase/functions/build-analyst/index.ts`

---

## Phase 4: Auto-Import Plan History

### Enhancement to Plan History tab
- When a new plan is detected (via the AI analyst or manual paste), auto-parse it:
  - Split on numbered lines, bullet points, headers
  - Extract task titles, categorize each using `autoCategorize()`
  - Generate `plan_items` array with `pending` status
- Add "Auto-Analyze Plan" button that uses AI to:
  - Summarize the plan
  - Cross-reference tasks against existing tracker items
  - Mark tasks that are already implemented as `implemented`
  - Flag tasks that overlap with existing items
- Plans created by the AI Analyst tab are automatically saved

**Files**: `PlanHistoryTab.tsx`, `hooks.ts` (new `useAutoAnalyzePlan` hook)

---

## Phase 5: Automated Email Management Tab

### New tab: "Email Templates"
A dedicated management interface for ALL automated emails in the platform.

**Email catalog (all automated emails):**
1. Appointment Confirmation
2. Appointment Reminder (24hr)
3. Appointment Reminder (30min)
4. Appointment Completed / Follow-up
5. Signup Welcome
6. Password Recovery
7. Magic Link
8. Email Change Verification
9. Invite
10. Reauthentication Code
11. Lead Contact Confirmation
12. Booking Receipt
13. Document Ready Notification
14. RON Session Link

**Features:**
- **Master Template Editor**: Edit the shared email layout (header, footer, colors, fonts) that wraps ALL automated emails — changes apply to every template. Extends existing `EmailTemplateDesigner` component.
- **Per-Template Editor**: Select any template from the catalog, edit its HTML body with a rich text editor
- **Clickable Tag Insertion**: Sidebar of available placeholder tags (e.g., `{{client_name}}`, `{{date}}`, `{{time}}`, `{{service_type}}`, `{{confirmation_number}}`, `{{location}}`). Clicking a tag inserts it at cursor position in the editor.
- **Live Preview**: Real-time rendered preview with sample data replacing tags, showing the full email as it would appear (master template + body content)
- **Color & Brand Controls**: Inline color pickers for header, accent, footer, body — synced with master template
- **Template-specific sample data**: Each template type has realistic sample data for preview
- **Save**: Persists to `platform_settings` table via existing mechanism

**Files**: 
- New `src/pages/admin/build-tracker/EmailTemplatesTab.tsx`
- Update `AdminBuildTracker.tsx` to add the tab

---

## Phase 6: Enhanced Dashboard

### Dashboard improvements
- Add "Platform Functions Health" section showing entity health summary
- Add "Email Templates" status card (configured vs unconfigured count)
- Add "AI Analysis" card showing last analysis timestamp and key findings
- Make all stat cards clickable to navigate to relevant tab

**File**: `DashboardTab.tsx`

---

## Files Changed Summary

### New Files:
1. `src/pages/admin/build-tracker/PlatformFunctionsTab.tsx` — Entity registry & diagnostics
2. `src/pages/admin/build-tracker/platformEntities.ts` — Entity definitions
3. `src/pages/admin/build-tracker/AIAnalystTab.tsx` — AI chat interface
4. `src/pages/admin/build-tracker/EmailTemplatesTab.tsx` — Automated email management
5. `supabase/functions/build-analyst/index.ts` — AI analysis edge function

### Modified Files:
6. `src/pages/admin/AdminBuildTracker.tsx` — Add new tabs, fix refresh/re-analyze
7. `src/pages/admin/build-tracker/hooks.ts` — Fix query invalidation, add AI hooks
8. `src/pages/admin/build-tracker/constants.ts` — Add entity types, analysis utilities
9. `src/pages/admin/build-tracker/DashboardTab.tsx` — Enhanced dashboard cards
10. `src/pages/admin/build-tracker/PlanHistoryTab.tsx` — Auto-import & AI analysis integration

### Database:
- No schema changes needed — uses existing `platform_settings`, `build_tracker_plans`, `build_tracker_items`, and `chat_messages` tables

