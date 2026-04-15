import { rateLimitGuard } from "../_shared/middleware.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rl = rateLimitGuard(req, 15); if (rl) return rl;

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { z } = await import("https://esm.sh/zod@3.23.8");
    const BodySchema = z.object({
      text: z.string().min(10).max(50000),
      document_type: z.string().max(100).optional(),
      document_name: z.string().max(500).optional(),
      standard: z.string().max(100).optional(),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { text, document_type, document_name, standard } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert Ohio notary compliance auditor. Analyze the provided document text and grade it against these standards:

1. Ohio ORC §147.541-147.66 (Notary Public Act)
2. General document execution standards (signatures, dates, witness requirements)
3. Real estate lending compliance (if applicable)

Return a JSON object with this exact structure:
{
  "overall_score": <number 0-100>,
  "grade_letter": "<A|B|C|D|F>",
  "findings": [
    {
      "category": "<string: signer_id | certificate | venue | seal | execution | compliance>",
      "issue": "<string: description of the issue>",
      "severity": "<High|Medium|Low>",
      "recommendation": "<string: how to fix>"
    }
  ],
  "summary": "<string: 2-3 sentence summary>"
}

Grading scale: A=90-100, B=80-89, C=70-79, D=60-69, F=0-59.
Be thorough but fair. Check for: signer identification, notarial certificate completeness, venue/date, seal requirements, acknowledgment vs jurat correctness, proper capacity statements.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Document type: ${document_type || "unknown"}\nStandard: ${standard || "ohio_orc_147"}\n\nDocument text:\n${text.substring(0, 15000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "grade_document",
            description: "Return compliance grading results",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                grade_letter: { type: "string", enum: ["A", "B", "C", "D", "F"] },
                findings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      issue: { type: "string" },
                      severity: { type: "string", enum: ["High", "Medium", "Low"] },
                      recommendation: { type: "string" },
                    },
                    required: ["category", "issue", "severity", "recommendation"],
                  },
                },
                summary: { type: "string" },
              },
              required: ["overall_score", "grade_letter", "findings", "summary"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "grade_document" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "AI credits depleted. Add funds in Settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No grading response from AI");

    const grading = JSON.parse(toolCall.function.arguments);

    // Save to DB
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await adminClient.from("ai_document_grades").insert({
      user_id: user.id,
      document_name: document_name || "Unnamed Document",
      document_type: document_type || null,
      overall_score: grading.overall_score,
      grade_letter: grading.grade_letter,
      findings: grading.findings,
      compliance_standard: standard || "ohio_orc_147",
    });

    return new Response(JSON.stringify(grading), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
