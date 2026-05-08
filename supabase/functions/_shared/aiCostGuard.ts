/**
 * Shared AI cost guardrail: per-user rate limiting + standardized 402/429 handling.
 * Used by all AI edge functions to enforce monthly caps and gateway error mapping.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface AiQuotaCheckResult {
  allowed: boolean;
  reason?: string;
  count?: number;
  limit?: number;
}

const DEFAULT_MONTHLY_LIMIT = 500; // safe default per authenticated user
const DEFAULT_ANON_LIMIT = 5;

/** Best-effort per-user monthly quota check via ai_usage_log table. Fails open on errors. */
export async function checkAiQuota(
  userId: string | null,
  functionName: string,
  monthlyLimit = DEFAULT_MONTHLY_LIMIT
): Promise<AiQuotaCheckResult> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return { allowed: true };

    const limit = userId ? monthlyLimit : DEFAULT_ANON_LIMIT;
    const key = userId ?? "anonymous";
    const supabase = createClient(supabaseUrl, serviceKey);

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("ai_usage_log")
      .select("*", { count: "exact", head: true })
      .eq("user_key", key)
      .gte("created_at", monthStart.toISOString());

    if (error) return { allowed: true }; // fail open

    if ((count ?? 0) >= limit) {
      return { allowed: false, reason: "MONTHLY_LIMIT", count: count ?? 0, limit };
    }

    // best-effort log (non-blocking)
    void supabase
      .from("ai_usage_log")
      .insert({ user_key: key, function_name: functionName })
      .then(() => {});

    return { allowed: true, count: count ?? 0, limit };
  } catch {
    return { allowed: true };
  }
}

/** Standard JSON response for AI gateway/quota failures with proper status codes. */
export function aiGuardResponse(
  status: 402 | 429,
  message: string,
  corsHeaders: Record<string, string>,
  retryAfter?: string
) {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };
  if (retryAfter) headers["Retry-After"] = retryAfter;
  const code = status === 402 ? "CREDITS_EXHAUSTED" : "RATE_LIMITED";
  return new Response(JSON.stringify({ error: code, message }), { status, headers });
}

/** Map AI gateway response status to user-friendly error response. */
export function mapAiGatewayError(
  response: Response,
  corsHeaders: Record<string, string>
): Response | null {
  if (response.status === 429) {
    return aiGuardResponse(
      429,
      "AI service is busy. Please retry in a moment.",
      corsHeaders,
      response.headers.get("retry-after") ?? "30"
    );
  }
  if (response.status === 402) {
    return aiGuardResponse(
      402,
      "AI credits exhausted. Please contact your administrator.",
      corsHeaders
    );
  }
  return null;
}
