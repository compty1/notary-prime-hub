

# Build Tracker Enhancement Plan

## Current State
The tracker has 4 tabs (Dashboard, Gap Analysis, To-Do, Add/Import) with basic CRUD, filtering, bulk operations, and charts. It works but is missing key capabilities for effective build management.

## Enhancements

### 1. Refresh & Re-analyze Button
- Add a prominent "Refresh" button in the header that refetches data from the database
- Add a "Re-analyze Statuses" action that cross-references items against known resolved patterns and flags stale statuses

### 2. Sorting on All Columns
- Make every column header in the Gap Analysis table clickable to sort ascending/descending
- Support multi-field sort: Title, Category, Severity (by rank), Status, Impact Area, Updated At
- Visual sort indicator arrows on active column

### 3. Impact Area Filter
- Add an Impact Area dropdown filter alongside Category/Severity/Status filters
- Auto-populate options from distinct `impact_area` values in the dataset

### 4. Status Summary Counts in Filters
- Show counts next to each filter option (e.g. "Security (12)", "Critical (5)")
- Show total filtered count prominently

### 5. Bulk Operations in Gap Analysis Tab
- Add Select All checkbox + per-row checkboxes to the Gap Analysis table
- Bulk toolbar: "Add Selected to To-Do", "Change Status", "Change Category", "Delete Selected"
- This mirrors the To-Do tab bulk ops but works across all items

### 6. Delete Item Capability
- Add delete mutation with confirmation dialog
- Available in expanded row detail and via bulk selection
- Uses `supabase.from("build_tracker_items").delete()`

### 7. To-Do Tab: Inline Status Change
- Add inline status dropdown on each to-do card (currently only shows status text)
- When marking "resolved", auto-remove from to-do list

### 8. To-Do Tab: Filter by Category/Severity
- Add quick-filter chips at top of to-do list for category and severity
- Helps focus on e.g. only "security" to-dos or "critical" items

### 9. Dashboard: Impact Area Breakdown Chart
- Third chart showing items grouped by impact_area
- Shows which parts of the build have the most open issues

### 10. Dashboard: Recently Updated Items
- List of 10 most recently updated items with timestamp
- Quick-click to jump to item in Gap Analysis tab

### 11. Gap Analysis: "Updated At" Column with Relative Time
- Show "2h ago", "3d ago" etc. for when each item was last touched
- Sortable column

### 12. Keyboard Shortcut for Quick Add
- "N" key opens quick-add modal from any tab
- Minimal form: title + category + severity, then Enter to save

### 13. Export Capability
- "Export CSV" button that downloads all items (or filtered subset) as CSV
- Useful for sharing status reports

### 14. Count Badges on Tab Headers
- Show count on each tab: "To-Do (15)", "Gap Analysis (80)"
- To-Do shows only active to-do count; Gap Analysis shows filtered count

## Technical Approach

All changes are in a single file: `src/pages/admin/AdminBuildTracker.tsx`

- Add `useDeleteItem` mutation hook
- Add sorting state (`sortField`, `sortDir`) to GapAnalysisTab with clickable headers
- Add `selectedGaps` state + bulk toolbar to GapAnalysisTab
- Add impact_area filter derived from `useMemo` on distinct values
- Add relative time formatter utility (inline)
- Add CSV export function using `Blob` + `URL.createObjectURL`
- Add `AlertDialog` for delete confirmation
- Add category/severity filter chips to TodoTab
- Add recently-updated section to DashboardTab
- Add count badges to TabsTrigger components

No database changes needed — all enhancements are UI-side.

## Files Changed
1. **Edit:** `src/pages/admin/AdminBuildTracker.tsx` — all enhancements above

