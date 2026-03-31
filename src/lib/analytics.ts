/**
 * Lightweight GA4 event tracking wrapper.
 * Falls back silently when gtag is not loaded.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type EventName =
  | "booking_started"
  | "booking_completed"
  | "lead_submitted"
  | "contact_form_submitted"
  | "ron_session_started"
  | "document_uploaded";

export function trackEvent(event: EventName, params?: Record<string, string | number | boolean>) {
  try {
    window.gtag?.("event", event, params);
  } catch {
    // silently fail
  }
}
