

# DocuDex Editor: Remaining Gaps & Bugs Fix Plan

## Summary of Current State

The audit CSV lists 145 items. After previous rounds of work, the editor was migrated to TipTap and many features were added. However, several items are still broken or incomplete based on code review.

## Confirmed Remaining Issues

### 1. Font Size Extension Not Registered (FT-001) — Critical
The toolbar has a font size selector but it uses `setMark("textStyle", { fontSize })` which requires a custom `FontSize` extension. No such extension is registered in the TipTap editor config (lines 159-243). The font size dropdown will silently fail.
**Fix:** Create a custom TipTap `FontSize` extension using `@tiptap/extension-text-style` and register it.

### 2. Font Size Dropdown Always Shows "14" (FT-001) — Bug
The font size `<Select>` has `value="14"` hardcoded (toolbar line 175). It never reads the current font size from editor state, so it always shows "14" regardless of actual size.
**Fix:** Track current font size from `editor.getAttributes("textStyle")` and use as controlled value.

### 3. Table Toolbar Button Inserts But No Table Editing Controls (EL-002) — High
Tables insert correctly via TipTap `insertTable`, and `resizable: true` is set. However, there are **no toolbar buttons or context UI** for add row, delete row, add column, delete column, merge cells, toggle header, or delete table. Users can insert a table but can't manage it.
**Fix:** Add a table context toolbar that appears when cursor is inside a table, with row/column/merge/delete actions using TipTap table commands.

### 4. Context Menu Uses `document.execCommand("copy"/"paste")` (SC-001) — Bug
Lines 1115-1119: The context menu still uses deprecated `document.execCommand("copy")` and `document.execCommand("paste")`. Copy should use `navigator.clipboard.writeText()` and paste should use `navigator.clipboard.readText()`.
**Fix:** Replace with Clipboard API calls.

### 5. Auto-Save Doesn't Actually Save to Backend (CE-006) — Bug
The auto-save interval (line 303-311) calls `saveSnapshot("Auto-save")` which only adds to local history stack. It does NOT call `onSave()` to persist to the backend. The comment says "auto-save" but it's just local snapshots.
**Fix:** Call `onSave(title, pages)` in the auto-save interval (with error handling to avoid toast spam).

### 6. Drag-and-Drop File Import Only Handles Images (DD-003) — Gap
The `handleDrop` (line 198-210) only handles image files. No support for PDF or DOCX drag-and-drop import.
**Fix:** Add handlers for `.pdf` (using pdf.js text extraction) and `.docx` (using mammoth.js HTML conversion) in the drop handler.

### 7. No DOCX/PDF Import Functionality (IM-001, IM-002) — High Gap
No import buttons or functionality exist for loading existing PDF or DOCX files into the editor.
**Fix:** Add an "Import" button in the toolbar/sidebar that accepts PDF/DOCX files, converts to HTML via edge function or client-side library, and loads into editor.

### 8. No Table Context Actions When Cursor in Table (EL-002) — High
When the cursor is inside a table, there's no floating toolbar or buttons to add/remove rows/columns.
**Fix:** Add a conditional toolbar section or floating menu that appears when `editor.isActive("table")`, exposing `addRowBefore`, `addRowAfter`, `deleteRow`, `addColumnBefore`, `addColumnAfter`, `deleteColumn`, `mergeCells`, `splitCell`, `toggleHeaderRow`, `deleteTable`.

### 9. `replaceAll` in Find & Replace Operates on Raw HTML (FR-002) — Bug
Line 75-79 of `DocuDexFindReplace.tsx`: `replaceAll` runs regex on `editor.getHTML()` which replaces inside HTML tags (e.g., matching text inside attributes or tag names). This can corrupt the document.
**Fix:** Use TipTap's built-in search-and-replace via `editor.state.doc` text content traversal, or iterate text nodes only.

### 10. Mobile Sidebar Opens But Desktop Sidebar Doesn't Render on Mobile (MB-004) — Bug
Line 923: Desktop sidebar is hidden with `!isMobile &&` guard, and mobile sidebar overlay (line 1311-1358) renders a second `DocuDexSidebar`. But the mobile sidebar FAB (line 1299-1308) doesn't have the sidebar tabs visible — it just toggles `sidebarOpen`. The mobile experience is fragmented.
**Fix:** Consolidate mobile sidebar logic; ensure tab selection works in the overlay.

### 11. No High Contrast Mode CSS (A11-004) — Gap
No `@media (forced-colors: active)` styles exist.
**Fix:** Add forced-colors media query styles to `index.css` for the DocuDex editor.

### 12. Print Preview Doesn't Show Headers/Footers/Watermarks (EX-004) — Bug
The print preview dialog (line 1231-1256) renders raw `page.html` content but doesn't include headers, footers, or watermarks that `buildExportHtml()` adds. Preview doesn't match export.
**Fix:** Use `buildExportHtml()` output or replicate header/footer/watermark rendering in preview.

### 13. Export DOC Still Not Real DOCX (EX-001) — Known Limitation
The `.doc` export (line 685-700) generates HTML with Microsoft Office XML namespace — it's not a real `.docx` file. This was noted in the audit as critical.
**Fix:** This requires adding a `docx` npm package or server-side conversion edge function. Plan as a separate task.

---

## Implementation Plan

### Phase 1: Critical Bugs (breaks functionality)
1. **Register FontSize TipTap extension** — Create custom extension, register in editor config, fix toolbar to read current size
2. **Fix context menu clipboard** — Replace `document.execCommand` with Clipboard API
3. **Fix auto-save to persist** — Call `onSave()` silently on interval with error suppression
4. **Fix replaceAll HTML corruption** — Rewrite to operate on text nodes only
5. **Fix print preview** — Include headers/footers/watermarks

### Phase 2: High-Priority Gaps (core editor features)
6. **Add table editing toolbar** — Floating bar with row/column/merge/delete actions when cursor is in table
7. **Add DOCX import** — Use mammoth.js client-side for DOCX-to-HTML conversion
8. **Add PDF text import** — Simple text extraction via edge function

### Phase 3: UX Polish
9. **Fix font size indicator** — Track and display current size dynamically
10. **Add high contrast mode styles** — CSS forced-colors support
11. **Fix mobile sidebar flow** — Consolidate desktop/mobile sidebar rendering

### Files to Edit
- `src/components/DocuDexEditor.tsx` — FontSize extension, auto-save fix, print preview fix, import buttons
- `src/components/docudex/DocuDexToolbar.tsx` — Font size tracking, table context toolbar
- `src/components/docudex/DocuDexFindReplace.tsx` — Fix replaceAll
- `src/index.css` — High contrast mode styles

### Technical Notes
- FontSize extension pattern: extend `TextStyle` with `fontSize` attribute, parse from inline styles
- Table editing: TipTap table extension already registered with `resizable: true`; commands like `addRowAfter()` are available on the chain
- mammoth.js can be imported client-side for DOCX conversion without an edge function

