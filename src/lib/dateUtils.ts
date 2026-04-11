/**
 * CODE-001: Standardized date formatting utilities
 * All date display in the app should use these functions for consistency.
 */
import { format, parseISO, isValid } from "date-fns";

/** Format a date string or Date object to "Apr 11, 2026" */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) ? format(d, "MMM d, yyyy") : "—";
}

/** Format a time string or Date to "3:43 PM ET" */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) ? `${format(d, "h:mm a")} ET` : "—";
}

/** Format to "Apr 11, 2026 at 3:43 PM ET" */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) ? `${format(d, "MMM d, yyyy")} at ${format(d, "h:mm a")} ET` : "—";
}

/** Parse an appointment date string (YYYY-MM-DD) to a Date */
export function parseAppointmentDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/** Convert a Date to ISO date string (YYYY-MM-DD) */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Format currency with $ sign */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}
