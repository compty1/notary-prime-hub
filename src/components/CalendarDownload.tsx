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
      "BEGIN:VEVENT", `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
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
