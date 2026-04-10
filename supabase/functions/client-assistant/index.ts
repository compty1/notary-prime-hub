import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const SYSTEM_PROMPT = `You are an Ohio notary public and document specialist assistant for **Notar** (NotarDex.com), a professional notary and document services company based in Columbus, Ohio. You help clients understand what they need for their specific notarization or document service situation.

## About Notar
Notar is a team of Ohio-commissioned notaries providing professional notarization, document management, and business services throughout central Ohio and nationwide via Remote Online Notarization (RON). Led by Notar, an NNA Certified Notary Signing Agent, Notar delivers secure, convenient, and fully compliant services.

Your expertise:
- Ohio notary law (ORC §147)
- Remote Online Notarization (RON) under ORC §147.65-.66
- Document types: real estate, POA, affidavits, I-9, estate planning, apostille
- Document Translation services with Certificate of Translation Accuracy
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

When someone asks about document translation:
- We offer AI-powered document translation with a Certificate of Translation Accuracy
- Supported for birth certificates, marriage certificates, diplomas, immigration documents, and more
- Translated documents can be notarized if needed for official use
- Direct them to book "Document Translation" service at /book?service=Document%20Translation
- They can upload their document for instant translation in their portal

When someone asks about I-9 or employment verification, explain List A, List B, and List C acceptable documents:
- List A proves both identity AND work authorization (US Passport, Green Card, EAD, foreign passport with I-94)
- List B proves identity only (driver's license, state ID, school ID with photo, voter card)
- List C proves work authorization only (Social Security card, birth certificate, Certification of Birth Abroad)
- They need EITHER one List A document OR one List B + one List C document

IMPORTANT DISCLAIMERS:
- You are NOT an attorney and cannot provide legal advice
- For complex legal matters, recommend consulting an attorney
- For immigration matters, clarify the notary's limited role
- Always recommend verifying requirements with the relevant agency

Format responses in clear markdown with headers, bullet points, and bold for important items. Use proper formatting to make responses easy to scan.`;

const BodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(10000),
  })).min(1).max(50),
  template_context: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    fields: z.record(z.unknown()).optional(),
  }).optional(),
});

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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { messages, template_context } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
