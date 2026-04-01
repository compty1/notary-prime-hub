const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const checks: Record<string, boolean> = {
      supabase_url: !!Deno.env.get("SUPABASE_URL"),
      supabase_anon_key: !!Deno.env.get("SUPABASE_ANON_KEY"),
      supabase_service_role_key: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      stripe_configured: !!Deno.env.get("STRIPE_SECRET_KEY"),
      ionos_configured: !!Deno.env.get("IONOS_EMAIL_ADDRESS"),
    };

    const allHealthy = Object.values(checks).every(Boolean);

    return new Response(
      JSON.stringify({
        status: allHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        checks,
      }),
      {
        status: allHealthy ? 200 : 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("health-check error:", err.message);
    return new Response(
      JSON.stringify({ status: "error", error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
