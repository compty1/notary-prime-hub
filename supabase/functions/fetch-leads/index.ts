import { rateLimitGuard, corsHeaders as buildCorsHeaders, handleCorsOptions, errorResponse, jsonResponse } from "../_shared/middleware.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const BodySchema = z.object({
  source: z.enum(["all", "database", "ohio_sos"]).default("all"),
  status: z.string().optional(),
  intent: z.string().optional(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rl = rateLimitGuard(req, 20); if (rl) return rl;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify admin/notary role
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "notary"]);
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { source, status, intent, limit, offset } = parsed.data;

    // Query actual leads from database
    let query = serviceClient.from("leads").select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (intent) query = query.eq("intent_score", intent);

    const { data: leads, count, error: queryError } = await query;
    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Compute pipeline stats
    const { data: allLeads } = await serviceClient.from("leads").select("status, intent_score");
    const stats = {
      total: count ?? 0,
      by_status: {} as Record<string, number>,
      by_intent: {} as Record<string, number>,
    };
    (allLeads || []).forEach((l: any) => {
      stats.by_status[l.status] = (stats.by_status[l.status] || 0) + 1;
      stats.by_intent[l.intent_score] = (stats.by_intent[l.intent_score] || 0) + 1;
    });

    return new Response(
      JSON.stringify({
        leads: leads || [],
        total: count ?? 0,
        stats,
        source: "database",
        offset,
        limit,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Fetch leads error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
