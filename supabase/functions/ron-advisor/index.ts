import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, result } = await req.json();

    if (!scenario || !result) {
      return new Response(JSON.stringify({ error: "Missing scenario or result" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a legal information assistant specializing in Ohio Remote Online Notarization (RON) law. You explain notarization eligibility in plain, clear language for non-lawyers.

CRITICAL RULES:
- You MUST ONLY use the structured analysis data provided. Do NOT invent or cite laws not in the data.
- You are explaining results, not generating legal analysis.
- Use simple language a homeowner or small business owner would understand.
- Always include the disclaimer that this is not legal advice.
- Keep your response under 300 words.
- Structure your response with: a 1-sentence summary, key points, and a clear next step.`;

    const userPrompt = `Here is a notarization scenario and its analysis. Please explain the results in plain language.

SCENARIO:
- Document: ${scenario.document_category} / ${scenario.document_subtype}
- Notarial Act: ${scenario.notarial_act_type}
- Document Use State: ${scenario.document_use_state}
- Signer State: ${scenario.signer_state}
${scenario.requires_apostille ? "- Requires Apostille: Yes" : ""}
${scenario.is_recordable_in_land_records ? "- Recordable in Land Records: Yes" : ""}
${scenario.signer_location_country === "non_us" ? "- Signer Outside US: Yes" : ""}

ANALYSIS RESULT:
- Status: ${result.status} (Risk Level: ${result.risk_level})
- Headline: ${result.headline}
- Ohio Analysis: ${result.notary_state_analysis.notes.join("; ")}
- Receiving State (${result.receiving_state_analysis.state_name}): RON Authorized: ${result.receiving_state_analysis.ron_authorized}, Acceptance: ${result.receiving_state_analysis.acceptance_rating}
- Risk Reasons: ${result.risk_reasons.join("; ")}
- Recommended Actions: ${result.recommended_actions.join("; ")}
- Citations: ${result.citations.join("; ")}

Please provide a clear, friendly explanation of what this means for the user.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI explanation unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Unable to generate explanation.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ron-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
