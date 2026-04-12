/**
 * Capacity planning — notary utilization rate analysis.
 * Enhancement #36 (Capacity planning view)
 */

import { supabase } from "@/integrations/supabase/client";

export interface UtilizationData {
  date: string;
  totalSlots: number;
  bookedSlots: number;
  utilizationRate: number;
}

/** Calculate daily utilization for a date range */
export async function getUtilization(
  startDate: string,
  endDate: string,
  slotsPerDay = 8
): Promise<UtilizationData[]> {
  const { data } = await supabase
    .from("appointments")
    .select("scheduled_date")
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .not("status", "in", '("cancelled","no_show")');

  if (!data) return [];

  const dayMap = new Map<string, number>();
  data.forEach((a: any) => {
    const d = a.scheduled_date;
    dayMap.set(d, (dayMap.get(d) || 0) + 1);
  });

  // Fill in all dates
  const result: UtilizationData[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dow = current.getDay();
    // Skip weekends
    if (dow !== 0 && dow !== 6) {
      const booked = dayMap.get(dateStr) || 0;
      result.push({
        date: dateStr,
        totalSlots: slotsPerDay,
        bookedSlots: booked,
        utilizationRate: Math.round((booked / slotsPerDay) * 100),
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/** Get average utilization rate */
export function avgUtilization(data: UtilizationData[]): number {
  if (data.length === 0) return 0;
  return Math.round(data.reduce((s, d) => s + d.utilizationRate, 0) / data.length);
}

/** Find peak and low days */
export function utilizationInsights(data: UtilizationData[]) {
  if (data.length === 0) return { peakDay: null, lowDay: null, avgRate: 0 };
  const sorted = [...data].sort((a, b) => b.utilizationRate - a.utilizationRate);
  return {
    peakDay: sorted[0],
    lowDay: sorted[sorted.length - 1],
    avgRate: avgUtilization(data),
  };
}
