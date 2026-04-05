import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL_IDS = new Set([
  "contract-generator","meeting-minutes","business-proposal","policy-generator",
  "invoice-generator","tech-docs","board-report","training-manual","sop-generator",
  "case-study","whitepaper","job-description","project-charter","api-docs","changelog",
  "sentiment-analyzer","contract-risk","financial-summarizer","competitor-analysis",
  "data-insight","survey-analyzer","meeting-cost","churn-risk","pricing-strategy",
  "email-campaign","press-release","client-communication","pitch-deck",
  "crisis-communication","newsletter","social-media-planner","rfp-response",
  "gdpr-policy","audit-checklist","risk-register","compliance-gap","dpa-generator",
  "incident-report","brand-voice","market-research","strategic-plan","okr-generator",
  "value-proposition","ab-test-planner","user-persona","business-model-canvas",
  "swot-deep-dive","product-roadmap",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tool_id, fields, systemPrompt } = await req.json();

    if (!tool_id || !TOOL_IDS.has(tool_id)) {
      return new Response(JSON.stringify({ error: "Invalid tool_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!systemPrompt || !fields) {
      return new Response(JSON.stringify({ error: "Missing systemPrompt or fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fieldEntries = Object.entries(fields as Record<string, string>)
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `**${k}**: ${v}`)
      .join("\n");

    const userMessage = `Generate the document based on these inputs:\n\n${fieldEntries}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt + "\n\nIMPORTANT: Output ONLY in markdown format. Use proper markdown tables, headers, bold, italic, lists, code blocks, and blockquotes. Ensure all tables are properly formatted with headers and alignment. Be thorough and complete — do not truncate or abbreviate sections." },
          { role: "user", content: userMessage },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: `AI service error: ${response.status}`, details: errText }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
