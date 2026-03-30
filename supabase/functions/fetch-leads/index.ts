import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  source: z.enum(["all", "ohio_sos", "google_places"]).default("all"),
});

interface NormalizedLead {
  name: string | null;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  lead_type: string;
  service_needed: string | null;
  intent_score: string;
  source: string;
  source_url: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check (item 16 - edge function auth)
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

    // Verify admin role
    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "notary"]);
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate input (item 54)
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { source } = parsed.data;

    const supabase = serviceClient;
    const results: { source: string; count: number; leads: NormalizedLead[] }[] = [];

    if (source === "all" || source === "ohio_sos") {
      const ohioCounties = [
        { county: "Franklin", city: "Columbus", zip: "43215" },
        { county: "Cuyahoga", city: "Cleveland", zip: "44114" },
        { county: "Hamilton", city: "Cincinnati", zip: "45202" },
        { county: "Summit", city: "Akron", zip: "44308" },
        { county: "Montgomery", city: "Dayton", zip: "45402" },
      ];

      const sampleLeads: NormalizedLead[] = ohioCounties.map((c) => ({
        name: null, phone: null, email: null,
        business_name: `${c.county} County Recorder`,
        address: null, city: c.city, state: "OH", zip: c.zip,
        lead_type: "business", service_needed: "Real Estate Notarization",
        intent_score: "medium", source: "ohio_public_records",
        source_url: "https://www.ohiosos.gov/notary/",
      }));
      results.push({ source: "ohio_sos", count: sampleLeads.length, leads: sampleLeads });
    }

    let inserted = 0;
    for (const result of results) {
      for (const lead of result.leads) {
        const { data: existing } = await supabase.from("leads").select("id").eq("business_name", lead.business_name || "").eq("city", lead.city || "").limit(1);
        if (!existing || existing.length === 0) {
          const { error } = await supabase.from("leads").insert(lead);
          if (!error) inserted++;
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Lead fetch complete", sources: results.map((r) => ({ source: r.source, found: r.count })), inserted }),
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
