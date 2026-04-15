// EF-318: Added auth check + migrated to Deno.serve + rate limiting
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
  const rl = rateLimitGuard(req, 20);
  if (rl) return rl;

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vin } = await req.json();
    if (!vin || typeof vin !== "string") {
      return new Response(JSON.stringify({ error: "VIN is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cleaned = vin.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) {
      return new Response(JSON.stringify({ error: "Invalid VIN format. Must be 17 alphanumeric characters (no I, O, Q)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resp = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleaned}?format=json`);
    if (!resp.ok) throw new Error(`NHTSA API error: ${resp.status}`);
    const data = await resp.json();

    const getValue = (id: number) => data.Results?.find((r: { VariableId: number; Value: string | null }) => r.VariableId === id)?.Value || null;

    const result = {
      vin: cleaned,
      make: getValue(26),
      model: getValue(28),
      year: getValue(29),
      body_class: getValue(5),
      vehicle_type: getValue(39),
      fuel_type: getValue(24),
      engine_cylinders: getValue(9),
      engine_displacement: getValue(11),
      drive_type: getValue(15),
      doors: getValue(14),
      gvwr: getValue(25),
      plant_country: getValue(75),
      plant_state: getValue(77),
      manufacturer: getValue(27),
      trim: getValue(109),
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("decode-vin error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
