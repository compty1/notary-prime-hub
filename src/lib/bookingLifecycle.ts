/**
 * SVC-452: Booking lifecycle timestamp tracker
 * Tracks key moments: scheduled, started, completed.
 */

export interface BookingLifecycle {
  scheduledAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  noShowAt?: string;
}

export function getBookingDuration(lifecycle: BookingLifecycle): number | null {
  if (!lifecycle.startedAt || !lifecycle.completedAt) return null;
  const start = new Date(lifecycle.startedAt).getTime();
  const end = new Date(lifecycle.completedAt).getTime();
  return Math.round((end - start) / 60000); // minutes
}

export function getBookingLeadTime(lifecycle: BookingLifecycle): number {
  const scheduled = new Date(lifecycle.scheduledAt).getTime();
  const created = lifecycle.confirmedAt ? new Date(lifecycle.confirmedAt).getTime() : Date.now();
  return Math.round((scheduled - created) / 3600000); // hours
}

export function formatLifecycleTimeline(lifecycle: BookingLifecycle): { label: string; time: string; status: "completed" | "pending" | "skipped" }[] {
  const steps = [
    { label: "Scheduled", time: lifecycle.scheduledAt, status: "completed" as const },
    { label: "Confirmed", time: lifecycle.confirmedAt || "", status: lifecycle.confirmedAt ? "completed" as const : "pending" as const },
    { label: "Started", time: lifecycle.startedAt || "", status: lifecycle.startedAt ? "completed" as const : "pending" as const },
    { label: "Completed", time: lifecycle.completedAt || "", status: lifecycle.completedAt ? "completed" as const : lifecycle.cancelledAt ? "skipped" as const : "pending" as const },
  ];
  if (lifecycle.cancelledAt) {
    steps.push({ label: "Cancelled", time: lifecycle.cancelledAt, status: "completed" });
  }
  if (lifecycle.noShowAt) {
    steps.push({ label: "No-Show", time: lifecycle.noShowAt, status: "completed" });
  }
  return steps;
}
