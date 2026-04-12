/**
 * Error tracking and reporting utilities.
 * Captures, categorizes, and logs errors for admin review.
 */

import { supabase } from "@/integrations/supabase/client";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export type AppError = {
  message: string;
  stack?: string;
  context: string;
  severity: ErrorSeverity;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
};

const errorBuffer: AppError[] = [];
const MAX_BUFFER = 50;

/** Log an error to the buffer and optionally to audit trail */
export async function logError(
  error: Error | string,
  context: string,
  severity: ErrorSeverity = "medium",
  metadata?: Record<string, unknown>
): Promise<void> {
  const err: AppError = {
    message: typeof error === "string" ? error : error.message,
    stack: typeof error === "string" ? undefined : error.stack?.slice(0, 500),
    context,
    severity,
    metadata,
    timestamp: new Date().toISOString(),
  };

  // Buffer locally
  errorBuffer.push(err);
  if (errorBuffer.length > MAX_BUFFER) errorBuffer.shift();

  // Log critical/high to audit trail
  if (severity === "critical" || severity === "high") {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("audit_log").insert({
        action: `error_${severity}`,
        entity_type: "system",
        details: {
          message: err.message,
          context: err.context,
          stack: err.stack?.slice(0, 200),
          ...metadata,
        },
        user_id: user?.id,
      });
    } catch {
      // silently fail — don't throw from error handler
    }
  }
}

/** Get recent errors from buffer */
export function getRecentErrors(): AppError[] {
  return [...errorBuffer].reverse();
}

/** Clear error buffer */
export function clearErrors(): void {
  errorBuffer.length = 0;
}

/** Global error handler setup */
export function initGlobalErrorHandler(): void {
  window.addEventListener("unhandledrejection", (event) => {
    logError(
      event.reason?.message || "Unhandled promise rejection",
      "global:unhandledrejection",
      "high",
      { reason: String(event.reason) }
    );
  });

  window.addEventListener("error", (event) => {
    logError(
      event.error || event.message,
      `global:error:${event.filename}:${event.lineno}`,
      "high"
    );
  });
}

/** Performance monitoring: log slow operations */
export async function trackPerformance(
  operation: string,
  fn: () => Promise<void>,
  thresholdMs: number = 3000
): Promise<void> {
  const start = performance.now();
  try {
    await fn();
  } finally {
    const duration = performance.now() - start;
    if (duration > thresholdMs) {
      logError(
        `Slow operation: ${operation} took ${Math.round(duration)}ms`,
        "performance",
        "low",
        { operation, durationMs: Math.round(duration), threshold: thresholdMs }
      );
    }
  }
}
