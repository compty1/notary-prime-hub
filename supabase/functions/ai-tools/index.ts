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
  // Ohio Notary Tools
  "ohio-ron-certificate","ohio-journal-drafter","ohio-acknowledgment-jurat",
  "ron-session-summary","notary-commission-checklist",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const { tool_id, fields, systemPrompt, previousOutput, refinementPrompt } = await req.json();

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

    // ─── Free plan usage cap: 2 free generations ───
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: profileRow } = await adminClient
      .from("profiles")
      .select("plan")
      .eq("user_id", user.id)
      .single();
    const userPlan = (profileRow as Record<string, unknown>)?.plan || "free";
    if (userPlan === "free") {
      const { count } = await adminClient
        .from("tool_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= 2) {
        return new Response(JSON.stringify({ error: "Free plan limit reached. You've used your 2 free AI generations. Upgrade your plan to continue.", code: "USAGE_LIMIT" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const fieldEntries = Object.entries(fields as Record<string, string>)
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `**${k}**: ${v}`)
      .join("\n");

    // Build messages array with multi-turn refinement support
    const messages: Array<{ role: string; content: string }> = [
      {
        role: "system",
        content: systemPrompt + "\n\nIMPORTANT: Output ONLY in markdown format. Use proper markdown tables, headers, bold, italic, lists, code blocks, and blockquotes. Ensure all tables are properly formatted with headers and alignment. Be thorough and complete — do not truncate or abbreviate sections.",
      },
      {
        role: "user",
        content: `Generate the document based on these inputs:\n\n${fieldEntries}`,
      },
    ];

    // Multi-turn refinement: append previous output and refinement instruction
    if (previousOutput && refinementPrompt) {
      messages.push(
        { role: "assistant", content: previousOutput },
        { role: "user", content: `Please refine the above output with the following instruction:\n\n${refinementPrompt}` }
      );
    }

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
        messages,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const status = response.status === 429 ? 429 : response.status === 402 ? 402 : 500;
      const retryAfter = response.headers.get("retry-after");
      const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
      if (retryAfter) headers["Retry-After"] = retryAfter;
      return new Response(JSON.stringify({ error: `AI service error: ${response.status}`, details: errText, retryAfter }), {
        status,
        headers,
      });
    }

    // Save generation to database (non-blocking, fire-and-forget)
    supabase.from("tool_generations").insert({
      user_id: user.id,
      tool_id,
      fields,
      result: "[streaming]",
      is_preset: false,
    }).then(() => {}, () => {});

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
