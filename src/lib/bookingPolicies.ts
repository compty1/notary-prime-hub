/**
 * BK-004: Configurable cancellation policy
 * BK-006: Mobile notary travel fee calculator
 * BK-007: Waitlist manager for full slots
 */

// --- Cancellation Policy ---
export interface CancellationPolicy {
  freeWindowHours: number;
  lateFeePercent: number;
  noShowFeePercent: number;
}

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  freeWindowHours: 24,
  lateFeePercent: 50,
  noShowFeePercent: 100,
};

export function calculateCancellationFee(
  scheduledDate: string,
  scheduledTime: string,
  estimatedPrice: number,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY
): { fee: number; isFree: boolean; reason: string } {
  const appointmentDt = new Date(`${scheduledDate}T${scheduledTime}`);
  const now = new Date();
  const hoursUntil = (appointmentDt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil >= policy.freeWindowHours) {
    return { fee: 0, isFree: true, reason: `Cancellation is free more than ${policy.freeWindowHours} hours before appointment.` };
  }

  if (hoursUntil < 0) {
    const fee = Math.round(estimatedPrice * (policy.noShowFeePercent / 100) * 100) / 100;
    return { fee, isFree: false, reason: `No-show fee of ${policy.noShowFeePercent}% applied.` };
  }

  const fee = Math.round(estimatedPrice * (policy.lateFeePercent / 100) * 100) / 100;
  return { fee, isFree: false, reason: `Late cancellation fee of ${policy.lateFeePercent}% applies (less than ${policy.freeWindowHours}h notice).` };
}

// --- Travel Fee Calculator ---
export interface TravelFeeConfig {
  baseMiles: number;        // Free miles included
  perMileRate: number;      // Per mile after base
  minimumFee: number;       // Minimum travel charge
  maxRadius: number;        // Maximum travel distance
}

export const DEFAULT_TRAVEL_CONFIG: TravelFeeConfig = {
  baseMiles: 15,
  perMileRate: 0.75,
  minimumFee: 25,
  maxRadius: 100,
};

export function calculateTravelFee(
  distanceMiles: number,
  config: TravelFeeConfig = DEFAULT_TRAVEL_CONFIG
): { fee: number; withinRange: boolean; breakdown: string } {
  if (distanceMiles > config.maxRadius) {
    return {
      fee: 0,
      withinRange: false,
      breakdown: `Location is ${distanceMiles.toFixed(1)} miles away, exceeding our ${config.maxRadius}-mile service area.`,
    };
  }

  if (distanceMiles <= config.baseMiles) {
    return { fee: 0, withinRange: true, breakdown: `Within ${config.baseMiles}-mile base radius — no travel fee.` };
  }

  const extraMiles = distanceMiles - config.baseMiles;
  const rawFee = extraMiles * config.perMileRate;
  const fee = Math.max(rawFee, config.minimumFee);

  return {
    fee: Math.round(fee * 100) / 100,
    withinRange: true,
    breakdown: `${extraMiles.toFixed(1)} miles beyond base × $${config.perMileRate}/mi = $${fee.toFixed(2)}`,
  };
}

// --- Waitlist Entry ---
export interface WaitlistEntry {
  clientId: string;
  clientEmail: string;
  clientName: string;
  serviceType: string;
  preferredDate: string;
  preferredTime?: string;
  notaryId?: string;
  addedAt: string;
  notifiedAt?: string;
  status: "waiting" | "notified" | "booked" | "expired";
}

export function createWaitlistEntry(
  clientId: string,
  clientEmail: string,
  clientName: string,
  serviceType: string,
  preferredDate: string,
  preferredTime?: string,
  notaryId?: string
): WaitlistEntry {
  return {
    clientId,
    clientEmail,
    clientName,
    serviceType,
    preferredDate,
    preferredTime,
    notaryId,
    addedAt: new Date().toISOString(),
    status: "waiting",
  };
}

export function shouldExpireWaitlistEntry(entry: WaitlistEntry): boolean {
  const preferredDt = new Date(entry.preferredDate);
  return preferredDt < new Date();
}
