import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

const CANCELLATION_REASONS = [
  "Schedule conflict",
  "No longer needed",
  "Found another provider",
  "Cost concerns",
  "Document not ready",
  "Personal emergency",
  "Other",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  onCancelled?: () => void;
}

export function AppointmentCancellationDialog({ open, onOpenChange, appointmentId, onCancelled }: Props) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!reason) { toast.error("Please select a cancellation reason"); return; }
    setSubmitting(true);
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        admin_notes: `Cancelled: ${reason}${notes ? ` — ${notes}` : ""}`,
      })
      .eq("id", appointmentId);

    if (error) {
      toast.error("Failed to cancel appointment");
    } else {
      toast.success("Appointment cancelled");
      logAuditEvent("appointment_cancelled", { entityType: "appointments", entityId: appointmentId, details: { reason } });
      onCancelled?.();
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Cancel Appointment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reason for cancellation</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Additional notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." rows={3} />
          </div>
          <p className="text-xs text-muted-foreground">
            Note: Cancellations within 2 hours of the appointment may incur a travel fee per our cancellation policy.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Keep Appointment</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={submitting}>
            {submitting ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
