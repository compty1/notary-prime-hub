

## Fix Plan: 3 Critical Edge Function Bugs

### 1. `discover-leads/index.ts` — Replace `getClaims` with `getUser` + add admin role check

**Line 24**: `supabase.auth.getClaims(token)` does not exist in supabase-js v2. Replace lines 23-27 with:
- `await supabase.auth.getUser()` to verify the caller
- Add admin role check using service role client (same pattern as `notary-assistant` lines 67-79)

### 2. `send-appointment-emails/index.ts` — Already fixed

This function already has a graceful fallback at lines 183-189 (logs instead of sending when no key) and lines 232-234 (sets `skipped_no_key` flag). No changes needed.

### 3. `notary-assistant/index.ts` — Allow notary role

**Lines 68-79**: Currently queries `user_roles` for `role = 'admin'` only. Change to query for roles matching either `admin` or `notary` using `.in('role', ['admin', 'notary'])`, and adjust from `.single()` to checking if any rows returned.

### Files to modify:
- `supabase/functions/discover-leads/index.ts` (lines 23-27 → getUser + role check)
- `supabase/functions/notary-assistant/index.ts` (lines 68-79 → allow notary)

