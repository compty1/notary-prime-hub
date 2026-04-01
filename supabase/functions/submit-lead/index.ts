import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^[\d\s()+\-\.]{7,20}$/;

/* ─── IP-based rate limiting (in-memory, per-isolate) ─── */
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 5; // max 5 submissions per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

const ALLOWED_SOURCES = [
  "coming_soon",
  "website_contact_form",
  "loan_signing_inquiry",
  "provider_application",
  "chatbot",
];

const SOURCE_LEAD_TYPE: Record<string, string> = {
  coming_soon: "individual",
  website_contact_form: "individual",
  loan_signing_inquiry: "business",
  provider_application: "notary",
  chatbot: "individual",
};

function sanitize(val: unknown, maxLen: number): string | null {
  if (val == null || val === "") return null;
  const s = String(val).trim().slice(0, maxLen);
  // Strip HTML tags
  return s.replace(/<[^>]*>/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Server-side rate limiting by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Validate source
    const source = String(body.source || "").trim();
    if (!ALLOWED_SOURCES.includes(source)) {
      return new Response(
        JSON.stringify({ error: "Invalid source" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate & sanitize fields
    const email = sanitize(body.email, 255);
    if (email && !EMAIL_RE.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phone = sanitize(body.phone, 20);
    if (phone && !PHONE_RE.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = sanitize(body.name, 100);
    const businessName = sanitize(body.business_name, 200);
    const serviceNeeded = sanitize(body.service_needed, 200);
    const notes = sanitize(body.notes, 1000);
    const address = sanitize(body.address, 300);
    const city = sanitize(body.city, 100);
    const state = sanitize(body.state, 50) || "OH";
    const zip = sanitize(body.zip, 10);

    const leadType = SOURCE_LEAD_TYPE[source] || "individual";

    // Insert using service role to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("leads").insert({
      source,
      status: "new",
      lead_type: leadType,
      name,
      email,
      phone,
      business_name: businessName,
      service_needed: serviceNeeded,
      notes,
      address,
      city,
      state,
      zip,
    });

    if (error) {
      console.error("Lead insert error:", error.message);
      return new Response(
        JSON.stringify({ error: "Failed to submit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("submit-lead error:", err);
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
