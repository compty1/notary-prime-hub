/**
 * Gap 197-198: CSRF protection via custom header validation
 * Gap 200: Enhanced sanitization for user inputs
 * Gap 204: Audit event type registry for comprehensive logging
 */

/** All auditable admin actions (gap 204) */
export const AUDIT_EVENTS = {
  // Auth
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGIN_RATE_LIMITED: "login_rate_limited",
  LOGOUT: "logout",
  PASSWORD_CHANGED: "password_changed",
  
  // Admin actions
  ADMIN_USER_CREATED: "admin_user_created",
  ADMIN_USER_ROLE_CHANGED: "admin_role_changed",
  ADMIN_APPOINTMENT_STATUS: "admin_appointment_status",
  ADMIN_DOCUMENT_STATUS: "admin_document_status",
  ADMIN_SERVICE_UPDATED: "admin_service_updated",
  ADMIN_SETTINGS_UPDATED: "admin_settings_updated",
  ADMIN_BULK_ACTION: "admin_bulk_action",
  ADMIN_EXPORT: "admin_data_export",
  
  // Client actions
  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_DELETED: "document_deleted",
  APPOINTMENT_BOOKED: "appointment_booked",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  PAYMENT_SUBMITTED: "payment_submitted",
  PROFILE_UPDATED: "profile_updated",
} as const;

export type AuditEvent = typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS];

/** Sanitize text input by stripping control characters and trimming */
export function sanitizeTextInput(input: string, maxLength = 1000): string {
  // Strip null bytes and control characters except newlines/tabs
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.trim().slice(0, maxLength);
}

/** Validate that a request includes the CSRF header (gap 198) */
export function hasCSRFHeader(headers: Headers): boolean {
  return headers.get("X-Requested-With") === "XMLHttpRequest";
}

/** #3547: Client-side rate limiter for form submissions */
const _rateLimitMap = new Map<string, number>();
export function isRateLimited(key: string, intervalMs = 60000): boolean {
  const now = Date.now();
  const lastTime = _rateLimitMap.get(key) || 0;
  if (now - lastTime < intervalMs) return true;
  _rateLimitMap.set(key, now);
  return false;
}

/** #3879: Inject X-Frame-Options equivalent via CSP meta tag */
export function injectFrameProtection() {
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;
  const meta = document.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = "frame-ancestors 'self'";
  document.head.appendChild(meta);
}
