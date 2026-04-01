

# Plan: Fix 100 Gaps in the Build Tracker

After thorough analysis of all 13 build tracker components, here are 100 identified issues grouped into categories, with fixes.

---

## A. Runtime Errors & Bugs (10 items)

1. **BulkActionBar ref warning** — Console error: "Function components cannot be given refs". BulkActionBar is passed as a child but receives a ref from Radix. Fix: wrap with `React.forwardRef`.
2. **MutationRecord attributeName error** — Runtime TypeError from rrweb/session replay conflicting with DOM. Add error suppression in ErrorBoundary.
3. **BulkActionBar duplicated** — Gap Analysis has both an inline bulk bar (lines 171-179) AND the floating BulkActionBar component (line 325). Remove the inline duplicate.
4. **Checkbox rapid toggle loop** — Session replay shows checkboxes toggling on/off rapidly (20+ times in <2ms). Likely a state sync race in todo priority reorder. Add debounce to `movePriority`.
5. **EmailTemplatesTab query uses wrong column** — Line 84 queries `platform_settings` with `.eq("key", ...)` but the table uses `setting_key` column. Fix column name.
6. **No error boundary on AI streaming** — If the SSE stream breaks mid-parse, `JSON.parse` throws silently. Multiple components catch but log nothing. Add user-visible retry.
7. **CSV export missing ID column** — `exportCSV` omits the item `id`, making re-import impossible. Add ID as first column.
8. **Delete confirmation doesn't disable button** — Delete dialog's action button has no `disabled` state during mutation.
9. **Pagination resets on bulk update** — After bulk resolve, `items` array changes trigger page reset to 1 even if user is on page 3. Preserve page if items still exist.
10. **Stale `jumpToId`** — After jumping to a gap, `jumpToGapId` is never cleared, so switching tabs and back re-scrolls.

## B. Missing Functionality (20 items)

11. **No CSV import** — Bulk import only supports plain text lines. Add CSV file upload with column mapping.
12. **No undo for bulk operations** — Bulk resolve/delete has no undo. Add toast with "Undo" action using previous state.
13. **No item history/changelog** — No audit trail when status changes. Track status transitions with timestamps.
14. **No drag-and-drop reorder in To-Do** — Priority reorder uses arrow buttons only. Add drag-and-drop.
15. **No keyboard navigation in Gap table** — No arrow key navigation, Enter to expand, Escape to collapse.
16. **No "Select visible" vs "Select all"** — `toggleAll` selects all filtered items across pages, not just visible page.
17. **No item creation date display** — Cards/rows don't show when items were created, only updated.
18. **No deep linking to specific items** — Can't share a URL that opens a specific gap item.
19. **No data backup/restore** — No way to export full state (items + plans) and restore later.
20. **No real-time sync** — Multiple admin users see stale data. Add Supabase realtime subscription.
21. **No item comments/threads** — `admin_notes` is a single text field. No threaded discussion.
22. **No item attachments** — Can't attach screenshots or files to tracker items.
23. **No recurring items** — Can't set items to auto-reopen on schedule (e.g., weekly compliance check).
24. **No batch category reassignment** — Can bulk resolve but can't bulk change category or severity.
25. **No print view** — No print-friendly layout for reports.
26. **Theme Explorer "Apply to Preview"** — Button exists conceptually but no state bridge to LivePreviewTab.
27. **No search in Plan History** — Can't search across plans by title or content.
28. **No item merge** — Duplicate items can't be merged, only deleted.
29. **No Gantt/timeline view** — No visual timeline of items by creation/resolution date.
30. **No notifications for status changes** — No toast or indicator when items change externally.

## C. UX & Design Issues (20 items)

31. **Filter state lost on tab switch** — Switching from Gaps to Dashboard and back resets all filters.
32. **No loading states on individual mutations** — Status dropdown change shows no loading indicator.
33. **Bulk action bar overlaps content** — Fixed bottom bar covers pagination controls.
34. **No confirmation for "Resolve All" per category** — Dashboard category "Resolve All" buttons have no confirmation dialog.
35. **Empty states inconsistent** — Some tabs show icons+text, others just text. Standardize.
36. **No skeleton loading** — Tabs show spinner; should show content-shaped skeletons.
37. **Tab overflow not obvious** — Horizontal scroll on tab bar has no visual indicator that more tabs exist.
38. **Long titles truncated without tooltip** — Gap table truncates titles but no hover tooltip to see full text.
39. **Color contrast issues in severity badges** — Yellow-on-white (`medium`) is hard to read in light mode.
40. **No dark mode optimization for charts** — Recharts use hardcoded colors that clash with dark mode.
41. **Todo card notes textarea always visible** — Takes up space even when empty and not editing.
42. **No item count in tab triggers** — Only Gaps and To-Do show counts; other tabs don't.
43. **Preview tab iframe has no loading indicator** — Just shows blank space while loading.
44. **Brand Analysis results disappear on refresh** — Cached in state only, not `localStorage`.
45. **No mobile responsiveness** — Tab bar, gap table, and dashboard grid don't collapse well on mobile.
46. **Category filter buttons in To-Do too many** — 13 category buttons overflow on smaller screens.
47. **No visual diff in plan auto-analyze** — Just shows count of changes, not which items changed.
48. **Verify Fixes truncates items at 50** — Silently ignores items beyond 50.
49. **No "last analyzed" timestamp** — Re-analyze button doesn't show when analysis was last run.
50. **Charts have no click interaction** — Bar charts are display-only; should filter on click.

## D. Data Integrity & Performance (15 items)

51. **No pagination on initial query** — `useTrackerItems` fetches ALL items. Will degrade with 1000+ items.
52. **N+1 mutation in `addToTodo` from DesignFeatureDialog** — Line 111 calls `insertItem.mutate` in a loop instead of bulk insert.
53. **No deduplication on bulk import** — Pasting same lines twice creates duplicates.
54. **`autoCategorize` only checks first match** — Items matching multiple keyword sets get first hit only.
55. **No validation on item fields** — Title can be empty string (whitespace only passes `.trim()` check poorly).
56. **`resolved_at` not set on bulk resolve from Dashboard** — Category "Resolve All" sets `resolved_at` but some paths don't.
57. **Plan cross-reference O(n*m)** — For large datasets, `crossReferenceItems` iterates all items for each plan item.
58. **localStorage unbounded** — AI chat history and theme data grow without limit.
59. **No query invalidation after delete** — Delete removes from selectedIds but may leave stale optimistic state.
60. **`useReanalyze` Promise pattern** — Wraps `mutateAsync` in `new Promise` unnecessarily; use `await` directly.
61. **No rate limiting on AI calls** — User can spam "Enhance" or "Verify" with no throttle.
62. **SSE parser incomplete** — If a JSON chunk splits across two `data:` lines, it silently drops content.
63. **Email template save uses wrong table schema** — Upserts with `key` column but table has `setting_key`.
64. **No optimistic updates** — All mutations wait for server round-trip before UI updates.
65. **`flowHealth` useMemo has empty deps** — Line 71: `useMemo(() => ..., [])` — never recalculates.

## E. Security & Compliance (10 items)

66. **No RLS check on build_tracker_items** — Any authenticated user can read/write all tracker items.
67. **AI prompts leak internal architecture** — Enhance/Verify prompts include file paths and DB schema hints.
68. **No input sanitization on bulk import** — Raw text inserted into DB without escaping.
69. **Clipboard API fails silently** — `navigator.clipboard.writeText` can throw in insecure contexts.
70. **Preview iframe allows popups** — `sandbox="allow-popups"` could be exploited.
71. **No CSRF protection on edge function calls** — AI calls use only anon key.
72. **Email template XSS** — `renderPreview` injects raw HTML with `dangerouslySetInnerHTML` and no sanitization despite importing `sanitizeHtml`.
73. **No audit logging** — Status changes, deletions, and bulk operations aren't logged.
74. **Theme export includes raw hex** — Generated CSS/Tailwind snippets aren't validated.
75. **No session timeout** — AI chat keeps localStorage data indefinitely.

## F. Missing Features in Specific Tabs (15 items)

76. **Dashboard: No "time to resolve" metric** — Average days from creation to resolution.
77. **Dashboard: No sprint velocity** — Items resolved per week trend chart.
78. **Gap Analysis: No column resize** — Fixed column widths don't adapt to content.
79. **Gap Analysis: No inline edit** — Must expand row to change anything except status/todo.
80. **Gap Analysis: No saved filter presets** — Can't save and recall common filter combinations.
81. **To-Do: No due dates** — Items have no target completion date.
82. **To-Do: No progress percentage** — No overall completion meter for to-do list.
83. **Service Flows: Static data** — `serviceFlows.ts` is hardcoded; should sync with actual codebase state.
84. **Page Auditor: No lighthouse scores** — Lists pages but no performance/accessibility metrics.
85. **Page Auditor: No broken link detection** — Doesn't check if routes actually render without errors.
86. **Plan History: No plan comparison** — Can't diff two plans side by side.
87. **AI Analyst: No conversation export** — Can't export chat as markdown or PDF.
88. **Email Templates: No send test email** — Can only preview, not actually send a test.
89. **Brand Analysis: No competitor comparison** — Only analyzes own brand, no benchmarking.
90. **Theme Explorer: No color accessibility check** — Generated themes aren't checked for WCAG contrast.

## G. Code Quality & Architecture (10 items)

91. **SSE parsing duplicated 5 times** — Identical streaming logic in GapAnalysisTab, VerifyFixesButton, DesignFeatureDialog, AIAnalystTab, BrandAnalysisTab. Extract shared `useSSEStream` hook.
92. **No TypeScript strict checks** — `as any` casts used ~15 times in hooks.ts and AddImportTab.
93. **Monolithic GapAnalysisTab** — 450 lines with inline ExpandedGapRow. Split into sub-components.
94. **No test coverage** — Zero tests for any build tracker component.
95. **Magic strings for statuses** — `"open"`, `"resolved"` used as raw strings. Use enum/const object.
96. **No error boundaries per tab** — One failing tab crashes the entire tracker.
97. **Inconsistent import patterns** — Some files use `type` imports, others don't.
98. **No JSDoc on exported functions** — `autoCategorize`, `sortItems`, `exportCSV` undocumented.
99. **platformEntities.ts hardcoded** — Entity health is static, not derived from actual DB/code state.
100. **No lazy loading for heavy tabs** — All 13 tabs render on mount; should lazy-load AI, Brand, Theme tabs.

---

## Implementation Phases

### Phase 1: Critical Fixes (Items 1-10)
- Fix BulkActionBar forwardRef warning
- Remove duplicate inline bulk bar from GapAnalysisTab
- Fix EmailTemplatesTab column name (`key` → `setting_key`)
- Fix CSV export to include ID
- Clear jumpToGapId after scroll
- Add debounce to todo priority reorder
- Preserve pagination on bulk updates

**Files:** `BulkActionBar.tsx`, `GapAnalysisTab.tsx`, `EmailTemplatesTab.tsx`, `constants.ts`, `AdminBuildTracker.tsx`, `TodoTab.tsx`

### Phase 2: Extract Shared SSE Hook (Item 91)
- Create `useSSEStream.ts` hook with unified streaming logic
- Refactor all 5 AI-calling components to use it

**Files:** New `useSSEStream.ts`, edit 5 tab files

### Phase 3: UX Polish (Items 31-50)
- Add tooltips on truncated titles
- Fix dark mode chart colors
- Add skeleton loaders
- Add confirmation dialogs on destructive bulk actions
- Fix bulk action bar z-index/overlap
- Persist Brand Analysis results in localStorage
- Add loading indicator to preview iframe
- Limit category filter buttons with "More" overflow

**Files:** `GapAnalysisTab.tsx`, `DashboardTab.tsx`, `TodoTab.tsx`, `LivePreviewTab.tsx`, `BrandAnalysisTab.tsx`

### Phase 4: Data Features (Items 11-14, 16, 24)
- Add CSV file upload with Papa Parse
- Add batch category/severity change to bulk actions
- Add "Select page only" vs "Select all" toggle
- Add undo toast for bulk operations

**Files:** `AddImportTab.tsx`, `BulkActionBar.tsx`, `GapAnalysisTab.tsx`

### Phase 5: Performance & Architecture (Items 51, 53, 60-61, 65, 93, 96, 100)
- Add cursor-based pagination to `useTrackerItems`
- Fix `flowHealth` useMemo deps
- Remove unnecessary Promise wrapping in `useReanalyze`
- Add throttle to AI calls
- Lazy-load heavy tabs (AI, Brand, Theme)
- Add per-tab error boundaries
- Split GapAnalysisTab into sub-components

**Files:** `hooks.ts`, `AdminBuildTracker.tsx`, `GapAnalysisTab.tsx`, `DashboardTab.tsx`

### Phase 6: Security Hardening (Items 66-73)
- Sanitize email template preview HTML
- Wrap clipboard API in try/catch with fallback
- Remove `allow-popups` from iframe sandbox
- Add audit log calls on status changes
- Redact internal paths from AI prompts

**Files:** `EmailTemplatesTab.tsx`, `LivePreviewTab.tsx`, `VerifyFixesButton.tsx`, `GapAnalysisTab.tsx`, `hooks.ts`

### Phase 7: Missing Tab Features (Items 76-90)
- Add time-to-resolve metric on Dashboard
- Add completion progress bar to To-Do
- Add search to Plan History
- Add chat export to AI Analyst
- Add WCAG contrast check to Theme Explorer
- Add test email send button to Email Templates

**Files:** `DashboardTab.tsx`, `TodoTab.tsx`, `PlanHistoryTab.tsx`, `AIAnalystTab.tsx`, `ThemeExplorerTab.tsx`, `EmailTemplatesTab.tsx`

### Phase 8: Code Quality (Items 92, 94-98)
- Replace `as any` casts with proper types
- Add JSDoc comments to exported utilities
- Add unit tests for `autoCategorize`, `sortItems`, `exportCSV`, `crossReferenceItems`
- Use status constants instead of magic strings

**Files:** `constants.ts`, `hooks.ts`, `AddImportTab.tsx`, new test file

---

## Summary

| Phase | Items | Effort | Priority |
|-------|-------|--------|----------|
| 1. Critical Fixes | 1-10 | Small | Immediate |
| 2. SSE Hook | 91 | Small | High |
| 3. UX Polish | 31-50 | Medium | High |
| 4. Data Features | 11-14,16,24 | Medium | Medium |
| 5. Performance | 51,53,60-65,93,96,100 | Medium | Medium |
| 6. Security | 66-73 | Medium | High |
| 7. Tab Features | 76-90 | Large | Low |
| 8. Code Quality | 92,94-98 | Small | Low |

All changes are scoped to `src/pages/admin/build-tracker/` and require no new database migrations.

