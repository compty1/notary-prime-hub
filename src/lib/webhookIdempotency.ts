/**
 * SVC-101/455: Webhook idempotency utilities
 * Prevents duplicate processing of Stripe webhook events
 */
import { supabase } from "@/integrations/supabase/client";

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("audit_log")
    .select("id")
    .eq("entity_type", "webhook_event")
    .eq("entity_id", eventId)
    .maybeSingle();
  return !!data;
}

export async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  await supabase.from("audit_log").insert({
    action: `webhook.${eventType}`,
    entity_type: "webhook_event",
    entity_id: eventId,
    details: { processed_at: new Date().toISOString() },
  });
}

/** Map Stripe event types to internal appointment statuses */
export const STRIPE_EVENT_STATUS_MAP: Record<string, string> = {
  "payment_intent.succeeded": "paid",
  "payment_intent.payment_failed": "payment_failed",
  "charge.refunded": "refunded",
  "charge.dispute.created": "disputed",
  "invoice.paid": "paid",
  "invoice.payment_failed": "payment_failed",
  "checkout.session.completed": "paid",
  "customer.subscription.created": "active",
  "customer.subscription.updated": "active",
  "customer.subscription.deleted": "cancelled",
};
