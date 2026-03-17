import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an Ohio notary public and document specialist assistant. You help clients understand what they need for their specific notarization or document service situation.

Your expertise:
- Ohio notary law (ORC §147)
- Remote Online Notarization (RON) under ORC §147.65-.66
- Document types: real estate, POA, affidavits, I-9, estate planning, apostille
- Required documents, identification, and preparation steps
- Fee estimates based on Ohio notary fee schedules
- Immigration document assistance (notary role only — NOT legal advice)

When answering:
1. Identify the specific service they need
2. List exactly what documents/items to bring
3. Explain whether in-person or RON is appropriate
4. Give practical tips and common pitfalls
5. Provide estimated timeline and cost range
6. Suggest booking the appropriate service

When discussing specific document types (power of attorney, affidavit, travel consent for minor, bill of sale, etc.), mention that templates are available at the /templates page. Reference specific template names when relevant to the user's situation.

When listing required forms or certificates, format them as actionable items the user can find on our templates page. For example: "You can find a Power of Attorney template on our [Templates page](/templates)."

IMPORTANT DISCLAIMERS:
- You are NOT an attorney and cannot provide legal advice
- For complex legal matters, recommend consulting an attorney
- For immigration matters, clarify the notary's limited role
- Always recommend verifying requirements with the relevant agency

Format responses in clear markdown with headers, bullet points, and bold for important items.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, template_context } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (template_context) {
      systemPrompt += `\n\nCurrent template context:\nTemplate: ${template_context.title}\nCategory: ${template_context.category}\nDescription: ${template_context.description}\nFilled fields: ${JSON.stringify(template_context.fields || {})}\n\nAnswer questions specifically about this template and the user's situation.`;
    }

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI assistant unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("client-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
