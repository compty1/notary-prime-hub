/**
 * Net Promoter Score (NPS) tracking and analysis.
 * Enhancement #76 (NPS tracking)
 */

import { supabase } from "@/integrations/supabase/client";

export interface NPSResult {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

/** Calculate NPS from client feedback */
export async function calculateNPS(days = 90): Promise<NPSResult> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data } = await supabase
    .from("client_feedback")
    .select("nps_score")
    .gte("created_at", since)
    .not("nps_score", "is", null);

  if (!data || data.length === 0) {
    return { score: 0, promoters: 0, passives: 0, detractors: 0, totalResponses: 0 };
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  data.forEach((d: any) => {
    const score = d.nps_score;
    if (score >= 9) promoters++;
    else if (score >= 7) passives++;
    else detractors++;
  });

  const total = data.length;
  const nps = Math.round(((promoters - detractors) / total) * 100);

  return { score: nps, promoters, passives, detractors, totalResponses: total };
}

/** Get NPS trend over time */
export async function getNPSTrend(months = 6): Promise<Array<{ month: string; nps: number; responses: number }>> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data } = await supabase
    .from("client_feedback")
    .select("nps_score, created_at")
    .gte("created_at", since.toISOString())
    .not("nps_score", "is", null);

  if (!data) return [];

  const monthMap = new Map<string, number[]>();
  data.forEach((d: any) => {
    const month = d.created_at.slice(0, 7);
    const scores = monthMap.get(month) || [];
    scores.push(d.nps_score);
    monthMap.set(month, scores);
  });

  return Array.from(monthMap.entries())
    .map(([month, scores]) => {
      const p = scores.filter((s) => s >= 9).length;
      const d = scores.filter((s) => s < 7).length;
      return {
        month,
        nps: Math.round(((p - d) / scores.length) * 100),
        responses: scores.length,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}
