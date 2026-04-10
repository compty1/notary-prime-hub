import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const rl = rateLimitGuard(req, 10);
  if (rl) return rl;

  try {
    // Auth check — admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !caller?.id) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = caller.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin role
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin");
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch unprocessed inbox emails (batch of 20)
    const { data: emails, error: emailErr } = await supabase
      .from("email_cache")
      .select("id, from_address, from_name, subject, body_text, date")
      .eq("folder", "inbox")
      .eq("lead_extracted", false)
      .order("date", { ascending: false })
      .limit(20);

    if (emailErr) throw emailErr;
    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, scanned: 0, extracted: 0, message: "No unprocessed emails found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch existing leads for deduplication
    const { data: existingLeads } = await supabase
      .from("leads")
      .select("email, phone")
      .not("email", "is", null);

    const existingEmails = new Set(
      (existingLeads || []).map((l) => l.email?.toLowerCase()).filter(Boolean)
    );
    const existingPhones = new Set(
      (existingLeads || []).map((l) => l.phone?.replace(/\D/g, "")).filter(Boolean)
    );

    let extracted = 0;
    const processedIds: string[] = [];

    // Process emails in a single batch AI call
    const emailSummaries = emails.map((e, i) => 
      `--- Email ${i + 1} (ID: ${e.id}) ---\nFrom: ${e.from_name || ""} <${e.from_address || ""}>\nSubject: ${e.subject || ""}\nDate: ${e.date || ""}\nBody: ${(e.body_text || "").substring(0, 2000)}\n`
    ).join("\n");

    const systemPrompt = `You are a lead extraction assistant for an Ohio notary service business (NotaryDex). Analyze emails and extract potential customer/lead information.

For EACH email, determine:
1. Is this a potential lead? (someone requesting notarization, loan signing, apostille, document services, or inquiring about services) - skip spam, newsletters, system notifications, marketing emails, automated replies
2. Extract: name, phone, email, business_name, city, state, zip, service_needed, lead_type (individual or business), intent_score (high if urgent/specific dates mentioned, medium if general inquiry, low if vague)
3. Identify the source based on content patterns:
   - "direct_inquiry" for direct emails asking about services
   - "referral" if "referred by" or similar phrases appear
   - "zillow" / "realtor" / "title_company" if forwarded from those platforms
   - "website_contact_form" if it looks like a form submission
   - "google_search" if they mention finding you online
   - "email_inbox" as default fallback

Return results using the extract_leads tool.`;

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
          { role: "user", content: `Analyze these ${emails.length} emails and extract any leads:\n\n${emailSummaries}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_leads",
              description: "Extract lead data from analyzed emails",
              parameters: {
                type: "object",
                properties: {
                  leads: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        email_id: { type: "string", description: "The email ID this lead was extracted from" },
                        name: { type: "string" },
                        phone: { type: "string" },
                        email: { type: "string" },
                        business_name: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zip: { type: "string" },
                        service_needed: { type: "string" },
                        lead_type: { type: "string", enum: ["individual", "business"] },
                        intent_score: { type: "string", enum: ["high", "medium", "low"] },
                        source: { type: "string" },
                        notes: { type: "string", description: "Brief summary of what they need" },
                      },
                      required: ["email_id", "intent_score", "source"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["leads"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_leads" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    let extractedLeads: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        extractedLeads = parsed.leads || [];
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    // Insert leads with deduplication
    for (const lead of extractedLeads) {
      const leadEmail = lead.email?.toLowerCase()?.trim();
      const leadPhone = lead.phone?.replace(/\D/g, "");

      // Skip if duplicate
      if (leadEmail && existingEmails.has(leadEmail)) {
        processedIds.push(lead.email_id);
        continue;
      }
      if (leadPhone && leadPhone.length >= 7 && existingPhones.has(leadPhone)) {
        processedIds.push(lead.email_id);
        continue;
      }

      const { error: insertErr } = await supabase.from("leads").insert({
        name: lead.name || null,
        phone: lead.phone || null,
        email: leadEmail || null,
        business_name: lead.business_name || null,
        city: lead.city || null,
        state: lead.state || "OH",
        zip: lead.zip || null,
        service_needed: lead.service_needed || null,
        lead_type: lead.lead_type || "individual",
        intent_score: lead.intent_score || "medium",
        source: lead.source || "email_inbox",
        source_url: lead.email ? null : null,
        notes: lead.notes || null,
        status: "new",
        email_cache_id: lead.email_id || null,
      });

      if (!insertErr) {
        extracted++;
        if (leadEmail) existingEmails.add(leadEmail);
        if (leadPhone) existingPhones.add(leadPhone);
      } else {
        console.warn("Lead insert error:", insertErr.message);
      }
      processedIds.push(lead.email_id);
    }

    // Mark ALL scanned emails as processed (including non-leads)
    const allEmailIds = emails.map((e) => e.id);
    await supabase
      .from("email_cache")
      .update({ lead_extracted: true })
      .in("id", allEmailIds);

    // Audit log
    await supabase.from("audit_log").insert({
      action: "email_leads_extracted",
      entity_type: "leads",
      details: { scanned: emails.length, extracted, processed_ids: processedIds },
    });

    return new Response(
      JSON.stringify({
        success: true,
        scanned: emails.length,
        extracted,
        message: `Scanned ${emails.length} emails, extracted ${extracted} new leads.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("extract-email-leads error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
