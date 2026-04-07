import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, RefreshCw, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function GoogleCalendarWidget() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data: calStatus, isLoading } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
          body: { action: "status" },
        });
        if (error) return { connected: false, error: error.message, calendar: null };
        return data as { connected: boolean; calendar?: { id: string; summary: string } | null; error?: string };
      } catch {
        return { connected: false, error: "Failed to check status", calendar: null };
      }
    },
    staleTime: 60_000,
  });

  const syncAppointments = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Fetch upcoming appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, scheduled_date, scheduled_time, service_type, location, notes, status, confirmation_number")
        .in("status", ["scheduled", "confirmed"])
        .gte("scheduled_date", now.toISOString().split("T")[0])
        .lte("scheduled_date", future.toISOString().split("T")[0])
        .limit(50);

      if (!appointments?.length) {
        toast({ title: "No appointments to sync", description: "No upcoming appointments found." });
        return;
      }

      let synced = 0;
      for (const appt of appointments) {
        const startDate = `${appt.scheduled_date}T${appt.scheduled_time}:00`;
        const endTime = new Date(new Date(startDate).getTime() + 60 * 60 * 1000).toISOString();

        const { data } = await supabase.functions.invoke("google-calendar-sync", {
          body: {
            action: "create_event",
            summary: `Notarization: ${appt.service_type} (${appt.confirmation_number || appt.id.slice(0, 8)})`,
            description: `Service: ${appt.service_type}\nStatus: ${appt.status}\n${appt.notes || ""}`,
            start: startDate,
            end: endTime,
            location: appt.location || "Remote (RON)",
          },
        });
        if (data?.event) synced++;
      }

      return synced;
    },
    onSuccess: (count) => {
      setSyncing(false);
      toast({ title: "Calendar synced", description: `${count} appointments synced to Google Calendar.` });
      qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
    },
    onError: (e: Error) => {
      setSyncing(false);
      toast({ title: "Sync failed", description: e.message, variant: "destructive" });
    },
  });

  const connected = calStatus?.connected ?? false;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-sans flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Google Calendar
        </CardTitle>
        <Badge variant={connected ? "default" : "secondary"} className="text-[10px]">
          {isLoading ? "Checking..." : connected ? "Connected" : "Not Connected"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Checking connection...
          </div>
        ) : connected ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">{calStatus?.calendar?.summary || "Primary Calendar"}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => syncAppointments.mutate()}
              disabled={syncing}
            >
              {syncing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
              Sync Appointments
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {calStatus?.error || "Calendar credentials not configured"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure Google Calendar API credentials in your platform settings to enable appointment syncing.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
