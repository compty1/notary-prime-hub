import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Validate that the Stripe event has valid metadata when we need it
const PaymentMetadataSchema = z.object({
  payment_id: z.string().uuid().optional(),
  appointment_id: z.string().uuid().optional(),
}).passthrough();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) {
        return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("STRIPE_WEBHOOK_SECRET not configured — skipping signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metaParsed = PaymentMetadataSchema.safeParse(pi.metadata || {});
        const meta = metaParsed.success ? metaParsed.data : {};
        const { payment_id: paymentId, appointment_id: appointmentId } = meta;

        if (paymentId) {
          await supabase
            .from("payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), method: "stripe" })
            .eq("id", paymentId);
        } else if (appointmentId) {
          await supabase
            .from("payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), method: "stripe" })
            .eq("appointment_id", appointmentId)
            .eq("status", "pending");
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metaParsed = PaymentMetadataSchema.safeParse(pi.metadata || {});
        const meta = metaParsed.success ? metaParsed.data : {};
        const { payment_id: paymentId, appointment_id: appointmentId } = meta;

        if (paymentId) {
          await supabase
            .from("payments")
            .update({ status: "failed" })
            .eq("id", paymentId);
        } else if (appointmentId) {
          await supabase
            .from("payments")
            .update({ status: "failed" })
            .eq("appointment_id", appointmentId)
            .eq("status", "pending");
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
