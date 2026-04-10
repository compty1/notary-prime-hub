

# DocuDex Editor Enhancement Plan — Canva-Style Document Studio

## Summary
Transform DocuDex from a TipTap-based rich text editor into a Canva-like document canvas with drag-and-drop elements, resizable objects, functional QR codes, and rich design templates (certificates, awards, etc.). Generate a comprehensive DOCX specification and CSV task tracker.

## Current State Analysis

**What exists:**
- TipTap-based rich text editor with inline HTML content
- 9-tab sidebar (Templates, Layouts, AI, Recommend, Elements, Shapes, Design, Translate, History)
- 25+ document templates (legal, notary, business) — all text-only
- Elements panel with items like QR Code, Signature, Notary Seal — but QR Code just inserts placeholder text `[QR Code — Use export to embed]`
- No drag-and-drop positioning, no resize handles, no canvas layer system
- Shapes are HTML snippets inserted inline (not movable objects)

**Key problems identified:**
1. QR Code inserts useless placeholder — no actual QR generation or settings
2. No drag-and-drop canvas — everything is inline TipTap content
3. No resize handles on inserted elements (images, shapes, blocks)
4. No certificate/award templates with rich visual designs
5. No ability to import documents and edit individual elements
6. Elements can't be freely positioned on the canvas

## Deliverables

Two files generated to `/mnt/documents/`:

### 1. `docudex-enhancement-plan.docx` (~30 pages)
Full specification covering:
- Architecture: hybrid canvas layer (absolute-positioned elements) + TipTap text flow
- QR Code fix: real QR generation with URL/text input, size, color, error correction settings
- Drag-and-drop system using `@dnd-kit` (already in project) + custom resize handles
- Canvas object model (position, size, rotation, z-index, lock, opacity)
- 30+ new rich templates: certificates, awards, diplomas, letterheads, flyers, invitations
- Element library expansion: shapes, icons, borders, frames, decorative dividers
- Document import enhancements: PDF/DOCX element extraction
- Export improvements for pixel-perfect output
- 50+ enhancement ideas for future iterations

### 2. `docudex-enhancement-tasks.csv`
Structured task tracker with columns: ID, Phase, Category, Task, Priority, Complexity, Status, Description
- ~150+ specific implementation items
- Grouped by phase (Foundation, Elements, Templates, Canvas, Import/Export, Polish)
- Priority levels (P0-Critical, P1-High, P2-Medium, P3-Nice-to-have)

## Technical Approach

### Architecture Change: Hybrid Canvas Model
```text
┌─────────────────────────────────────┐
│  DocuDex Canvas Container           │
│  ┌───────────────────────────────┐  │
│  │  Background Layer (z:0)       │  │
│  │  - Page background/pattern    │  │
│  ├───────────────────────────────┤  │
│  │  Text Flow Layer (z:10)       │  │
│  │  - TipTap editor (existing)   │  │
│  ├───────────────────────────────┤  │
│  │  Object Layer (z:20+)         │  │
│  │  - Draggable/resizable items  │  │
│  │  - Images, QR codes, shapes   │  │
│  │  - Signature blocks, seals    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Key Implementation Areas

1. **Canvas Object System** — New `CanvasObject` type with x/y/width/height/rotation/zIndex; rendered as absolutely positioned divs with drag (via @dnd-kit) and resize handles

2. **QR Code Fix** — Replace placeholder with actual QR generation using `qrcode` npm package; dialog for URL, text, WiFi, vCard; color/size/error-correction settings; renders as canvas element on the document

3. **Rich Templates** — Certificate of Achievement, Award of Excellence, Diploma, Employee of the Month, etc. with decorative borders, gold accents, seal placeholders, and rich formatting

4. **Element Resize/Move** — Custom resize handle component (8 handles: corners + edges); maintain aspect ratio option; snap-to-grid; alignment guides

5. **Document Import Enhancement** — Extract images, tables, and text blocks as separate canvas objects from imported DOCX files

## Files to Create/Modify

| Action | File |
|--------|------|
| Generate | `/mnt/documents/docudex-enhancement-plan.docx` |
| Generate | `/mnt/documents/docudex-enhancement-tasks.csv` |

No code changes — this is a planning/documentation task only. Implementation follows after approval.

