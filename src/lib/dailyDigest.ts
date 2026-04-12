/**
 * Admin daily digest data aggregator.
 * Compiles daily operations summary for admin dashboard or email.
 */
import { supabase } from "@/integrations/supabase/client";

export interface DailyDigest {
  date: string;
  appointmentsToday: number;
  appointmentsCompleted: number;
  newLeads: number;
  newClients: number;
  revenue: number;
  pendingDocuments: number;
  pendingReviews: number;
  upcomingRenewals: number;
  openIssues: number;
}

export async function generateDailyDigest(date?: string): Promise<DailyDigest> {
  const targetDate = date || new Date().toISOString().split("T")[0];

  const [apptRes, completedRes, leadsRes, clientsRes, paymentsRes, docsRes] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", targetDate).not("status", "in", '("cancelled")'),
    supabase.from("appointments").select("*", { count: "exact", head: true }).eq("scheduled_date", targetDate).eq("status", "completed"),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`),
    supabase.from("payments").select("amount").eq("status", "paid").gte("created_at", `${targetDate}T00:00:00`).lt("created_at", `${targetDate}T23:59:59`),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
  ]);

  const revenue = (paymentsRes.data ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    date: targetDate,
    appointmentsToday: apptRes.count ?? 0,
    appointmentsCompleted: completedRes.count ?? 0,
    newLeads: leadsRes.count ?? 0,
    newClients: clientsRes.count ?? 0,
    revenue,
    pendingDocuments: docsRes.count ?? 0,
    pendingReviews: 0,
    upcomingRenewals: 0,
    openIssues: 0,
  };
}
