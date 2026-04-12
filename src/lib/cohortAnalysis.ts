/**
 * Cohort analysis for client retention.
 * Enhancement #75 (Cohort analysis)
 */

import { supabase } from "@/integrations/supabase/client";

export interface CohortData {
  cohortMonth: string;
  totalClients: number;
  retentionByMonth: Record<number, number>; // month offset → % retained
}

/** Build cohort retention matrix */
export async function buildCohortAnalysis(months = 12): Promise<CohortData[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, created_at")
    .gte("created_at", since.toISOString())
    .limit(1000);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("client_id, scheduled_date")
    .gte("scheduled_date", since.toISOString().split("T")[0])
    .not("status", "in", '("cancelled","no_show")')
    .limit(1000);

  if (!profiles || !appointments) return [];

  // Group clients by signup month
  const cohortMap = new Map<string, Set<string>>();
  profiles.forEach((p: any) => {
    const month = p.created_at.slice(0, 7);
    const set = cohortMap.get(month) || new Set();
    set.add(p.user_id);
    cohortMap.set(month, set);
  });

  // Track activity by client and month
  const activityMap = new Map<string, Set<string>>();
  appointments.forEach((a: any) => {
    const month = a.scheduled_date.slice(0, 7);
    const set = activityMap.get(a.client_id) || new Set();
    set.add(month);
    activityMap.set(a.client_id, set);
  });

  // Build cohort data
  const cohorts: CohortData[] = [];
  const sortedMonths = Array.from(cohortMap.keys()).sort();

  for (const cohortMonth of sortedMonths) {
    const clients = cohortMap.get(cohortMonth)!;
    const totalClients = clients.size;
    const retentionByMonth: Record<number, number> = {};

    for (let offset = 0; offset <= 6; offset++) {
      const targetDate = new Date(cohortMonth + "-01");
      targetDate.setMonth(targetDate.getMonth() + offset);
      const targetMonth = targetDate.toISOString().slice(0, 7);

      let active = 0;
      clients.forEach((clientId) => {
        if (activityMap.get(clientId)?.has(targetMonth)) active++;
      });

      retentionByMonth[offset] = totalClients > 0 ? Math.round((active / totalClients) * 100) : 0;
    }

    cohorts.push({ cohortMonth, totalClients, retentionByMonth });
  }

  return cohorts;
}
