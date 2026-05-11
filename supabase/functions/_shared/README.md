# Shared Edge Function Utilities

This directory holds helpers reused across multiple Supabase Edge Functions.
Importing from here keeps single-source-of-truth for cross-cutting concerns.

| File | Purpose |
| --- | --- |
| `logger.ts` | Structured JSON logger (`logger.info / warn / error`). Every Edge Function should use it instead of bare `console.log`. |
| `middleware.ts` | Request middleware: CORS preflight, JWT validation helpers, request-id tagging, optional admin-only gating. |
| `aiCostGuard.ts` | Per-user monthly quota tracking + standard `402` (Credits Exhausted) and `429` (Rate Limited) responses. Wrap every Lovable AI Gateway call. |
| `uplGuardrail.ts` | Pre-flight check for AI prompts that might return Unauthorized Practice of Law (UPL) content. Notar must never give legal advice. |
| `email-templates/` | Shared HTML/MJML email templates for transactional notifications. |

## Conventions

- **CORS**: For browser-callable functions, always emit `Access-Control-Allow-Origin: *` (or the explicit origin) and handle the `OPTIONS` preflight.
- **Validation**: Validate every request body with `zod`. Return `400` with field errors on failure.
- **Auth**: Check `Authorization: Bearer <jwt>` and verify with the Supabase JWKS unless the function is intentionally public (webhooks).
- **Secrets**: Read via `Deno.env.get(...)`. Never hardcode.
- **Logging**: Use `logger.*` to emit structured logs (correlation-id friendly).
- **Output**: Always `JSON.stringify` and set `Content-Type: application/json`.

## Adding a new shared util

1. Drop the file in `supabase/functions/_shared/`.
2. Document it here.
3. Import from sibling functions via the relative path: `import { foo } from "../_shared/foo.ts";`
