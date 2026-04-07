import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert Ohio Notary Public assistant for the **NotarDex** team (NotarDex.com), specializing in Ohio Revised Code Chapter 147. You help notaries with:

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
- SignNow platform usage and session management

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

## SignNow Platform
- Document-centric flow: upload_document → add_fields → send_invite → document viewed → document signed → completed
- Documents uploaded via POST /document, signing fields added via PUT /document/{id}
- Invites sent via POST /document/{id}/invite with signer email and role
- Signed documents downloaded via GET /document/{id}/download?type=collapsed
- Webhooks notify on document.complete, invite.update events

Always cite specific ORC sections when applicable. Be precise and practical. Format responses with clear markdown.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "notary"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Admin or notary access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Support both { messages: [...] } and legacy { prompt/message: "..." } formats
    let messages: { role: string; content: string }[];
    let streaming = true;

    if (body.messages && Array.isArray(body.messages)) {
      // Filter out empty assistant messages (from streaming state) and validate
      const cleaned = body.messages.filter(
        (m: any) => m && typeof m.content === "string" && m.content.trim().length > 0
      );
      if (cleaned.length === 0) {
        return new Response(JSON.stringify({ error: "At least one non-empty message is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      messages = cleaned.slice(-50).map((m: any) => ({
        role: ["user", "assistant", "system"].includes(m.role) ? m.role : "user",
        content: String(m.content).slice(0, 50000),
      }));
    } else if (body.prompt || body.message) {
      const text = (body.prompt || body.message || "").toString().slice(0, 50000);
      if (!text.trim()) {
        return new Response(JSON.stringify({ error: "prompt or message is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      messages = [{ role: "user", content: text }];
      streaming = false; // Legacy callers expect JSON, not streaming
    } else {
      return new Response(JSON.stringify({ error: "messages, prompt, or message is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
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
        stream: streaming,
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

    // Streaming mode: return SSE stream directly
    if (streaming) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Non-streaming (legacy) mode: parse and return JSON
    const aiResult = await response.json();
    const reply = aiResult.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ reply, text: reply, response: reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notary-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
