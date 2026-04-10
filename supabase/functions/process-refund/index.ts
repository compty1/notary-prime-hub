import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  const start = Date.now();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Audit Item 83: Rate limiting (5 req/min for refunds)
  const rlResponse = rateLimitGuard(req, 5);
  if (rlResponse) return rlResponse;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some(r => r.role === "admin")) return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Validate input with Zod
    const { z } = await import("https://esm.sh/zod@3.23.8");
    const BodySchema = z.object({
      payment_id: z.string().uuid(),
      reason: z.enum(["duplicate", "fraudulent", "requested_by_customer"]).optional().default("requested_by_customer"),
      idempotency_key: z.string().max(100).optional(),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { payment_id, reason, idempotency_key } = parsed.data;

    // Idempotency check — prevent duplicate refunds (Gap 149)
    if (idempotency_key) {
      const { data: existingLog } = await supabase
        .from("audit_log")
        .select("id")
        .eq("action", "payment_refunded")
        .eq("entity_id", payment_id)
        .contains("details", { idempotency_key })
        .limit(1);
      if (existingLog && existingLog.length > 0) {
        return new Response(JSON.stringify({ success: true, message: "Refund already processed (idempotent)" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get payment record
    const { data: payment, error: payErr } = await supabase.from("payments").select("*").eq("id", payment_id).single();
    if (payErr || !payment) return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (payment.status === "refunded") return new Response(JSON.stringify({ success: true, message: "Already refunded" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (payment.status !== "paid") return new Response(JSON.stringify({ error: "Only paid payments can be refunded" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // If Stripe payment, attempt Stripe refund
    let stripeRefundId = null;
    if (payment.stripe_payment_intent_id && stripeKey) {
      const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: { "Authorization": `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: `payment_intent=${payment.stripe_payment_intent_id}&reason=${reason}`,
      });
      const refundData = await refundRes.json();
      if (!refundRes.ok) return new Response(JSON.stringify({ error: "Stripe refund failed", details: refundData }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      stripeRefundId = refundData.id;
    }

    // Update payment status
    await supabase.from("payments").update({
      status: "refunded",
      notes: `${payment.notes || ""}\nRefunded: ${reason}${stripeRefundId ? ` (Stripe: ${stripeRefundId})` : " (Manual)"}`.trim(),
    }).eq("id", payment_id);

    // Audit log with idempotency key
    await supabase.rpc("log_audit_event", {
      _action: "payment_refunded",
      _entity_type: "payments",
      _entity_id: payment_id,
      _details: { amount: payment.amount, reason, stripe_refund_id: stripeRefundId, idempotency_key: idempotency_key || null },
    });

    console.log(`process-refund completed in ${Date.now() - start}ms | payment=${payment_id}`);
    return new Response(JSON.stringify({ success: true, stripe_refund_id: stripeRefundId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(`process-refund error (${Date.now() - start}ms):`, (e as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
