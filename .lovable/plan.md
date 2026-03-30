

# Finish SignNow Migration — Remaining Tasks

## What's Left

1. **AdminRevenue.tsx** — Still references `onenotary_fee` column name and displays "OneNotary" labels throughout the revenue dashboard
2. **notary-assistant/index.ts** — Line 21 still says "OneNotary platform usage"
3. **AdminSettings.tsx** — Missing SignNow webhook URL configuration field
4. **Database column rename not applied** — The `notary_journal.onenotary_fee` column was in the migration plan but the DB types still show `onenotary_fee`, meaning the column rename may not have been applied. Need to verify and create a migration if needed.
5. **SignNow OAuth token management** — The current edge function uses a static `SIGNNOW_API_TOKEN` bearer token. Based on the SignNow API docs provided, tokens expire (default 30 days). Should add token refresh logic or at minimum document the flow.

## Plan

### 1. Database Migration — Rename remaining `onenotary_fee` column
- Rename `notary_journal.onenotary_fee` → `notary_journal.platform_fee` (the prior migration may have failed or not included this)
- Verify `notarization_sessions.onenotary_session_id` was renamed to `signnow_document_id`

### 2. Update `AdminRevenue.tsx`
- Replace all `onenotary_fee` references with `platform_fee`
- Rename "OneNotary Fees" label → "Signing Platform Fees"
- Update CSV export header from "OneNotary Fee" → "Platform Fee"
- Update table column header from "OneNotary" → "Platform"

### 3. Update `notary-assistant/index.ts`
- Line 21: Change "OneNotary platform usage and session management" → "SignNow platform usage and session management"

### 4. Add SignNow Webhook URL Config to `AdminSettings.tsx`
- Add a read-only field in the Platform Integration card showing the webhook endpoint URL: `https://svrebvbcsxaoluafblnq.supabase.co/functions/v1/signnow-webhook`
- Add a copy-to-clipboard button so the admin can paste it into SignNow's dashboard
- Add helper text: "Register this URL in your SignNow account under API Settings → Webhooks. Subscribe to events: document.complete, document.update, invite.update"

### 5. Enhance SignNow Edge Function with OAuth Token Refresh
- Update `supabase/functions/signnow/index.ts` to support the `POST /oauth2/token` flow with `grant_type=password` or `grant_type=refresh_token`
- Add a new action `refresh_token` that generates a fresh access token using stored credentials (`SIGNNOW_USERNAME`, `SIGNNOW_PASSWORD`, `SIGNNOW_BASIC_TOKEN`)
- Add a `verify_token` action that calls `GET /oauth2/token` to check if the current token is still valid
- This enables the admin integration test page to verify token validity and refresh when needed

### 6. Update `AdminIntegrationTest.tsx`
- Add a "Verify Token" sub-test that calls the `verify_token` action before `list_documents`
- Show token expiration info in the test result

### Files Touched
- **Migration**: 1 new SQL migration (column rename)
- **Edit**: `AdminRevenue.tsx`, `AdminSettings.tsx`, `AdminIntegrationTest.tsx`, `notary-assistant/index.ts`, `signnow/index.ts`

