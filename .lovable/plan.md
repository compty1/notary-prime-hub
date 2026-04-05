

# AI Tools Failure — Root Cause Analysis & Fix Plan

## Root Cause

**All 5 AI edge functions are broken because they use `getClaims()` on `@supabase/supabase-js@2.49.1`, which does NOT have that method.** The `getClaims()` method was added in a much newer version of the SDK. When the function calls `supabase.auth.getClaims(token)`, it throws a runtime error (`.getClaims is not a function`), which is caught by the generic `catch` block and returns a 500 — but since the function crashes, no logs are recorded.

The working functions (`client-assistant`, `notary-assistant`) use `@supabase/supabase-js@2` (resolves to latest) and call `getUser()` instead — that's why they work.

## Affected Functions (5 total)

| Function | Import Version | Auth Method | Status |
|---|---|---|---|
| `ai-tools` | `@2.49.1` | `getClaims()` | BROKEN |
| `ai-cross-document` | `@2.49.1` | `getClaims()` | BROKEN |
| `ai-style-match` | `@2.49.1` | `getClaims()` | BROKEN |
| `ai-compliance-scan` | `@2.49.1` | `getClaims()` | BROKEN |
| `build-analyst` | `@2.49.1` | `getClaims()` | BROKEN |

## Working Functions (for reference)

| Function | Import Version | Auth Method | Status |
|---|---|---|---|
| `client-assistant` | `@2` (latest) | `getUser()` | WORKS |
| `notary-assistant` | `@2` (latest) | `getUser()` | WORKS |
| `ai-extract-document` | `@2.49.1` | `getUser()` | WORKS (correct method, wrong version) |

## Fix Plan

### Step 1: Fix all 5 broken edge functions
For each of `ai-tools`, `ai-cross-document`, `ai-style-match`, `ai-compliance-scan`, `build-analyst`:

1. Change import from `@supabase/supabase-js@2.49.1` to `@supabase/supabase-js@2`
2. Replace the `getClaims(token)` auth block with the working `getUser()` pattern:
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Step 2: Fix `ai-extract-document` import version
Change from `@2.49.1` to `@2` for consistency (it already uses `getUser()` so it may work, but the pinned old version could cause other issues).

### Total: 6 edge function files, same 2-line fix in each.

