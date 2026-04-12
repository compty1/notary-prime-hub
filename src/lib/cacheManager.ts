/**
 * I-041: Service catalog caching with stale-while-revalidate pattern.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Default TTL: 5 minutes */
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * Get cached data or execute fetcher.
 * Returns stale data while revalidating in background.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  // Fresh cache hit
  if (existing && now < existing.expiresAt) {
    return existing.data;
  }

  // Stale cache hit — return stale, revalidate in background
  if (existing) {
    revalidateInBackground(key, fetcher, ttlMs);
    return existing.data;
  }

  // Cache miss — fetch and cache
  const data = await fetcher();
  cache.set(key, { data, timestamp: now, expiresAt: now + ttlMs });
  return data;
}

async function revalidateInBackground<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<void> {
  try {
    const data = await fetcher();
    const now = Date.now();
    cache.set(key, { data, timestamp: now, expiresAt: now + ttlMs });
  } catch {
    // Keep stale data on revalidation failure
  }
}

/** Invalidate a specific cache key */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/** Invalidate all cache entries matching a prefix */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/** Clear entire cache */
export function clearCache(): void {
  cache.clear();
}

/** Get cache stats for debugging */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/** Common cache keys */
export const CACHE_KEYS = {
  SERVICES: "services_catalog",
  PRICING_RULES: "pricing_rules",
  PLATFORM_SETTINGS: "platform_settings",
  FEATURE_FLAGS: "feature_flags",
  SERVICE_CATEGORIES: "service_categories",
  NOTARY_DIRECTORY: "notary_directory",
} as const;
