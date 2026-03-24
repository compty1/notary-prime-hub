import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { text, source_language, target_language, document_type, client_name } = await req.json();

    if (!text || !target_language) {
      return new Response(JSON.stringify({ error: "text and target_language are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translationPrompt = `You are a professional document translator. Translate the following document from ${source_language || "the original language"} to ${target_language}. 

Preserve all formatting, paragraph breaks, and document structure. Translate accurately and professionally — this is for official use.

Document type: ${document_type || "General document"}

--- DOCUMENT TO TRANSLATE ---
${text}
--- END DOCUMENT ---

Return ONLY the translated text, preserving formatting.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: translationPrompt }],
        temperature: 0.2,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI request failed: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const translatedText = aiData.choices?.[0]?.message?.content || "";

    // Generate Certificate of Translation Accuracy
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const certificate = `CERTIFICATE OF TRANSLATION ACCURACY

I, Notar, hereby certify that the attached translation from ${source_language || "the source language"} to ${target_language} is a true, accurate, and complete translation of the original document to the best of my knowledge and ability.

Document Type: ${document_type || "General Document"}
${client_name ? `Prepared for: ${client_name}` : ""}
Source Language: ${source_language || "See original"}
Target Language: ${target_language}
Date of Translation: ${today}
Translation Method: AI-assisted with human review

This translation was prepared using AI-assisted technology and reviewed for accuracy.

_________________________
Notar
Ohio Commissioned Notary Public
Franklin County, Ohio

Note: This certificate accompanies the translated document. The notarization of the translator's oath (if required) is a separate service.`;

    return new Response(JSON.stringify({
      translated_text: translatedText,
      certificate,
      source_language: source_language || "auto-detected",
      target_language,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Translation error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
