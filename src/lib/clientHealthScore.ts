import { supabase } from "@/integrations/supabase/client";

/**
 * Computes client health metrics for proactive outreach.
 * Used for churn prediction and engagement scoring.
 */

export type ClientHealthScore = {
  clientId: string;
  score: number; // 0-100
  label: "healthy" | "at_risk" | "churning" | "new";
  factors: string[];
};

export async function computeClientHealth(clientId: string): Promise<ClientHealthScore> {
  const factors: string[] = [];
  let score = 50; // baseline

  // Check appointment history
  const { count: totalAppts } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  if ((totalAppts ?? 0) === 0) {
    return { clientId, score: 30, label: "new", factors: ["No appointment history"] };
  }

  if ((totalAppts ?? 0) >= 5) { score += 15; factors.push("5+ appointments"); }
  if ((totalAppts ?? 0) >= 10) { score += 10; factors.push("10+ appointments (loyal)"); }

  // Check recent activity (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentAppts } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", ninetyDaysAgo);

  if ((recentAppts ?? 0) === 0) { score -= 20; factors.push("No activity in 90 days"); }
  else { score += 10; factors.push("Active in last 90 days"); }

  // Check no-shows
  const { count: noShows } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("status", "no_show" as any);

  if ((noShows ?? 0) >= 2) { score -= 15; factors.push(`${noShows} no-shows`); }

  // Check feedback
  const { data: feedback } = await supabase
    .from("client_feedback")
    .select("rating")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (feedback && feedback.length > 0) {
    const avgRating = feedback.reduce((s, f) => s + f.rating, 0) / feedback.length;
    if (avgRating >= 4) { score += 10; factors.push(`Avg rating: ${avgRating.toFixed(1)}`); }
    else if (avgRating <= 2) { score -= 15; factors.push(`Low avg rating: ${avgRating.toFixed(1)}`); }
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  let label: ClientHealthScore["label"] = "healthy";
  if (score < 30) label = "churning";
  else if (score < 50) label = "at_risk";

  return { clientId, score, label, factors };
}
