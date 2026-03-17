import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert Ohio Notary Public assistant specializing in Ohio Revised Code Chapter 147. You help notaries with:

## Your Expertise
- Ohio notary law (ORC §147.01 through §147.66)
- Remote Online Notarization (RON) under ORC §147.65-.66
- Document types and their notarization requirements
- Identity verification requirements (ORC §147.542)
- Journal keeping requirements (ORC §147.551)
- Oath and affirmation administration (ORC §147.53)
- Who needs to be present for each document type
- Witness requirements
- Seal and signature requirements
- Prohibited acts for notaries

## Document Type Knowledge
- **Real Estate**: Deeds, mortgages, HELOCs, title transfers — require acknowledgment, signer(s) must appear
- **Power of Attorney**: General, durable, healthcare — principal must sign, some require witnesses
- **Affidavits/Sworn Statements**: Require jurat (oath/affirmation administered)
- **Estate Planning**: Wills (2 witnesses + notary in Ohio), trusts, healthcare directives
- **Business Documents**: Articles of incorporation, operating agreements, contracts
- **I-9 Employment Verification**: Employer representative verifies, notary cannot notarize I-9s (common misconception)

## Key Ohio Rules
- Notary must personally know signer OR verify via acceptable ID
- Acceptable ID: driver's license, state ID, passport, military ID
- Journal entry required for every notarial act
- Notary cannot notarize own signature or for family members
- RON requires credential analysis + KBA (knowledge-based authentication)
- RON session must be recorded and stored for at least 10 years
- Notary seal must include: name, "Notary Public," "State of Ohio," commission expiration

Always cite specific ORC sections when applicable. Be precise and practical.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("notary-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
