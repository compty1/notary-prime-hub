/**
 * SVC-131: Timezone display utility
 * Shows localized time alongside Eastern Time for bookings.
 */
import { Clock, Globe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TimezoneDisplayProps {
  dateTime: string; // ISO or "YYYY-MM-DDThh:mm"
  showLocal?: boolean;
}

export function TimezoneDisplay({ dateTime, showLocal = true }: TimezoneDisplayProps) {
  const dt = new Date(dateTime);
  if (isNaN(dt.getTime())) return null;

  const etFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isEastern = localTz.includes("New_York") || localTz.includes("America/Detroit");

  const localFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });

  const etTime = etFormatter.format(dt);
  const localTime = localFormatter.format(dt);

  if (isEastern || !showLocal) {
    return (
      <span className="text-sm flex items-center gap-1">
        <Clock className="h-3 w-3 text-muted-foreground" /> {etTime} ET
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-sm flex items-center gap-1 cursor-help">
          <Clock className="h-3 w-3 text-muted-foreground" /> {etTime} ET
          <Globe className="h-3 w-3 text-muted-foreground ml-1" />
          <span className="text-muted-foreground">({localTime})</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Your local time: {localTime}</p>
        <p className="text-xs text-muted-foreground">All appointments are in Eastern Time</p>
      </TooltipContent>
    </Tooltip>
  );
}
