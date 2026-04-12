/**
 * BK-005 / 2A: Service duration engine.
 * Calculates booking time slots based on service-specific duration,
 * signer count, and add-ons. Used by booking calendar to block correct time ranges.
 */
import { SERVICE_REGISTRY, getServiceById } from "@/lib/serviceRegistry";

export interface DurationFactors {
  serviceId: string;
  signerCount?: number;
  documentCount?: number;
  additionalServices?: string[];
  isAfterHours?: boolean;
}

/** Extra minutes per additional signer beyond the first */
const MINUTES_PER_EXTRA_SIGNER = 10;

/** Extra minutes per additional document beyond what's included */
const MINUTES_PER_EXTRA_DOC = 5;

/** Buffer between appointments in minutes */
const BUFFER_MINUTES = 15;

/**
 * Calculate total estimated duration for a booking in minutes.
 * Returns the base service duration + adjustments for signers, docs, add-ons.
 */
export function calculateBookingDuration(factors: DurationFactors): number {
  const service = getServiceById(factors.serviceId);
  if (!service) return 30; // safe default

  let duration = service.estimatedDuration ?? 30;

  // Add time for extra signers
  if (factors.signerCount && factors.signerCount > 1) {
    duration += (factors.signerCount - 1) * MINUTES_PER_EXTRA_SIGNER;
  }

  // Add time for extra documents (>2)
  if (factors.documentCount && factors.documentCount > 2) {
    duration += (factors.documentCount - 2) * MINUTES_PER_EXTRA_DOC;
  }

  // Add time for bundled services
  if (factors.additionalServices?.length) {
    for (const addOnId of factors.additionalServices) {
      const addOn = getServiceById(addOnId);
      if (addOn?.estimatedDuration) {
        duration += Math.round(addOn.estimatedDuration * 0.5); // 50% overlap assumed
      }
    }
  }

  return duration;
}

/**
 * Get the number of time slots a service occupies (30-min slots).
 */
export function getSlotCount(factors: DurationFactors): number {
  const duration = calculateBookingDuration(factors);
  return Math.ceil(duration / 30);
}

/**
 * Calculate the total block including buffer.
 */
export function getTotalBlockMinutes(factors: DurationFactors): number {
  return calculateBookingDuration(factors) + BUFFER_MINUTES;
}

/**
 * Format duration for display.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Get all service durations for admin reference.
 */
export function getAllServiceDurations(): Array<{ id: string; name: string; duration: number; formatted: string }> {
  return SERVICE_REGISTRY.map(s => ({
    id: s.id,
    name: s.name,
    duration: s.estimatedDuration ?? 30,
    formatted: formatDuration(s.estimatedDuration ?? 30),
  }));
}
