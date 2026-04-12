/**
 * User notification preferences management.
 * Category G items (email/SMS preferences)
 */

import { supabase } from "@/integrations/supabase/client";

export interface NotificationPreferences {
  email_appointment_reminders: boolean;
  email_status_updates: boolean;
  email_marketing: boolean;
  email_document_ready: boolean;
  email_review_requests: boolean;
  sms_appointment_reminders: boolean;
  sms_status_updates: boolean;
}

const DEFAULTS: NotificationPreferences = {
  email_appointment_reminders: true,
  email_status_updates: true,
  email_marketing: false,
  email_document_ready: true,
  email_review_requests: true,
  sms_appointment_reminders: false,
  sms_status_updates: false,
};

/** Load notification preferences from profile metadata */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.notification_preferences) return { ...DEFAULTS };
  
  const stored = typeof data.notification_preferences === "object" ? data.notification_preferences : {};
  return { ...DEFAULTS, ...stored } as NotificationPreferences;
}

/** Save notification preferences */
export async function saveNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const current = await getNotificationPreferences(userId);
  const merged = { ...current, ...prefs };
  
  await supabase
    .from("profiles")
    .update({ notification_preferences: merged as any })
    .eq("user_id", userId);
}

/** Check if a specific notification type is enabled for a user */
export async function isNotificationEnabled(
  userId: string,
  type: keyof NotificationPreferences
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);
  return prefs[type] ?? DEFAULTS[type] ?? true;
}
