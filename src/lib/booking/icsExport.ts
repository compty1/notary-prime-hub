/**
 * Sprint C (C-66..75): Calendar export (.ics) for confirmation page
 * Generates RFC 5545 iCalendar files for appointment confirmation downloads.
 */

interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** HH:MM 24-hour */
  time: string;
  /** Duration minutes (default 60) */
  durationMinutes?: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toIcsDate(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(event: IcsEvent): string {
  const start = toIcsDate(event.date, event.time);
  const durationMin = event.durationMinutes ?? 60;
  const [y, m, d] = event.date.split("-").map(Number);
  const [hh, mm] = event.time.split(":").map(Number);
  const endDate = new Date(y, m - 1, d, hh, mm + durationMin);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Notar Notary Services//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escape(event.title)}`,
    event.description ? `DESCRIPTION:${escape(event.description)}` : "",
    event.location ? `LOCATION:${escape(event.location)}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcs(event: IcsEvent, filename = "appointment.ics"): void {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
