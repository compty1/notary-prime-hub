

# Plan: AI Services Audit, Document Studio, and Contrast Fixes

## Part 1: AI Services Audit — Missing Features

### Resume Builder (`ResumeBuilder.tsx`)
**Missing:**
- **Resume file upload & parse**: No way to upload a PDF/DOCX resume — only manual text paste for analysis. Add a file upload button that sends the file to the `ai-extract-document` edge function for extraction, then populates the editor.
- **Job description matching**: The analyze feature doesn't accept a job description to score against. Add a "Job Description" textarea field to the analyze dialog.
- **PDF/DOCX export**: No export functionality — only save to DB. Add export buttons (Print/PDF via browser, .DOC via HTML blob — same pattern as DocumentTemplates).
- **Download as formatted resume**: No visual preview of the resume in template format.

**Fix**: Add file upload input (accept `.pdf,.doc,.docx`) → call `ai-extract-document` → populate content. Add job description field to analyze dialog. Add export buttons to the editor dialog.

### Other AI Services (confirmed working)
- **AI Tools Hub**: 50+ tools, generation, save, history — complete
- **Document Templates**: TipTap editor, AI chat, save to vault, print/export — complete
- **Grant Generator, Signature Generator**: Functional as-is

---

## Part 2: Document Studio — "Canva for Documents"

Transform the existing `/templates` page into a full **Document Studio** by adding a "Create from Scratch" mode alongside the template library.

### New Tab Structure
Add tabs to DocumentTemplates: **"Templates"** (existing grid) | **"Create New"** (blank document studio)

### "Create New" Tab Features
- **Blank document**: Opens TipTap editor directly with a document title input
- **AI Chat sidebar**: Reuse existing chat panel but contextualized for freeform editing — "Help me draft a...", "Rewrite this paragraph", "Add a section about..."
- **AI inline actions**: Select text → floating toolbar with "Rewrite", "Expand", "Summarize", "Fix Grammar", "Make Formal"
- **Document review/analysis**: "Review Document" button calls AI to provide feedback on completeness, tone, legal accuracy
- **Full toolbar**: Already exists (bold, italic, underline, headings, lists, alignment)
- **Save/Export**: Already exists (Save to Vault, Export .DOC, Print/PDF)
- **Version history**: Track edits with timestamp snapshots stored in `document_versions` table

### Implementation
- Modify `DocumentTemplates.tsx` to add a Tabs wrapper: "Template Library" and "Document Studio"
- The Studio tab renders the TipTap editor full-width with an AI chat panel on the right (resizable via existing `ResizablePanel` components)
- AI inline actions use a floating menu on text selection (TipTap BubbleMenu extension)
- Document review calls `build-analyst` edge function with the document content

### Template Start
- Add "Start from template" cards within the Studio tab that pre-populate the editor with template content (bridging both modes)

---

## Part 3: Remaining Contrast Fixes

### Still broken:
1. **ComingSoon.tsx** `FeatureCard` — `text-primary-foreground` (dark slate) on dark `bg-gradient-hero` background. Fix: change to `text-white` for title, `text-white/60` for desc
2. **ComingSoon.tsx footer** — `text-primary-foreground/50` and `text-primary-foreground/10` on dark bg. Fix: change to `text-white/50` and `text-white/10`
3. **ComingSoon.tsx** line 150 — still says "Notar" not "NotarDex"
4. **Index.tsx CTA section** (line 454) — `text-primary-foreground` on amber gradient — this is actually correct (dark text on amber), but verify contrast ratio. The `/80` opacity variant may be too light — change to `text-primary-foreground/90` for better readability.
5. **RonSession.tsx** badges — `bg-primary/20 text-primary-foreground` — primary/20 is very light amber, primary-foreground is dark slate — this is correct contrast.

### Header darker
The navbar already uses `bg-sidebar-background` (222 47% 11% = very dark slate). If user wants it even darker, change to `bg-[hsl(222,47%,5%)]` or add a new token. The `text-white` on this dark bg is correct.

---

## Part 4: Execution Order

1. Fix remaining contrast issues in ComingSoon.tsx (quick wins)
2. Add resume upload + export to ResumeBuilder.tsx
3. Add Document Studio tab to DocumentTemplates.tsx with blank editor + AI sidebar
4. Add TipTap BubbleMenu for inline AI actions

## Files Modified

| File | Change |
|---|---|
| `src/pages/ComingSoon.tsx` | Fix `text-primary-foreground` → `text-white`, fix "Notar" branding |
| `src/pages/ResumeBuilder.tsx` | Add file upload, job description matching, export buttons |
| `src/pages/DocumentTemplates.tsx` | Add "Document Studio" tab with blank editor + AI chat sidebar |
| `src/components/Navbar.tsx` | Darken header background if needed |

