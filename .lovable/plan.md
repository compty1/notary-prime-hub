

# Build Tracker — Gap Fix Plan

## Issues Found

1. **Console warning**: `AlertDialogContent` ref forwarding warning from Radix
2. **Date sorting broken**: `updated_at` sorted as string instead of timestamp
3. **jumpToId doesn't scroll**: Expanding a row from Dashboard doesn't scroll into view
4. **Bulk import fires N individual mutations**: Each line triggers a separate insert — slow and spammy
5. **Todo priority reorder race condition**: `movePriority` fires 2 separate mutations that can conflict
6. **Gap Analysis tab count shows total, not filtered**: Tab badge says "Gap Analysis (77)" even when filtering
7. **No "Re-analyze" button**: Plan called for status re-analysis but only Refresh exists
8. **No "Clear Filters" button**: Must manually reset each dropdown
9. **QuickAdd doesn't reset on close**: Category/severity persist between opens
10. **Delete dialog doesn't show item titles**: Just shows count, unhelpful for single deletes
11. **No empty state for Gap Analysis**: Shows blank table with no guidance
12. **`LegalGlossaryProvider` catches "Title" column header**: The word "Title" in the table header gets wrapped in a legal glossary tooltip (visible in session replay) — needs data attribute exclusion

## Fixes

### File: `src/pages/admin/AdminBuildTracker.tsx`

**Fix 1 — Date sorting**: Change `sortItems` to compare `updated_at` by timestamp, not string localeCompare.

**Fix 2 — Scroll to expanded item**: Add `useEffect` + `scrollIntoView` when `jumpToId` changes in `GapAnalysisTab`.

**Fix 3 — Batch bulk import**: Replace per-line `insert.mutate()` loop with single `.insert([...])` call using a new `useBulkInsert` hook.

**Fix 4 — Priority reorder**: Combine both priority swaps into a single `useBulkUpdate` call to prevent race conditions.

**Fix 5 — Filtered count on tab**: Pass `filteredCount` from `GapAnalysisTab` up via callback; display on tab trigger. Use a ref or state lift.

**Fix 6 — Re-analyze button**: Add "Re-analyze" action next to Refresh that checks resolved items against known patterns (e.g., items marked resolved with no `resolved_at` timestamp) and flags stale ones back to `open`.

**Fix 7 — Clear Filters button**: Add a "Clear" button that resets all filter dropdowns + search to defaults.

**Fix 8 — QuickAdd reset**: Reset `category` and `severity` to defaults in `onClose`.

**Fix 9 — Delete dialog improvements**: Show first 3 item titles in the delete confirmation.

**Fix 10 — Empty state**: Show message when `sorted.length === 0` after filtering.

**Fix 11 — Legal glossary exclusion**: Add `data-no-glossary` attribute to the table header to prevent `LegalGlossaryProvider` from processing it.

**Fix 12 — Console warning**: The Radix AlertDialog ref warning is benign and version-dependent — no code change needed.

## Files Changed
1. **Edit:** `src/pages/admin/AdminBuildTracker.tsx` — all fixes above

