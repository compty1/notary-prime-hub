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

    const { z } = await import("https://esm.sh/zod@3.23.8");
    const BodySchema = z.object({
      amount: z.number().positive().max(50000),
      appointmentId: z.string().uuid().optional().default(""),
      description: z.string().max(500).optional().default("Notary service payment"),
      referralProfessionalId: z.string().uuid().nullable().optional().default(null),
      notarialActCount: z.number().int().min(1).max(100).optional().default(1),
      serviceType: z.string().max(100).optional(),
      enforceFeeCap: z.boolean().optional(),
      notaryFeeOnly: z.number().positive().optional(),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { amount: rawAmount, appointmentId, description, referralProfessionalId, notarialActCount, serviceType, enforceFeeCap, notaryFeeOnly } = parsed.data;
    // Zod already validated positive + max 50k
    const amount = Math.round(rawAmount * 100) / 100;

    // Ohio ORC §147.08 fee cap enforcement: $5 per notarial act
    const isNotarialService = serviceType?.toLowerCase()?.includes("notar") || enforceFeeCap;
    if (isNotarialService) {
      const ohioFeeCap = notarialActCount * 5;
      const feeToCheck = notaryFeeOnly ?? amount;
      if (feeToCheck > ohioFeeCap) {
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
        referral_professional_id: referralProfessionalId || "",
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
        referral_professional_id: referralProfessionalId || null,
      });
    }

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("create-payment-intent error:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: "Payment processing failed. Please try again." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
