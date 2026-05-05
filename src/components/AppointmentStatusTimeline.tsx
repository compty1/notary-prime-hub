/**
 * Renders the status-change history for a single appointment.
 * Shows: timestamps, who changed it, transition (from -> to), and notes.
 * Includes a quick-add note input that writes a synthetic history entry.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Loader2,
  ArrowRight,
  StickyNote,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { appointmentStatusColors } from "@/lib/statusColors";

interface HistoryRow {
  id: string;
  appointment_id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  source: string | null;
  changed_by: string | null;
  created_at: string;
  actor_name?: string | null;
}

interface AppointmentStatusTimelineProps {
  appointmentId: string;
  /** Show the inline "add note" form */
  allowAddNote?: boolean;
}

export function AppointmentStatusTimeline({
  appointmentId,
  allowAddNote = true,
}: AppointmentStatusTimelineProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointment_status_history")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({
        title: "Failed to load timeline",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const list = (data || []) as HistoryRow[];
    const userIds = Array.from(
      new Set(list.map((r) => r.changed_by).filter(Boolean) as string[]),
    );
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const map = new Map(
        (profiles || []).map((p: any) => [p.user_id, p.full_name || p.email]),
      );
      list.forEach((r) => {
        r.actor_name = r.changed_by ? map.get(r.changed_by) || null : null;
      });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`appt-history-${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointment_status_history",
          filter: `appointment_id=eq.${appointmentId}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const addNote = async () => {
    if (!note.trim() || !user) return;
    setSaving(true);
    // Pull current status to satisfy NOT NULL on to_status
    const { data: appt } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", appointmentId)
      .single();
    const currentStatus = (appt?.status as string) || "note";
    const { error } = await supabase.from("appointment_status_history").insert({
      appointment_id: appointmentId,
      from_status: currentStatus,
      to_status: currentStatus,
      note: note.trim(),
      source: "note",
      changed_by: user.id,
    });
    if (error) {
      toast({ title: "Could not save note", description: error.message, variant: "destructive" });
    } else {
      setNote("");
      toast({ title: "Note added to timeline" });
      load();
    }
    setSaving(false);
  };

  const statusColor = (s: string) =>
    (appointmentStatusColors as Record<string, string>)[s] ||
    "bg-muted text-muted-foreground";

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" /> Status Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allowAddNote && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <label className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <StickyNote className="h-3.5 w-3.5" /> Add timeline note
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., KBA email sent to signer; awaiting response."
              rows={2}
              maxLength={500}
            />
            <Button size="sm" onClick={addNote} disabled={!note.trim() || saving}>
              {saving ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1 h-3.5 w-3.5" />
              )}
              Add note
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No status changes recorded yet.
          </p>
        ) : (
          <ScrollArea className="h-[360px] pr-3">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {rows.map((r) => {
                const isNote = r.source === "note" && r.from_status === r.to_status;
                return (
                  <li key={r.id} className="relative">
                    <span
                      className={`absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background ${
                        isNote ? "bg-warning" : "bg-primary"
                      }`}
                      aria-hidden
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        {isNote ? (
                          <Badge variant="outline" className="text-[10px]">
                            <StickyNote className="mr-1 h-2.5 w-2.5" /> Note
                          </Badge>
                        ) : (
                          <>
                            {r.from_status ? (
                              <Badge className={`${statusColor(r.from_status)} text-[10px]`}>
                                {r.from_status}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                created
                              </Badge>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge className={`${statusColor(r.to_status)} text-[10px]`}>
                              {r.to_status}
                            </Badge>
                          </>
                        )}
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {format(new Date(r.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      {r.note && (
                        <p className="rounded-md bg-muted/40 px-2 py-1 text-xs text-foreground">
                          {r.note}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {r.actor_name ? `by ${r.actor_name}` : "system"} · {r.source || "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default AppointmentStatusTimeline;
