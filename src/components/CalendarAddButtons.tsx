/**
 * SVC-129: Calendar add buttons for booking confirmations
 * Downloads .ics or opens Google Calendar link.
 */
import { Button } from "@/components/ui/button";
import { CalendarPlus, Download } from "lucide-react";
import { downloadICS, getGoogleCalendarUrl } from "@/lib/calendarSync";

interface CalendarAddButtonsProps {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export function CalendarAddButtons(props: CalendarAddButtonsProps) {
  const gcalUrl = getGoogleCalendarUrl(props);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => downloadICS(props)}>
        <Download className="mr-1 h-3 w-3" /> Download .ics
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
          <CalendarPlus className="mr-1 h-3 w-3" /> Add to Google Calendar
        </a>
      </Button>
    </div>
  );
}
