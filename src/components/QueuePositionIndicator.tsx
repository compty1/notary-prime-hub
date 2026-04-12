import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface QueuePositionIndicatorProps {
  appointmentId: string;
  scheduledDate: string;
}

export function QueuePositionIndicator({ appointmentId, scheduledDate }: QueuePositionIndicatorProps) {
  const [position, setPosition] = useState<number | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchQueue = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_time")
        .eq("scheduled_date", scheduledDate)
        .in("status", ["pending", "confirmed"])
        .order("scheduled_time", { ascending: true });

      if (!data) return;
      setTotal(data.length);
      const idx = data.findIndex(a => a.id === appointmentId);
      setPosition(idx >= 0 ? idx + 1 : null);
    };

    if (appointmentId && scheduledDate) fetchQueue();
  }, [appointmentId, scheduledDate]);

  if (position === null) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span>Queue position:</span>
      <Badge variant="secondary">{position} of {total}</Badge>
      {position === 1 && (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Next</Badge>
      )}
    </div>
  );
}
