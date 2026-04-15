/**
 * OPS-001: Notary Work Queue
 * Assigned jobs with accept/decline, status changes, and notes for notary role.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";

export function NotaryWorkQueue() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["notary-work-queue", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("id, service_type, status, scheduled_date, scheduled_time, confirmation_number, notes, admin_notes, notarization_type, signer_count")
        .eq("notary_id", user.id)
        .in("status", ["scheduled", "in_progress" as any, "confirmed"])
        .order("scheduled_date", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      const update: Record<string, unknown> = { status };
      if (note) update.admin_notes = note;
      const { error } = await supabase.from("appointments").update(update as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notary-work-queue"] });
      toast.success("Job updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!assignments?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2" />
          No assigned jobs in your queue
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Your Work Queue ({assignments.length})</h2>
      {assignments.map(job => (
        <Card key={job.id}>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {job.service_type}
                {job.notarization_type && (
                  <Badge variant="secondary" className="text-[10px]">{job.notarization_type}</Badge>
                )}
              </div>
              <Badge variant="outline">{job.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{job.scheduled_date} @ {job.scheduled_time}</span>
              <span>Ref: {job.confirmation_number || job.id.slice(0, 8)}</span>
              {job.signer_count && <span>{job.signer_count} signer(s)</span>}
            </div>
            {job.notes && <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{job.notes}</p>}
            <Textarea
              placeholder="Add notes..."
              value={noteMap[job.id] || ""}
              onChange={e => setNoteMap(prev => ({ ...prev, [job.id]: e.target.value }))}
              className="text-xs min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateStatus.mutate({ id: job.id, status: "in_progress", note: noteMap[job.id] })}
                disabled={job.status === "in_session"}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus.mutate({ id: job.id, status: "completed", note: noteMap[job.id] })}
              >
                Complete
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatus.mutate({ id: job.id, status: "cancelled", note: noteMap[job.id] })}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
