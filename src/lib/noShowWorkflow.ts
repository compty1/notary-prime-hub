/**
 * SVC-132: No-show workflow
 * Status management, fee logic, and notification triggers for missed appointments
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NO_SHOW_FEE = 25.00; // Standard no-show fee
export const NO_SHOW_GRACE_MINUTES = 15; // Minutes past scheduled time before marking no-show

export async function markAsNoShow(appointmentId: string, reason?: string): Promise<boolean> {
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "no_show" as any,
      admin_notes: reason ? `No-show: ${reason}` : "Marked as no-show",
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (error) {
    toast.error("Failed to mark as no-show");
    return false;
  }

  // Log audit event
  await supabase.from("audit_log").insert({
    action: "appointment.no_show",
    entity_type: "appointment",
    entity_id: appointmentId,
    details: { reason, fee: NO_SHOW_FEE },
  });

  toast.success("Appointment marked as no-show");
  return true;
}

export function isEligibleForNoShow(scheduledDate: string, scheduledTime: string): boolean {
  const scheduled = new Date(`${scheduledDate}T${scheduledTime}`);
  const graceEnd = new Date(scheduled.getTime() + NO_SHOW_GRACE_MINUTES * 60 * 1000);
  return new Date() > graceEnd;
}
