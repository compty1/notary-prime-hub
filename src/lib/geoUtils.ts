/**
 * Haversine distance calculator and after-hours detection.
 * Used by BookAppointment for service area validation and travel fee estimation.
 */

const R = 3958.8; // Earth radius in miles

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns true if the selected time is outside standard business hours (9am-6pm ET).
 */
export function isAfterHours(timeStr: string): boolean {
  if (!timeStr) return false;
  const [h] = timeStr.split(":").map(Number);
  return h < 9 || h >= 18;
}

/**
 * Returns the after-hours fee tier based on time.
 * Standard: 9am-6pm = $0
 * Evening: 6pm-10pm = after_hours_fee (default $25)
 * Emergency: 10pm-9am = after_hours_fee * 3 (default $75)
 */
export function getAfterHoursFee(timeStr: string, baseFee: number): number {
  if (!timeStr) return 0;
  const [h] = timeStr.split(":").map(Number);
  if (h >= 9 && h < 18) return 0;
  if (h >= 18 && h < 22) return baseFee;
  return baseFee * 3; // emergency hours
}

/** Default office coordinates (Columbus, OH) */
export const DEFAULT_OFFICE_LAT = 39.9612;
export const DEFAULT_OFFICE_LON = -82.9988;
