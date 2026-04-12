/**
 * Business intelligence — CLV, demand heatmap, funnel analytics.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Client Lifetime Value calculation.
 */
export async function getClientLTV(clientId: string) {
  const { data } = await supabase
    .from("payments")
    .select("amount, created_at, status")
    .eq("client_id", clientId)
    .eq("status", "paid")
    .order("created_at");

  if (!data || data.length === 0) {
    return { ltv: 0, transactionCount: 0, avgTransaction: 0, firstPurchase: null, lastPurchase: null, tenure: 0 };
  }

  const ltv = data.reduce((sum, p) => sum + (p.amount || 0), 0);
  const avgTransaction = ltv / data.length;
  const firstPurchase = data[0].created_at;
  const lastPurchase = data[data.length - 1].created_at;
  const tenureDays = Math.floor(
    (new Date(lastPurchase).getTime() - new Date(firstPurchase).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    ltv: Math.round(ltv * 100) / 100,
    transactionCount: data.length,
    avgTransaction: Math.round(avgTransaction * 100) / 100,
    firstPurchase,
    lastPurchase,
    tenure: tenureDays,
  };
}

/**
 * Service demand heatmap — appointments by day of week and hour.
 */
export async function getServiceDemandHeatmap(days = 90) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data } = await supabase
    .from("appointments")
    .select("scheduled_date, scheduled_time")
    .gte("scheduled_date", since)
    .not("status", "eq", "cancelled");

  if (!data) return [];

  const heatmap: Record<string, Record<string, number>> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  data.forEach(appt => {
    const date = new Date(appt.scheduled_date + "T12:00:00");
    const dayName = dayNames[date.getDay()];
    const hour = appt.scheduled_time?.split(":")[0] || "09";

    if (!heatmap[dayName]) heatmap[dayName] = {};
    heatmap[dayName][hour] = (heatmap[dayName][hour] || 0) + 1;
  });

  // Flatten to array format
  const result: Array<{ day: string; hour: string; count: number }> = [];
  dayNames.forEach(day => {
    for (let h = 8; h <= 20; h++) {
      const hour = String(h).padStart(2, "0");
      result.push({ day, hour, count: heatmap[day]?.[hour] || 0 });
    }
  });

  return result;
}

/**
 * Conversion funnel analysis: visitor → lead → booking → completion.
 */
export async function getConversionFunnel(startDate: string, endDate: string) {
  const [leadsRes, bookingsRes, completedRes] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .gte("created_at", startDate).lte("created_at", endDate),
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", startDate).lte("created_at", endDate),
  ]);

  const leads = leadsRes.count ?? 0;
  const bookings = bookingsRes.count ?? 0;
  const completed = completedRes.count ?? 0;

  return {
    stages: [
      { name: "Leads", count: leads, percentage: 100 },
      { name: "Bookings", count: bookings, percentage: leads > 0 ? Math.round((bookings / leads) * 100) : 0 },
      { name: "Completed", count: completed, percentage: bookings > 0 ? Math.round((completed / bookings) * 100) : 0 },
    ],
    leadToBookingRate: leads > 0 ? Math.round((bookings / leads) * 100) : 0,
    bookingToCompletionRate: bookings > 0 ? Math.round((completed / bookings) * 100) : 0,
    overallConversionRate: leads > 0 ? Math.round((completed / leads) * 100) : 0,
  };
}

/**
 * Service popularity ranking.
 */
export async function getServicePopularity(days = 90) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data } = await supabase
    .from("appointments")
    .select("service_type")
    .gte("scheduled_date", since)
    .not("status", "eq", "cancelled");

  if (!data) return [];

  const counts: Record<string, number> = {};
  data.forEach(a => {
    counts[a.service_type] = (counts[a.service_type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([service, count]) => ({ service, count, percentage: Math.round((count / data.length) * 100) }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Revenue by service type for profitability analysis.
 */
export async function getRevenueByService(startDate: string, endDate: string) {
  const { data } = await supabase
    .from("payments")
    .select("amount, appointment_id, status")
    .eq("status", "paid")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (!data || data.length === 0) return [];

  // Get appointment service types for these payments
  const appointmentIds = data.filter(p => p.appointment_id).map(p => p.appointment_id!);
  
  if (appointmentIds.length === 0) return [];

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, service_type")
    .in("id", appointmentIds.slice(0, 100)); // limit to avoid query size issues

  const serviceMap: Record<string, string> = {};
  (appointments ?? []).forEach(a => { serviceMap[a.id] = a.service_type; });

  const revenue: Record<string, { total: number; count: number }> = {};
  data.forEach(p => {
    const serviceType = p.appointment_id ? (serviceMap[p.appointment_id] || "Other") : "Other";
    if (!revenue[serviceType]) revenue[serviceType] = { total: 0, count: 0 };
    revenue[serviceType].total += p.amount || 0;
    revenue[serviceType].count += 1;
  });

  return Object.entries(revenue)
    .map(([service, { total, count }]) => ({
      service,
      total: Math.round(total * 100) / 100,
      count,
      avg: Math.round((total / count) * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);
}
