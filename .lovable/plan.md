

# Add Automatic Per-Document Webhook Registration

## Problem
SignNow's webhook UI requires a specific document ID — it doesn't support wildcard subscriptions. This means webhooks must be registered per-document via the SignNow API after each upload.

## Solution
After each successful document upload in the `signnow` edge function, automatically register a webhook subscription for that document using the SignNow API's event subscription endpoint.

## Changes

### 1. Update `supabase/functions/signnow/index.ts`

After the document upload succeeds (line ~197-207), add a helper function and call it to register webhook events for the new document:

**New helper function** `registerDocumentWebhook(documentId, token)`:
- Calls `POST https://api.signnow.com/api/v2/events` (or the v1 equivalent `POST /document/{id}/event`) to subscribe to:
  - `document.complete`
  - `document.update`  
  - `document.delete`
  - `invite.create`, `invite.update`, `invite.cancel`
- Callback URL: `https://svrebvbcsxaoluafblnq.supabase.co/functions/v1/signnow-webhook`
- Includes the `SIGNNOW_WEBHOOK_SECRET` for HMAC signature verification if configured
- Logs but does NOT fail the upload if webhook registration fails (non-blocking)

**Insert point**: Right after the `notarization_sessions` upsert (line ~207), before the return statement.

### 2. Add `SIGNNOW_WEBHOOK_SECRET` secret

Use the `add_secret` tool to prompt the user to store the HMAC secret. This secret is used by both:
- The `signnow-webhook` function (to verify inbound signatures)
- The `signnow` function (to register webhooks with the correct secret)

### 3. No other file changes needed
The existing `signnow-webhook/index.ts` already handles all the event types. The build error shown (503 sandbox scheduler) is transient infrastructure — not caused by code.

## Technical Details

SignNow's Event Subscription API (v2):
```
POST /api/v2/events
{
  "event": "document.complete",
  "entity_id": "<document_id>",
  "action": "callback",
  "attributes": {
    "callback": "https://...signnow-webhook",
    "use_tls_12": true
  }
}
```

Each event type requires a separate subscription call, so we'll fire them in parallel with `Promise.allSettled` to avoid blocking on any single failure.

