/**
 * Date and time validation utilities for Ohio notary compliance (Items 100-115)
 * Enforce scheduling rules, business hours, and blackout periods.
 */

import { format, isAfter, isBefore, isWeekend, addMinutes, parse, differenceInYears, isSameDay } from "date-fns";

/** Ohio business hours for notarization */
export const BUSINESS_HOURS = {
  weekday: { start: "09:00", end: "19:00" },
  saturday: { start: "10:00", end: "16:00" },
  sunday: null, // closed
} as const;

/** After-hours fee threshold */
export const AFTER_HOURS_FEE = 25;

/** Check if a time is within business hours */
export function isWithinBusinessHours(date: Date, time: string): boolean {
  const day = date.getDay();
  if (day === 0) return false; // Sunday
  const hours = day === 6 ? BUSINESS_HOURS.saturday : BUSINESS_HOURS.weekday;
  if (!hours) return false;
  return time >= hours.start && time < hours.end;
}

/** Check if appointment qualifies for after-hours fee */
export function isAfterHours(date: Date, time: string): boolean {
  return !isWithinBusinessHours(date, time);
}

/** Validate a signer's age (must be 18+) */
export function isValidSignerAge(birthDate: Date): boolean {
  return differenceInYears(new Date(), birthDate) >= 18;
}

/** Calculate estimated end time for an appointment */
export function getEstimatedEndTime(startTime: string, durationMinutes: number): string {
  const start = parse(startTime, "HH:mm", new Date());
  const end = addMinutes(start, durationMinutes);
  return format(end, "HH:mm");
}

/** Get available time slots for a given date */
export function getAvailableSlots(date: Date, existingSlots: string[] = [], intervalMinutes = 30): string[] {
  const day = date.getDay();
  if (day === 0) return []; // Sunday
  
  const hours = day === 6 ? BUSINESS_HOURS.saturday : BUSINESS_HOURS.weekday;
  if (!hours) return [];

  const slots: string[] = [];
  let current = parse(hours.start, "HH:mm", date);
  const end = parse(hours.end, "HH:mm", date);

  while (isBefore(current, end)) {
    const timeStr = format(current, "HH:mm");
    if (!existingSlots.includes(timeStr)) {
      slots.push(timeStr);
    }
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

/** Validate that an appointment date is not in the past */
export function isValidAppointmentDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isAfter(date, today) || isSameDay(date, today);
}

/** Format time for display (12-hour format) */
export function formatTimeDisplay(time24: string): string {
  try {
    const parsed = parse(time24, "HH:mm", new Date());
    return format(parsed, "h:mm a");
  } catch {
    return time24;
  }
}

/** Ohio statutory holidays when notarization may be restricted */
export const OHIO_HOLIDAYS_2026 = [
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Day
  "2026-02-16", // Presidents' Day
  "2026-05-25", // Memorial Day
  "2026-07-04", // Independence Day
  "2026-09-07", // Labor Day
  "2026-11-11", // Veterans Day
  "2026-11-26", // Thanksgiving
  "2026-12-25", // Christmas Day
];
