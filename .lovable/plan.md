

# Revised Plan: Dual-Mode RON Session (Link-Only + API) with SignNow KBA Integration

## Assessment of Current State

The existing `RonSession.tsx` already implements a **link-paste flow** with these elements:
- 4-step progress: Paste Link → Verify ID/KBA → Oath → Finalize
- Manual ID verification (type, number, expiration, toggle)
- Manual KBA toggle
- Oath administration with scripts (jurat, oath, affirmation)
- Recording consent tracking
- Voice-to-notes dictation
- Finalization: creates journal entry, e-seal, payment record, marks documents notarized
- Realtime session status updates
- Commission expiry blocking (ORC §147.03)

**What's missing for a complete link-only (non-API) flow:**
1. No way to indicate which signing platform was used (always assumes SignNow)
2. No document name capture for journal enrichment when no documents are uploaded
3. No signer email capture for correspondence
4. The ID/KBA toggles don't acknowledge that SignNow handles these natively — notary must redundantly confirm
5. No mode selector to distinguish manual link-paste from future API-integrated flow
6. `saveSessionData` still does a raw `audit_log` INSERT instead of using the secure `log_audit_event` RPC

## Plan

### 1. Database Migration
Add columns to `notarization_sessions`:
```sql
ALTER TABLE public.notarization_sessions
  ADD COLUMN IF NOT EXISTS session_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS signing_platform text DEFAULT 'signnow',
  ADD COLUMN IF NOT EXISTS signer_email text,
  ADD COLUMN IF NOT EXISTS document_name text;
```

### 2. Update RonSession.tsx — Mode Selector + Enhanced Manual Flow

**Step 1 replacement — Mode selection card** (shown before link is saved):
- **Manual Mode** (default, current behavior enhanced): Paste any signing link. Add fields:
  - Platform dropdown: SignNow, DocuSign, Notarize, BlueNotary, Other
  - Document Name (text input, for journal)
  - Signer Email (optional, for records)
- **API Mode**: Card shown but disabled with "Coming Soon" label — placeholder for future SignNow API integration

**Step 2 — Conditional ID/KBA behavior based on platform:**
- When platform is **SignNow**: Show an info banner: "SignNow handles ID verification and KBA within its signing flow (MISMO-compliant per ORC §147.66). Toggle these after the signer completes the SignNow session." Keep the manual toggles but add contextual guidance.
- When platform is **Other**: Keep current manual toggle behavior unchanged.

**Persist** `session_mode`, `signing_platform`, `signer_email`, `document_name` when saving the session link and on finalization.

**Fix audit logging**: Replace raw `audit_log` INSERT calls with `supabase.rpc("log_audit_event", {...})`.

### 3. Finalization Enhancements

Include `signing_platform`, `document_name`, and `session_mode` in:
- The `notary_journal` entry (in `notes` or `document_description` field)
- The audit log details
- The e-seal verification `document_name` (fallback to uploaded doc name if available, otherwise use manual input)

### 4. Files Changed

| File | Change |
|------|--------|
| `src/pages/RonSession.tsx` | Add mode selector, platform/document/email fields, conditional KBA guidance for SignNow, fix audit log calls, persist new fields |
| New migration | Add `session_mode`, `signing_platform`, `signer_email`, `document_name` to `notarization_sessions` |

### 5. What This Covers for Link-Only Operations

The link-only flow will support the complete notarization lifecycle:
1. **Session setup**: Paste link from any platform, capture metadata
2. **Identity verification**: Manual confirmation with SignNow-aware guidance
3. **KBA**: Manual confirmation with note that SignNow handles it natively
4. **Recording consent**: Already implemented (Ohio ORC §147.66)
5. **Oath administration**: Already implemented with script prompts
6. **Finalization**: Journal entry, e-seal, payment, document status update — all enriched with platform and document metadata
7. **Client portal**: Client sees the signing link and can join (already works)
8. **Realtime updates**: Session status syncs live (already works)
9. **Commission expiry blocking**: Already enforced
10. **Audit trail**: All actions logged with platform context

