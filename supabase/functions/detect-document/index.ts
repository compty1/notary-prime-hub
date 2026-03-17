import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { imageBase64, fileName } = await req.json();
    if (!imageBase64) throw new Error("No document image provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at identifying legal documents that need notarization under Ohio law (ORC §147). Analyze the document and determine the correct notarization requirements.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this document${fileName ? ` (filename: ${fileName})` : ''} and determine what type of notarization is needed:` },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_document",
              description: "Analyze a document and determine notarization requirements",
              parameters: {
                type: "object",
                properties: {
                  document_type: { type: "string", description: "Category: Real Estate, Legal, Estate Planning, Business, Personal, Other" },
                  document_name: { type: "string", description: "Specific document name (e.g. Quit Claim Deed, Power of Attorney)" },
                  notarization_method: { type: "string", enum: ["acknowledgment", "jurat", "oath", "copy_certification"], description: "Required notarization method" },
                  signers_required: { type: "number", description: "Number of signers needed" },
                  witnesses_required: { type: "number", description: "Number of witnesses needed under Ohio law" },
                  who_must_be_present: { type: "array", items: { type: "string" }, description: "List of who must be physically/virtually present" },
                  special_requirements: { type: "array", items: { type: "string" }, description: "Any special Ohio requirements or warnings" },
                  ron_eligible: { type: "boolean", description: "Whether this document can be notarized via RON" },
                  estimated_time_minutes: { type: "number", description: "Estimated time for the notarization" },
                  confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence in the document identification" }
                },
                required: ["document_type", "document_name", "notarization_method", "signers_required", "witnesses_required", "who_must_be_present", "ron_eligible", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_document" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not analyze document" }), {
      status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
