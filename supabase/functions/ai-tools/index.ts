import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard, requireEnvVars } from "../_shared/middleware.ts";

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
  // Resume & missing tools
  "resume-analyzer","executive-summary","proposal-template",
  // Brand & Strategy
  "brand-voice-guide","risk-assessment","competitive-analysis",
  // UX Consulting Tools
  "ux-heuristic-audit","ux-user-journey-map","ux-accessibility-audit",
  "ux-information-architecture","ux-design-system-audit","ux-usability-test-plan",
  "ux-conversion-optimizer","ux-micro-copy","ux-competitive-ux-analysis",
  "ux-wireframe-spec","ux-design-critique","ux-onboarding-flow",
  "ux-form-optimizer","ux-persona-builder","ux-mobile-audit",
  // Financial Operations Tools
  "fin-cash-flow-forecast","fin-pricing-strategy","fin-budget-template",
  "fin-invoice-analyzer","fin-profit-loss","fin-expense-optimizer",
  "fin-tax-prep-checklist","fin-kpi-dashboard","fin-revenue-model",
  "fin-vendor-comparison","fin-collections-playbook","fin-financial-health-check",
  "fin-grant-budget","fin-subscription-analyzer","fin-roi-calculator",
  "fin-payroll-planning","fin-break-even-analysis","fin-quarterly-report",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit: 15 AI tool generations per minute
    const rlResponse = rateLimitGuard(req, 15);
    if (rlResponse) return rlResponse;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(req, 401, "Unauthorized");
    }

    const envErr = requireEnvVars(req, "SUPABASE_URL", "LOVABLE_API_KEY");
    if (envErr) return envErr;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse(req, 401, "Unauthorized");
    }

    const { tool_id, fields, systemPrompt, previousOutput, refinementPrompt } = await req.json();

    if (!tool_id || !TOOL_IDS.has(tool_id)) {
      return errorResponse(req, 400, "Invalid tool_id");
    }

    if (!systemPrompt || !fields) {
      return errorResponse(req, 400, "Missing systemPrompt or fields");
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
        return errorResponse(req, 402, "Usage Limit", "Free plan limit reached. You've used your 2 free AI generations. Upgrade your plan to continue.");
      }
    }

    const fieldEntries = Object.entries(fields as Record<string, string>)
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `**${k}**: ${v}`)
      .join("\n");

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

    if (previousOutput && refinementPrompt) {
      messages.push(
        { role: "assistant", content: previousOutput },
        { role: "user", content: `Please refine the above output with the following instruction:\n\n${refinementPrompt}` }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

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
      const hdrs: Record<string, string> = { ...corsHeaders(req), "Content-Type": "application/json" };
      if (retryAfter) hdrs["Retry-After"] = retryAfter;
      return new Response(JSON.stringify({ error: `AI service error: ${response.status}`, details: errText, retryAfter }), {
        status,
        headers: hdrs,
      });
    }

    // Save generation to database (non-blocking)
    supabase.from("tool_generations").insert({
      user_id: user.id,
      tool_id,
      fields,
      result: "[streaming]",
      is_preset: false,
    }).then(() => {}, () => {});

    return new Response(response.body, {
      headers: {
        ...corsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return errorResponse(req, 500, "Internal Error", (err as Error).message);
  }
});
