

# Build Intelligence & Gap Tracker — Admin Module

## What This Is
A new admin page at `/admin/build-tracker` that serves as a centralized build management hub. It ingests all known gaps, features, and workflow issues, shows their current status and impact, and provides full to-do list management with notes, bulk operations, and accurate status reasoning.

## Database

### New table: `build_tracker_items`
```sql
CREATE TABLE build_tracker_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'gap',        -- gap, feature, workflow, security, compliance, ux, seo, performance
  severity text NOT NULL DEFAULT 'medium',      -- critical, high, medium, low, info
  status text NOT NULL DEFAULT 'open',          -- open, in_progress, resolved, deferred, wont_fix
  impact_area text,                             -- e.g. "Booking Flow", "RON Session", "CRM", "Security"
  suggested_fix text,
  is_on_todo boolean NOT NULL DEFAULT false,
  todo_priority integer,                        -- ordering within to-do list
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
- RLS: admin-only (uses `has_role` function)
- Trigger for `updated_at`

### Seed data
Pre-populate with ~80 items parsed from the user's original gap list and `.lovable/plan.md`, each with:
- Accurate current status (resolved if implemented, open if not)
- Category and severity assignment
- Impact area mapping
- Suggested fix text

## New Page: `src/pages/admin/AdminBuildTracker.tsx`

### Layout — 4 sections via Tabs

**Tab 1: Dashboard Overview**
- KPI cards: Total items, Open gaps, In Progress, Resolved, Deferred
- Breakdown charts by category and severity (bar chart using existing pattern)
- "Build Health Score" — percentage of resolved vs total

**Tab 2: Gap Analysis**
- Filterable/searchable table of all items
- Columns: Title, Category, Severity, Status, Impact Area, On To-Do
- Inline status dropdown to change status
- Click row to expand: description, suggested fix, admin notes editor
- Color-coded severity badges

**Tab 3: To-Do List**
- Shows only items where `is_on_todo = true`, ordered by `todo_priority`
- Bulk operations toolbar:
  - Select All / Deselect All checkbox
  - "Add All Open to To-Do" button — bulk sets `is_on_todo = true` for all open items
  - "Mark Selected Done" — bulk status update
  - "Remove from To-Do" — bulk unset
- Drag-to-reorder (or up/down buttons) for priority
- Inline notes editing per item
- Add custom to-do item button (opens form with title, description, category, severity)

**Tab 4: Add / Import**
- Form to manually add new gap/feature/issue
- Fields: title, description, category (dropdown), severity (dropdown), impact area, suggested fix
- Bulk add via textarea (one title per line, auto-categorized as "gap")

### Key Behaviors
- All CRUD via Supabase queries to `build_tracker_items`
- Real-time status updates with optimistic UI
- Status change auto-sets `resolved_at` when marking resolved
- Search works across title, description, suggested_fix, admin_notes
- Filter by: category, severity, status, impact_area, is_on_todo

## Routing & Navigation
- Add route `/admin/build-tracker` in `App.tsx` under admin layout
- Add sidebar item "Build Tracker" with `Bug` icon in `AdminDashboard.tsx`

## Seed Migration
A second migration will INSERT the initial ~80 items covering all gaps from the user's list, with statuses accurately reflecting current implementation state (cross-referenced with `.lovable/plan.md` and actual codebase).

## Files Changed
1. **New:** `supabase/migrations/..._build_tracker.sql` — table + RLS + trigger + seed data
2. **New:** `src/pages/admin/AdminBuildTracker.tsx` — full page with 4 tabs
3. **Edit:** `src/App.tsx` — add lazy route
4. **Edit:** `src/pages/admin/AdminDashboard.tsx` — add sidebar nav item
5. **Edit:** `src/integrations/supabase/types.ts` — auto-updated

