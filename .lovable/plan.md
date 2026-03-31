

# Plan: Lead Proposal AI Generator + Logo Replacement

## Part 1: Logo Replacement (All Instances)

The uploaded image shows a bold serif "N" with a coral dot (period) on a dark navy background. The user wants to:
- Remove the SVG "N checkmark" icon from `Logo.tsx`
- Replace it with the uploaded PNG image
- Keep the "Notar." text with coral period
- Update favicon everywhere

### Steps

1. **Copy uploaded image to project**
   - Copy `user-uploads://SHANE_GOBLE_3.png` to `public/logo-icon.png` (overwrite existing)
   - Also copy to `src/assets/logo-icon.png` for React imports

2. **Delete old favicon files**
   - Remove `public/favicon.ico` and `public/favicon.png`
   - Copy the same image as `public/favicon.png`

3. **Update `src/components/Logo.tsx`**
   - Replace the entire SVG block with an `<img>` tag referencing `/logo-icon.png`
   - Size the image using the existing `sizeMap` icon dimensions
   - Keep the "Notar." text and coral period exactly as-is

4. **Update `index.html`**
   - Favicon link already points to `/favicon.png` — just ensure the file is replaced

5. **Files that import Logo** (26 files) — no changes needed since they all use the `<Logo />` component which will automatically use the new image.

---

## Part 2: AI Lead Proposal Generator

Add a new "Proposal" tab to the AI Writer page (`/ai-writer`) that generates professional lead outreach proposals for leads in the system.

### Architecture

- **New edge function**: `supabase/functions/generate-lead-proposal/index.ts`
  - Accepts lead data (name, business, service needed, location, notes)
  - Uses Lovable AI (Gemini) with a specialized system prompt for notary service proposals
  - Generates a professional proposal including: intro, services offered, pricing estimates, Ohio compliance notes, next steps, and CTA
  - Streams the response back via SSE
  - Requires authentication + admin/notary role check

- **New tab in `src/pages/AIWriter.tsx`**: "Lead Proposal"
  - Dropdown to select an existing lead from the `leads` table
  - Or manual entry fields (name, business, service, location)
  - Tone selector (professional, friendly, persuasive)
  - "Generate Proposal" button that streams the AI response
  - Copy, Download, Print, and "Email to Lead" actions
  - "Email to Lead" saves to email queue for sending

- **Integration with `AdminLeadPortal.tsx`**
  - Add a "Generate Proposal" button on each lead card
  - Clicking navigates to `/ai-writer?tab=proposal&leadId=<id>` with pre-filled data

### Edge Function System Prompt
Specialized for generating notary service proposals including:
- Professional greeting with lead's name/business
- Service recommendation based on their needs
- Ohio-specific compliance info (ORC §147)
- Fee estimates from the platform's pricing
- Clear next steps and booking CTA
- RON availability mention when relevant

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/generate-lead-proposal/index.ts` | AI proposal generation edge function |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/Logo.tsx` | Replace SVG with PNG image |
| `src/pages/AIWriter.tsx` | Add "Lead Proposal" tab with lead selector, generation, and actions |
| `src/pages/admin/AdminLeadPortal.tsx` | Add "Generate Proposal" button per lead |
| `public/favicon.png` | Replace with new logo |
| `public/logo-icon.png` | Replace with new logo |

