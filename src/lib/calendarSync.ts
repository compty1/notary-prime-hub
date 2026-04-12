/**
 * SVC-129: ICS Calendar File Generator
 * Creates .ics files for appointment bookings and Google Calendar deep links.
 */

export function generateICSContent(event: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  organizer?: string;
}): string {
  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Notar//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    event.location ? `LOCATION:${event.location}` : "",
    event.organizer ? `ORGANIZER:mailto:${event.organizer}` : "",
    `UID:${crypto.randomUUID()}@notar.com`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadICS(event: Parameters<typeof generateICSContent>[0]) {
  const content = generateICSContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(event: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}): string {
  const formatGCal = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    dates: `${formatGCal(event.startDate)}/${formatGCal(event.endDate)}`,
    ...(event.location ? { location: event.location } : {}),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
