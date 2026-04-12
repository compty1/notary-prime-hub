/**
 * Client acquisition cost (CAC) tracking.
 * Enhancement #40 (Client acquisition cost tracking)
 */

import { supabase } from "@/integrations/supabase/client";

export interface AcquisitionMetrics {
  totalClients: number;
  totalMarketingSpend: number;
  cac: number;
  avgLifetimeValue: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
}

/** Calculate acquisition metrics */
export async function calculateAcquisitionMetrics(
  marketingSpend: number,
  days = 90
): Promise<AcquisitionMetrics> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { count: newClients } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  const { data: payments } = await supabase
    .from("payments")
    .select("amount, client_id")
    .eq("status", "paid");

  const totalClients = newClients || 1;
  const cac = marketingSpend / totalClients;

  // Calculate average LTV
  const clientRevenue = new Map<string, number>();
  payments?.forEach((p: any) => {
    clientRevenue.set(p.client_id, (clientRevenue.get(p.client_id) || 0) + (p.amount || 0));
  });

  const revenues = Array.from(clientRevenue.values());
  const avgLTV = revenues.length > 0 ? revenues.reduce((s, v) => s + v, 0) / revenues.length : 0;

  // Payback = CAC / (avg monthly revenue per client)
  const avgMonthlyRevenue = avgLTV / 12; // rough estimate
  const paybackPeriodMonths = avgMonthlyRevenue > 0 ? Math.ceil(cac / avgMonthlyRevenue) : 0;

  return {
    totalClients,
    totalMarketingSpend: marketingSpend,
    cac: Math.round(cac * 100) / 100,
    avgLifetimeValue: Math.round(avgLTV * 100) / 100,
    ltvCacRatio: cac > 0 ? Math.round((avgLTV / cac) * 10) / 10 : 0,
    paybackPeriodMonths,
  };
}
