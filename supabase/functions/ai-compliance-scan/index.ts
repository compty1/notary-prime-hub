import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const BUILT_IN_RULES: Record<string, string> = {
  ohio_orc_147: `You are a compliance auditor specializing in Ohio Revised Code §147 (Notary Public laws).
Check this document for compliance with:
- ORC §147.53: Notary must include commission number, commission expiration date, and county of commission
- ORC §147.542: Electronic notarization must include notary's electronic seal/stamp
- ORC §147.55: Notary certificate must include date of notarization, venue (county and state), and type of notarial act
- ORC §147.541: Notary journal entry requirements for each notarial act
- ORC §147.63: RON sessions require audio-video recording retention for 5 years
- ORC §147.66: Knowledge-Based Authentication (KBA) is required for RON with max 2 attempts
- Proper signer identification requirements
- Witness requirements for certain document types
Flag any missing elements or non-compliant sections.`,

  gdpr: `You are a GDPR compliance auditor. Check this document for:
- Data processing lawful basis declaration
- Data subject rights information
- Data retention periods specified
- Data controller/processor identification
- Cross-border transfer safeguards
- Privacy notice/policy references
- Consent mechanisms where required
- Data breach notification procedures
Flag any missing privacy disclosures or non-compliant data handling.`,

  general_legal: `You are a legal compliance reviewer. Check this document for:
- Missing signature lines or notarization blocks
- Incomplete party identification
- Missing dates or venue information
- Unclear or ambiguous terms
- Missing governing law clause
- Incomplete consideration or payment terms
- Missing dispute resolution mechanisms
- Statute of limitations issues
Flag any gaps that could invalidate the document or create legal risk.`,

  brand_guidelines: `You are a brand compliance reviewer. Check this document for:
- Consistent company name usage
- Proper trademark symbols (™, ®) where needed
- Professional tone and language
- No discriminatory or offensive language
- Proper attribution for quotes or data
- Consistent formatting (headers, fonts mentioned, spacing)
- Professional email/contact information
Flag any brand inconsistencies.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { document_text, rule_set = "general_legal", custom_rules } = await req.json();

    if (!document_text || typeof document_text !== "string") {
      return new Response(JSON.stringify({ error: "document_text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (document_text.length > 100000) {
      return new Response(JSON.stringify({ error: "Document too large. Maximum 100,000 characters." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = custom_rules || BUILT_IN_RULES[rule_set] || BUILT_IN_RULES.general_legal;

    const tools = [
      {
        type: "function",
        function: {
          name: "compliance_results",
          description: "Return compliance scan findings.",
          parameters: {
            type: "object",
            properties: {
              overall_status: { type: "string", enum: ["compliant", "issues_found", "non_compliant"] },
              score: { type: "number", description: "Compliance score 0-100" },
              findings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string", enum: ["critical", "warning", "info"] },
                    rule: { type: "string" },
                    description: { type: "string" },
                    location: { type: "string", description: "Where in the document this issue was found" },
                    source_quote: { type: "string" },
                    suggested_fix: { type: "string" },
                  },
                  required: ["severity", "rule", "description", "suggested_fix"],
                },
              },
              summary: { type: "string" },
            },
            required: ["overall_status", "score", "findings", "summary"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Scan this document for compliance issues:\n\n${document_text}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "compliance_results" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Compliance scan failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured results" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ scan: results, rule_set }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-compliance-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
