

# Plan: Fix Email Management Formatting & Display Issues

## Root Causes Identified

### 1. IMAP Body Parsing Fails on MIME Multipart Emails
The `ionos-email-sync` edge function uses a naive regex (`BODY\[TEXT\]\s*\{(\d+)\}`) to extract body text. Real IONOS emails are MIME multipart (with boundaries like `------=_Part_12345`), so the "body" captured is raw MIME content including boundary markers, Content-Type headers, and base64-encoded sections — rendering as garbled text in the UI.

### 2. Sanitizer Strips Too Aggressively for Email HTML
`sanitizeHtml()` only allows basic tags (`p, br, strong, em, ul, ol, li, a, span, blockquote`). Email HTML heavily uses `table`, `tr`, `td`, `th`, `div`, `img`, `style` — all stripped, destroying email layouts entirely.

### 3. Date/Sender Fields Display Issues
- `to_addresses` is typed as `Json | null` in the DB but the component treats it as `string[]` — causing `.join()` failures when it's null or a JSON string
- `is_read` and `is_starred` are nullable booleans (`boolean | null`) — falsy checks fail silently
- The `date` field from IMAP may contain malformed date strings that `new Date()` returns "Invalid Date" for
- The fallback to `email_cache` (when edge function fails — which the console "Failed to fetch" errors confirm is happening) casts `cached` as `unknown as EmailItem[]`, losing type safety on nullable fields

### 4. Edge Function Fetch Failures (Console Errors)
The repeated "Failed to fetch" errors in the console show the `ionos-email` edge function is unreachable or timing out. The fallback reads from `email_cache` directly, but the `body_text` column contains raw MIME content from the sync, not clean text.

## Implementation Plan

### Step 1: Fix MIME Parsing in `ionos-email-sync`
- Add a proper MIME multipart boundary parser that extracts `text/plain` and `text/html` parts separately
- Decode quoted-printable and base64 content transfer encodings
- Store clean `body_text` (plain text part) and `body_html` (HTML part) separately in `email_cache`

### Step 2: Expand Sanitizer for Email Rendering
- Create a new `sanitizeEmailHtml()` function in `sanitize.ts` with email-safe tags: `table, tr, td, th, thead, tbody, div, img, hr, pre, code, center, font`
- Allow `style, width, height, align, valign, bgcolor, color, border, cellpadding, cellspacing, src, alt` attributes
- Use this expanded sanitizer only in the email reader pane, not for user-generated content

### Step 3: Fix Type Handling in AdminMailbox
- Safely handle `to_addresses` as `Json | null` — parse/cast correctly with fallback to empty array
- Guard `is_read` and `is_starred` against null with `?? false`
- Add robust date parsing with fallback for invalid dates in `formatDate()`
- Fix the `EmailItem` type to match the actual DB schema (nullable booleans, Json arrays)

### Step 4: Improve Email List Display
- Show sender email when `from_name` is empty instead of "Unknown"
- Show relative time (e.g., "2h ago") for recent emails
- Truncate body snippet from clean `body_text` only (not raw MIME)
- Add loading state when fetching full email body on click

### Step 5: Add Graceful Fallback for Edge Function Failures
- When `callEdgeFunction("ionos-email", ...)` fails, fall back to direct Supabase query more gracefully
- Show a subtle banner indicating "Showing cached emails" when in fallback mode
- Include `body_html` in the fallback query select (currently selected via `*` but not reliably typed)

### Step 6: Deploy Updated Edge Function
- Redeploy `ionos-email-sync` with the MIME parser fix so future syncs store clean content
- Add a "Re-sync" option that clears and re-fetches recent emails with the fixed parser

## Files Modified
- `supabase/functions/ionos-email-sync/index.ts` — MIME multipart parser
- `src/lib/sanitize.ts` — new `sanitizeEmailHtml()` function  
- `src/pages/admin/AdminMailbox.tsx` — type fixes, date formatting, fallback UI
- `src/pages/admin/AdminEmailManagement.tsx` — minor cleanup

## Technical Notes
- ~4 file edits, 1 edge function redeploy
- No DB migration needed — schema already has the right columns
- The MIME parser handles `Content-Transfer-Encoding: quoted-printable` and `base64`

