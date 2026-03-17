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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional OCR transcription engine. Your task is to transcribe the document image into clean, well-formatted HTML that preserves the original document's formatting as closely as possible.

Rules:
- Preserve headings, paragraphs, lists, tables, bold/italic text, and alignment
- Use semantic HTML: <h1>-<h6>, <p>, <ul>/<ol>/<li>, <table>, <strong>, <em>
- Preserve signature lines as underscores: <p>_________________________</p>
- Maintain the document's logical structure and flow
- If text is unclear, use [illegible] placeholder
- Do NOT add any commentary or explanation — return ONLY the HTML content
- Do NOT wrap in \`\`\`html code blocks — return raw HTML`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe this document (${file_name || "uploaded document"}) into formatted HTML, preserving the original layout and formatting.`
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
