import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addMinutes, isWithinInterval } from "date-fns";

interface Conflict {
  existingId: string;
  existingTime: string;
  existingService: string;
}

interface AppointmentConflictDetectorProps {
  date: string;
  time: string;
  durationMinutes?: number;
  excludeId?: string;
}

export function AppointmentConflictDetector({ date, time, durationMinutes = 60, excludeId }: AppointmentConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date || !time) { setConflicts([]); return; }

    const check = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("appointments")
          .select("id, scheduled_time, service_type")
          .eq("scheduled_date", date)
          .in("status", ["pending", "confirmed"]);

        if (excludeId) query = query.neq("id", excludeId);

        const { data } = await query;
        if (!data) { setConflicts([]); return; }

        const newStart = parseISO(`${date}T${time}`);
        const newEnd = addMinutes(newStart, durationMinutes);

        const found = data.filter(appt => {
          const existStart = parseISO(`${date}T${appt.scheduled_time}`);
          const existEnd = addMinutes(existStart, 60);
          return (
            isWithinInterval(newStart, { start: existStart, end: existEnd }) ||
            isWithinInterval(existStart, { start: newStart, end: newEnd })
          );
        }).map(appt => ({
          existingId: appt.id,
          existingTime: appt.scheduled_time,
          existingService: appt.service_type,
        }));

        setConflicts(found);
      } catch {
        setConflicts([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(check, 300);
    return () => clearTimeout(debounce);
  }, [date, time, durationMinutes, excludeId]);

  if (conflicts.length === 0) return null;

  return (
    <Alert variant="destructive" className="mt-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Scheduling Conflict Detected</AlertTitle>
      <AlertDescription>
        <p className="text-sm mb-2">This time slot overlaps with {conflicts.length} existing appointment(s):</p>
        <div className="space-y-1">
          {conflicts.map(c => (
            <div key={c.existingId} className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3" />
              <span>{c.existingTime}</span>
              <Badge variant="outline" className="text-[10px]">{c.existingService}</Badge>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
