

# RON Legality & Acceptance Advisor — Implementation Plan

## What This Builds

A comprehensive tool that tells users whether their specific notarization scenario is legally valid and practically accepted, using a 3-layer architecture: curated legal data, deterministic rules engine, and AI-powered plain-language explanations. Replaces the current basic `RonEligibilityChecker` with a full "regulatory expert system."

## Architecture

```text
┌─────────────────────────────────────────────┐
│  Layer A: Legal Data (src/lib/ronStateData)  │
│  - 50-state profiles with citations          │
│  - Ohio RON rules table (doc types)          │
│  - Document legality matrix                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Layer B: Rules Engine (src/lib/ronAdvisor)   │
│  - Ohio eligibility check                    │
│  - Cross-state recognition logic             │
│  - Risk scoring algorithm (0-4+ → L/M/H)    │
│  - Citation attachment                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Layer C: AI Explanation (edge function)      │
│  - Takes structured result → plain language   │
│  - Client-friendly summaries                 │
│  - Never invents law, only explains it       │
└─────────────────────────────────────────────┘
```

## Implementation

### 1. Legal Data Layer — `src/lib/ronStateData.ts`

- **50-state profiles**: Each state gets `ron_authorized`, `ron_maturity`, acceptance ratings by category (real_estate, estate_planning, affidavits, financial, business, government), statutory citations, and practice notes
- **Ohio RON rules table**: Document category + subtype + notarial act type → allowed/conditional/not_allowed + notes + risk modifier
- **All data from the document's 50-state matrix** with proper citations (ORC, state statutes)

### 2. Rules Engine — `src/lib/ronLegalityEngine.ts`

**Input model** (10 fields from the spec):
- `notary_state` (OH preselected), `signer_state`, `document_use_state`
- `document_category`, `document_subtype`, `notarial_act_type`
- `signer_location_country` (US/non-US)
- `is_recordable_in_land_records`, `requires_apostille`
- `intended_recipient_type`, `extra_notes`

**Risk scoring algorithm** (deterministic, from spec):
1. Base risk = 0
2. Ohio rules: conditional → +1, not allowed → set high
3. Receiving state acceptance: mixed/medium → +1, low/high-risk → +2
4. Recordable in land records → +1
5. Requires apostille → +1
6. Signer outside US → +1
7. Map: 0-1 = Low, 2-3 = Medium, 4+ = High

**Output**: Structured JSON with `status`, `headline`, `notary_state_analysis`, `receiving_state_analysis`, `risk_level`, `risk_reasons`, `recommended_actions`, `citations`, `disclaimer`

### 3. AI Explanation Layer — Edge Function `ron-advisor`

- Takes the structured rules engine output + user's scenario
- Uses Lovable AI (Gemini Flash) to generate plain-language explanation
- Grounded entirely in the rules engine output (no hallucinated law)
- Returns explanation text alongside the structured data
- Rate limited, auth required

### 4. UI — Rebuild `RonEligibilityChecker.tsx`

**Two modes** (same component, different field count):

**Public mode** (`/ron-check`): Simplified 5-field form
- Signer location, document use state, document type (cascading category → subtype), notarial act type, "I'm not sure" option
- Quick green/yellow/red result card

**Dashboard mode** (embedded in notary portal): Full 10-field form
- All fields from spec including recipient type, apostille toggle, land records toggle, extra notes
- Full structured result with 3 analysis blocks (Ohio, cross-state, practical acceptance)
- "Attach to appointment" checkbox
- Option to generate client-friendly PDF summary

**Result panel** renders:
- Headline status with color-coded badge (green/yellow/red)
- Block A: Ohio RON analysis with ORC citations
- Block B: Cross-state recognition analysis with state statute citations  
- Block C: Practical acceptance risk with bullet reasons
- Actionable guidance (confirm with recorder, use compliant platform, etc.)
- Legal disclaimer

### 5. Integration Points

- **BookAppointment.tsx**: Replace the current "Check RON Eligibility" link with an inline mini-advisor widget
- **Notary Dashboard**: Add as a standalone tool tab
- **NotaryPage.tsx**: Add "Can this be done online?" widget for public notary pages
- **Route**: Keep `/ron-check` but upgrade the component

### Files Created/Modified

| File | Action |
|------|--------|
| `src/lib/ronStateData.ts` | **Create** — 50-state profiles + Ohio rules table + document matrix |
| `src/lib/ronLegalityEngine.ts` | **Create** — Deterministic rules engine + risk scoring |
| `src/pages/RonEligibilityChecker.tsx` | **Rewrite** — Full advisor UI with public/dashboard modes |
| `supabase/functions/ron-advisor/index.ts` | **Create** — AI explanation endpoint |
| `src/hooks/useRonAdvisor.ts` | **Create** — Hook calling the edge function |
| `src/components/RonAdvisorWidget.tsx` | **Create** — Compact embeddable widget for booking/notary pages |
| `src/pages/BookAppointment.tsx` | **Edit** — Replace link with inline widget |

No database migrations needed — this is a stateless advisory tool (results can optionally be attached to appointments via existing tables).

