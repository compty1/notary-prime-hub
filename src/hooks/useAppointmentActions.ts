/**
 * Appointment lifecycle hook. Captures before/after snapshots and routes
 * every state change through `recordAppointmentEvent` so audit + email +
 * admin notifications stay in sync.
 */
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { recordAppointmentEvent, type AppointmentEventType } from "@/lib/bookingLifecycle";

export type AppointmentAction = "confirm" | "complete" | "cancel" | "reschedule" | "reassign" | "no_show";

interface ActionResult {
  success: boolean;
  error?: string;
}

const STATUS_MAP: Record<AppointmentAction, string> = {
  confirm: "confirmed",
  complete: "completed",
  cancel: "cancelled",
  reschedule: "scheduled",
  reassign: "confirmed",
  no_show: "no_show",
};

const EVENT_TYPE_MAP: Record<AppointmentAction, AppointmentEventType> = {
  confirm: "appointment_confirmed",
  complete: "appointment_completed",
  cancel: "appointment_cancelled",
  reschedule: "appointment_rescheduled",
  reassign: "appointment_reassigned",
  no_show: "appointment_no_show",
};

export function useAppointmentActions() {
  const { toast } = useToast();

  const performAction = async (
    appointmentId: string,
    action: AppointmentAction,
    metadata?: Record<string, unknown>
  ): Promise<ActionResult> => {
    try {
      // Capture "before" snapshot for the audit trail
      const { data: before } = await supabase
        .from("appointments")
        .select("status, scheduled_date, scheduled_time, notary_id, admin_notes")
        .eq("id", appointmentId)
        .maybeSingle();

      const newStatus = STATUS_MAP[action];
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (action === "reassign" && metadata?.notaryId) {
        updateData.notary_id = metadata.notaryId;
      }
      if (action === "cancel" && metadata?.reason) {
        updateData.admin_notes = metadata.reason;
      }
      if (action === "reschedule") {
        updateData.rescheduled_from = appointmentId;
        if (metadata?.newDate) updateData.scheduled_date = metadata.newDate;
        if (metadata?.newTime) updateData.scheduled_time = metadata.newTime;
      }

      const { error } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;

      await recordAppointmentEvent({
        type: EVENT_TYPE_MAP[action],
        appointmentId,
        before: before ?? null,
        after: { ...before, ...updateData },
        reason: (metadata?.reason as string) ?? undefined,
        actor: "admin",
      });

      toast({
        title: `Appointment ${action}ed`,
        description: `Status updated to ${newStatus}.`,
      });

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast({ title: "Action failed", description: message, variant: "destructive" });
      return { success: false, error: message };
    }
  };

  return { performAction };
}
