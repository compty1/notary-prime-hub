import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventClickArg, DateSelectArg } from "@fullcalendar/core";

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO or "YYYY-MM-DDTHH:mm"
  end?: string;
  color?: string;
  extendedProps?: Record<string, any>;
}

interface FullCalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (eventId: string, extendedProps?: Record<string, any>) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  readOnly?: boolean;
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
  height?: string | number;
}

export default function FullCalendarView({
  events,
  onEventClick,
  onDateSelect,
  readOnly = false,
  initialView = "dayGridMonth",
  height = "auto",
}: FullCalendarViewProps) {
  const calendarEvents: EventInput[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: e.color || "hsl(var(--primary))",
        borderColor: e.color || "hsl(var(--primary))",
        extendedProps: e.extendedProps,
      })),
    [events]
  );

  const handleEventClick = (info: EventClickArg) => {
    onEventClick?.(info.event.id, info.event.extendedProps);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    if (!readOnly) {
      onDateSelect?.(info.start, info.end);
    }
  };

  return (
    <div className="fc-wrapper rounded-lg border border-border bg-card p-2 text-foreground [&_.fc]:text-foreground [&_.fc-toolbar-title]:text-base [&_.fc-toolbar-title]:font-semibold [&_.fc-button]:!bg-primary [&_.fc-button]:!border-primary [&_.fc-button]:!text-primary-foreground [&_.fc-button]:text-xs [&_.fc-button]:rounded-md [&_.fc-button-active]:!bg-primary/80 [&_.fc-button:hover]:!bg-primary/90 [&_.fc-col-header-cell]:bg-muted/50 [&_.fc-col-header-cell]:text-xs [&_.fc-col-header-cell]:font-medium [&_.fc-daygrid-day-number]:text-xs [&_.fc-daygrid-day-number]:text-muted-foreground [&_.fc-day-today]:!bg-primary/5 [&_.fc-event]:cursor-pointer [&_.fc-event]:text-xs [&_.fc-event]:rounded-sm [&_.fc-scrollgrid]:border-border [&_.fc-theme-standard_td]:border-border [&_.fc-theme-standard_th]:border-border [&_table]:border-border">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={calendarEvents}
        eventClick={handleEventClick}
        selectable={!readOnly}
        select={handleDateSelect}
        editable={false}
        height={height}
        dayMaxEvents={3}
        nowIndicator
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
      />
    </div>
  );
}
