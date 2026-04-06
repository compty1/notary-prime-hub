

# Plan: 800-Point Gap Analysis Import, Build Tracker Bug Fixes, Client Portal AI Tools Integration & Usage Caps

## Summary

This plan covers 4 major workstreams:
1. Generate and import ~800 specific gaps into the build_tracker_items table
2. Fix all build tracker component bugs
3. Add AI Tools tab to Client Portal with generation history, editing, version tracking
4. Implement 2-free-generation cap on the free plan

---

## Workstream 1: Generate & Import 800 Gaps into Build Tracker

Run a comprehensive script that audits every page, component, edge function, DB table, RLS policy, and service flow to produce 800 specific, actionable gap items. These will be inserted directly into `build_tracker_items` via the database.

### Gap Categories & Approximate Counts
- **Security & RLS** (~80): Missing DELETE policies on tables like `crm_activities`, `document_bundles`; missing UPDATE restrictions; CORS wildcards in remaining edge functions; CSP header gaps
- **Ohio RON Compliance** (~60): Journal credential_analysis not populated on finalize; witness ID verification gaps; commission expiry auto-check; e-seal hash not verified on download; recording duration validation
- **Accessibility** (~70): Missing `htmlFor`/`id` pairs in booking forms; color contrast on badge variants; keyboard navigation in custom dropdowns; focus indicators on cards; alt text on dynamic images
- **Performance** (~60): N+1 queries in AdminClients, AdminAppointments; missing pagination on admin lists; unbounded `.select("*")` on large tables; missing `loading="lazy"` on images; unnecessary re-renders in ClientPortal
- **UX/UI** (~120): Missing loading skeletons on ~15 admin pages; inconsistent empty states; missing confirmation dialogs for destructive actions; date format inconsistencies; mobile table overflow issues
- **Feature Completeness** (~100): tool_generations not surfaced in portal; no usage caps; missing version history for AI outputs; no rich text editing of results; missing webhook signature verification on some endpoints
- **Data Integrity** (~50): Orphaned FK references; missing cascade deletes; nullable columns that should have defaults; missing unique constraints
- **SEO** (~40): Missing structured data on service pages; duplicate meta descriptions; missing canonical URLs on paginated content
- **Testing** (~50): Zero test coverage for most components; missing edge function integration tests; no E2E tests for critical flows
- **Integration** (~40): SignNow webhook handler incomplete; HubSpot sync one-directional; Google Calendar sync not tested; Stripe refund flow missing email notification
- **Mobile** (~40): Admin dashboard unusable on mobile; portal tab bar overflow; touch target sizes below 44px; form inputs too small
- **Documentation** (~40): Missing JSDoc on all `lib/` exports; no API documentation for edge functions; missing README sections
- **DevOps/Infra** (~50): No global error handler; no structured logging; missing health checks on critical paths; no rate limiting on public endpoints

### Implementation
- Generate the gaps programmatically using a script that analyzes the codebase structure
- Batch insert into `build_tracker_items` (100 at a time via existing bulk insert)
- Each item gets: title, description, category, severity, impact_area, suggested_fix, page_route

---

## Workstream 2: Build Tracker Bug Fixes

### Bugs Found

1. **Bulk import limited to 100 items** — the `useBulkInsert` hook throws at >100. For 800 items, need to chunk automatically.

2. **Re-analyze only checks 50 uncategorized items** — `useReanalyze` slices to 50 (`uncategorized.slice(0, 50)`), missing the rest.

3. **Duplicate detection too aggressive** — title normalization strips all non-alphanumeric, causing false positives (e.g., "Add RLS to deals" and "Add RLS to documents" both normalize similarly).

4. **GapAnalysisTab sort state not persisted** — switching tabs loses sort/filter state.

5. **PlatformScanButton doesn't deduplicate against existing items** — running a scan can create duplicate entries if the same finding already exists.

6. **CSV export doesn't include all new fields** — missing `page_route` in some exports.

7. **TodoTab priority reordering fires excessive DB calls** — each arrow click triggers an immediate mutation without debouncing (the `moveDebounceRef` is declared but not used effectively).

8. **Plan History tab doesn't show item count** — `plan_items` array length not displayed in the list view.

### Fixes
- Chunk bulk inserts into batches of 100 automatically in `useBulkInsert`
- Remove the 50-item slice limit in `useReanalyze`
- Improve duplicate detection with Levenshtein distance or longer normalization keys
- Persist GapAnalysisTab filter state in URL search params
- Add title-based deduplication in PlatformScanButton before inserting
- Fix TodoTab to batch priority updates with a debounce timer
- Show plan item counts in PlanHistoryTab

---

## Workstream 3: Client Portal AI Tools Integration

### 3a. New "AI Tools" Tab in Client Portal

Add a new tab to `ClientPortal.tsx` between "Services" and "Refer":
- Tab icon: `Sparkles` with label "AI Tools"
- Shows the user's generation history from `tool_generations` table
- Quick-launch buttons for all 50+ tools
- Search/filter by tool category

### 3b. Generation History List
- Fetch from `tool_generations` where `user_id = auth.uid()`, ordered by `created_at DESC`
- Display: tool name (mapped from `tool_id`), date, truncated preview of result
- Click to expand full result with rendered markdown view
- "Re-use inputs" button that navigates to `/ai-tools?tool={tool_id}` with pre-filled fields

### 3c. Rich Text Editing of Results
- Add an "Edit" button on each generation that opens the `RichTextEditor` component (already exists)
- Convert the markdown result to HTML for editing, save back to `tool_generations.result`
- Track edit timestamp in a new `edited_at` column

### 3d. Version History
- Add a `tool_generation_versions` table to store previous versions when a result is edited
- Schema: `id, generation_id (FK), result, created_at`
- Before each edit save, insert the current result into versions
- UI: "Version History" expandable showing previous versions with timestamps and restore button

### 3e. Database Changes
```sql
-- Add edited_at to tool_generations
ALTER TABLE tool_generations ADD COLUMN edited_at timestamptz;

-- Version history table
CREATE TABLE tool_generation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid NOT NULL REFERENCES tool_generations(id) ON DELETE CASCADE,
  result text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tool_generation_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own generation versions"
  ON tool_generation_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM tool_generations g WHERE g.id = generation_id AND g.user_id = auth.uid()));
```

---

## Workstream 4: Free Plan Usage Cap (2 Free Generations)

### 4a. Server-Side Enforcement
In the `ai-tools` edge function, before calling the AI gateway:
- Count existing generations: `SELECT count(*) FROM tool_generations WHERE user_id = $1`
- If count >= 2 AND user has no paid subscription, return 402 with message "Free plan limit reached. Upgrade to continue."
- Check subscription status via a `subscriptions` table or a `user_plan` field on profiles

### 4b. Client-Side UX
- In `ToolRunner.tsx`, before generating, check remaining free uses
- Show a usage indicator: "1 of 2 free generations used"
- When limit reached, show upgrade CTA with link to `/subscribe`
- Handle 402 response gracefully with upgrade dialog

### 4c. Subscription Check
- Add a `plan` column to `profiles` table (default: `'free'`), or check against existing `subscriptions` table if present
- The edge function checks this value to determine if the cap applies

### 4d. Database Changes
```sql
-- Add plan column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
```

---

## Files Modified

### New Files
- `src/pages/portal/PortalAIToolsTab.tsx` — AI Tools tab for client portal
- `src/components/GenerationHistoryCard.tsx` — Reusable generation history card with edit/version UI

### Modified Files
- `src/pages/ClientPortal.tsx` — Add AI Tools tab, fetch tool_generations
- `src/components/ai-tools/ToolRunner.tsx` — Add usage cap UI, save result to DB after streaming
- `src/pages/admin/build-tracker/hooks.ts` — Fix bulk insert chunking, re-analyze limit
- `src/pages/admin/build-tracker/PlatformScanButton.tsx` — Deduplication before insert
- `src/pages/admin/build-tracker/TodoTab.tsx` — Fix priority reorder debouncing
- `src/pages/admin/build-tracker/GapAnalysisTab.tsx` — Persist filter state in URL
- `supabase/functions/ai-tools/index.ts` — Add free plan usage cap check

### Database Migrations
- Add `edited_at` column to `tool_generations`
- Create `tool_generation_versions` table with RLS
- Add `plan` column to `profiles`

### Gap Import Script
- Generate 800 gaps and batch-insert via Supabase client

---

## Unfinished Items from Previous Plans

The following items from the 700-point gap analysis were documented as resolved but code was not fully implemented:

1. **Phase 5 Accessibility** — Skip-to-content ✅ done. ARIA live ✅ done. But: form label audit (Gap 142), color contrast increase (Gap 143), keyboard nav fixes (Gaps 147-150) — NOT implemented
2. **Phase 6 Performance** — N+1 query fix in AdminClients (Gap 202) — NOT implemented. `useMemo` wrapping in ClientPortal (Gap 203) — NOT implemented
3. **Phase 7 UX/UI** — Standardized empty states, loading skeletons on remaining pages, mobile table scroll wrappers, confirmation dialogs — NOT implemented (only documented)
4. **Phase 8** — Refund email notification (Gap 372) — NOT implemented
5. **Phase 10** — Global error handler (`window.onerror`) — NOT implemented. JSDoc on lib exports — NOT implemented

All of these will be included in this plan's execution.

---

## Execution Order

1. Database migrations (new columns + version table)
2. Generate & import 800 gaps into build tracker
3. Fix build tracker bugs
4. Build portal AI Tools tab with history + editing + versions
5. Implement free plan cap in edge function + UI
6. Fix remaining items from previous phases (accessibility, performance, UX)

