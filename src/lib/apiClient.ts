/**
 * API client with exponential backoff retry, circuit breaker, and connectivity checks.
 * Addresses Gaps #486-500 from the implementation plan.
 */

import { supabase } from "@/integrations/supabase/client";

/** User-friendly error messages mapped from HTTP status codes (Gap #496) */
const ERROR_MESSAGES: Record<number, string> = {
  400: "The request was invalid. Please check your input and try again.",
  401: "You need to sign in to access this resource.",
  403: "You don't have permission to perform this action.",
  404: "The requested resource was not found.",
  408: "The request timed out. Please try again.",
  409: "There was a conflict with the current state. Please refresh and try again.",
  422: "The data provided could not be processed. Please check your input.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again later.",
  502: "Service temporarily unavailable. Please try again in a moment.",
  503: "Service is currently under maintenance. Please try again later.",
};

/** Circuit breaker state (Gap #497) */
const circuitState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  cooldownMs: 30000, // 30 seconds
};

function checkCircuit(): boolean {
  if (!circuitState.isOpen) return true;
  if (Date.now() - circuitState.lastFailure > circuitState.cooldownMs) {
    circuitState.isOpen = false;
    circuitState.failures = 0;
    return true;
  }
  return false;
}

function recordSuccess() {
  circuitState.failures = 0;
  circuitState.isOpen = false;
}

function recordFailure() {
  circuitState.failures++;
  circuitState.lastFailure = Date.now();
  if (circuitState.failures >= 3) {
    circuitState.isOpen = true;
  }
}

/** Check connectivity before making requests (Gap #493) */
export function isOnline(): boolean {
  return navigator.onLine;
}

/** Get user-friendly error message (Gap #496) */
export function getFriendlyError(status: number, fallback?: string): string {
  return ERROR_MESSAGES[status] || fallback || "An unexpected error occurred. Please try again.";
}

/** Retry wrapper with exponential backoff (Gap #487) */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; onRetry?: (attempt: number) => void } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;

  if (!isOnline()) {
    throw new Error("You appear to be offline. Please check your internet connection.");
  }

  if (!checkCircuit()) {
    throw new Error("Service temporarily unavailable. Please try again in a moment.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        onRetry?.(attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        recordFailure();
      }
    }
  }

  throw lastError;
}

/** Typed Supabase query with retry (Gap #488) */
export async function queryWithRetry<T>(
  queryFn: () => ReturnType<typeof supabase.from>,
  options?: { maxRetries?: number }
): Promise<T[]> {
  return withRetry(async () => {
    const result = await (queryFn() as any);
    if (result.error) throw new Error(result.error.message);
    return result.data as T[];
  }, options);
}

/** Invoke edge function with retry (Gap #491) */
export async function invokeWithRetry<T = any>(
  functionName: string,
  body: Record<string, unknown>,
  options?: { maxRetries?: number }
): Promise<T> {
  return withRetry(async () => {
    const { data, error } = await supabase.functions.invoke(functionName, { body });
    if (error) throw error;
    return data as T;
  }, { maxRetries: options?.maxRetries ?? 2 });
}
