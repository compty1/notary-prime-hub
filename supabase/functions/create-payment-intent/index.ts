import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Audit Item 47: Rate limiting (20 req/min for payment creation)
  const rlResponse = rateLimitGuard(req, 20);
  if (rlResponse) return rlResponse;

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.error("create-payment-intent auth error:", userErr?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;
    const userEmail = user.email || "";

    const body = await req.json();
    const rawAmount = Number(body.amount);
    const appointmentId = body.appointmentId || "";
    const description = body.description || "Notary service payment";

    // Validate amount: must be positive, max $50k, max 2 decimal places
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return new Response(JSON.stringify({ error: "Amount must be greater than $0" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (rawAmount > 50000) {
      return new Response(JSON.stringify({ error: "Amount exceeds maximum ($50,000)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const amount = Math.round(rawAmount * 100) / 100; // round to 2 decimal places

    // Ohio ORC §147.08 fee cap enforcement: $5 per notarial act
    // Always enforce for notarization services
    const notarialActCount = Number(body.notarialActCount) || 1;
    const isNotarialService = body.serviceType?.toLowerCase()?.includes("notar") || body.enforceFeeCap;
    if (isNotarialService) {
      const ohioFeeCap = notarialActCount * 5;
      const notaryFeeOnly = Number(body.notaryFeeOnly) || amount;
      if (notaryFeeOnly > ohioFeeCap) {
        return new Response(JSON.stringify({ error: `Notarization fee exceeds Ohio statutory cap of $${ohioFeeCap.toFixed(2)} for ${notarialActCount} act(s) per ORC §147.08. The notary fee portion must not exceed $5 per act.` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name, email")
      .eq("user_id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", userId);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      customer: customerId,
      metadata: {
        supabase_user_id: userId,
        appointment_id: appointmentId || "",
        description: (description || "").slice(0, 500),
      },
      description: description || "Notary service payment",
      automatic_payment_methods: { enabled: true },
    });

    if (appointmentId) {
      await supabase.from("payments").insert({
        client_id: userId,
        appointment_id: appointmentId,
        amount,
        status: "pending",
        method: "stripe",
        notes: `Stripe PI: ${paymentIntent.id}`,
      });
    }

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("create-payment-intent error:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: "Payment processing failed. Please try again." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
