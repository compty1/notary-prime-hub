/**
 * Rate limiting utilities for client-side operations (Items 485, 632)
 * Token bucket and sliding window implementations.
 */

interface RateLimitEntry {
  timestamps: number[];
  blockedUntil?: number;
}

const limitStore = new Map<string, RateLimitEntry>();

/** Sliding window rate limiter */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = limitStore.get(key) || { timestamps: [] };

  // Check if currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, retryAfterMs: entry.blockedUntil - now };
  }

  // Clean old timestamps
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);
    entry.blockedUntil = now + retryAfterMs;
    limitStore.set(key, entry);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  entry.blockedUntil = undefined;
  limitStore.set(key, entry);
  return { allowed: true };
}

/** Progressive penalty rate limiter (longer blocks on repeated violations) */
export function checkProgressiveRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const penaltyKey = `${key}_penalty`;
  const now = Date.now();
  const result = checkRateLimit(key, maxRequests, windowMs);

  if (!result.allowed) {
    // Increase penalty on each violation
    const currentPenalty = limitStore.get(penaltyKey)?.timestamps.length || 0;
    const multiplier = Math.min(Math.pow(2, currentPenalty), 16); // max 16x
    const penaltyEntry = limitStore.get(penaltyKey) || { timestamps: [] };
    penaltyEntry.timestamps.push(now);
    limitStore.set(penaltyKey, penaltyEntry);

    return {
      allowed: false,
      retryAfterMs: (result.retryAfterMs || windowMs) * multiplier,
    };
  }

  return result;
}

/** Reset rate limit for a key */
export function resetRateLimit(key: string) {
  limitStore.delete(key);
  limitStore.delete(`${key}_penalty`);
}

/** Cleanup old entries to prevent memory leaks */
export function cleanupRateLimits() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes

  for (const [key, entry] of limitStore) {
    const newest = Math.max(...entry.timestamps, 0);
    if (now - newest > maxAge) {
      limitStore.delete(key);
    }
  }

  // Prevent unbounded growth
  if (limitStore.size > 1000) {
    limitStore.clear();
  }
}

// Auto-cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
