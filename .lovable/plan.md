# Plan: Fix 84 Open Build Tracker Items

The CSV contains 84 open items grouped into **6 workstreams**.

---

## Workstream 1: Brand & UX Enhancements (7 items)
**No DB changes needed**

### Phase 1A: Typography & Design Tokens
- **Premium font pairing**: Add humanist sans-serif headline font (e.g., Plus Jakarta Sans). Update `index.css` and `tailwind.config.ts`.
- **Warmer elements**: Add warm accent CSS variables for client-facing flows. Rounded UI variants.

### Phase 1B: Conversion & Social Proof
- **Urgency/scarcity cues**: `<UrgencyBanner>` component for service pages.
- **Social proof section**: `<TestimonialsSection>` with rotating testimonials and partner logos.
- **CTA enhancement**: Stronger contrast, action-oriented copy on key CTAs.

### Phase 1C: Visual Identity
- **Bespoke iconography**: Custom SVG icons with Ohio/notary motifs.
- **Brand illustration style**: Minimalist geometric illustrations for empty states.

---

## Workstream 2: Grant Generator (20 items)
**DB migration + edge function + new pages**

### Phase 2A: Database & Backend
1. `grants` table (id, user_id, title, content JSONB, grant_type, status, timestamps)
2. `grant_templates` table
3. RLS policies (user-scoped)
4. `generate-grant` edge function via Lovable AI (Gemini 2.5 Flash)

### Phase 2B: UI Pages
5. `GrantDashboard.tsx` — list/filter/search
6. `GrantEditor.tsx` — rich text + AI assist panel
7. Route `/grants` + nav entry

### Phase 2C: Features
8. Export PDF/DOCX
9. AI granular controls (tone, length, section)
10. Compliance Watchdog hook
11. Version history

---

## Workstream 3: Resume & Cover Letter Tool (17 items)
**DB migration + edge function + new pages**

### Phase 3A: Database & Backend
1. `resumes` table (id, user_id, title, template_id, content JSONB, timestamps)
2. `cover_letters` table
3. `resume_templates` table
4. RLS policies
5. `analyze-resume` edge function via Lovable AI

### Phase 3B: UI Pages
6. `ResumeBuilder.tsx` — section-based editor
7. `CoverLetterBuilder.tsx` — guided builder
8. `ResumeDashboard.tsx`
9. Template selection with live preview
10. Routes `/resume-builder`, `/cover-letter-builder`

### Phase 3C: Features
11. PDF generation
12. Paste & Analyze
13. Upload & Analyze
14. Keyword optimization
15. Version control
16. Rich text editor (reuse TipTap)

---

## Workstream 4: Professional Signature Generator (20 items)
**DB migration + storage bucket + new component**

### Phase 4A: Database & Backend
1. `user_signatures` table (id, user_id, name, font_family, style_config JSONB, image_path, is_default)
2. `signatures` storage bucket with RLS
3. `generate-signature` edge function
4. RLS policies

### Phase 4B: UI Component
5. `SignatureGenerator.tsx` — canvas-based
   - Text input + live preview, font selection, color picker, draw mode
6. Download PNG/SVG
7. Save to storage
8. Multi-signature management

### Phase 4C: Integration
9. User profile integration
10. Document signing hook
11. Performance optimization

---

## Workstream 5: Lead Finder Enhancement (20 items)
**Uses existing `leads` table + edge functions**

### Phase 5A: Backend
1. Verify existing schema (already sufficient)
2. Enhance `discover-leads` with geo/industry enrichment
3. Duplicate detection (email + business_name)
4. Rate limiting config
5. Job queue via DB status tracking

### Phase 5B: UI
6. Enhanced `AdminLeadPortal.tsx` with search, filters, detail view, status management
7. Manual search form
8. Dashboard integration cards

### Phase 5C: Data Quality
9. Source attribution, privacy notice, error logging, async status indicators

---

## Workstream 6: Testing
- Unit tests for new features
- Integration tests for key flows
- E2E acceptance testing

---

## Recommended Order

| Priority | Workstream | Effort | Dependencies |
|----------|-----------|--------|-------------|
| 1 | Brand & UX (WS1) | 1-2 sessions | None |
| 2 | Signature Generator (WS4) | 2-3 sessions | DB migration |
| 3 | Lead Finder (WS5) | 2-3 sessions | Existing tables |
| 4 | Grant Generator (WS2) | 3-4 sessions | DB migration + AI |
| 5 | Resume Tool (WS3) | 3-4 sessions | DB migration + AI |
| 6 | Testing (WS6) | 1-2 sessions | All above |

## Notes
- All AI features use Lovable AI (Gemini 2.5 Flash) — no external API keys.
- All new tables need RLS + auth enforcement.
- New pages need routes in `App.tsx` and nav in `Navbar.tsx`.
- All UI uses existing design system tokens.
