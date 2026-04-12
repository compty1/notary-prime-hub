/**
 * Change management log — tracks platform changes.
 * Enhancement #88 (Change management log)
 */

import { supabase } from "@/integrations/supabase/client";

export interface ChangeLogEntry {
  id: string;
  date: string;
  category: "feature" | "bugfix" | "security" | "compliance" | "infrastructure";
  title: string;
  description: string;
  impactLevel: "low" | "medium" | "high";
  author?: string;
}

/** Fetch recent change log entries from platform_settings */
export async function getChangeLog(): Promise<ChangeLogEntry[]> {
  const { data } = await supabase
    .from("platform_settings")
    .select("setting_value")
    .eq("setting_key", "change_log")
    .maybeSingle();

  if (!data?.setting_value) return [];

  try {
    return JSON.parse(data.setting_value);
  } catch {
    return [];
  }
}

/** Add a new change log entry */
export async function addChangeLogEntry(entry: Omit<ChangeLogEntry, "id" | "date">): Promise<void> {
  const current = await getChangeLog();
  const newEntry: ChangeLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };

  current.unshift(newEntry);
  // Keep last 200 entries
  const trimmed = current.slice(0, 200);

  await supabase.from("platform_settings").upsert(
    { setting_key: "change_log", setting_value: JSON.stringify(trimmed) },
    { onConflict: "setting_key" }
  );
}
