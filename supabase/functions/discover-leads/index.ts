import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, searchQueries } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "discover") {
      const queries = searchQueries || [
        "title company Columbus Ohio needs notary",
        "real estate closing attorney Franklin County Ohio",
        "law firm Columbus Ohio document notarization",
        "mortgage company Columbus Ohio loan signing agent",
        "estate planning attorney Columbus Ohio",
      ];

      const aiPrompt = `You are a lead generation assistant for a notary public business in Columbus/Franklin County, Ohio.
      
Given these business search queries: ${JSON.stringify(queries)}

Generate 15 realistic potential business leads that would need notary services in the Columbus, Ohio area. For each lead, provide:
- business_name: company name
- city: city in Ohio (focus on Columbus metro)
- state: "OH"
- zip: realistic Ohio zip code
- service_needed: specific notary service they'd need
- intent_score: "high", "medium", or "low" based on likelihood
- lead_type: "business" or "individual"
- notes: brief reason why they're a good lead

Return ONLY a JSON array of objects with these exact fields. No markdown, no explanation.`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.7,
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await aiResp.text();
        console.error("AI gateway error:", aiResp.status, errText);
        throw new Error(`AI request failed: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || "[]";
      
      let leads;
      try {
        const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        leads = JSON.parse(jsonStr);
      } catch {
        leads = [];
      }

      let inserted = 0;
      for (const lead of leads) {
        if (!lead.business_name) continue;
        
        const { data: existing } = await serviceRoleClient
          .from("leads")
          .select("id")
          .eq("business_name", lead.business_name)
          .eq("city", lead.city || "Columbus")
          .limit(1);

        if (!existing || existing.length === 0) {
          const { error } = await serviceRoleClient.from("leads").insert({
            business_name: lead.business_name,
            city: lead.city || "Columbus",
            state: lead.state || "OH",
            zip: lead.zip || null,
            lead_type: lead.lead_type || "business",
            service_needed: lead.service_needed || null,
            intent_score: lead.intent_score || "medium",
            source: "ai_discovery",
            notes: lead.notes || null,
            status: "new",
          });
          if (!error) inserted++;
        }
      }

      return new Response(
        JSON.stringify({ message: "AI lead discovery complete", found: leads.length, inserted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "enrich") {
      const { data: leadsToEnrich } = await serviceRoleClient
        .from("leads")
        .select("*")
        .is("phone", null)
        .is("email", null)
        .limit(10);

      if (!leadsToEnrich || leadsToEnrich.length === 0) {
        return new Response(
          JSON.stringify({ message: "No leads to enrich", enriched: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const enrichPrompt = `For these businesses in Ohio, suggest the most likely contact approach and any public information you know about them. Return a JSON array with objects containing: id, suggested_phone_search (search query to find their phone), suggested_email_domain, outreach_tip.

Businesses: ${JSON.stringify(leadsToEnrich.map(l => ({ id: l.id, name: l.business_name, city: l.city })))}

Return ONLY a JSON array. No markdown.`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: enrichPrompt }],
          temperature: 0.3,
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI enrichment failed");
      }

      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || "[]";
      
      let enrichments;
      try {
        const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        enrichments = JSON.parse(jsonStr);
      } catch {
        enrichments = [];
      }

      let enriched = 0;
      for (const e of enrichments) {
        if (!e.id) continue;
        const notes = `Outreach: ${e.outreach_tip || "N/A"} | Search: ${e.suggested_phone_search || ""} | Domain: ${e.suggested_email_domain || ""}`;
        const { error } = await serviceRoleClient
          .from("leads")
          .update({ notes } as any)
          .eq("id", e.id);
        if (!error) enriched++;
      }

      return new Response(
        JSON.stringify({ message: "Lead enrichment complete", enriched }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'discover' or 'enrich'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI lead discovery error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});