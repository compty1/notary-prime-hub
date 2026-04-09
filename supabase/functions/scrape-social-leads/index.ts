import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const INDIVIDUAL_QUERIES = [
  '"need a notary" Columbus Ohio',
  '"looking for notary" Columbus',
  '"notary near me" Columbus OH',
  '"mobile notary" Columbus Ohio',
  '"notarize documents" Columbus',
  '"need documents notarized" Ohio',
  '"notary public" Columbus Reddit',
  '"power of attorney" notary Columbus Ohio',
  '"apostille" Columbus Ohio help',
  'site:reddit.com notary Columbus Ohio',
  'site:reddit.com "need notary" Ohio',
  '"notary recommendation" Columbus',
  '"who can notarize" Columbus Ohio',
  '"certified copy" notary Columbus',
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl connector not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check — admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: roleData } = await serviceRoleClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const allResults: any[] = [];

    // Search using Firecrawl - pick 4 random queries to stay within rate limits
    const shuffled = [...INDIVIDUAL_QUERIES].sort(() => Math.random() - 0.5);
    const selectedQueries = shuffled.slice(0, 4);

    for (const query of selectedQueries) {
      try {
        console.log("Searching:", query);
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 5,
            lang: "en",
            country: "us",
            tbs: "qdr:w", // Last week
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Firecrawl search error for "${query}":`, response.status, errText);
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: "Firecrawl credits exhausted. Please top up your Firecrawl account." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          continue;
        }

        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          for (const result of data.data) {
            allResults.push({
              url: result.url,
              title: result.title || "",
              description: result.description || "",
              markdown: result.markdown?.substring(0, 500) || "",
              query,
            });
          }
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Search error for "${query}":`, err);
      }
    }

    if (allResults.length === 0) {
      return new Response(JSON.stringify({ message: "No results found", found: 0, inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate by URL
    const uniqueResults = allResults.filter((r, i, arr) => arr.findIndex(x => x.url === r.url) === i);

    // Use AI to extract lead info from results
    const extractPrompt = `You are a lead extraction assistant. From these web search results, identify INDIVIDUALS who need notary services in the Columbus, Ohio area. Extract actionable lead information.

Search results:
${JSON.stringify(uniqueResults.map(r => ({ url: r.url, title: r.title, snippet: r.description || r.markdown?.substring(0, 300) })), null, 2)}

For each potential lead, return:
- name: person's name if available, otherwise null
- service_needed: what notary service they need (e.g., "Power of Attorney notarization", "Document notarization", "Apostille")
- intent_score: "high" if actively seeking now, "medium" if mentioned needing, "low" if tangentially related
- source_url: the URL where this was found
- notes: brief context about their need (1-2 sentences)
- city: city if mentioned, default "Columbus"

ONLY include results where someone is genuinely seeking notary services. Skip advertisements, notary business listings, and irrelevant results. Return ONLY a JSON array. No markdown.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: extractPrompt }],
        temperature: 0.3,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI extraction failed: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    let leads: any[];
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      leads = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      leads = [];
    }

    let inserted = 0;
    for (const lead of leads) {
      if (!lead.source_url) continue;

      // Dedup by source_url
      const { data: existing } = await serviceRoleClient
        .from("leads")
        .select("id")
        .eq("source_url", lead.source_url)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error } = await serviceRoleClient.from("leads").insert({
        name: lead.name || null,
        city: lead.city || "Columbus",
        state: "OH",
        lead_type: "individual",
        service_needed: lead.service_needed || "Notarization",
        intent_score: lead.intent_score || "medium",
        source: "social_scrape",
        source_url: lead.source_url,
        notes: lead.notes || null,
        status: "new",
      });

      if (!error) inserted++;
    }

    return new Response(JSON.stringify({
      message: "Social lead scrape complete",
      searched: selectedQueries.length,
      results_found: uniqueResults.length,
      leads_extracted: leads.length,
      inserted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Social lead scrape error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
