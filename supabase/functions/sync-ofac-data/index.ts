import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch SDN CSV from Treasury
    const csvUrl = "https://www.treasury.gov/ofac/downloads/sdn.csv";
    const resp = await fetch(csvUrl);
    if (!resp.ok) throw new Error(`Treasury fetch failed: ${resp.status}`);
    const csvText = await resp.text();

    const lines = csvText.split("\n").filter(l => l.trim());
    let synced = 0;

    for (const line of lines) {
      const parts = line.split(",").map(p => p.replace(/^"|"$/g, "").trim());
      if (parts.length < 3) continue;

      const [entryId, sdnName, sdnType, program, title, , , , , , , remarks] = parts;
      if (!entryId || !sdnName) continue;

      const { error } = await adminClient.from("ofac_sdn_list").upsert({
        entry_id: entryId,
        sdn_name: sdnName,
        sdn_type: sdnType || null,
        program: program || null,
        title: title || null,
        remarks: remarks || null,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: "entry_id" });

      if (!error) synced++;
      if (synced >= 5000) break; // Safety limit
    }

    return new Response(JSON.stringify({ synced, message: `Synced ${synced} SDN entries` }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("sync-ofac-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
