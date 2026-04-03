

# AI Services & Critical Gaps — Full Audit & Fix Plan

## Audit Summary

Reviewed all 17 AI-powered edge functions, their frontend callers, auth patterns, API gateway URLs, and remaining SEO/layout gaps from prior phases.

---

## Critical AI Service Gaps Found

### Gap 1: `ai-tools` uses WRONG gateway URL
**File:** `supabase/functions/ai-tools/index.ts` line 58
- Uses `https://ai.gateway.lovable.dev/chat/completions` (missing `/v1/`)
- Every other function uses `https://ai.gateway.lovable.dev/v1/chat/completions`
- This could silently fail or route incorrectly

**Fix:** Change to `https://ai.gateway.lovable.dev/v1/chat/completions`

### Gap 2: `ai-tools` has NO auth check
**File:** `supabase/functions/ai-tools/index.ts`
- No JWT validation, no user verification — anyone with the anon key can call it
- Every other AI function either checks auth (`client-assistant`, `notary-assistant`, `translate-document`, etc.) or is admin-only
- This is an abuse vector for unlimited AI generation

**Fix:** Add auth check matching the pattern in `client-assistant/index.ts`

### Gap 3: `ai-cross-document` has NO auth check
**File:** `supabase/functions/ai-cross-document/index.ts`
- No auth verification at all — reads `LOVABLE_API_KEY` directly, no user check
- Frontend (`AIKnowledge.tsx`) calls it with just the anon key

**Fix:** Add auth check

### Gap 4: `ai-style-match` has NO auth check
**File:** `supabase/functions/ai-style-match/index.ts`
- Same pattern — no auth, no user verification

**Fix:** Add auth check

### Gap 5: `ai-compliance-scan` has NO auth check
**File:** `supabase/functions/ai-compliance-scan/index.ts`
- No auth — anyone can submit documents for compliance scanning

**Fix:** Add auth check

### Gap 6: `build-analyst` has NO auth check
**File:** `supabase/functions/build-analyst/index.ts`
- No auth verification — used by admin Build Tracker AND by public-facing Resume Builder and Grant Dashboard
- Resume Builder and Grant Dashboard call it with just the anon key
- This is a significant abuse vector since it's a general-purpose AI endpoint

**Fix:** Add auth check. Update `ResumeBuilder.tsx` and `GrantDashboard.tsx` to use `callEdgeFunctionStream` (which includes auth headers) instead of raw fetch with anon key.

### Gap 7: `WhatDoINeed` component calls `client-assistant` which REQUIRES auth
**File:** `src/components/WhatDoINeed.tsx`
- Used on homepage (`Index.tsx`) and Services page — both public/unauthenticated
- `client-assistant` edge function validates JWT and returns 401 for unauthenticated users
- This means the "What Do I Need?" feature silently fails for all non-logged-in visitors

**Fix:** Either (a) make `client-assistant` allow anon access for this use case, or (b) show a login prompt when unauthenticated users try to use it, or (c) create a lightweight public `client-assistant-public` function with rate limiting instead of auth.

### Gap 8: `AIKnowledge.tsx` calls `ai-cross-document` with anon key only
**File:** `src/pages/AIKnowledge.tsx` line 90
- Uses `Authorization: Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` instead of user token
- Once auth is added to the edge function (Gap 3), this will break

**Fix:** Switch to `callEdgeFunctionStream` which sends the user's session token.

### Gap 9: `ComplianceWatchdog` calls `ai-compliance-scan` via `supabase.functions.invoke`
- `supabase.functions.invoke` does send the user's auth token automatically, so this will work once auth is added to the edge function. No frontend change needed.

---

## Remaining SEO/Layout Gaps (Still Unimplemented)

### Gap 10: 9 pages still use `usePageTitle` instead of `usePageMeta`
`SubscriptionPlans`, `ServiceDetail`, `ClientPortal`, `BusinessPortal`, `GrantDashboard`, `ResumeBuilder`, `ServiceRequest`, `VerifySeal`, `Unsubscribe` — plus ~20 admin pages for consistency.

### Gap 11: `AppointmentConfirmation.tsx` still missing `PageShell`
### Gap 12: `VirtualMailroom.tsx` still missing `PageShell`

### Gap 13: 3 duplicate `@media print` blocks in `index.css`
Need consolidation into one block.

### Gap 14: `useToolHistory` never wired in `AITools.tsx`
`recordUsage()` is never called — tool history is dead code.

---

## Implementation Steps

### Step 1: Fix `ai-tools` gateway URL
Change `/chat/completions` to `/v1/chat/completions` in `supabase/functions/ai-tools/index.ts`.

### Step 2: Add auth to 5 unprotected AI edge functions
Add JWT user verification to: `ai-tools`, `ai-cross-document`, `ai-style-match`, `ai-compliance-scan`, `build-analyst`. Use the same auth pattern from `client-assistant` (create Supabase client with auth header, call `getUser()`).

### Step 3: Fix `WhatDoINeed` for unauthenticated users
Show a message prompting login when no session exists, or create a separate rate-limited public endpoint. Recommendation: show a "Sign in to use AI assistant" prompt for unauthenticated users since all other AI features require auth.

### Step 4: Update frontend callers to use auth helpers
- `AIKnowledge.tsx` — switch from raw fetch with anon key to `callEdgeFunctionStream`
- `ResumeBuilder.tsx` — switch from raw fetch to `callEdgeFunctionStream`
- `GrantDashboard.tsx` — switch from raw fetch to `callEdgeFunctionStream`

### Step 5: Convert 9 pages from `usePageTitle` to `usePageMeta`
Add appropriate title + description to: `SubscriptionPlans`, `ServiceDetail`, `ClientPortal`, `BusinessPortal`, `GrantDashboard`, `ResumeBuilder`, `ServiceRequest`, `VerifySeal`, `Unsubscribe`.

### Step 6: Add `PageShell` to `AppointmentConfirmation` and `VirtualMailroom`

### Step 7: Consolidate print CSS in `index.css`

### Step 8: Wire `recordUsage()` in `AITools.tsx`

**Total: ~20 files across edge functions and frontend.**

