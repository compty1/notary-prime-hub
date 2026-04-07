

# Plan: DocuDex Document Editor, Notary Professional Dashboard, and AI Generation Styling

This is a large implementation covering three major features. Due to the scope, I'll organize into discrete deliverables.

---

## Part 1: DocuDex — Canva-Like Document Editor (New Route `/docudex`)

Replace the current basic Document Studio tab with a full-featured, standalone DocuDex page inspired by the uploaded Document_Canvas reference.

### Architecture

```text
/docudex (public feature, auth-protected)
┌─────────────────────────────────────────────────┐
│ Header: Title input, Export, Share, Save         │
├───────┬─────────────────────────────┬───────────┤
│ Left  │     Document Canvas         │ Right     │
│Sidebar│  (multi-page, 816x1056px    │ AI Chat   │
│       │   editable surfaces with    │ Panel     │
│ Tabs: │   contentEditable divs)     │ (toggle)  │
│ Templs│                             │           │
│ AI    │  ┌────────────────────┐     │           │
│ Elems │  │ Page 1             │     │           │
│ Design│  │ (rich content)     │     │           │
│ Transl│  └────────────────────┘     │           │
│ Histy │  [+ Insert New Sheet]       │           │
└───────┴─────────────────────────────┴───────────┘
│ Footer: Word count, Read time, Tone, Live Preview│
└─────────────────────────────────────────────────┘
```

### Features from Document_Canvas.docx
- **Multi-page canvas**: Array of pages, each with `contentEditable` div at 816x1056px (US Letter proportions), add/delete/duplicate/reorder pages
- **Left sidebar with 6 tabs**:
  - Templates: Pre-made document templates (contracts, proposals, reports, etc.)
  - AI Tools: Smart Drafter (generate full page content), AI text selection actions (improve, formal, shorter)
  - Elements: Insert callout boxes, tables, status badges, AI-generated graphics
  - Design: Brand kit color picker, typography selector (Sans/Serif/Mono), accent color
  - Translate: Language selector + full-page translation via AI
  - History: Version snapshots with restore capability
- **Floating AI bubble**: On text selection, show bubble with Improve/Formal/Shorter actions
- **Top toolbar**: Undo, Save snapshot, Bold, Italic, Underline, Alignment, Lists, Document title, Export
- **Document stats footer**: Word count, read time, tone indicator, live preview status
- **Export**: .DOC, Print/PDF, Save to Vault
- **AI content generation**: Full page generation via `notary-assistant` edge function, text replacement on selection
- **Max length**: Support up to 500,000 characters

### Implementation
- **New file**: `src/pages/DocuDex.tsx` — standalone page with full canvas editor
- **New route**: `/docudex` in App.tsx (auth-protected)
- **Navbar link**: Add "DocuDex" to main navigation
- Uses `contentEditable` divs (not TipTap) for the multi-page canvas to match the Canva-like page model
- DOMPurify sanitization on all content
- AI calls through `notary-assistant` edge function (already exists, supports streaming)

### Existing `/templates` page
Keep the existing Document Templates page as-is — it serves a different purpose (form-fill legal templates). DocuDex is the new creative document editor.

---

## Part 2: DocuDex Professional (Admin/Notary Dashboard Integration)

Add a "DocuDex Pro" section to the admin dashboard for notaries/professionals completing services for clients.

### Features
- **Admin nav item**: "DocuDex Pro" in sidebar under service fulfillment tools
- **New admin page**: `src/pages/admin/AdminDocuDexPro.tsx`
- **Client-linked document creation**: Select a client + service request, then generate documents specific to that service
- **Professional templates**: Service-specific templates (notarization certificates, deed preparation, affidavits, loan signing packages) with auto-populated client data
- **Adjustable length**: Slider/input for target document length (up to 500,000 characters)
- **AI generation**: "Generate for Service" button that creates full documents based on service type + client details
- **Bulk generation**: Generate multiple related documents for a single appointment
- **Save & attach**: Save generated documents to the client's document vault and link to their appointment
- **Full editing**: Same canvas editor as DocuDex but with professional context

### Implementation
- **New file**: `src/pages/admin/AdminDocuDexPro.tsx`
- **New admin route**: `/admin/docudex-pro` in App.tsx
- **Admin sidebar**: Add entry to `adminNavItems` in AdminDashboard.tsx
- Queries `services`, `appointments`, and `profiles` tables for context
- Uses shared DocuDex editor component (extracted as `src/components/DocuDexEditor.tsx`)

---

## Part 3: Notary Professional Dashboard (from notarydash.docx)

Integrate the RON session orchestration concepts from the uploaded notary dashboard reference into the existing platform.

### What the reference describes
The notarydash.docx shows a specialized RON session dashboard with:
- **Dual view**: Notary View / Client View toggle
- **Session orchestration**: Native API vs Manual Link Paste modes for signing platforms
- **Guardian Eye AI**: Simulated duress detection with biometric liveness monitoring
- **Document canvas**: Warranty deed display with signature zones
- **Smart Seal**: Digital seal application with hash anchoring
- **Real-time journal**: Auto-logging session events
- **SignNow integration**: Link pasting, clipboard copy, external signing launch

### Integration approach
The existing `RonSession.tsx` already handles the core RON workflow (setup, verify ID/KBA, administer oath, finalize) with SignNow/platform integration. Rather than replacing it, enhance it with the concepts from the reference:

1. **Guardian Eye status panel**: Add a visual duress awareness indicator to the RON session page (informational, not simulated AI — real feature would need video feed which is out of scope). Display as a "Session Security" card showing:
   - Session encryption status (AES-256 indicator)
   - Liveness detection status
   - Participant verification badges
2. **Orchestration mode toggle**: Already partially exists (signing platform selector). Enhance the UI to show "Native API" vs "Manual Link" modes more prominently
3. **Enhanced journal panel**: Add real-time event logging sidebar during RON sessions
4. **Smart Seal visualization**: Show digital seal preview after applying notary stamp
5. **Session metadata bar**: Show session ID, encryption status, provider info in a top bar

### Implementation
- **Modified file**: `src/pages/RonSession.tsx` — add Guardian Eye card, enhanced journal panel, seal visualization
- No new routes needed — enhances existing `/ron-session`

---

## Part 4: AI-Generated Content Style Formatting

When AI generates document content (in DocuDex, Document Studio, etc.), provide style formatting options.

### Features
- After AI generates content, show it in a **preview panel** with formatting options before inserting
- **Style options**: Professional, Casual, Legal, Academic, Creative
- **Format options**: With headings, bullet points, numbered lists, plain paragraphs
- **Font selection**: Sans/Serif/Mono preview
- **Apply button**: Insert the styled version into the editor
- **Regenerate**: Request AI to regenerate with different style

### Implementation
- **New component**: `src/components/AIContentPreview.tsx` — modal/panel that shows generated content with style selectors and live preview
- Integrated into DocuDex and Document Studio AI generation flows

---

## Part 5: Header/Contrast Fixes

- Darken navbar if not already done (verify current `bg-[hsl(222,47%,5%)]`)
- Audit all highlight/accent colors where text overlaps with low contrast

---

## Files Created

| File | Purpose |
|---|---|
| `src/components/DocuDexEditor.tsx` | Shared multi-page canvas editor component |
| `src/components/AIContentPreview.tsx` | AI content style preview + apply component |
| `src/pages/DocuDex.tsx` | Main DocuDex page |
| `src/pages/admin/AdminDocuDexPro.tsx` | Professional DocuDex for service fulfillment |

## Files Modified

| File | Change |
|---|---|
| `src/App.tsx` | Add `/docudex` and `/admin/docudex-pro` routes |
| `src/pages/admin/AdminDashboard.tsx` | Add DocuDex Pro to sidebar nav |
| `src/components/Navbar.tsx` | Add DocuDex link to main nav |
| `src/pages/RonSession.tsx` | Add Guardian Eye panel, enhanced journal, seal visualization |

## Execution Order
1. Create shared `DocuDexEditor.tsx` component (multi-page canvas with sidebar, toolbar, AI integration)
2. Create `AIContentPreview.tsx` for styled AI output preview
3. Create `DocuDex.tsx` page and wire route
4. Create `AdminDocuDexPro.tsx` with client/service context
5. Enhance `RonSession.tsx` with notary dashboard features
6. Update navigation (Navbar + Admin sidebar + App.tsx routes)
7. Verify contrast/header fixes

