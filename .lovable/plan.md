

# Plan: Resume Upload/Analyze in AI Tools + "Open in DocuDex" for All Tools

## Overview

Two enhancements:
1. **Resume Builder AI Tool**: Add a dedicated resume analysis tool to the AI Tools Hub that accepts file upload (PDF/DOCX), extracts content via `ai-extract-document`, and provides AI-powered scoring/recommendations with job description matching
2. **"Open in DocuDex" button**: Add to the ToolRunner output panel for ALL AI tools, allowing users to send generated content directly to DocuDex for rich-text editing

## Changes

### 1. Add Resume Analyzer Tool to AI Tools Registry

**File**: `src/lib/aiToolsRegistry.ts`

Add a new tool entry `resume-analyzer` in the "Analysis & Insights" category with fields:
- `resumeText` (textarea, required) — paste resume text or populated by upload
- `jobDescription` (textarea, optional) — target job description for scoring
- `analysisType` (select) — "Full Analysis", "ATS Optimization", "Skills Gap", "Industry Match"

System prompt engineered to return structured markdown: Score (1-100), ATS compatibility, strengths, weaknesses, keyword gaps, and actionable recommendations.

Also register the tool ID in the edge function's `TOOL_IDS` set.

### 2. Add File Upload Support to ToolRunner

**File**: `src/components/ai-tools/ToolRunner.tsx`

- Add a file upload zone (visible only for tools with `supportsUpload: true` — a new optional field on `AITool`)
- When a file is uploaded, call `ai-extract-document` edge function with `extractor_type: "hr"` to parse the resume
- Populate the `resumeText` field with extracted structured content
- Show upload status (uploading spinner, success badge)

### 3. Add "Open in DocuDex" Button to ToolRunner Output

**File**: `src/components/ai-tools/ToolRunner.tsx`

- Add an "Open in DocuDex" button in the output action bar (next to Copy, Download, Print, Save)
- On click, encode the generated markdown result into a URL parameter and navigate to `/docudex?content=...` (using sessionStorage for large content to avoid URL length limits)
- Uses `useNavigate` from react-router-dom

### 4. DocuDex: Accept Incoming Content

**File**: `src/pages/DocuDex.tsx` (or `src/components/DocuDexEditor.tsx`)

- On mount, check for `ai_tools_content` key in sessionStorage
- If present, load it as initial editor content and clear the key
- This enables the seamless handoff from any AI tool

### 5. AI Tool Type Update

**File**: `src/lib/aiToolsRegistry.ts`

- Add optional `supportsUpload?: boolean` to `AITool` interface
- Set `supportsUpload: true` on the new `resume-analyzer` tool

### 6. Edge Function Update

**File**: `supabase/functions/ai-tools/index.ts`

- Add `"resume-analyzer"` to the `TOOL_IDS` set

## File Summary

| File | Action |
|---|---|
| `src/lib/aiToolsRegistry.ts` | Add `supportsUpload` to interface, add `resume-analyzer` tool |
| `src/components/ai-tools/ToolRunner.tsx` | Add file upload for upload-enabled tools, add "Open in DocuDex" button for all tools |
| `src/pages/DocuDex.tsx` | Accept content from sessionStorage on mount |
| `supabase/functions/ai-tools/index.ts` | Add `resume-analyzer` to `TOOL_IDS` |

