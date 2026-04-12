/**
 * Staff shift scheduling for multi-notary operations.
 * Enhancement #110 (Shift scheduling)
 */

export interface ShiftTemplate {
  name: string;
  startTime: string; // HH:MM
  endTime: string;
  daysOfWeek: number[]; // 0=Sun
}

export const DEFAULT_SHIFTS: ShiftTemplate[] = [
  { name: "Morning", startTime: "08:00", endTime: "12:00", daysOfWeek: [1, 2, 3, 4, 5] },
  { name: "Afternoon", startTime: "12:00", endTime: "17:00", daysOfWeek: [1, 2, 3, 4, 5] },
  { name: "Evening", startTime: "17:00", endTime: "20:00", daysOfWeek: [1, 2, 3, 4] },
  { name: "Saturday", startTime: "09:00", endTime: "14:00", daysOfWeek: [6] },
];

/** Check if a time falls within a shift */
export function isWithinShift(time: string, shift: ShiftTemplate): boolean {
  return time >= shift.startTime && time < shift.endTime;
}

/** Get available shifts for a given date */
export function getShiftsForDate(date: Date, shifts = DEFAULT_SHIFTS): ShiftTemplate[] {
  const dow = date.getDay();
  return shifts.filter((s) => s.daysOfWeek.includes(dow));
}

/** Generate time slots from shift templates */
export function generateSlotsFromShifts(
  date: Date,
  intervalMinutes = 30,
  shifts = DEFAULT_SHIFTS
): string[] {
  const available = getShiftsForDate(date, shifts);
  const slots: string[] = [];

  for (const shift of available) {
    const [startH, startM] = shift.startTime.split(":").map(Number);
    const [endH, endM] = shift.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m < endMinutes; m += intervalMinutes) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
  }

  return slots;
}
