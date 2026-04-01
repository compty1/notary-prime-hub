

# Plan: Integrate Build Guardian Capabilities into Build Tracker

## What the Build Guardian project has that this build tracker lacks

After thorough analysis, the Build Guardian ("Remix of Build Guardian") project has these key capabilities not present in the current build tracker:

1. **Live Site Preview** — Iframe-based responsive preview (Desktop/Tablet/Mobile viewports) with theme overlay
2. **Brand Analysis** — AI-powered color psychology, typography analysis, audience impact scores, sales psychology metrics
3. **Theme Explorer** — AI-generated theme alternatives with color swatches, mockup previews, side-by-side comparison, and export (CSS/Tailwind/shadcn/Lovable prompt)
4. **Design Feature Generator** — AI dialog that generates implementation specs from a feature title, with "Add to To-Do" capability
5. **Verify Fixes Button** — AI-powered verification that checks open gaps against current build state, confirms fixes, and bulk-resolves
6. **Enhanced Gap Cards** — Collapsible cards with "Enhance" button (AI implementation spec), resolve/dismiss/to-do actions, and "In To-Do" tracking
7. **Bulk Action Bar** — Floating bar for bulk resolve, dismiss, copy, export, add-to-todo, add-to-plan on selected items
8. **Category-filtered specialist views** — Security panel, Functionality panel grouped by sections
9. **Category progress bars** — Per-category resolution progress with bulk resolve per category
10. **Recently Fixed section** — Collapsible list of items resolved in the last 7 days

## Adaptation Strategy

The Build Guardian uses separate DB tables (`gap_analyses`, `project_themes`, `project_chats`, etc.) and a multi-project architecture. This build tracker uses `build_tracker_items` and `build_tracker_plans` in a single-project context. All features will be adapted to work with the existing `build_tracker_items` table and the `build-analyst` edge function (no new DB tables needed for most features).

---

## Phase 1: Live Site Preview Tab

Create `src/pages/admin/build-tracker/LivePreviewTab.tsx`:
- Iframe preview using the project's own preview URL (`https://id-preview--b6d1b88a-ed8c-42c3-98a9-3a2517fa9990.lovable.app`)
- Desktop/Tablet/Mobile viewport switcher
- Refresh and open-in-new-tab buttons
- Theme overlay support (receives applied theme from Brand tab)
- Error fallback when iframe blocked

Add as new tab "Preview" in `AdminBuildTracker.tsx`.

**Files:** New `LivePreviewTab.tsx`, edit `AdminBuildTracker.tsx`

---

## Phase 2: Brand Analysis Tab

Create `src/pages/admin/build-tracker/BrandAnalysisTab.tsx`:
- **Brand Analysis Section**: Uses `build-analyst` edge function with a brand-specific prompt to generate color psychology, typography, audience impact, and sales psychology scores
- Results cached in `localStorage` (keyed by project)
- Score bars for professionalism, trustworthiness, modernity, approachability, uniqueness
- CTA visibility, visual hierarchy, scarcity cues, social proof metrics
- Brand gaps summary

Add as new tab "Brand" in `AdminBuildTracker.tsx`.

**Files:** New `BrandAnalysisTab.tsx`, edit `AdminBuildTracker.tsx`

---

## Phase 3: Theme Explorer Tab

Create `src/pages/admin/build-tracker/ThemeExplorerTab.tsx`:
- "Generate Alternatives" button → calls `build-analyst` with theme generation prompt
- Theme cards with color swatches, typography info, and mini mockup previews
- Save/delete themes to `localStorage` (no new DB table needed)
- Side-by-side comparison mode (select 2 themes, show diff)
- Export dialog: CSS variables, Tailwind config, shadcn tokens, Lovable prompt, Component prompt
- "Apply to Preview" button that passes theme to LivePreviewTab via shared state

Add as new tab "Themes" in `AdminBuildTracker.tsx`.

**Files:** New `ThemeExplorerTab.tsx`, edit `AdminBuildTracker.tsx`

---

## Phase 4: Design Feature Generator Dialog

Create `src/pages/admin/build-tracker/DesignFeatureDialog.tsx`:
- Dialog with title + description inputs
- "Generate Spec" button → calls `build-analyst` edge function
- AI returns implementation steps, files to modify, testing steps, complexity
- "Add Steps to To-Do" button → creates `build_tracker_items` with `is_on_todo: true`
- "Copy Spec" button
- Accessible from Dashboard and AI Analyst tabs

**Files:** New `DesignFeatureDialog.tsx`, edit `DashboardTab.tsx` header

---

## Phase 5: Verify Fixes Button

Create `src/pages/admin/build-tracker/VerifyFixesButton.tsx`:
- Button that sends open items to `build-analyst` with verification prompt
- AI returns which items are likely resolved vs still open
- Dialog shows confirmed fixes, still-open items, any new issues found
- "Apply Fixes" button bulk-updates matched items to `resolved` status
- Usable from Dashboard, Gap Analysis, and category-filtered views

**Files:** New `VerifyFixesButton.tsx`, edit `DashboardTab.tsx`, `GapAnalysisTab.tsx`

---

## Phase 6: Enhanced Gap Cards with AI Enhance

Modify `GapAnalysisTab.tsx` to add:
- "Enhance" button on each expanded gap row → calls `build-analyst` for detailed implementation spec
- Shows implementation spec inline in the expanded row
- "Copy Spec" on the generated spec
- Visual "In To-Do" indicator on rows where `is_on_todo === true`

**Files:** Edit `GapAnalysisTab.tsx`

---

## Phase 7: Bulk Action Bar

Create `src/pages/admin/build-tracker/BulkActionBar.tsx`:
- Floating bar at bottom when items are selected in Gap Analysis
- Buttons: Resolve Selected, Dismiss Selected (set `status: 'wont_fix'`), Copy to Clipboard, Export CSV, Add to To-Do, Clear Selection
- Uses existing `useBulkUpdate` and `useDeleteItems` hooks

Wire into `GapAnalysisTab.tsx` (already has selection via `selectedIds`).

**Files:** New `BulkActionBar.tsx`, edit `GapAnalysisTab.tsx`

---

## Phase 8: Category Progress & Recently Fixed on Dashboard

Enhance `DashboardTab.tsx`:
- **Category Progress Bars**: For each category with items, show resolved/total with progress bar and bulk "Resolve All" button per category
- **Recently Fixed Section**: Collapsible section showing items resolved in last 7 days with timestamps

**Files:** Edit `DashboardTab.tsx`

---

## Phase 9: Security & Functionality Panels on Dashboard

Add two new card sections to `DashboardTab.tsx`:
- **Security Summary Card**: Filter items by `category === "security"` or `"compliance"`, show count of open security/compliance items with severity breakdown, link to filtered Gap Analysis view
- **Functionality Summary Card**: Filter items by `category === "feature"` or `"workflow"`, show open count grouped by subcategory (Features, Wiring, Quality)

These are summary cards, not full panels — clicking them jumps to the Gap Analysis tab with the appropriate filter pre-applied.

**Files:** Edit `DashboardTab.tsx`

---

## Summary

| Phase | New Files | Edited Files | Effort |
|-------|-----------|-------------|--------|
| 1. Live Preview | 1 | 1 | Small |
| 2. Brand Analysis | 1 | 1 | Medium |
| 3. Theme Explorer | 1 | 1 | Medium |
| 4. Design Feature Dialog | 1 | 1 | Small |
| 5. Verify Fixes | 1 | 2 | Medium |
| 6. Enhanced Gap Cards | 0 | 1 | Small |
| 7. Bulk Action Bar | 1 | 1 | Small |
| 8. Category Progress | 0 | 1 | Small |
| 9. Security/Func Panels | 0 | 1 | Small |
| **Total** | **6 new** | **~5 edited** | |

All features use the existing `build_tracker_items` table and `build-analyst` edge function. No new database tables or migrations needed. Theme data and brand analysis results are cached in `localStorage` for persistence without DB overhead.

