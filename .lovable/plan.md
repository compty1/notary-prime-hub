

## Plan: Simplify RON Flow to Link-Paste Only

### Problem
The current RON session page has two modes controlled by a setting (`ron_session_method`): a complex SignNow API flow (upload → add fields → send invite) and a simpler "email invite" mode where the notary pastes a link. The user wants to consolidate to a single, streamlined flow where the notary always pastes a SignNow signing link directly.

### Changes

**1. Simplify `src/pages/RonSession.tsx` — Admin/Notary Session Controls**
- Remove the `ronMethod` toggle and the entire SignNow API flow branch (upload document, send invite, cancel invite logic)
- Remove related state: `uploadingDoc`, `sendingInvite`, `cancellingSession`, `inviteEmail`, `inviteSubject`, `inviteMessage`, `signnowDocumentId`
- Make the "paste link" UI the only session initiation method — always shown, no conditional
- Improve the paste-link section with clearer guidance: "Open SignNow, prepare the document and signing session there, then paste the signing link below"
- Auto-update session status to "confirmed" when a link is saved (so the flow progresses)
- Add a visual step indicator: Step 1 → Paste Link, Step 2 → Verify ID/KBA, Step 3 → Administer Oath, Step 4 → Finalize
- Keep all existing: ID verification sidebar, KBA toggle, oath administration, voice-to-notes, save/finalize logic

**2. Update `src/pages/RonSession.tsx` — Client View**
- No changes needed — client view already shows the `participantLink` when available, which is exactly what gets saved from the paste flow

**3. Remove unused SignNow API call functions**
- Remove `handleDocUpload`, `handleSendInvite`, `handleCancelSession` functions from the component
- Remove the file upload input and invite form JSX entirely
- Keep the `signnow` edge function intact (it's used elsewhere for integration testing, webhook management, and document download)

**4. Update `saveManualLink` in `src/pages/RonSession.tsx`**
- Rename to `saveSessionLink` for clarity
- After saving the link, automatically set `sessionStatus` to `"confirmed"` and update the DB session status
- Add URL validation to ensure the pasted link is a valid URL

**5. Update session status badge in the header**
- Remove the "Manual / Email Invite" vs "SignNow Platform" badge distinction since there's now only one flow
- Show a simple status badge instead

### Files Modified
- `src/pages/RonSession.tsx` — primary changes (simplify to link-paste flow, remove API upload/invite, add step indicator)

### What Stays the Same
- All loading animations
- Client-side view (already works with paste flow)
- SignNow edge function (used for other features)
- ID verification, KBA, oath, voice notes, finalization logic
- Realtime subscription for session updates
- Commission expiry checks
- All database tables and RLS policies

