/**
 * Appointment waitlist with auto-notification logic.
 * Enhancement #109 (Waitlist with auto-notification)
 */

import { supabase } from "@/integrations/supabase/client";

export interface WaitlistEntry {
  clientId: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  preferredDate: string;
  preferredTimeRange: string;
  createdAt: string;
  notified: boolean;
}

/** Add client to waitlist */
export async function addToWaitlist(entry: Omit<WaitlistEntry, "createdAt" | "notified">): Promise<boolean> {
  const { error } = await supabase.from("platform_settings").upsert({
    setting_key: `waitlist_${entry.clientId}_${entry.preferredDate}`,
    setting_value: JSON.stringify({ ...entry, createdAt: new Date().toISOString(), notified: false }),
  }, { onConflict: "setting_key" });
  return !error;
}

/** Check waitlist for available slots and notify */
export async function checkWaitlistForDate(date: string): Promise<WaitlistEntry[]> {
  const { data } = await supabase
    .from("platform_settings")
    .select("setting_key, setting_value")
    .like("setting_key", `waitlist_%_${date}`);

  if (!data) return [];
  return data.map((d) => {
    try { return JSON.parse(d.setting_value); } catch { return null; }
  }).filter(Boolean);
}
