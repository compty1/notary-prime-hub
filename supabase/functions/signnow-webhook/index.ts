import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const responseHeaders = {
  "Content-Type": "application/json",
};

// Zod schema for the webhook payload
const WebhookPayloadSchema = z.object({
  event: z.string().optional(),
  action: z.string().optional(),
  content: z.object({
    document_id: z.string().optional(),
  }).passthrough().optional(),
  document_id: z.string().optional(),
  meta: z.object({
    document_id: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

async function verifyWebhookSignature(body: string, signature: string | null): Promise<boolean> {
  const secret = Deno.env.get("SIGNNOW_WEBHOOK_SECRET");
  if (!secret) {
    console.warn("SIGNNOW_WEBHOOK_SECRET not configured — skipping signature verification");
    return true;
  }
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: responseHeaders,
    });
  }

  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-signnow-signature") || req.headers.get("x-event-hash");

    const valid = await verifyWebhookSignature(bodyText, signature);
    if (!valid) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: responseHeaders,
      });
    }

    // Validate payload shape
    const parseResult = WebhookPayloadSchema.safeParse(JSON.parse(bodyText));
    if (!parseResult.success) {
      console.error("Invalid webhook payload:", parseResult.error.flatten());
      return new Response(JSON.stringify({ error: "Invalid payload", details: parseResult.error.flatten().fieldErrors }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    const body = parseResult.data;
    console.log("SignNow webhook received:", JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const event = body.event || body.action;
    const documentId = body.content?.document_id || body.document_id || body.meta?.document_id;

    if (!documentId) {
      console.log("No document_id in webhook payload");
      return new Response(JSON.stringify({ ok: true, message: "No document_id" }), {
        headers: responseHeaders,
      });
    }

    const { data: session } = await supabase
      .from("notarization_sessions")
      .select("*, appointments(*)")
      .eq("signnow_document_id", documentId)
      .single();

    if (!session) {
      console.log("No matching session found for SignNow document:", documentId);
      return new Response(JSON.stringify({ ok: true, message: "No matching session" }), {
        headers: responseHeaders,
      });
    }

    const appointmentId = session.appointment_id;

    if (event === "document.complete" || event === "document.signed") {
      await supabase.from("notarization_sessions").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        id_verified: true,
        kba_completed: true,
      }).eq("id", session.id);

      await supabase.from("appointments").update({
        status: "completed",
      }).eq("id", appointmentId);

      await supabase.from("documents").update({
        status: "notarized",
      }).eq("appointment_id", appointmentId);

      if (session.appointments) {
        const appt = session.appointments;
        await supabase.from("payments").insert({
          client_id: appt.client_id,
          appointment_id: appointmentId,
          amount: appt.estimated_price || 5,
          status: "pending",
          notes: `RON session completed via SignNow — ${appt.service_type}`,
        });
      }

      await supabase.from("audit_log").insert({
        action: "ron_session_completed_webhook",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: { signnow_document_id: documentId, event },
      });

    } else if (event === "document.update" || event === "document.viewed") {
      await supabase.from("notarization_sessions").update({
        status: "in_session",
        started_at: session.started_at || new Date().toISOString(),
      }).eq("id", session.id);

      await supabase.from("appointments").update({
        status: "in_session",
      }).eq("id", appointmentId);

    } else if (event === "invite.update" || event === "invite.sent") {
      await supabase.from("audit_log").insert({
        action: "signnow_invite_update",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: { signnow_document_id: documentId, event, content: body.content },
      });

    } else if (event === "document.cancel" || event === "invite.cancel") {
      await supabase.from("notarization_sessions").update({
        status: "cancelled",
      }).eq("id", session.id);

      await supabase.from("appointments").update({
        status: "cancelled",
      }).eq("id", appointmentId);

    } else {
      console.log("Unhandled SignNow event:", event);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("SignNow webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});
