import { supabase } from "@/integrations/supabase/client";
import { differenceInHours, parseISO, addHours, format } from "date-fns";

// Reminder intervals in hours before appointment
export const REMINDER_SCHEDULE = [48, 24, 2] as const;

export type ReminderType = "48h" | "24h" | "2h";

/**
 * Check which reminders are due for upcoming appointments.
 * Used by admin dashboard to trigger notifications.
 */
export async function getUpcomingReminders(): Promise<{
  appointmentId: string;
  clientId: string;
  scheduledDate: string;
  scheduledTime: string;
  serviceType: string;
  reminderType: ReminderType;
}[]> {
  const now = new Date();
  const cutoff = addHours(now, 49); // look ahead ~49h to catch 48h reminders

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, client_id, scheduled_date, scheduled_time, service_type")
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_date", format(now, "yyyy-MM-dd"))
    .lte("scheduled_date", format(cutoff, "yyyy-MM-dd"));

  if (!appointments) return [];

  // Check which reminders have already been sent
  const { data: sentEmails } = await supabase
    .from("appointment_emails")
    .select("appointment_id, email_type")
    .in("appointment_id", appointments.map(a => a.id));

  const sentSet = new Set((sentEmails || []).map(e => `${e.appointment_id}:${e.email_type}`));

  const due: ReturnType<typeof getUpcomingReminders> extends Promise<infer T> ? T : never = [];

  appointments.forEach(appt => {
    const apptTime = parseISO(`${appt.scheduled_date}T${appt.scheduled_time}`);
    const hoursUntil = differenceInHours(apptTime, now);

    REMINDER_SCHEDULE.forEach(hours => {
      const type: ReminderType = `${hours}h` as ReminderType;
      if (hoursUntil <= hours && hoursUntil > (hours === 2 ? 0 : hours - 24)) {
        if (!sentSet.has(`${appt.id}:reminder_${type}`)) {
          due.push({
            appointmentId: appt.id,
            clientId: appt.client_id,
            scheduledDate: appt.scheduled_date,
            scheduledTime: appt.scheduled_time,
            serviceType: appt.service_type,
            reminderType: type,
          });
        }
      }
    });
  });

  return due;
}

/**
 * Mark a reminder as sent
 */
export async function markReminderSent(appointmentId: string, reminderType: ReminderType) {
  await supabase.from("appointment_emails").insert({
    appointment_id: appointmentId,
    email_type: `reminder_${reminderType}`,
  });
}
