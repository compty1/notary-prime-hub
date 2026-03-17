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

    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

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
            content: "You extract information from government-issued photo IDs. Return ONLY a JSON object with these fields: full_name (string), date_of_birth (string, YYYY-MM-DD), id_number (string), id_type (string - e.g. 'Driver License', 'Passport', 'State ID'), expiration_date (string, YYYY-MM-DD), address (string or null), state (string or null). If any field cannot be determined, use null. If the image is not an ID, return {\"error\": \"Not a valid ID document\"}."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all information from this government-issued photo ID:" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_id_info",
              description: "Extract structured data from a government-issued photo ID",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string", description: "Full name on the ID" },
                  date_of_birth: { type: "string", description: "Date of birth in YYYY-MM-DD format" },
                  id_number: { type: "string", description: "ID/license number" },
                  id_type: { type: "string", description: "Type of ID (Driver License, Passport, State ID)" },
                  expiration_date: { type: "string", description: "Expiration date in YYYY-MM-DD format" },
                  address: { type: "string", description: "Address on the ID" },
                  state: { type: "string", description: "State of issuance" },
                  is_expired: { type: "boolean", description: "Whether the ID is expired based on expiration date" },
                  error: { type: "string", description: "Error message if image is not a valid ID" }
                },
                required: ["full_name", "id_type"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_id_info" } }
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
      const idInfo = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(idInfo), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Could not extract ID information" }), {
      status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-id error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
