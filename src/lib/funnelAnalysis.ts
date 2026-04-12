/**
 * Funnel analysis — visitor → booking → completion conversion tracking.
 * Enhancement #74 (Funnel analysis)
 */

export interface FunnelStage {
  name: string;
  count: number;
  dropoffRate: number;
  conversionFromPrevious: number;
}

/** Build a conversion funnel from raw stage counts */
export function buildFunnel(stages: Array<{ name: string; count: number }>): FunnelStage[] {
  if (stages.length === 0) return [];

  return stages.map((stage, i) => {
    const prevCount = i === 0 ? stage.count : stages[i - 1].count;
    const conversionFromPrevious = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;
    const dropoffRate = 100 - conversionFromPrevious;

    return {
      name: stage.name,
      count: stage.count,
      dropoffRate: i === 0 ? 0 : dropoffRate,
      conversionFromPrevious: i === 0 ? 100 : conversionFromPrevious,
    };
  });
}

/** Standard booking funnel stages */
export const BOOKING_FUNNEL_STAGES = [
  "Page View",
  "Service Selected",
  "Date Selected",
  "Form Completed",
  "Payment Initiated",
  "Booking Confirmed",
  "Appointment Completed",
] as const;

/** Get funnel data from localStorage analytics (client-side) */
export function getBookingFunnelData(): Array<{ name: string; count: number }> {
  try {
    const raw = localStorage.getItem("funnel_data");
    if (!raw) return BOOKING_FUNNEL_STAGES.map((name) => ({ name, count: 0 }));
    return JSON.parse(raw);
  } catch {
    return BOOKING_FUNNEL_STAGES.map((name) => ({ name, count: 0 }));
  }
}

/** Track a funnel event */
export function trackFunnelEvent(stageName: string) {
  try {
    const data = getBookingFunnelData();
    const stage = data.find((s) => s.name === stageName);
    if (stage) {
      stage.count++;
      localStorage.setItem("funnel_data", JSON.stringify(data));
    }
  } catch {
    // Silent fail
  }
}
