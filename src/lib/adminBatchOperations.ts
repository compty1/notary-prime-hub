import { supabase } from "@/integrations/supabase/client";

/**
 * Batch operations for admin efficiency.
 */

/** Bulk archive completed appointments older than N days */
export async function bulkArchiveOldAppointments(daysOld: number = 90): Promise<number> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from("appointments")
    .update({ admin_notes: "[ARCHIVED]" })
    .eq("status", "completed" as any)
    .lt("created_at", cutoff)
    .is("admin_notes", null)
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/** Bulk tag clients by their appointment count */
export async function identifyTopClients(minAppointments: number = 5): Promise<string[]> {
  const { data } = await supabase
    .from("appointments")
    .select("client_id")
    .eq("status", "completed" as any);

  if (!data) return [];

  const counts = new Map<string, number>();
  data.forEach(a => counts.set(a.client_id, (counts.get(a.client_id) ?? 0) + 1));

  return Array.from(counts.entries())
    .filter(([_, count]) => count >= minAppointments)
    .map(([id]) => id);
}

/** Get unlinked documents (no appointment association) */
export async function getOrphanedDocuments(): Promise<{ id: string; fileName: string; uploadedAt: string }[]> {
  const { data } = await supabase
    .from("documents")
    .select("id, file_name, created_at")
    .is("appointment_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map(d => ({
    id: d.id,
    fileName: d.file_name,
    uploadedAt: d.created_at,
  }));
}

/** Generate daily summary stats */
export async function getDailySummary(date: string): Promise<{
  appointments: number;
  completed: number;
  cancelled: number;
  documentsUploaded: number;
  newClients: number;
}> {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const next = nextDay.toISOString().split("T")[0];

  const [appts, completed, cancelled, docs, clients] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", date),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", date).eq("status", "completed" as any),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", date).eq("status", "cancelled" as any),
    supabase.from("documents").select("*", { count: "exact", head: true }).gte("created_at", date).lt("created_at", next),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", date).lt("created_at", next),
  ]);

  return {
    appointments: appts.count ?? 0,
    completed: completed.count ?? 0,
    cancelled: cancelled.count ?? 0,
    documentsUploaded: docs.count ?? 0,
    newClients: clients.count ?? 0,
  };
}
