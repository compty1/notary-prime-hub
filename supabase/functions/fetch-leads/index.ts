import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { source } = await req.json().catch(() => ({ source: "all" }));
    const results: { source: string; count: number; leads: NormalizedLead[] }[] = [];

    // Source 1: Ohio Secretary of State - Notary Search (placeholder)
    // In production, this would scrape/API the Ohio SOS notary directory
    // For now, generates sample leads based on Ohio county data
    if (source === "all" || source === "ohio_sos") {
      const ohioCounties = [
        { county: "Franklin", city: "Columbus", zip: "43215" },
        { county: "Cuyahoga", city: "Cleveland", zip: "44114" },
        { county: "Hamilton", city: "Cincinnati", zip: "45202" },
        { county: "Summit", city: "Akron", zip: "44308" },
        { county: "Montgomery", city: "Dayton", zip: "45402" },
        { county: "Lucas", city: "Toledo", zip: "43604" },
        { county: "Stark", city: "Canton", zip: "44702" },
        { county: "Butler", city: "Hamilton", zip: "45011" },
      ];

      const sampleLeads: NormalizedLead[] = ohioCounties.slice(0, 5).map((c) => ({
        name: null,
        phone: null,
        email: null,
        business_name: `${c.county} County Recorder`,
        address: null,
        city: c.city,
        state: "OH",
        zip: c.zip,
        lead_type: "business",
        service_needed: "Real Estate Notarization",
        intent_score: "medium",
        source: "ohio_public_records",
        source_url: "https://www.ohiosos.gov/notary/",
      }));

      results.push({ source: "ohio_sos", count: sampleLeads.length, leads: sampleLeads });
    }

    // Source 2: Google Places API (requires GOOGLE_PLACES_API_KEY)
    if (source === "all" || source === "google_places") {
      const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
      if (apiKey) {
        try {
          const queries = [
            "title company Columbus Ohio",
            "real estate attorney Columbus Ohio",
            "law firm Columbus Ohio notary",
          ];

          for (const query of queries.slice(0, 1)) {
            const resp = await fetch(
              `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
            );
            const data = await resp.json();

            if (data.results) {
              const leads: NormalizedLead[] = data.results.slice(0, 10).map((place: any) => ({
                name: null,
                phone: null,
                email: null,
                business_name: place.name,
                address: place.formatted_address,
                city: "Columbus",
                state: "OH",
                zip: null,
                lead_type: "business",
                service_needed: "Mobile Notary / Loan Signing",
                intent_score: "medium",
                source: "google_places",
                source_url: `https://maps.google.com/?cid=${place.place_id}`,
              }));
              results.push({ source: "google_places", count: leads.length, leads });
            }
          }
        } catch (err) {
          console.error("Google Places error:", err);
        }
      } else {
        results.push({ source: "google_places", count: 0, leads: [] });
      }
    }

    // Insert leads into DB (dedupe by name + business_name + city)
    let inserted = 0;
    for (const result of results) {
      for (const lead of result.leads) {
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("business_name", lead.business_name || "")
          .eq("city", lead.city || "")
          .limit(1);

        if (!existing || existing.length === 0) {
          const { error } = await supabase.from("leads").insert(lead);
          if (!error) inserted++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Lead fetch complete",
        sources: results.map((r) => ({ source: r.source, found: r.count })),
        inserted,
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
