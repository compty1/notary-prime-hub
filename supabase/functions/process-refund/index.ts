import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    const { payment_id, reason } = await req.json();
    if (!payment_id) return new Response(JSON.stringify({ error: "payment_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get payment record
    const { data: payment, error: payErr } = await supabase.from("payments").select("*").eq("id", payment_id).single();
    if (payErr || !payment) return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (payment.status !== "paid") return new Response(JSON.stringify({ error: "Only paid payments can be refunded" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // If Stripe payment, attempt Stripe refund
    let stripeRefundId = null;
    if (payment.stripe_payment_intent_id && stripeKey) {
      const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: { "Authorization": `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: `payment_intent=${payment.stripe_payment_intent_id}&reason=${reason === "duplicate" ? "duplicate" : reason === "fraudulent" ? "fraudulent" : "requested_by_customer"}`,
      });
      const refundData = await refundRes.json();
      if (!refundRes.ok) return new Response(JSON.stringify({ error: "Stripe refund failed", details: refundData }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      stripeRefundId = refundData.id;
    }

    // Update payment status
    await supabase.from("payments").update({
      status: "refunded",
      notes: `${payment.notes || ""}\nRefunded: ${reason || "Admin-initiated"}${stripeRefundId ? ` (Stripe: ${stripeRefundId})` : " (Manual)"}`.trim(),
    }).eq("id", payment_id);

    // Audit log
    await supabase.rpc("log_audit_event", {
      _action: "payment_refunded",
      _entity_type: "payments",
      _entity_id: payment_id,
      _details: { amount: payment.amount, reason, stripe_refund_id: stripeRefundId },
    });

    return new Response(JSON.stringify({ success: true, stripe_refund_id: stripeRefundId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
