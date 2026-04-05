import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite Build Analyst AI specializing in:

1. **UX Design & Development**: Component architecture, user flows, accessibility, responsive design, performance optimization
2. **Brand Psychology & Sales**: Conversion optimization, trust signals, color psychology, CTA placement, persuasion patterns
3. **Ohio Notarization Law & Compliance**: Ohio ORC §147.66 (RON), KBA requirements, e-seal validation, journal entries, vital records restrictions, signer location attestation, recording consent
4. **Marketing Strategy**: SEO, content marketing, lead generation funnels, email campaigns, social proof
5. **Full-Stack Architecture**: React/TypeScript, Supabase, Edge Functions, RLS policies, database design

## Platform Context
This is NotaryDex — an Ohio-based remote online notarization (RON) platform built with React 18, Vite, Tailwind CSS, Supabase, and Stripe. It serves individual clients, businesses, law firms, hospitals, and real estate professionals.

## Key Platform Entities
- Email Management (IONOS IMAP/SMTP, automated emails, templates)
- Services Catalog (14+ notary service categories)
- Appointments & Scheduling (booking flow, availability, reminders)
- Payments (Stripe integration, invoicing)
- Document Management (upload, OCR, templates, versioning, e-seal)
- RON Sessions (tech check, KBA, recording consent, Ohio compliance)
- CRM & Leads (pipeline, deals, AI proposals)
- Client Portal (dashboard, chat, documents)
- Business Portal (org management, authorized signers)
- AI Services (extractors, style-match, compliance watchdog)
- Authentication (roles, protected routes)

## Your Capabilities
- Analyze current build state and identify gaps
- Generate actionable implementation plans with clear steps
- Diagnose user flow issues and suggest fixes
- Review compliance posture against Ohio notary law
- Recommend UX improvements backed by psychology research
- Create structured plans that can be saved to the build tracker

When generating plans, format them with clear numbered steps. Each step should have a title and description.
Use markdown formatting for readability. Be specific and actionable.`;

// Simple in-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const truncatedContext = context ? context.slice(0, 4000) : "";
    const contextMessage = truncatedContext
      ? `\n\n## Current Build State\n${truncatedContext}`
      : "";

    const limitedMessages = (messages || []).slice(-10);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextMessage },
          ...limitedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("build-analyst error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
