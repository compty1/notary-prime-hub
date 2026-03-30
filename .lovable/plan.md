

# Fix: Documents Not Appearing in SignNow After RON Upload

## Diagnosis

There are zero edge function invocation logs for the `signnow` function, which means either:
1. The function was never deployed (or needs redeployment after recent webhook changes)
2. The SignNow API token (`SIGNNOW_API_TOKEN`) has expired — these tokens have a limited lifespan (typically 30 days)

The client-side code in `RonSession.tsx` correctly reads the file, converts to base64, and calls `supabase.functions.invoke("signnow", ...)`. The edge function code correctly sends a multipart form upload to `POST https://api.signnow.com/document`. So the issue is deployment or token-related, not a code bug.

## Plan

### Step 1: Redeploy the `signnow` edge function
The function was recently modified to add webhook registration logic. It needs to be redeployed to pick up those changes and ensure it's live.

### Step 2: Verify the SignNow API token
Call the `verify_token` action on the deployed function to check if the `SIGNNOW_API_TOKEN` is still valid. SignNow tokens expire — if expired, use the `refresh_token` action to get a new one, then update the secret.

### Step 3: Test the upload flow end-to-end
Use `curl_edge_functions` to call the `signnow` function with `action: "verify_token"` to confirm connectivity, then test a small document upload.

### Step 4: Add error visibility
Add a toast or console log in `RonSession.tsx` that surfaces the exact error message when `supabase.functions.invoke` fails, since currently `resp.error.message` may not contain the full SignNow API error detail. Update the error handling to also check `resp.data?.error`.

## Technical Details

- The `supabase.functions.invoke` call returns `{ data, error }` — but edge function HTTP errors (like 403 from expired commission or 500 from bad token) come back in `resp.data` not `resp.error` unless the function itself is unreachable
- Current error handling on line 251 only checks `resp.error` (network/CORS errors), missing cases where the function returns a 4xx/5xx with an error body in `resp.data`
- Fix: also check `if (resp.data?.error) throw new Error(resp.data.error)`

