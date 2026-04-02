

# Plan: AI Tools Hub — 50+ Professional AI Document Tools

## Architecture

Rather than creating 50+ separate pages, we'll build a **single configurable AI Tools page** (`/ai-tools`) with a data-driven registry of all tools. Each tool is defined by a config object (title, category, fields, system prompt, output format) and rendered by a shared `AIToolRunner` component. This keeps the codebase maintainable and makes adding new tools trivial.

### Key Design Decisions

- **One new page**: `src/pages/AITools.tsx` — browsable catalog with category filters + individual tool runner
- **One new edge function**: `supabase/functions/ai-tools/index.ts` — handles all tool prompts with tool-specific system prompts
- **Tool registry**: `src/lib/aiToolsRegistry.ts` — array of ~50 tool configs with fields, formatting instructions, and output settings
- **Rich output**: Results rendered with ReactMarkdown (tables, headings, lists, bold/italic) + copy/download/print actions
- **Route**: `/ai-tools` for the catalog, `/ai-tools?tool=contract-generator` for direct tool access

---

## Files to Create

### 1. `src/lib/aiToolsRegistry.ts` — Tool Configuration Registry

A typed array of all 50+ tools, each containing:
- `id`, `title`, `category` (Documents & Generation, Analysis & Insights, Communication, Compliance & Legal, Creative & Strategy)
- `description`, `icon` (lucide icon name)
- `fields[]` — each with `name`, `label`, `type` (text/textarea/select/number), `placeholder`, `options[]`, `required`
- `systemPrompt` — industry-specific formatting instructions baked into each tool (e.g., contract generator includes clause numbering, legal formatting; invoice generator includes tax calculation tables; API docs include endpoint tables with HTTP methods)
- `outputFormat` — "markdown" (default) or "structured"
- `maxLength` — suggested output token guidance

All 50+ tools from the request will be defined here with detailed, industry-appropriate system prompts that enforce proper formatting (tables for financial data, numbered clauses for contracts, bullet checklists for audits, etc.).

### 2. `src/pages/AITools.tsx` — Main Page (~400 lines)

**Catalog View** (no tool selected):
- Hero section with category filter chips
- Searchable grid of tool cards organized by category
- Each card shows icon, title, description, "Try it" button

**Tool Runner View** (tool selected via `?tool=id`):
- Back button to catalog
- Tool-specific input form generated from `fields[]` config
- "Generate" button with streaming SSE output
- Rich markdown result panel with:
  - Copy to clipboard, Download as .md, Print
  - Toggle between rendered markdown and raw text
  - Tables render with proper borders/alignment
  - Code blocks for technical docs

**Streaming**: Reuses the existing `callEdgeFunctionStream` + SSE parsing pattern from `AIWriter.tsx`.

### 3. `supabase/functions/ai-tools/index.ts` — Edge Function

- Accepts `{ tool_id, fields, messages? }` 
- Validates tool_id against an allowlist
- Constructs a rich system prompt combining the tool's base prompt with formatting instructions
- Calls Lovable AI gateway with streaming enabled
- Returns SSE stream
- Handles 429/402 errors properly

### 4. Route & Navigation Updates

- `src/App.tsx` — Add lazy import + route `/ai-tools`
- `src/pages/Services.tsx` — Update `aiTools[]` array to include link to `/ai-tools`

---

## Tool Categories & Counts

| Category | Tools | Examples |
|----------|-------|---------|
| Documents & Generation | 15 | Contract Generator, Meeting Minutes, Invoice/Quote, SOP, API Docs, Changelog |
| Analysis & Insights | 10 | Sentiment Analyzer, Contract Risk, Financial Summarizer, Churn Risk, Pricing Strategy |
| Communication | 8 | Email Campaign, Press Release, Client Communication, RFP Response, Newsletter |
| Compliance & Legal | 6 | GDPR Policy, Audit Checklist, Risk Register, Incident Report, DPA Generator |
| Creative & Strategy | 11 | Brand Voice, Market Research, Strategic Planning, OKR Generator, SWOT, A/B Test Planner |

**Total: 50 tools**

---

## Output Quality — Industry-Relevant Formatting

Each tool's system prompt enforces proper formatting:
- **Contracts**: Numbered sections, WHEREAS/NOW THEREFORE clauses, signature blocks, governing law
- **Invoices**: Markdown tables with columns, tax calculations, payment terms, totals
- **Board Reports**: Executive summary, KPI tables, financial highlights, recommendations
- **API Docs**: HTTP method badges, endpoint tables, JSON request/response examples in code blocks
- **Audit Checklists**: Checkbox lists grouped by control family, evidence requirements
- **Meeting Minutes**: Attendees table, agenda items, action items with owners and due dates
- **SWOT/Canvas**: 2x2 matrix tables, strategic implications

---

## Summary

| Change | File |
|--------|------|
| Tool registry (50 tools) | `src/lib/aiToolsRegistry.ts` (new) |
| AI Tools page + runner | `src/pages/AITools.tsx` (new) |
| Edge function | `supabase/functions/ai-tools/index.ts` (new) |
| Route registration | `src/App.tsx` (edit) |
| Services page link | `src/pages/Services.tsx` (edit) |

