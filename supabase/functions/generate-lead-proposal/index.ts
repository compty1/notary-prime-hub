// EF-301: Migrated from deprecated `serve` to `Deno.serve`
// LP-083: Fixed deprecated import
import { rateLimitGuard } from "../_shared/middleware.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const SYSTEM_PROMPT = `You are a professional proposal writer for Notar, an Ohio-based notary and document services company. Generate polished, persuasive lead outreach proposals.

Company info:
- Name: Notar (Notar.com)
- Location: Columbus, Ohio — serves Franklin County and surrounding areas (4-zone travel model from West Jefferson, OH 43162)
- Services: In-Person Notarization, Remote Online Notarization (RON), Mobile Notary, Loan Signing, Apostille, Document Drafting, I-9 Verification, Certified Copies, Estate Planning Bundles, Process Serving, Business Formation Filing
- Lead Notary: Shane Goble, NNA Certified Notary Signing Agent
- Phone: (614) 300-6890 | Email: contact@notar.com
- Ohio compliance: ORC §147, Secretary of State commissioned

Pricing reference (Central Ohio Competitive Pricing Audit 2026):
- Standard notarization: $5/notarial act (Ohio statutory max ORC §147.08)
- RON sessions: $30/notarial act + $10 technology fee per session ($40-45 typical)
- Mobile notary travel (zone-based from West Jefferson 43162):
  • Zone 1 (0-15 mi): $25 flat
  • Zone 2 (15-30 mi): $35 flat
  • Zone 3 (30-45 mi): $45 flat
  • Zone 4 (45+ mi): $55 + $1.50/mi beyond 45
- Loan signing packages: Standard $125, Purchase $150, Reverse Mortgage $175
- Apostille processing: $175 (includes SOS fee + handling)
- After-hours surcharge: 1.5x base fee (evenings 6pm-9pm), 2x (weekends), 3x (emergency/overnight)
- Facility surcharges: Hospital $20, Jail $75, Government $10
- Additional signers: $15 each beyond first
- Wait time: $20 per 15-minute increment
- Witness fee: $25 per witness (max 2)
- I-9 verification: $35 per form
- Estate planning bundle: $200 (will + POA + directive)
- Cancellation: <2hrs $50, 2-24hrs $25, no-show full fee

Guidelines:
- Address the lead by name/business name
- Reference their specific service need if known
- Include relevant Ohio compliance info (ORC §147)
- Mention RON availability for remote clients
- Include clear next steps and a booking CTA
- Keep it professional but warm
- Include pricing estimates when service is known
- End with contact info and booking link (notar.com/book)
- Do NOT include any explanations outside the proposal text`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const rl = rateLimitGuard(req, 10); if (rl) return rl;

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authUser.id;

    // Check admin or notary role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const userRoles = (roles || []).map((r: { role: string }) => r.role);
    if (!userRoles.includes("admin") && !userRoles.includes("notary")) {
      return new Response(JSON.stringify({ error: "Forbidden — admin or notary role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { leadData, tone = "professional" } = await req.json();

    if (!leadData) {
      return new Response(JSON.stringify({ error: "leadData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Generate a ${tone} service proposal for this lead:

Name: ${leadData.name || "N/A"}
Business: ${leadData.business_name || "N/A"}
Service Needed: ${leadData.service_needed || "General notarization services"}
Location: ${[leadData.city, leadData.state].filter(Boolean).join(", ") || "Ohio"}
Phone: ${leadData.phone || "N/A"}
Email: ${leadData.email || "N/A"}
Lead Type: ${leadData.lead_type || "individual"}
Notes: ${leadData.notes || "None"}

Create a complete, ready-to-send proposal that includes:
1. Professional greeting
2. Introduction of Notar and our qualifications
3. Recommended services based on their needs
4. Pricing estimates
5. Ohio compliance assurance (ORC §147)
6. RON availability if they're remote
7. Clear next steps with booking link
8. Professional sign-off from Shane Goble`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-lead-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
