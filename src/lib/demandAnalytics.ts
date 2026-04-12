/**
 * Demand analytics — heatmaps, geographic distribution, seasonal forecasting.
 * Enhancements #72-79 (BI tools)
 */

import { supabase } from "@/integrations/supabase/client";

export interface DemandHeatmapEntry {
  dayOfWeek: number; // 0=Sun
  hour: number;
  count: number;
}

/** Fetch appointment demand by day/hour */
export async function getDemandHeatmap(days = 90): Promise<DemandHeatmapEntry[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("appointments")
    .select("scheduled_date, scheduled_time")
    .gte("created_at", since)
    .not("status", "in", '("cancelled","no_show")');

  if (!data) return [];

  const map = new Map<string, number>();
  data.forEach((a: any) => {
    const d = new Date(a.scheduled_date);
    const dow = d.getUTCDay();
    const hour = parseInt(a.scheduled_time?.split(":")[0] || "0", 10);
    const key = `${dow}-${hour}`;
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries()).map(([key, count]) => {
    const [dayOfWeek, hour] = key.split("-").map(Number);
    return { dayOfWeek, hour, count };
  });
}

/** Service popularity ranking */
export async function getServicePopularity(days = 90): Promise<Array<{ service: string; count: number; revenue: number }>> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("appointments")
    .select("service_type, estimated_price")
    .gte("created_at", since)
    .not("status", "in", '("cancelled","no_show")');

  if (!data) return [];

  const svcMap = new Map<string, { count: number; revenue: number }>();
  data.forEach((a: any) => {
    const svc = a.service_type || "Unknown";
    const entry = svcMap.get(svc) || { count: 0, revenue: 0 };
    entry.count++;
    entry.revenue += a.estimated_price || 0;
    svcMap.set(svc, entry);
  });

  return Array.from(svcMap.entries())
    .map(([service, stats]) => ({ service, ...stats }))
    .sort((a, b) => b.count - a.count);
}

/** Monthly trend data */
export async function getMonthlyTrends(months = 12): Promise<Array<{ month: string; appointments: number; revenue: number }>> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  
  const { data: appts } = await supabase
    .from("appointments")
    .select("scheduled_date, estimated_price")
    .gte("scheduled_date", since.toISOString().split("T")[0])
    .not("status", "in", '("cancelled","no_show")');

  if (!appts) return [];

  const monthMap = new Map<string, { appointments: number; revenue: number }>();
  appts.forEach((a: any) => {
    const month = a.scheduled_date?.slice(0, 7) || "unknown";
    const entry = monthMap.get(month) || { appointments: 0, revenue: 0 };
    entry.appointments++;
    entry.revenue += a.estimated_price || 0;
    monthMap.set(month, entry);
  });

  return Array.from(monthMap.entries())
    .map(([month, stats]) => ({ month, ...stats }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
