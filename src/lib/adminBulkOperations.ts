/**
 * Admin bulk operation utilities.
 * Category F items (bulk email, SMS, status updates)
 */

import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";

/** Bulk update appointment statuses */
export async function bulkUpdateAppointmentStatus(
  appointmentIds: string[],
  newStatus: string,
  adminNote?: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const id of appointmentIds) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus as any, admin_notes: adminNote || undefined })
      .eq("id", id);

    if (error) {
      failed++;
    } else {
      success++;
    }
  }

  await logAuditEvent("bulk_status_update", {
    entityType: "appointments",
    details: { count: appointmentIds.length, newStatus, success, failed },
  });

  return { success, failed };
}

/** Bulk send email via edge function */
export async function bulkSendEmail(
  recipientIds: string[],
  subject: string,
  body: string,
  templateName = "admin_bulk"
): Promise<{ queued: number; errors: string[] }> {
  const errors: string[] = [];
  let queued = 0;

  // Fetch recipient emails
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, email, full_name")
    .in("user_id", recipientIds);

  if (!profiles) return { queued: 0, errors: ["Failed to fetch recipients"] };

  for (const profile of profiles) {
    if (!profile.email) {
      errors.push(`No email for user ${profile.user_id}`);
      continue;
    }

    const { error } = await supabase.rpc("enqueue_email", {
      queue_name: "email_queue",
      payload: {
        to: profile.email,
        subject,
        html: body.replace(/\{\{name\}\}/g, profile.full_name || "Client"),
        template: templateName,
      } as any,
    });

    if (error) {
      errors.push(`Failed to queue for ${profile.email}: ${error.message}`);
    } else {
      queued++;
    }
  }

  await logAuditEvent("bulk_email_sent", {
    entityType: "email",
    details: { recipientCount: recipientIds.length, queued, errors: errors.length },
  });

  return { queued, errors };
}

/** Bulk archive old records */
export async function bulkArchiveCompletedAppointments(
  olderThanDays: number
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 86400000).toISOString();
  
  const { data } = await supabase
    .from("appointments")
    .update({ status: "archived" as any })
    .in("status", ["completed"] as any)
    .lt("scheduled_date", cutoff.split("T")[0])
    .select("id");

  const count = data?.length || 0;

  if (count > 0) {
    await logAuditEvent("bulk_archive", {
      entityType: "appointments",
      details: { archived: count, olderThanDays },
    });
  }

  return count;
}
