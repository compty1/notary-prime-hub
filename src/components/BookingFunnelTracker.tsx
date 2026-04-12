/**
 * SVC-141: Funnel tracking for booking flow
 * Tracks: page_view -> form_start -> step_complete -> submit -> payment
 */
import { useEffect, useRef } from "react";
import { trackAnalyticsEvent, ANALYTICS_EVENTS } from "@/lib/analyticsEvents";

type FunnelStep = "view" | "start" | "step_1" | "step_2" | "step_3" | "submit" | "payment" | "confirmation";

const FUNNEL_KEY = "ntrdx_booking_funnel";

interface FunnelState {
  sessionId: string;
  steps: { step: FunnelStep; timestamp: number }[];
  serviceType?: string;
}

function getFunnelState(): FunnelState | null {
  try {
    const raw = sessionStorage.getItem(FUNNEL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveFunnelState(state: FunnelState): void {
  try { sessionStorage.setItem(FUNNEL_KEY, JSON.stringify(state)); } catch {}
}

export function startBookingFunnel(serviceType?: string): string {
  const sessionId = crypto.randomUUID();
  const state: FunnelState = {
    sessionId,
    steps: [{ step: "view", timestamp: Date.now() }],
    serviceType,
  };
  saveFunnelState(state);
  trackAnalyticsEvent(ANALYTICS_EVENTS.BOOKING_STEP_START, { sessionId, serviceType });
  return sessionId;
}

export function trackFunnelStep(step: FunnelStep, metadata?: Record<string, any>): void {
  const state = getFunnelState();
  if (!state) return;

  // Don't duplicate steps
  if (state.steps.some(s => s.step === step)) return;

  state.steps.push({ step, timestamp: Date.now() });
  saveFunnelState(state);

  trackAnalyticsEvent(ANALYTICS_EVENTS.BOOKING_STEP_START, {
    sessionId: state.sessionId,
    serviceType: state.serviceType,
    stepNumber: state.steps.length,
    ...metadata,
  });
}

export function completeFunnel(): void {
  const state = getFunnelState();
  if (!state) return;

  const totalMs = Date.now() - state.steps[0].timestamp;
  trackAnalyticsEvent(ANALYTICS_EVENTS.BOOKING_COMPLETED, {
    sessionId: state.sessionId,
    serviceType: state.serviceType,
    totalSteps: state.steps.length,
    totalDurationMs: totalMs,
    totalDurationMin: Math.round(totalMs / 60000),
  });

  try { sessionStorage.removeItem(FUNNEL_KEY); } catch {}
}

/**
 * Hook to track when a booking step is rendered
 */
export function useTrackBookingStep(step: FunnelStep, serviceType?: string) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    if (step === "view") {
      startBookingFunnel(serviceType);
    } else {
      trackFunnelStep(step, { serviceType });
    }
  }, [step, serviceType]);
}
