/**
 * OP-006: Rate limiting utility for edge functions
 * Simple in-memory rate limiter (for edge function context)
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  booking: { windowMs: 60_000, maxRequests: 10 },
  contact: { windowMs: 60_000, maxRequests: 5 },
  sealVerification: { windowMs: 60_000, maxRequests: 20 },
  aiGeneration: { windowMs: 60_000, maxRequests: 5 },
  default: { windowMs: 60_000, maxRequests: 30 },
};

export function checkRateLimit(
  identifier: string,
  endpoint: string = "default"
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now - entry.windowStart >= config.windowMs) {
    entry = { count: 0, windowStart: now };
    store.set(key, entry);
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    retryAfterMs: 0,
  };
}

export function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>, endpoint: string = "default"): Record<string, string> {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    ...(result.retryAfterMs > 0 && {
      "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
    }),
  };
}
