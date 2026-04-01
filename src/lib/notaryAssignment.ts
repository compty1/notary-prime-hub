import { supabase } from "@/integrations/supabase/client";

interface NotaryCandidate {
  userId: string;
  name: string;
  activeCount: number;
  score: number;
}

/**
 * Notary Assignment Algorithm
 * Scores notaries based on availability and current workload.
 * Lower active appointment count = higher score.
 */
export async function findBestNotary(
  scheduledDate: string,
  scheduledTime: string
): Promise<NotaryCandidate | null> {
  // 1. Get all notary user IDs
  const { data: notaryRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "notary");

  if (!notaryRoles || notaryRoles.length === 0) return null;

  const notaryIds = notaryRoles.map((r) => r.user_id);

  // 2. Get profiles for names
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .in("user_id", notaryIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p.full_name || p.email || "Unknown"])
  );

  // 3. Check who is NOT already booked at this date/time
  const { data: conflicting } = await supabase
    .from("appointments")
    .select("notary_id")
    .eq("scheduled_date", scheduledDate)
    .eq("scheduled_time", scheduledTime)
    .not("status", "in", '("cancelled","no_show")')
    .not("notary_id", "is", null);

  const busyIds = new Set((conflicting || []).map((a) => a.notary_id));
  const available = notaryIds.filter((id) => !busyIds.has(id));

  if (available.length === 0) return null;

  // 4. Count active appointments per available notary (workload)
  const { data: activeAppts } = await supabase
    .from("appointments")
    .select("notary_id")
    .in("notary_id", available)
    .in("status", ["scheduled", "confirmed", "in_session", "kba_pending"])
    .gte("scheduled_date", new Date().toISOString().split("T")[0]);

  const workload: Record<string, number> = {};
  available.forEach((id) => (workload[id] = 0));
  (activeAppts || []).forEach((a) => {
    if (a.notary_id) workload[a.notary_id] = (workload[a.notary_id] || 0) + 1;
  });

  // 5. Score: lower workload = higher score
  const candidates: NotaryCandidate[] = available.map((id) => ({
    userId: id,
    name: profileMap.get(id) || "Unknown",
    activeCount: workload[id] || 0,
    score: 100 - (workload[id] || 0) * 10,
  }));

  // Sort by score descending, then by name for stable ordering
  candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return candidates[0] || null;
}

export async function autoAssignNotary(appointmentId: string): Promise<string | null> {
  const { data: appt } = await supabase
    .from("appointments")
    .select("scheduled_date, scheduled_time")
    .eq("id", appointmentId)
    .single();

  if (!appt) return null;

  const best = await findBestNotary(appt.scheduled_date, appt.scheduled_time);
  if (!best) return null;

  await supabase
    .from("appointments")
    .update({ notary_id: best.userId })
    .eq("id", appointmentId);

  return best.userId;
}
