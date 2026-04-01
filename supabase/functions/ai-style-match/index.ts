const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sample_texts, brief, analyze_only } = await req.json();

    if (!Array.isArray(sample_texts) || sample_texts.length === 0) {
      return new Response(JSON.stringify({ error: "sample_texts array is required (1-5 samples)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sample_texts.length > 5) {
      return new Response(JSON.stringify({ error: "Maximum 5 sample texts" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const samplesContext = sample_texts.map((t: string, i: number) =>
      `=== SAMPLE ${i + 1} ===\n${t.slice(0, 10000)}\n`
    ).join("\n");

    // If analyze_only, just return style analysis
    if (analyze_only) {
      const tools = [{
        type: "function",
        function: {
          name: "style_analysis",
          description: "Return the writing style analysis.",
          parameters: {
            type: "object",
            properties: {
              tone: { type: "string", description: "Overall tone (e.g., formal, conversational, authoritative)" },
              vocabulary_level: { type: "string", enum: ["simple", "intermediate", "advanced", "technical"] },
              sentence_style: { type: "string", description: "Sentence structure patterns" },
              formatting_patterns: { type: "array", items: { type: "string" } },
              key_phrases: { type: "array", items: { type: "string" }, description: "Recurring phrases or idioms" },
              voice: { type: "string", enum: ["active", "passive", "mixed"] },
              perspective: { type: "string", enum: ["first_person", "second_person", "third_person", "mixed"] },
              strengths: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
            },
            required: ["tone", "vocabulary_level", "sentence_style", "summary"],
            additionalProperties: false,
          },
        },
      }];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a writing style analyst. Analyze the provided writing samples and identify the author's unique style, tone, vocabulary, and formatting patterns." },
            { role: "user", content: `Analyze the writing style of these samples:\n\n${samplesContext}` },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "style_analysis" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "AI service is busy." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Style analysis failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "AI did not return analysis" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ analysis: JSON.parse(toolCall.function.arguments) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new document in matched style
    if (!brief || typeof brief !== "string") {
      return new Response(JSON.stringify({ error: "brief is required when generating" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional writer. You must write a new document that precisely matches the writing style, tone, vocabulary, and formatting of the provided sample texts.

Study these samples carefully and mimic:
- Sentence length and structure
- Vocabulary choices and jargon
- Tone and formality level
- Paragraph structure
- Any recurring phrases or patterns
- Formatting conventions (headers, bullets, etc.)

The output should be in markdown format suitable for rich text rendering.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here are the style samples to match:\n\n${samplesContext}\n\nNow write a new document based on this brief:\n${brief}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Style-match generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-style-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
