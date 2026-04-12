/**
 * Service profitability analysis.
 * Enhancement #37 (Service profitability)
 */

import { supabase } from "@/integrations/supabase/client";

export interface ServiceProfitability {
  service: string;
  totalRevenue: number;
  appointmentCount: number;
  avgRevenuePerAppointment: number;
  avgDurationMinutes: number;
  revenuePerHour: number;
}

/** Analyze profitability by service type */
export async function analyzeServiceProfitability(days = 180): Promise<ServiceProfitability[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data } = await supabase
    .from("appointments")
    .select("service_type, estimated_price, appointment_duration_actual")
    .gte("created_at", since)
    .in("status", ["completed"] as any);

  if (!data) return [];

  const svcMap = new Map<string, { revenue: number; count: number; totalMinutes: number }>();

  data.forEach((a: any) => {
    const svc = a.service_type || "Unknown";
    const entry = svcMap.get(svc) || { revenue: 0, count: 0, totalMinutes: 0 };
    entry.revenue += a.estimated_price || 0;
    entry.count++;
    entry.totalMinutes += a.appointment_duration_actual || 30;
    svcMap.set(svc, entry);
  });

  return Array.from(svcMap.entries())
    .map(([service, stats]) => {
      const avgDuration = stats.totalMinutes / stats.count;
      return {
        service,
        totalRevenue: Math.round(stats.revenue * 100) / 100,
        appointmentCount: stats.count,
        avgRevenuePerAppointment: Math.round((stats.revenue / stats.count) * 100) / 100,
        avgDurationMinutes: Math.round(avgDuration),
        revenuePerHour: Math.round((stats.revenue / (stats.totalMinutes / 60)) * 100) / 100,
      };
    })
    .sort((a, b) => b.revenuePerHour - a.revenuePerHour);
}
