import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PaymentMetadataSchema = z.object({
  payment_id: z.string().uuid().optional(),
  appointment_id: z.string().uuid().optional(),
  supabase_user_id: z.string().uuid().optional(),
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
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Idempotency check (item 44) - skip already processed events
    const { data: existingLog } = await supabase
      .from("audit_log")
      .select("id")
      .eq("entity_id", event.id)
      .eq("entity_type", "stripe_webhook")
      .limit(1);

    if (existingLog && existingLog.length > 0) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metaParsed = PaymentMetadataSchema.safeParse(pi.metadata || {});
        const meta = metaParsed.success ? metaParsed.data : {};
        const { payment_id: paymentId, appointment_id: appointmentId } = meta;

        if (paymentId) {
          await supabase.from("payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), method: "stripe", stripe_payment_intent_id: pi.id })
            .eq("id", paymentId);
        } else if (appointmentId) {
          await supabase.from("payments")
            .update({ status: "paid", paid_at: new Date().toISOString(), method: "stripe", stripe_payment_intent_id: pi.id })
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
          await supabase.from("payments").update({ status: "failed" }).eq("id", paymentId);
        } else if (appointmentId) {
          await supabase.from("payments").update({ status: "failed" }).eq("appointment_id", appointmentId).eq("status", "pending");
        }
        break;
      }
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metaParsed = PaymentMetadataSchema.safeParse(pi.metadata || {});
        const meta = metaParsed.success ? metaParsed.data : {};
        const { payment_id: paymentId, appointment_id: appointmentId } = meta;

        if (paymentId) {
          await supabase.from("payments").update({ status: "cancelled" }).eq("id", paymentId);
        } else if (appointmentId) {
          await supabase.from("payments").update({ status: "cancelled" }).eq("appointment_id", appointmentId).eq("status", "pending");
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (piId) {
          const refundAmount = (charge.amount_refunded || 0) / 100;
          await supabase.from("payments")
            .update({ status: "refunded", refund_amount: refundAmount, refunded_at: new Date().toISOString() })
            .eq("stripe_payment_intent_id", piId);
        }
        break;
      }
    }

    // Log webhook event for idempotency and audit (item 44)
    await supabase.from("audit_log").insert({
      action: `stripe_webhook_${event.type}`,
      entity_type: "stripe_webhook",
      entity_id: event.id,
      details: { event_type: event.type, livemode: event.livemode },
    });

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
