import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export type PlatformHealthMetric = {
  name: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  detail?: string;
};

/**
 * Run platform health checks covering database, auth, storage, and business logic.
 */
export async function runPlatformHealthCheck(): Promise<PlatformHealthMetric[]> {
  const metrics: PlatformHealthMetric[] = [];

  // 1. Database connectivity
  try {
    const start = performance.now();
    await supabase.from("profiles").select("user_id").limit(1);
    const latency = Math.round(performance.now() - start);
    metrics.push({
      name: "Database Connectivity",
      status: latency < 500 ? "healthy" : latency < 2000 ? "warning" : "critical",
      value: `${latency}ms`,
      detail: "Query latency to profiles table",
    });
  } catch {
    metrics.push({ name: "Database Connectivity", status: "critical", value: "Failed" });
  }

  // 2. Auth service
  try {
    const { data } = await supabase.auth.getSession();
    metrics.push({
      name: "Auth Service",
      status: "healthy",
      value: data.session ? "Authenticated" : "Anonymous",
    });
  } catch {
    metrics.push({ name: "Auth Service", status: "critical", value: "Unreachable" });
  }

  // 3. Storage availability
  try {
    const { data, error } = await supabase.storage.from("documents").list("", { limit: 1 });
    metrics.push({
      name: "File Storage",
      status: error ? "warning" : "healthy",
      value: error ? "Degraded" : "Available",
    });
  } catch {
    metrics.push({ name: "File Storage", status: "critical", value: "Unavailable" });
  }

  // 4. Recent appointments (business health)
  try {
    const { count } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", format(subDays(new Date(), 7), "yyyy-MM-dd"));
    metrics.push({
      name: "Weekly Appointments",
      status: (count ?? 0) > 0 ? "healthy" : "warning",
      value: String(count ?? 0),
      detail: "Last 7 days",
    });
  } catch {
    metrics.push({ name: "Weekly Appointments", status: "warning", value: "Unknown" });
  }

  // 5. Audit log freshness
  try {
    const { data } = await supabase
      .from("audit_log")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      const age = Date.now() - new Date(data.created_at).getTime();
      const hours = Math.round(age / (1000 * 60 * 60));
      metrics.push({
        name: "Audit Log",
        status: hours < 24 ? "healthy" : hours < 72 ? "warning" : "critical",
        value: `${hours}h since last entry`,
      });
    }
  } catch {
    metrics.push({ name: "Audit Log", status: "warning", value: "Unknown" });
  }

  return metrics;
}
