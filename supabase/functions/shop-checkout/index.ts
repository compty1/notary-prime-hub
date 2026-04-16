/**
 * Shop Checkout — creates Stripe Checkout session for notary package + add-on purchases.
 * Inserts shop_orders row as 'pending' and returns redirect URL.
 * On payment_intent.succeeded webhook, order is marked 'paid' and cart is cleared.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const ItemSchema = z.object({
  item_type: z.enum(["package", "addon"]),
  item_id: z.string().uuid(),
  variation: z.string().max(50).optional().default("complete"),
  quantity: z.number().int().min(1).max(50),
  name: z.string().max(200),
  price: z.number().min(0).max(10000),
});
const BodySchema = z.object({
  items: z.array(ItemSchema).min(1).max(50),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0).max(50000),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rl = rateLimitGuard(req, 20); if (rl) return rl;

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { items, subtotal, tax, total } = parsed.data;

    // Service-role for inserts
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Insert pending order
    const { data: order, error: orderErr } = await adminClient
      .from("shop_orders")
      .insert({
        user_id: user.id,
        items,
        total,
        status: "pending",
      })
      .select("id")
      .single();
    if (orderErr) {
      console.error("shop_orders insert error:", orderErr.message);
      throw new Error("Failed to create order");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") || "https://notardex.com";

    const lineItems = items.map((it) => ({
      price_data: {
        currency: "usd",
        product_data: { name: it.name },
        unit_amount: Math.round(it.price * 100),
      },
      quantity: it.quantity,
    }));
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Tax (est.)" },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: user.email,
      success_url: `${origin}/shop/cart?checkout=success&order=${order.id}`,
      cancel_url: `${origin}/shop/cart?checkout=cancelled`,
      metadata: {
        shop_order_id: order.id,
        supabase_user_id: user.id,
        order_type: "shop",
      },
    });

    // Save session id to order
    await adminClient
      .from("shop_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("shop-checkout error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Checkout failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
