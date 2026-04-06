import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";

interface CalendarDownloadProps {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or HH:MM:SS
  serviceType: string;
  notarizationType: "in_person" | "ron";
  location?: string;
  durationMinutes?: number;
  className?: string;
}

export function CalendarDownload({
  date, time, serviceType, notarizationType,
  location, durationMinutes = 30, className,
}: CalendarDownloadProps) {
  const handleDownload = () => {
    const dtStart = `${date.replace(/-/g, "")}T${time.replace(/:/g, "").substring(0, 4)}00`;
    const startDate = new Date(`${date}T${time}`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const dtEnd = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const loc = location || (notarizationType === "ron" ? "Online — Video Call" : "TBD");
    const desc = notarizationType === "ron"
      ? BRAND.calendarDescription("ron")
      : BRAND.calendarDescription("in_person");

    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:${BRAND.calendarProdId}`,
      "BEGIN:VTIMEZONE", "TZID:America/New_York",
      "BEGIN:STANDARD", "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "TZOFFSETFROM:-0400", "TZOFFSETTO:-0500", "TZNAME:EST", "END:STANDARD",
      "BEGIN:DAYLIGHT", "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0400", "TZNAME:EDT", "END:DAYLIGHT",
      "END:VTIMEZONE",
      "BEGIN:VEVENT", `DTSTART;TZID=America/New_York:${dtStart}`, `DTEND;TZID=America/New_York:${dtEnd.replace(/Z$/, "")}`,
      `SUMMARY:Notarization — ${serviceType}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${loc}`,
      "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notarization-${date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleDownload} variant="outline" className={className}>
      <Download className="mr-2 h-4 w-4" /> Add to Calendar
    </Button>
  );
}
