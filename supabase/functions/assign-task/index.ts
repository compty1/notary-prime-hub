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

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { z } = await import("https://esm.sh/zod@3.23.8");
    const BodySchema = z.object({
      taskId: z.string().uuid().optional(),
      mode: z.enum(["auto", "manual"]),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { taskId, mode } = parsed.data;

    if (mode === "auto") {
      // Get unassigned tasks from appointments
      const { data: unassigned } = await supabase
        .from("appointments")
        .select("id, service_type, scheduled_date, scheduled_time, location, notarization_type")
        .is("notary_id", null)
        .in("status", ["scheduled", "confirmed"])
        .order("scheduled_date", { ascending: true })
        .limit(20);

      // Get available notaries
      const { data: notaries } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "notary");

      if (!notaries?.length || !unassigned?.length) {
        return new Response(JSON.stringify({
          message: "No unassigned tasks or available notaries",
          assigned: 0,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get workload per notary
      const { data: workloads } = await supabase
        .from("appointments")
        .select("notary_id")
        .in("status", ["scheduled", "confirmed"])
        .not("notary_id", "is", null);

      const loadMap: Record<string, number> = {};
      notaries.forEach((n) => { loadMap[n.user_id] = 0; });
      workloads?.forEach((w) => {
        if (w.notary_id && loadMap[w.notary_id] !== undefined) {
          loadMap[w.notary_id]++;
        }
      });

      // Assign tasks round-robin by least loaded
      let assignedCount = 0;
      for (const task of unassigned) {
        const sorted = Object.entries(loadMap).sort(([, a], [, b]) => a - b);
        const leastLoaded = sorted[0]?.[0];
        if (!leastLoaded) break;

        const { error } = await supabase
          .from("appointments")
          .update({ notary_id: leastLoaded })
          .eq("id", task.id);

        if (!error) {
          loadMap[leastLoaded]++;
          assignedCount++;

          // Log audit
          await supabase.rpc("log_audit_event", {
            _action: "smart_task_assignment",
            _entity_type: "appointment",
            _entity_id: task.id,
            _details: { notary_id: leastLoaded, mode: "auto" },
          });
        }
      }

      return new Response(JSON.stringify({
        message: `Auto-assigned ${assignedCount} tasks`,
        assigned: assignedCount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
