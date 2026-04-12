import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const responseHeaders = {
  "Content-Type": "application/json",
};

const WebhookPayloadSchema = z.object({
  event: z.string().optional(),
  action: z.string().optional(),
  content: z.object({
    document_id: z.string().optional(),
    document_name: z.string().optional(),
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
    const documentName = body.content?.document_name || "";

    if (!documentId) {
      console.log("No document_id in webhook payload");
      return new Response(JSON.stringify({ ok: true, message: "No document_id" }), {
        headers: responseHeaders,
      });
    }

    // --- Upsert signnow_documents tracking record ---
    const now = new Date().toISOString();
    const statusMap: Record<string, string> = {
      "document.complete": "completed",
      "document.signed": "completed",
      "document.update": "viewed",
      "document.viewed": "viewed",
      "invite.sent": "pending",
      "invite.update": "pending",
      "document.cancel": "declined",
      "invite.cancel": "declined",
    };
    const mappedStatus = event ? statusMap[event] || "draft" : "draft";

    // Build update fields based on event
    const updateFields: Record<string, any> = { status: mappedStatus };
    if (event === "invite.sent" || event === "invite.update") updateFields.invite_sent_at = now;
    if (event === "document.viewed" || event === "document.update") updateFields.viewed_at = now;
    if (event === "document.signed") updateFields.signed_at = now;
    if (event === "document.complete") { updateFields.signed_at = now; updateFields.completed_at = now; }

    // Try to find existing tracking record
    const { data: existingDoc } = await supabase
      .from("signnow_documents")
      .select("id, appointment_id, signnow_emails_sent")
      .eq("signnow_document_id", documentId)
      .maybeSingle();

    // Append email event to the tracking array
    const emailEvent = { type: event || "unknown", sent_at: now, recipient: "" };

    if (existingDoc) {
      const emails = Array.isArray(existingDoc.signnow_emails_sent) ? existingDoc.signnow_emails_sent : [];
      await supabase.from("signnow_documents").update({
        ...updateFields,
        signnow_emails_sent: [...emails, emailEvent],
      }).eq("id", existingDoc.id);
    }

    // --- Original notarization_sessions logic ---
    const { data: session } = await supabase
      .from("notarization_sessions")
      .select("*, appointments(*)")
      .eq("signnow_document_id", documentId)
      .single();

    if (!session) {
      // If no session but we have a tracking doc, still log it
      if (!existingDoc) {
        // Create a tracking record without appointment link
        await supabase.from("signnow_documents").insert({
          signnow_document_id: documentId,
          document_name: documentName || "External Document",
          status: mappedStatus,
          signnow_emails_sent: [emailEvent],
          ...(event === "invite.sent" ? { invite_sent_at: now } : {}),
          ...(event === "document.viewed" ? { viewed_at: now } : {}),
          ...(event === "document.complete" ? { signed_at: now, completed_at: now } : {}),
        }).then(({ error }) => { if (error) console.warn("signnow_documents insert error:", error.message); });
      }

      console.log("No matching session found for SignNow document:", documentId);
      // Still log to webhook_events
      await supabase.from("webhook_events").insert({
        source: "signnow",
        event_type: event || "unknown",
        payload: body,
        status: "processed",
        processed_at: now,
      }).then(({ error }: any) => { if (error) console.warn("webhook_events log error:", error.message); });

      return new Response(JSON.stringify({ ok: true, message: "No matching session" }), {
        headers: responseHeaders,
      });
    }

    const appointmentId = session.appointment_id;

    // If no tracking doc exists yet, create one linked to appointment
    if (!existingDoc) {
      await supabase.from("signnow_documents").insert({
        appointment_id: appointmentId,
        signnow_document_id: documentId,
        document_name: documentName || "Session Document",
        status: mappedStatus,
        signnow_emails_sent: [emailEvent],
        ...(event === "invite.sent" ? { invite_sent_at: now } : {}),
        ...(event === "document.viewed" ? { viewed_at: now } : {}),
        ...(event === "document.complete" ? { signed_at: now, completed_at: now } : {}),
      }).then(({ error }) => { if (error) console.warn("signnow_documents insert error:", error.message); });
    }

    // Log email events from SignNow to crm_activities
    if (event === "invite.sent" || event === "invite.update") {
      await supabase.from("crm_activities").insert({
        contact_id: session.appointments?.client_id || session.client_id || appointmentId,
        contact_type: "client",
        activity_type: "email",
        subject: `SignNow: ${event === "invite.sent" ? "Signing invitation sent" : "Invite updated"}`,
        body: `SignNow sent a signing invitation for document ${documentId}`,
      }).then(({ error }) => { if (error) console.warn("crm_activities insert error:", error.message); });
    }

    if (event === "document.complete" || event === "document.signed") {
      await supabase.from("notarization_sessions").update({
        status: "completed",
        completed_at: now,
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

      await supabase.from("crm_activities").insert({
        contact_id: session.appointments?.client_id || appointmentId,
        contact_type: "client",
        activity_type: "status_change",
        subject: "SignNow: Document signing completed",
        body: `Document ${documentId} has been fully signed and completed via SignNow`,
      }).then(({ error }) => { if (error) console.warn("crm_activities insert error:", error.message); });

      await supabase.from("audit_log").insert({
        action: "ron_session_completed_webhook",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: { signnow_document_id: documentId, event },
      });

    } else if (event === "document.update" || event === "document.viewed") {
      await supabase.from("notarization_sessions").update({
        status: "in_session",
        started_at: session.started_at || now,
      }).eq("id", session.id);

      await supabase.from("appointments").update({
        status: "in_session",
      }).eq("id", appointmentId);

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

    // Always log all events to audit_log
    await supabase.from("audit_log").insert({
      action: "signnow_webhook_event",
      entity_type: "appointment",
      entity_id: appointmentId,
      details: { signnow_document_id: documentId, event, content: body.content },
    }).then(({ error }) => { if (error) console.warn("audit insert error:", error.message); });

    // Log to webhook_events dashboard table
    await supabase.from("webhook_events").insert({
      source: "signnow",
      event_type: event || "unknown",
      payload: body,
      status: "processed",
      processed_at: now,
    }).then(({ error }: any) => { if (error) console.warn("webhook_events log error:", error.message); });

    return new Response(JSON.stringify({ ok: true }), {
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("SignNow webhook error:", err);

    // INT-001: Log failed webhook to dead letter queue for retry
    try {
      const dlqSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await dlqSupabase.from("webhook_events").insert({
        source: "signnow",
        event_type: "processing_error",
        payload: { error: err.message, stack: err.stack?.slice(0, 500) },
        status: "failed",
        processed_at: new Date().toISOString(),
      }).then(({ error: dlqErr }) => { if (dlqErr) console.warn("DLQ insert error:", dlqErr.message); });
    } catch (_) { /* best effort */ }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});
