import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared date formatting utility (Bugs 78, 157, 158).
 * Prevents 6+ duplicate implementations across admin pages.
 */
export function formatDate(dateStr: string, options?: { includeYear?: boolean; includeWeekday?: boolean }): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  if (options?.includeYear !== false) opts.year = "numeric";
  if (options?.includeWeekday) opts.weekday = "short";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", opts);
}

/**
 * Shared time formatting utility (Bugs 78, 157, 158).
 * Converts "HH:MM" 24h string to "H:MM AM/PM".
 */
export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  return `${displayHour}:${m} ${period}`;
}

/**
 * Password strength scorer (Bug 91).
 * Extracted from SignUp.tsx for reuse.
 */
export function getPasswordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
