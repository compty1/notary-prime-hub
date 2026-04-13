import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { data: roleCheck } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });
    }

    const { product_id, product_name, product_type, vendor_name, description } = await req.json();

    if (!product_id || !product_name) {
      return new Response(JSON.stringify({ error: "product_id and product_name required" }), { status: 400, headers: corsHeaders });
    }

    // Use Lovable AI to enrich product details
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), { status: 500, headers: corsHeaders });
    }

    const prompt = `You are a product catalog enrichment AI for a notary and document services business platform. Given the following product information, generate enriched product data.

Product: ${product_name}
Type: ${product_type}
Vendor: ${vendor_name}
Current Description: ${description || "None provided"}

Generate a JSON object with these fields:
- enhanced_description: A compelling 2-3 sentence product description for business customers
- keywords: Array of 5-8 relevant search keywords
- suggested_categories: Array of 2-3 category suggestions
- compliance_notes: Any compliance or regulatory notes relevant to notary/document services (Ohio-specific if applicable)
- upsell_suggestions: Array of 2-3 complementary products that could be cross-sold
- target_audience: Who this product is best suited for

Return ONLY valid JSON, no markdown.`;

    const aiResponse = await fetch("https://ai.lovable.dev/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";

    // Try to parse AI response as JSON
    let enrichmentData: Record<string, unknown>;
    try {
      const cleaned = aiContent.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      enrichmentData = JSON.parse(cleaned);
    } catch {
      enrichmentData = {
        enhanced_description: aiContent.slice(0, 500),
        keywords: [product_type, vendor_name.toLowerCase()],
        parse_error: true,
      };
    }

    // Update the product with enrichment data
    const { error: updateError } = await supabase
      .from("vendor_products")
      .update({
        enrichment_data: enrichmentData,
        enriched_at: new Date().toISOString(),
        description: enrichmentData.enhanced_description
          ? String(enrichmentData.enhanced_description)
          : description,
      })
      .eq("id", product_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, enrichment: enrichmentData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
