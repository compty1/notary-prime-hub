/**
 * Retry utilities for network operations (Items 631, 1900-1910)
 * Exponential backoff with jitter for resilient API calls.
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Only retry on these status codes */
  retryOnStatus?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
};

/** Sleep with jitter */
function sleepWithJitter(baseMs: number): Promise<void> {
  const jitter = baseMs * (0.5 + Math.random() * 0.5);
  return new Promise(resolve => setTimeout(resolve, jitter));
}

/**
 * Retry a fetch-like async operation with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      if (attempt === opts.maxRetries) break;

      const delayMs = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt),
        opts.maxDelayMs
      );
      await sleepWithJitter(delayMs);
    }
  }

  throw lastError;
}

/**
 * Retry a fetch call, respecting retryable status codes.
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return withRetry(async () => {
    const response = await fetch(url, init);
    if (!response.ok && opts.retryOnStatus.includes(response.status)) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  }, opts);
}
