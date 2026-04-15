import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, jurisdiction } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let url = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}&per_page=10`;
    if (jurisdiction) url += `&jurisdiction_code=${encodeURIComponent(jurisdiction)}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OpenCorporates API error: ${resp.status}`);
    const data = await resp.json();

    const companies = (data.results?.companies || []).map((c: any) => ({
      name: c.company?.name,
      company_number: c.company?.company_number,
      jurisdiction: c.company?.jurisdiction_code,
      status: c.company?.current_status,
      incorporation_date: c.company?.incorporation_date,
      company_type: c.company?.company_type,
      registered_address: c.company?.registered_address_in_full,
      opencorporates_url: c.company?.opencorporates_url,
    }));

    return new Response(JSON.stringify({ companies, total: data.results?.total_count || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("search-corporate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
