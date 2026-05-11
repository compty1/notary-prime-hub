/**
 * Booking lifecycle helper.
 * Centralizes audit + email + admin-notification side effects for every
 * appointment event (booked, rescheduled, cancelled, confirmed, completed,
 * no_show). One call per state change keeps the audit trail consistent.
 */
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/auditLogger";

export type AppointmentEventType =
  | "appointment_booked"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_confirmed"
  | "appointment_completed"
  | "appointment_no_show"
  | "appointment_reassigned";

interface RecordEventArgs {
  type: AppointmentEventType;
  appointmentId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
  actor?: "client" | "admin" | "notary" | "system";
  /** When false, skip the email side-effect (use for silent admin edits). */
  sendEmail?: boolean;
}

const EMAIL_TYPE_MAP: Record<AppointmentEventType, string | null> = {
  appointment_booked: "status_scheduled",
  appointment_rescheduled: "status_rescheduled",
  appointment_cancelled: "status_cancelled",
  appointment_confirmed: "status_confirmed",
  appointment_completed: "status_completed",
  appointment_no_show: null,
  appointment_reassigned: null,
};

/**
 * Record an appointment lifecycle event:
 *  - audit_log row (visible to admin notifications)
 *  - send-appointment-emails edge function invocation (best-effort)
 */
export async function recordAppointmentEvent(args: RecordEventArgs): Promise<void> {
  const { type, appointmentId, before, after, reason, actor = "system", sendEmail = true } = args;

  // 1. Structured audit entry (also surfaces in useAdminNotifications)
  await logAdminAction({
    action: type,
    entityType: "appointment",
    entityId: appointmentId,
    details: {
      actor,
      reason: reason ?? null,
      before: before ?? null,
      after: after ?? null,
      at: new Date().toISOString(),
    },
  });

  // 2. Email notification (client + admin BCC handled server-side)
  const emailType = EMAIL_TYPE_MAP[type];
  if (sendEmail && emailType) {
    try {
      await supabase.functions.invoke("send-appointment-emails", {
        body: {
          appointment_id: appointmentId,
          email_type: emailType,
          status_change: emailType.replace(/^status_/, ""),
          notify_admin: true,
        },
      });
    } catch (err) {
      console.warn("[bookingLifecycle] email dispatch failed", err);
    }
  }
}
