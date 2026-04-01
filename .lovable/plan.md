

# Build Tracker — Comprehensive Analysis & Plan Tracking Enhancement

## Overview
Transform the build tracker from a static gap list into an intelligent, self-updating project analysis engine with service flow auditing, page-level diagnostics, integration health checks, and full plan history tracking from chat.

## Database Changes

### New table: `build_tracker_plans`
Tracks all implementation plans from Lovable chat sessions, their tasks, and completion status.

```sql
CREATE TABLE build_tracker_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_title text NOT NULL,
  plan_summary text,
  plan_items jsonb NOT NULL DEFAULT '[]',  -- [{title, status, tracker_item_id?}]
  source text NOT NULL DEFAULT 'manual',   -- 'chat' | 'manual'
  chat_context text,                        -- raw plan text from chat
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: admin-only, updated_at trigger
```

### Seed migration for service flow definitions
Insert structured service flow data into `build_tracker_items` with new categories and a new `flow_steps` jsonb column added to the existing table:

```sql
ALTER TABLE build_tracker_items
  ADD COLUMN IF NOT EXISTS flow_steps jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS page_route text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES build_tracker_plans(id) ON DELETE SET NULL;
```

## New Tabs (added to existing 4-tab layout → 7 tabs)

### Tab 5: Service Flow Analyzer
Pre-loaded with every service flow in the platform, each broken into steps with pass/fail analysis:

- **Booking Flow**: Landing → Service Select → Date/Time → Intake → Review → Payment → Confirmation → Email
- **RON Session Flow**: Booking → TechCheck → ID Verify → KBA → Recording Consent → Signing Platform → E-Seal → Journal → Invoice
- **Client Portal Flow**: Login → Dashboard → Documents → Chat → Appointments → Correspondence → Service Requests
- **Business Portal Flow**: Login → Members → Documents → Appointments
- **Document Flow**: Upload → Review → Notarize → Download → E-Seal Verify
- **Lead Capture Flow**: Website Form / Chatbot / Email → Lead Created → CRM Activity → Deal → Contacted → Converted
- **Admin Workflow**: Overview → Appointments → Clients → Journal → Revenue → Documents → Chat → Email

Each flow rendered as a visual step list with status indicators. Clicking a step expands to show: what's implemented, what's missing, suggested fixes. Steps link to corresponding tracker items. "Add all gaps to To-Do" per flow.

### Tab 6: Page Auditor
Lists every route in the app (derived from App.tsx route definitions — hardcoded list of ~50 routes) with per-page analysis:

- Route path, component name, protection status (public/auth/admin)
- Known issues per page (linked tracker items filtered by `page_route`)
- Quick-add issue button scoped to that page
- Categories checked per page: brand consistency, mobile responsiveness, error handling, loading states, SEO meta, accessibility
- Filter by: public pages, auth pages, admin pages, pages with issues, pages without issues

### Tab 7: Plan History
Tracks all implementation plans with task-level completion:

- List of all saved plans with title, date, task count, completion percentage
- Expand to see each task with status (implemented / pending / partial)
- "Add unfinished tasks to To-Do" button per plan
- "Add New Plan" form: title, summary, paste plan text (auto-parsed into task items)
- Each plan task can link to a `build_tracker_items` entry
- Completion bar visualization per plan

## Enhanced Existing Tabs

### Dashboard Tab Additions
- **Service Flow Health** section: mini cards showing each flow's completion % 
- **Pages with Issues** count card
- **Plans Completion** summary card
- **Auto-Refresh on Mount**: When the tracker opens, it runs `refetch()` automatically. The "Re-analyze" button enhanced to also check:
  - Items with `page_route` that no longer exists in the route list → flag as "stale"
  - Items marked resolved but with no `resolved_at` → flag back to open
  - Items whose `suggested_fix` mentions a component that now exists in the codebase (heuristic match on title keywords)

### Gap Analysis Tab Additions
- New filter: `page_route` (filter by specific page)
- New filter: `plan_id` (filter by plan)
- New column: "Page" showing the route if set
- Enhanced categories list: add `brand`, `integration`, `mobile`, `accessibility`, `data`

### Add/Import Tab Additions
- "Import Plan from Chat" section: paste a plan from chat history, auto-parses headers + bullet points into individual tracker items with plan linkage
- Auto-categorization: scans title for keywords like "security" → category=security, "RON" → impact_area=RON Session, etc.

## Auto-Analysis Engine (client-side)
A utility function `analyzeCurrentBuild()` that runs on mount and on "Re-analyze" button click:

1. Cross-references all tracker items against a hardcoded knowledge base of expected features (derived from service flows)
2. Checks for items that should exist but don't (e.g., "Payment error handling" in Booking Flow)
3. Generates "suggested new items" that admin can one-click add
4. Updates status reasoning: items titled with keywords matching implemented pages get flagged for review

## File Structure

Split the monolithic 903-line file into manageable sub-components:

```
src/pages/admin/AdminBuildTracker.tsx          — Main shell + tabs (reduced to ~200 lines)
src/pages/admin/build-tracker/DashboardTab.tsx
src/pages/admin/build-tracker/GapAnalysisTab.tsx
src/pages/admin/build-tracker/TodoTab.tsx
src/pages/admin/build-tracker/AddImportTab.tsx
src/pages/admin/build-tracker/ServiceFlowTab.tsx    — NEW
src/pages/admin/build-tracker/PageAuditorTab.tsx    — NEW
src/pages/admin/build-tracker/PlanHistoryTab.tsx     — NEW
src/pages/admin/build-tracker/constants.ts           — shared types, colors, categories
src/pages/admin/build-tracker/hooks.ts               — all mutation/query hooks
src/pages/admin/build-tracker/serviceFlows.ts        — flow step definitions
src/pages/admin/build-tracker/pageRegistry.ts        — all routes with metadata
```

## Files Changed

1. **New migration**: `build_tracker_plans` table + `build_tracker_items` column additions + seed service flow data
2. **New**: 8 files in `src/pages/admin/build-tracker/` (split + new tabs)
3. **Rewrite**: `src/pages/admin/AdminBuildTracker.tsx` — thin shell importing sub-components
4. **No changes** to App.tsx or AdminDashboard.tsx (route already exists)

## Key Design Decisions

- Service flows are **hardcoded definitions** in `serviceFlows.ts` — they describe what SHOULD exist. Tracker items describe what's actually tracked. The flow analyzer cross-references them.
- Page registry is **hardcoded from App.tsx routes** — keeps it accurate without runtime introspection.
- Plan tracking is **manual import** — admin pastes plan text and it gets parsed. No automatic chat history access (that's not available at runtime), but provides a structured way to track all plans.
- Auto-analysis is **heuristic** — keyword matching on titles, not code analysis. Practical and fast.
- Categories expanded to: `gap`, `feature`, `workflow`, `security`, `compliance`, `ux`, `seo`, `performance`, `brand`, `integration`, `mobile`, `accessibility`, `data`

