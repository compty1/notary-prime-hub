/**
 * Zapier/Make webhook endpoint configuration.
 * Enhancement #93 (Zapier/Make.com integration)
 */

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export const WEBHOOK_EVENTS = [
  "appointment.created",
  "appointment.confirmed",
  "appointment.completed",
  "appointment.cancelled",
  "payment.received",
  "payment.failed",
  "document.uploaded",
  "document.signed",
  "client.registered",
  "lead.captured",
  "review.submitted",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Build a webhook payload */
export function buildWebhookPayload(event: WebhookEvent, data: Record<string, unknown>): WebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
}

/** Send webhook to a registered URL (called from edge functions) */
export async function dispatchWebhook(url: string, payload: WebhookPayload, secret?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(payload)));
      headers["X-Webhook-Signature"] = btoa(String.fromCharCode(...new Uint8Array(sig)));
    }
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    return res.ok;
  } catch {
    return false;
  }
}
