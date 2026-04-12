/**
 * AP-004+: Hook to manage appointment pipeline status changes
 * with proper notifications and audit logging.
 */
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/auditLogger";
import { useToast } from "@/hooks/use-toast";

export type AppointmentAction = "confirm" | "complete" | "cancel" | "reschedule" | "reassign" | "no_show";

interface ActionResult {
  success: boolean;
  error?: string;
}

const STATUS_MAP: Record<AppointmentAction, string> = {
  confirm: "confirmed",
  complete: "completed",
  cancel: "cancelled",
  reschedule: "rescheduled",
  reassign: "confirmed",
  no_show: "no_show",
};

export function useAppointmentActions() {
  const { toast } = useToast();

  const performAction = async (
    appointmentId: string,
    action: AppointmentAction,
    metadata?: Record<string, unknown>
  ): Promise<ActionResult> => {
    try {
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

      // Audit log
      await logAdminAction({
        action: `appointment_${action}`,
        entityType: "appointment",
        entityId: appointmentId,
        details: { newStatus, ...metadata },
      });

      // Trigger email notification via edge function
      try {
        await supabase.functions.invoke("send-appointment-emails", {
          body: {
            appointment_id: appointmentId,
            email_type: `status_${newStatus}`,
          },
        });
      } catch {
        // Email failure shouldn't block the action
        console.warn("Failed to send appointment email notification");
      }

      toast({
        title: `Appointment ${action}ed`,
        description: `Status updated to ${newStatus}.`,
      });

      return { success: true };
    } catch (err: any) {
      toast({
        title: "Action failed",
        description: err.message,
        variant: "destructive",
      });
      return { success: false, error: err.message };
    }
  };

  return { performAction };
}
