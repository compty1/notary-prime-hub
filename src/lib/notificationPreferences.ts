/**
 * User notification preferences management.
 * Category G items (email/SMS preferences)
 * Stores preferences in platform_settings keyed by user ID.
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

/** Load notification preferences from platform_settings */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from("platform_settings")
    .select("setting_value")
    .eq("setting_key", `notification_prefs_${userId}`)
    .maybeSingle();

  if (!data?.setting_value) return { ...DEFAULTS };

  try {
    const stored = JSON.parse(data.setting_value);
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Save notification preferences */
export async function saveNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const current = await getNotificationPreferences(userId);
  const merged = { ...current, ...prefs };

  await supabase.from("platform_settings").upsert(
    { setting_key: `notification_prefs_${userId}`, setting_value: JSON.stringify(merged) },
    { onConflict: "setting_key" }
  );
}

/** Check if a specific notification type is enabled for a user */
export async function isNotificationEnabled(
  userId: string,
  type: keyof NotificationPreferences
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);
  return prefs[type] ?? DEFAULTS[type] ?? true;
}
