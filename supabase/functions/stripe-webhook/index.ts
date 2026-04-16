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
  referral_professional_id: z.string().uuid().optional(),
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

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: unknown) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        if (meta.order_type === "shop" && meta.shop_order_id) {
          // Mark shop order paid + clear cart
          await supabase.from("shop_orders").update({
            status: "paid",
          }).eq("id", meta.shop_order_id);
          if (meta.supabase_user_id) {
            await supabase.from("shop_cart_items").delete().eq("user_id", meta.supabase_user_id);
            // Authority tier perk: set priority_scheduling on user's future appointments
            const { data: order } = await supabase.from("shop_orders").select("items").eq("id", meta.shop_order_id).maybeSingle();
            const items = (order?.items as any[]) || [];
            const hasAuthority = items.some(i => typeof i?.name === "string" && i.name.toLowerCase().includes("authority"));
            if (hasAuthority) {
              await supabase.from("appointments")
                .update({ priority_scheduling: true })
                .eq("client_id", meta.supabase_user_id)
                .gte("scheduled_date", new Date().toISOString().slice(0, 10));
            }
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metaParsed = PaymentMetadataSchema.safeParse(pi.metadata || {});
        const meta = metaParsed.success ? metaParsed.data : {};
        const { payment_id: paymentId, appointment_id: appointmentId, referral_professional_id: referralProfId } = meta;

        const paidUpdate: Record<string, unknown> = {
          status: "paid",
          paid_at: new Date().toISOString(),
          method: "stripe",
          stripe_payment_intent_id: pi.id,
        };
        if (referralProfId) paidUpdate.referral_professional_id = referralProfId;

        if (paymentId) {
          await supabase.from("payments").update(paidUpdate).eq("id", paymentId);
        } else if (appointmentId) {
          await supabase.from("payments").update(paidUpdate).eq("appointment_id", appointmentId).eq("status", "pending");
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
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const customerId = sub.customer;
        const { data: prof } = await supabase.from("profiles").select("user_id").eq("stripe_customer_id", customerId).limit(1);
        if (prof && prof.length > 0) {
          const userId = prof[0].user_id;
          const plan = sub.status === "active" ? (sub.items?.data?.[0]?.price?.lookup_key || "pro") : "free";
          await supabase.from("profiles").update({ plan } as any).eq("user_id", userId);
          // Sync to user_subscriptions if table exists
          await supabase.from("user_subscriptions" as any).upsert({
            user_id: userId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            plan: sub.items?.data?.[0]?.price?.lookup_key || "pro",
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end || false,
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          }, { onConflict: "stripe_subscription_id" }).then(({ error }) => {
            if (error) console.warn("user_subscriptions upsert:", error.message);
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const customerId = sub.customer;
        const { data: prof } = await supabase.from("profiles").select("user_id").eq("stripe_customer_id", customerId).limit(1);
        if (prof && prof.length > 0) {
          await supabase.from("profiles").update({ plan: "free" } as any).eq("user_id", prof[0].user_id);
          await supabase.from("user_subscriptions" as any)
            .update({ status: "canceled" })
            .eq("stripe_subscription_id", sub.id)
            .then(({ error }) => { if (error) console.warn("sub delete sync:", error.message); });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription;
        if (subId) {
          await supabase.from("user_subscriptions" as any)
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subId)
            .then(({ error }) => { if (error) console.warn("invoice.payment_failed sync:", error.message); });
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subId = invoice.subscription;
        if (subId) {
          await supabase.from("user_subscriptions" as any)
            .update({ status: "active" })
            .eq("stripe_subscription_id", subId)
            .then(({ error }) => { if (error) console.warn("invoice.paid sync:", error.message); });
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

    // Log to webhook_events dashboard table
    await supabase.from("webhook_events").insert({
      source: "stripe",
      event_type: event.type,
      payload: event.data?.object || {},
      status: "processed",
      processed_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.warn("webhook_events log error:", error.message); });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    // REM-025: Log failed webhook to DLQ for retry
    try {
      const supabaseForDlq = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabaseForDlq.from("webhook_events").insert({
        source: "stripe",
        event_type: "processing_error",
        payload: { error: err instanceof Error ? err.message : "Unknown error" },
        status: "failed",
      }).then(({ error: dlqErr }) => { if (dlqErr) console.warn("DLQ log error:", dlqErr.message); });
    } catch (_) { /* best-effort DLQ logging */ }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
