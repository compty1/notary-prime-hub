/**
 * Shared edge function middleware: CORS, security headers, error formatting, rate limiting.
 * Items 629-650: Edge function hardening.
 */

const ALLOWED_ORIGINS = [
  "https://notardex.com",
  "https://www.notardex.com",
  "https://notary-prime-hub.lovable.app",
  "https://id-preview--b6d1b88a-ed8c-42c3-98a9-3a2517fa9990.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

/** Standard security headers for all edge function responses (items 501, 644) */
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/** Build CORS headers with origin allowlist (item 644) */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    ...securityHeaders,
  };
}

/** Handle CORS preflight */
export function handleCorsOptions(req: Request): Response {
  return new Response("ok", { headers: corsHeaders(req) });
}

/** Structured error response using RFC 7807 format (item 639) */
export function errorResponse(
  req: Request,
  status: number,
  title: string,
  detail?: string,
  extras?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      type: `https://httpstatuses.com/${status}`,
      title,
      status,
      detail: detail || title,
      ...extras,
    }),
    {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/problem+json" },
    }
  );
}

/** Success response helper */
export function jsonResponse(req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/** Simple in-memory rate limiter (item 632) */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

/** Clean up stale entries periodically */
function cleanupRateLimiter() {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
  // Prevent unbounded growth
  if (rateLimitMap.size > 10000) rateLimitMap.clear();
}

export function checkRateLimit(identifier: string, maxRequests = RATE_LIMIT_MAX): boolean {
  cleanupRateLimiter();
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

/** Validate required fields on request body (item 638) */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/** Max request body size check (item 643) — call after parsing JSON */
export function checkBodySize(body: string, maxBytes = 1_048_576): boolean {
  return new TextEncoder().encode(body).length <= maxBytes;
}
