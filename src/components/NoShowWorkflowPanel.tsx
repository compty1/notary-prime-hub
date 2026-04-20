import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NoShowWorkflowPanelProps {
  appointmentId: string;
  clientId: string;
  onComplete?: () => void;
}

export function NoShowWorkflowPanel({ appointmentId, clientId, onComplete }: NoShowWorkflowPanelProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const noShowFee = 25;

  const handleMarkNoShow = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("appointments").update({
        status: "no_show",
        admin_notes: `No-show. ${notes}`.trim(),
      }).eq("id", appointmentId);
      if (error) throw error;

      // Log audit event
      await supabase.rpc("log_audit_event", {
        _action: "appointment.no_show",
        _entity_type: "appointment",
        _entity_id: appointmentId,
        _details: { client_id: clientId, fee: noShowFee, notes },
      });

      toast.success("Appointment marked as no-show");
      setOpen(false);
      onComplete?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          <AlertTriangle className="mr-1 h-3 w-3" /> Mark No-Show
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as No-Show</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-warning" />
              <span className="font-medium">No-show fee: ${noShowFee}</span>
            </div>
            <p className="text-xs text-muted-foreground">A ${noShowFee} no-show fee will be noted on the client's record.</p>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Attempted contact, reason if known..." rows={3} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={handleMarkNoShow} disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Confirm No-Show"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
