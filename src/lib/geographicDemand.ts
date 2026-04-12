/**
 * Geographic demand visualization data.
 * Enhancement #73 (Geographic demand visualization)
 */

import { supabase } from "@/integrations/supabase/client";

export interface GeoPoint {
  city: string;
  state: string;
  count: number;
  revenue: number;
}

/** Aggregate appointment demand by location */
export async function getGeographicDemand(days = 180): Promise<GeoPoint[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data } = await supabase
    .from("appointments")
    .select("location, estimated_price")
    .gte("created_at", since)
    .not("status", "in", '("cancelled","no_show")')
    .not("location", "is", null);

  if (!data) return [];

  const locMap = new Map<string, { count: number; revenue: number }>();
  data.forEach((a: any) => {
    const loc = a.location || "Unknown";
    const entry = locMap.get(loc) || { count: 0, revenue: 0 };
    entry.count++;
    entry.revenue += a.estimated_price || 0;
    locMap.set(loc, entry);
  });

  return Array.from(locMap.entries())
    .map(([location, stats]) => ({
      city: location.split(",")[0]?.trim() || location,
      state: "OH",
      count: stats.count,
      revenue: Math.round(stats.revenue * 100) / 100,
    }))
    .sort((a, b) => b.count - a.count);
}
