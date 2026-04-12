/**
 * Client churn prediction and retention analysis.
 * Enhancement #33 (Churn prediction alerts)
 */

import { supabase } from "@/integrations/supabase/client";

export interface ChurnRisk {
  clientId: string;
  clientName: string;
  riskLevel: "low" | "medium" | "high";
  riskScore: number; // 0-100
  lastActivity: string;
  daysSinceActivity: number;
  totalAppointments: number;
  suggestedAction: string;
}

/** Analyze client churn risk */
export async function analyzeChurnRisk(minAppointments = 1): Promise<ChurnRisk[]> {
  const { data: clients } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .limit(500);

  if (!clients) return [];

  const { data: appointments } = await supabase
    .from("appointments")
    .select("client_id, scheduled_date, status")
    .not("status", "eq", "cancelled")
    .order("scheduled_date", { ascending: false });

  if (!appointments) return [];

  // Group by client
  const clientMap = new Map<string, { dates: string[]; total: number }>();
  appointments.forEach((a: any) => {
    const entry = clientMap.get(a.client_id) || { dates: [], total: 0 };
    entry.dates.push(a.scheduled_date);
    entry.total++;
    clientMap.set(a.client_id, entry);
  });

  const now = Date.now();
  const risks: ChurnRisk[] = [];

  for (const client of clients) {
    const stats = clientMap.get(client.user_id);
    if (!stats || stats.total < minAppointments) continue;

    const lastDate = stats.dates[0];
    const daysSince = Math.floor((now - new Date(lastDate).getTime()) / 86400000);

    let riskScore = 0;
    if (daysSince > 180) riskScore += 40;
    else if (daysSince > 90) riskScore += 25;
    else if (daysSince > 60) riskScore += 15;

    if (stats.total <= 1) riskScore += 30;
    else if (stats.total <= 3) riskScore += 15;

    // Frequency decay
    const avgGap = daysSince / Math.max(stats.total - 1, 1);
    if (avgGap > 120) riskScore += 20;
    else if (avgGap > 60) riskScore += 10;

    riskScore = Math.min(100, riskScore);

    const riskLevel = riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";
    const suggestedAction =
      riskLevel === "high" ? "Send re-engagement offer" :
      riskLevel === "medium" ? "Schedule follow-up call" :
      "Monitor";

    risks.push({
      clientId: client.user_id,
      clientName: client.full_name || "Unknown",
      riskLevel,
      riskScore,
      lastActivity: lastDate,
      daysSinceActivity: daysSince,
      totalAppointments: stats.total,
      suggestedAction,
    });
  }

  return risks.filter((r) => r.riskLevel !== "low").sort((a, b) => b.riskScore - a.riskScore);
}
