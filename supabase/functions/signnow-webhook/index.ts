import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    console.log("SignNow webhook received:", JSON.stringify(body));

    // SignNow webhook format varies by event type
    // Common fields: event, meta.timestamp, content (document data)
    const event = body.event || body.action;
    const documentId = body.content?.document_id || body.document_id || body.meta?.document_id;

    if (!documentId) {
      console.log("No document_id in webhook payload");
      return new Response(JSON.stringify({ ok: true, message: "No document_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find our session record
    const { data: session } = await supabase
      .from("notarization_sessions")
      .select("*, appointments(*)")
      .eq("signnow_document_id", documentId)
      .single();

    if (!session) {
      console.log("No matching session found for SignNow document:", documentId);
      return new Response(JSON.stringify({ ok: true, message: "No matching session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appointmentId = session.appointment_id;

    // Handle SignNow webhook events
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

      // Mark linked documents as notarized
      await supabase.from("documents").update({
        status: "notarized",
      }).eq("appointment_id", appointmentId);

      // Create payment record
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

      // Audit log
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
      // Signer interaction with invite
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("SignNow webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
