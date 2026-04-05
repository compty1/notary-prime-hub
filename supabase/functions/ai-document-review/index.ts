import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { documentText, documentType, checkType } = await req.json();

    if (!documentText || typeof documentText !== "string") {
      return new Response(JSON.stringify({ error: "documentText is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an Ohio notary document compliance reviewer. Analyze the provided document for:

1. **Missing Fields**: Signatures, dates, printed names, notary blocks
2. **Expired Information**: Check dates that may have passed
3. **Ohio Compliance**: Missing notary block, wrong venue format, missing ORC citations
4. **Format Issues**: Incomplete sections, missing pages indicators, improper formatting
5. **Identity Requirements**: Missing ID references, incomplete signer information

Output a structured JSON response with this exact format:
{
  "overallStatus": "pass" | "warning" | "fail",
  "score": 0-100,
  "findings": [
    {
      "severity": "critical" | "warning" | "info",
      "category": "missing_field" | "expired" | "compliance" | "format" | "identity",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Brief overall assessment"
}

Be thorough but practical. Focus on actionable findings.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Document type: ${documentType || "Unknown"}\nCheck type: ${checkType || "full"}\n\nDocument content:\n${documentText.substring(0, 15000)}` },
        ],
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "AI review failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let review;
    try {
      review = JSON.parse(content);
    } catch {
      review = {
        overallStatus: "warning",
        score: 50,
        findings: [{ severity: "info", category: "format", message: "Could not fully parse document", suggestion: "Please try again with a cleaner document format" }],
        summary: content,
      };
    }

    return new Response(JSON.stringify(review), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
