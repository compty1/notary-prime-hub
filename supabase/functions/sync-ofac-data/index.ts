// EF-312/313/314: Fixed CSV parsing (pipe delimiter), added auth, batch upserts, Deno.serve
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rl = rateLimitGuard(req, 2);
  if (rl) return rl;

  try {
    // Auth check — require admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const userRoles = (roles || []).map((r: { role: string }) => r.role);
    if (!userRoles.includes("admin")) {
      return new Response(JSON.stringify({ error: "Forbidden — admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch SDN pipe-delimited file from Treasury (EF-312: SDN uses | not ,)
    const csvUrl = "https://www.treasury.gov/ofac/downloads/sdn.pip";
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`Treasury fetch failed: ${resp.status}`);
    const csvText = await resp.text();

    const lines = csvText.split("\n").filter(l => l.trim());
    const BATCH_SIZE = 100;
    const MAX_ROWS = 5000;
    let synced = 0;
    let batch: { entry_id: string; sdn_name: string; sdn_type: string | null; program: string | null; title: string | null; remarks: string | null; last_synced_at: string }[] = [];

    for (const line of lines) {
      if (synced >= MAX_ROWS) break;
      // EF-312: SDN .pip files use pipe delimiter
      const parts = line.split("|").map(p => p.replace(/^"|"$/g, "").trim());
      if (parts.length < 3) continue;

      const [entryId, sdnName, sdnType, program, title, , , , , , , remarks] = parts;
      if (!entryId || !sdnName) continue;

      batch.push({
        entry_id: entryId,
        sdn_name: sdnName,
        sdn_type: sdnType || null,
        program: program || null,
        title: title || null,
        remarks: remarks || null,
        last_synced_at: new Date().toISOString(),
      });

      // EF-314: Batch upsert instead of serial
      if (batch.length >= BATCH_SIZE) {
        const { error } = await adminClient.from("ofac_sdn_list").upsert(batch, { onConflict: "entry_id" });
        if (!error) synced += batch.length;
        batch = [];
      }
    }

    // Flush remaining batch
    if (batch.length > 0) {
      const { error } = await adminClient.from("ofac_sdn_list").upsert(batch, { onConflict: "entry_id" });
      if (!error) synced += batch.length;
    }

    return new Response(JSON.stringify({ synced, message: `Synced ${synced} SDN entries` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("sync-ofac-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
