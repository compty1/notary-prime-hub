

# Plan: DocuDex Editor Comprehensive Audit CSV

Generate a CSV at `/mnt/documents/docudex_editor_audit.csv` listing all bugs, gaps, enhancements, and recommendations for the DocuDex editor.

## Key Findings from Code Review

**Critical bugs:**
- Uses deprecated `document.execCommand` for all formatting (lines 170-172) — will stop working in browsers
- `dangerouslySetInnerHTML` + `contentEditable` causes React state vs DOM desync (page content resets on re-render)
- No drag-and-drop for page reordering (only arrow buttons)
- No image upload — only inserts a placeholder div
- No color picker for text/background — only preset accent colors for elements
- No undo/redo (Ctrl+Z broken with contentEditable + React)
- Floating toolbar position calculation doesn't account for zoom level
- Export `.doc` is actually HTML with wrong MIME type — not real DOCX
- No auto-save / unsaved changes warning
- No keyboard shortcuts (Ctrl+S, Ctrl+B, etc.)

**Missing UX features:**
- No font size control, no line spacing, no margin adjustment
- No find & replace
- No spell check indicator
- No real image upload to storage
- No table editing (row/col add/remove)
- No text color or highlight color picker
- No hyperlink insertion
- No page margins/orientation settings
- No ruler/guides
- No snap-to-grid or alignment guides
- No collaborative editing indicators
- No document autosave with conflict detection
- No full-screen / distraction-free mode

## CSV Structure

Columns: `ID, Category, Severity, Type, Title, Current State, Recommended Fix, UX Impact, Implementation Notes`

Categories: Core Editor, Formatting, Drag & Drop, Colors & Styling, Elements, Templates, AI Features, Export, Page Management, Performance, Accessibility, Mobile, Dark Mode

## Implementation

Single Python script generating the CSV with ~200+ findings.

