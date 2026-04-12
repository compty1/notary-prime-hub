/**
 * Marketing campaign ROI tracking.
 * Enhancement #38 (Marketing campaign ROI)
 */

import { supabase } from "@/integrations/supabase/client";

export interface CampaignMetrics {
  source: string;
  leads: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  costPerAcquisition?: number;
}

/** Analyze marketing performance by referral source */
export async function getCampaignMetrics(days = 90): Promise<CampaignMetrics[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: leads } = await supabase
    .from("leads")
    .select("source, status, created_at")
    .gte("created_at", since);

  const { data: appointments } = await supabase
    .from("appointments")
    .select("referral_source, estimated_price, status")
    .gte("created_at", since)
    .not("referral_source", "is", null);

  const sourceMap = new Map<string, CampaignMetrics>();

  // Count leads by source
  leads?.forEach((l: any) => {
    const src = l.source || "direct";
    const entry = sourceMap.get(src) || { source: src, leads: 0, conversions: 0, revenue: 0, conversionRate: 0 };
    entry.leads++;
    if (l.status === "converted") entry.conversions++;
    sourceMap.set(src, entry);
  });

  // Add appointment revenue by referral source
  appointments?.forEach((a: any) => {
    const src = a.referral_source || "direct";
    const entry = sourceMap.get(src) || { source: src, leads: 0, conversions: 0, revenue: 0, conversionRate: 0 };
    if (a.status !== "cancelled" && a.status !== "no_show") {
      entry.revenue += a.estimated_price || 0;
    }
    sourceMap.set(src, entry);
  });

  return Array.from(sourceMap.values()).map((m) => ({
    ...m,
    conversionRate: m.leads > 0 ? Math.round((m.conversions / m.leads) * 100) : 0,
  })).sort((a, b) => b.revenue - a.revenue);
}
