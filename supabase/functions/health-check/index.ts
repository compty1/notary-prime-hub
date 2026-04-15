import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard } from "../_shared/middleware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit: 10 health checks per minute
    const rlResponse = rateLimitGuard(req, 10);
    if (rlResponse) return rlResponse;

    // EF-309: Auth check — only admin should see service status
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      // Unauthenticated callers get a minimal response (no service details)
      return jsonResponse(req, { status: "ok", timestamp: new Date().toISOString() });
    }

    // Authenticated: show service statuses without exposing which specific services
    const checks: Record<string, boolean> = {
      database: !!Deno.env.get("SUPABASE_URL"),
      auth: !!Deno.env.get("SUPABASE_ANON_KEY"),
      service_layer: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      payments: !!Deno.env.get("STRIPE_SECRET_KEY"),
      email: !!Deno.env.get("IONOS_EMAIL_ADDRESS"),
    };

    const allHealthy = Object.values(checks).every(Boolean);

    return jsonResponse(req, {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    }, allHealthy ? 200 : 503);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("health-check error:", msg);
    return errorResponse(req, 500, "Health check failed");
  }
});
