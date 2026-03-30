

# Migrate from OneNotary to SignNow

## Summary
Replace the entire OneNotary e-signing integration with SignNow's REST API. This touches 1 new edge function, 1 updated webhook, 1 renamed/rewritten session page, admin settings, the notary assistant prompt, the integration test page, and a DB migration to rename the column.

## SignNow API Flow

SignNow uses a document-centric model (vs OneNotary's session-centric model):

```text
1. Authenticate → POST /oauth2/token (Basic auth + user credentials → Bearer token)
2. Upload document → POST /document (multipart form with file)
3. Add signing fields → PUT /document/{document_id} (place signature/text fields)
4. Send invite → POST /document/{document_id}/invite (email signers with roles)
5. Check status → GET /document/{document_id} (poll or use webhooks)
6. Download signed → GET /document/{document_id}/download?type=collapsed
7. Webhooks → document.update, invite.update (signer completed)
```

## Changes

### 1. New secret: `SIGNNOW_API_TOKEN`
- Will need a SignNow API Bearer token (or client credentials for OAuth2 flow)
- Remove the old `ONENOTARY_API_TOKEN` secret (user said they'll add keys later)

### 2. New edge function: `supabase/functions/signnow/index.ts`
- Replaces `supabase/functions/onenotary/index.ts`
- Same auth pattern (JWT validation, admin/notary role check)
- SignNow-specific actions mapping:

| Action | SignNow Endpoint | Notes |
|--------|-----------------|-------|
| `upload_document` | `POST /document` | Multipart upload, returns `document_id` |
| `add_fields` | `PUT /document/{id}` | Add signature/date/text fields to doc |
| `send_invite` | `POST /document/{id}/invite` | The curl example the user provided |
| `get_document` | `GET /document/{id}` | Status, field data, signing progress |
| `download_document` | `GET /document/{id}/download?type=collapsed` | Signed PDF |
| `cancel_invite` | `PUT /document/{id}/invite/cancel` | Cancel pending invite |
| `list_documents` | `GET /user/documentsv2` | List user's documents |
| `create_signing_link` | `POST /link` | Generate embedded signing link |

- Upserts to `notarization_sessions` table using new column `signnow_document_id` (renamed from `onenotary_session_id`)

### 3. Updated webhook: `supabase/functions/signnow-webhook/index.ts`
- Replaces `onenotary-webhook/index.ts`
- Handles SignNow events: `document.update`, `invite.update`, `document.complete`
- Maps events to same DB status updates (in_session, completed, cancelled)

### 4. DB migration
- Rename column: `notarization_sessions.onenotary_session_id` → `signnow_document_id`
- Rename column: `notary_journal.onenotary_fee` → `platform_fee`
- Rename column: `notary_payouts.onenotary_fees` → `platform_fees`
- Add index on `notarization_sessions.signnow_document_id`

### 5. Rewrite `src/pages/OneNotarySession.tsx` → update in-place
- Rename component references from "OneNotary" to "SignNow" throughout UI text
- Replace `supabase.functions.invoke("onenotary", ...)` calls with `supabase.functions.invoke("signnow", ...)`
- Update action names: `create_session` → `upload_document` + `send_invite`, `init_session` → removed (invite is the init), `add_document` → `upload_document`, etc.
- Session flow changes: admin uploads doc first, then sends invite (vs creating session → adding participant → uploading doc → initializing)
- Keep all Ohio compliance features (oath, KBA tracking, ID verification, journal entry, e-seal) untouched

### 6. Update `src/pages/admin/AdminSettings.tsx`
- Change "OneNotary API Status" → "SignNow API Status"
- Change select options: `onenotary_platform` → `signnow_platform`
- Update KBA provider option from `onenotary_builtin` to `signnow_builtin`
- Update all descriptive text

### 7. Update `src/pages/admin/AdminIntegrationTest.tsx`
- Change flow step labels from "OneNotary Session Created" → "SignNow Document Uploaded & Invite Sent"
- Update descriptions to match SignNow flow

### 8. Update `supabase/functions/notary-assistant/index.ts`
- Replace "OneNotary Platform" section with "SignNow Platform" in the system prompt
- Update session lifecycle: uploaded → invite_sent → viewed → signed → completed
- Note that SignNow handles document signing; KBA/credential analysis may need separate handling depending on plan

### 9. Update `src/pages/admin/AdminAppointments.tsx`
- Any references to "OneNotary" in status badges or labels → "SignNow"

### 10. Update `src/pages/ServiceDetail.tsx`
- Change RON FAQ reference from "OneNotary or Notarize" → "SignNow"

### 11. Route rename consideration
- Keep `/ron-session` route path (it's generic enough)
- Component stays named the same file but internal branding changes

### Files touched (~10 files)
- **New**: `supabase/functions/signnow/index.ts`
- **New**: `supabase/functions/signnow-webhook/index.ts`
- **Delete content**: `supabase/functions/onenotary/index.ts`, `supabase/functions/onenotary-webhook/index.ts`
- **Edit**: `src/pages/OneNotarySession.tsx`, `src/pages/admin/AdminSettings.tsx`, `src/pages/admin/AdminIntegrationTest.tsx`, `src/pages/admin/AdminAppointments.tsx`, `src/pages/ServiceDetail.tsx`, `supabase/functions/notary-assistant/index.ts`
- **DB**: 1 migration (column renames)

