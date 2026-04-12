import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export type RevenueBreakdown = {
  month: string;
  total: number;
  byService: Record<string, number>;
};

/**
 * Fetch monthly revenue breakdown for the last N months.
 */
export async function getRevenueBreakdown(months: number = 6): Promise<RevenueBreakdown[]> {
  const results: RevenueBreakdown[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
    const end = format(endOfMonth(monthDate), "yyyy-MM-dd");
    const label = format(monthDate, "MMM yyyy");

    const { data: payments } = await supabase
      .from("payments")
      .select("amount, appointment_id")
      .eq("status", "paid")
      .gte("created_at", start)
      .lte("created_at", end);

    const total = payments?.reduce((s, p) => s + (p.amount || 0), 0) ?? 0;

    // Get service types from appointments
    const byService: Record<string, number> = {};
    if (payments && payments.length > 0) {
      const apptIds = payments.filter(p => p.appointment_id).map(p => p.appointment_id!);
      if (apptIds.length > 0) {
        const { data: appts } = await supabase
          .from("appointments")
          .select("id, service_type")
          .in("id", apptIds);

        const apptMap = new Map(appts?.map(a => [a.id, a.service_type]) ?? []);
        payments.forEach(p => {
          const svc = p.appointment_id ? (apptMap.get(p.appointment_id) ?? "Other") : "Other";
          byService[svc] = (byService[svc] ?? 0) + (p.amount || 0);
        });
      }
    }

    results.push({ month: label, total, byService });
  }

  return results;
}

/**
 * Calculate average revenue per appointment.
 */
export async function getAverageRevenuePerAppointment(): Promise<number> {
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "paid")
    .not("appointment_id", "is", null);

  if (!payments || payments.length === 0) return 0;
  return payments.reduce((s, p) => s + (p.amount || 0), 0) / payments.length;
}
