import { rateLimitGuard } from "../_shared/middleware.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const rl = rateLimitGuard(req, 20); if (rl) return rl;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { z } = await import("https://esm.sh/zod@3.23.8");
    const BodySchema = z.object({
      serviceType: z.string().max(200).optional(),
      preferredDate: z.string().max(20).optional(),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { serviceType, preferredDate } = parsed.data;

    // Fetch historical appointment data
    const { data: appointments } = await supabase
      .from("appointments")
      .select("scheduled_date, scheduled_time, service_type, status, appointment_duration_actual")
      .in("status", ["completed", "scheduled", "confirmed"])
      .order("scheduled_date", { ascending: false })
      .limit(500);

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({
        suggestions: [],
        message: "Not enough historical data to make suggestions. Any available time slot works!",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Analyze patterns
    const dayCount: Record<string, number> = {};
    const timeCount: Record<string, number> = {};
    const busySlots: Set<string> = new Set();

    appointments.forEach((apt) => {
      const date = new Date(apt.scheduled_date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;

      const hour = apt.scheduled_time?.split(":")[0];
      if (hour) {
        timeCount[hour] = (timeCount[hour] || 0) + 1;
      }

      if (apt.status === "scheduled" || apt.status === "confirmed") {
        busySlots.add(`${apt.scheduled_date}-${apt.scheduled_time}`);
      }
    });

    // Find least busy times (best availability)
    const sortedTimes = Object.entries(timeCount)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 5)
      .map(([hour]) => `${hour.padStart(2, "0")}:00`);

    const sortedDays = Object.entries(dayCount)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([day]) => day);

    const suggestions = sortedTimes.map((time) => ({
      time,
      reason: `Lower demand — fewer bookings at this time`,
      confidence: "high",
    }));

    return new Response(JSON.stringify({
      suggestions,
      recommendedDays: sortedDays,
      totalAnalyzed: appointments.length,
      busySlotsCount: busySlots.size,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
