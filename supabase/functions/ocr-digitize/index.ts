import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { image_base64, file_name } = await req.json();
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "image_base64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are a professional OCR transcription engine specializing in legal and notarial documents. Your task is to transcribe the document image into clean, richly formatted HTML that faithfully reproduces the original document's visual layout, spacing, and typography.

Formatting Rules:
- Wrap the entire output in <div style="font-family: 'Times New Roman', Georgia, serif; line-height: 1.8; color: #1a1a1a; max-width: 800px; margin: 0 auto;">
- Preserve headings using <h1>–<h6> with appropriate font-size and margin-bottom (e.g., style="font-size: 18px; margin-bottom: 16px; font-weight: bold; text-align: center;")
- Use <p> tags with style="margin-bottom: 12px;" for standard paragraphs
- Preserve indentation using style="padding-left: 2em;" or style="text-indent: 2em;" where the original document shows indented text
- Use <br/> for intentional line breaks within the same paragraph (e.g., address blocks, letterhead)
- Preserve alignment: use style="text-align: center;" or "text-align: right;" where applicable
- Use <strong> for bold text, <em> for italic text
- Use <ul>/<ol>/<li> for lists with style="margin-bottom: 8px; padding-left: 1.5em;"
- Preserve tables using <table style="width: 100%; border-collapse: collapse; margin: 16px 0;"> with <th>/<td> styled with border and padding
- Signature lines: <p style="margin-top: 32px; border-bottom: 1px solid #000; width: 60%; display: inline-block;">&nbsp;</p>
- For letter-spaced text (common in titles), use style="letter-spacing: 0.15em;"
- For right-aligned dates or reference numbers, use style="text-align: right;"
- Add style="page-break-before: always;" if the document clearly has multiple pages
- Preserve any numbered clauses with proper hanging indentation: style="padding-left: 3em; text-indent: -1.5em;"

Content Rules:
- If text is unclear, use <span style="color: #999; font-style: italic;">[illegible]</span>
- Do NOT add any commentary, explanation, or extra content
- Return ONLY the HTML content — no \`\`\`html code blocks
- Maintain the exact document structure, paragraph breaks, and logical flow`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe this document (${file_name || "uploaded document"}) into richly formatted HTML. Carefully preserve the original layout including margins, indentation, alignment, spacing between sections, and any visual hierarchy.`
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image_base64}` }
              }
            ]
          }
        ],
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
      return new Response(JSON.stringify({ error: "OCR processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const html = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ html, file_name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-digitize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
