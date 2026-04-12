/**
 * SVC-140/141: Standardized analytics event taxonomy and funnel tracking
 * Central event definitions with type-safe tracking wrapper.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/** Comprehensive event taxonomy */
export const ANALYTICS_EVENTS = {
  // Booking funnel (SVC-141)
  BOOKING_PAGE_VIEW: "booking_page_view",
  BOOKING_STEP_START: "booking_step_start",
  BOOKING_SERVICE_SELECTED: "booking_service_selected",
  BOOKING_DATE_SELECTED: "booking_date_selected",
  BOOKING_FORM_SUBMITTED: "booking_form_submitted",
  BOOKING_PAYMENT_STARTED: "booking_payment_started",
  BOOKING_COMPLETED: "booking_completed",
  BOOKING_ABANDONED: "booking_abandoned",

  // Authentication
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",

  // Services
  SERVICE_PAGE_VIEW: "service_page_view",
  SERVICE_CTA_CLICKED: "service_cta_clicked",

  // Documents
  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_DOWNLOADED: "document_downloaded",
  DOCUMENT_SIGNED: "document_signed",

  // RON
  RON_SESSION_STARTED: "ron_session_started",
  RON_SESSION_COMPLETED: "ron_session_completed",
  RON_KBA_STARTED: "ron_kba_started",
  RON_KBA_PASSED: "ron_kba_passed",
  RON_KBA_FAILED: "ron_kba_failed",

  // Payments
  PAYMENT_INITIATED: "payment_initiated",
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  SUBSCRIPTION_STARTED: "subscription_started",

  // CRM / Lead
  LEAD_SUBMITTED: "lead_submitted",
  CONTACT_FORM_SUBMITTED: "contact_form_submitted",

  // AI Tools
  AI_TOOL_USED: "ai_tool_used",
  AI_TOOL_EXPORT: "ai_tool_export",

  // Portal
  PORTAL_PAGE_VIEW: "portal_page_view",
  PORTAL_ACTION: "portal_action",
} as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

interface TrackEventParams {
  [key: string]: string | number | boolean | undefined;
}

/** Track an analytics event with type safety */
export function trackAnalyticsEvent(
  event: AnalyticsEventName,
  params?: TrackEventParams
) {
  try {
    // GA4
    window.gtag?.("event", event, {
      ...params,
      timestamp: Date.now(),
    });

    // Console in dev for debugging
    if (import.meta.env.DEV) {
      console.debug(`[Analytics] ${event}`, params);
    }
  } catch {
    // Never throw from analytics
  }
}

/** Track booking funnel step */
export function trackBookingFunnel(
  step: "view" | "start" | "service" | "date" | "submit" | "payment" | "complete" | "abandon",
  params?: TrackEventParams
) {
  const eventMap: Record<string, AnalyticsEventName> = {
    view: ANALYTICS_EVENTS.BOOKING_PAGE_VIEW,
    start: ANALYTICS_EVENTS.BOOKING_STEP_START,
    service: ANALYTICS_EVENTS.BOOKING_SERVICE_SELECTED,
    date: ANALYTICS_EVENTS.BOOKING_DATE_SELECTED,
    submit: ANALYTICS_EVENTS.BOOKING_FORM_SUBMITTED,
    payment: ANALYTICS_EVENTS.BOOKING_PAYMENT_STARTED,
    complete: ANALYTICS_EVENTS.BOOKING_COMPLETED,
    abandon: ANALYTICS_EVENTS.BOOKING_ABANDONED,
  };
  trackAnalyticsEvent(eventMap[step], { funnel_step: step, ...params });
}

/** Capture UTM parameters from URL (SVC-404) */
export function captureUTMParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem("notar_utm", JSON.stringify(utm));
    } catch { /* quota exceeded */ }
  }
  return utm;
}

/** Retrieve stored UTM params */
export function getStoredUTMParams(): Record<string, string> {
  try {
    const stored = sessionStorage.getItem("notar_utm");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
