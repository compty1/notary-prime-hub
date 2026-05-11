/**
 * Admin-facing appointment reschedule dialog.
 * Uses useAppointmentActions which writes via the validated state machine
 * and emits an audit log + email notification.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarClock } from "lucide-react";
import { useAppointmentActions } from "@/hooks/useAppointmentActions";

interface Props {
  appointment: { id: string; scheduled_date?: string; scheduled_time?: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled?: () => void;
}

export function AppointmentRescheduleDialog({ appointment, open, onOpenChange, onRescheduled }: Props) {
  const { performAction } = useAppointmentActions();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setDate(appointment.scheduled_date || "");
      setTime(appointment.scheduled_time || "");
      setReason("");
    }
  }, [appointment]);

  const handleSubmit = async () => {
    if (!appointment || !date || !time) return;
    setSaving(true);
    const result = await performAction(appointment.id, "reschedule", {
      newDate: date,
      newTime: time,
      reason,
    });
    setSaving(false);
    if (result.success) {
      onRescheduled?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" /> Reschedule Appointment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="resched-date">New Date</Label>
              <Input
                id="resched-date"
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="resched-time">New Time</Label>
              <Input
                id="resched-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="resched-reason">Reason (optional)</Label>
            <Textarea
              id="resched-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Internal note for the audit trail..."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The client will be notified by email. The original slot will be released for booking.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !date || !time}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
