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
    console.log("OneNotary webhook received:", JSON.stringify(body));

    // OneNotary webhook format: { event: "session.status.updated_*", data: { id, status, price, ... } }
    const { event, data } = body;
    const session_id = data?.id || body.session_id;

    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find our session record
    const { data: session } = await supabase
      .from("notarization_sessions")
      .select("*, appointments(*)")
      .eq("onenotary_session_id", session_id)
      .single();

    if (!session) {
      console.log("No matching session found for OneNotary session:", session_id);
      return new Response(JSON.stringify({ ok: true, message: "No matching session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appointmentId = session.appointment_id;

    // Handle OneNotary webhook events (full event names from v2 API)
    if (event?.includes("session_started") || event?.includes("ready_to_start")) {
      await supabase.from("notarization_sessions").update({
        status: "in_session",
        started_at: new Date().toISOString(),
      }).eq("id", session.id);

      await supabase.from("appointments").update({
        status: "in_session",
      }).eq("id", appointmentId);

    } else if (event?.includes("completed_successfully")) {
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

      // Create payment record with OneNotary session price
      if (session.appointments) {
        const appt = session.appointments;
        const sessionPrice = data?.price || 0;
        await supabase.from("payments").insert({
          client_id: appt.client_id,
          appointment_id: appointmentId,
          amount: appt.estimated_price || sessionPrice || 5,
          status: "pending",
          notes: `RON session completed via OneNotary — ${appt.service_type}. Platform fee: $${sessionPrice}`,
        });
      }

      // Audit log
      await supabase.from("audit_log").insert({
        action: "ron_session_completed_webhook",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: { onenotary_session_id: session_id, event, price: data?.price },
      });

    } else if (event?.includes("canceled") || event?.includes("cancelled") || event?.includes("terminated")) {
      await supabase.from("notarization_sessions").update({
        status: "cancelled",
      }).eq("id", session.id);

      await supabase.from("appointments").update({
        status: "cancelled",
      }).eq("id", appointmentId);

    } else if (event?.includes("notary_assigned")) {
      // Notary was assigned — log it
      await supabase.from("audit_log").insert({
        action: "ron_notary_assigned",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: { onenotary_session_id: session_id, event, notary: data?.notary },
      });

    } else if (event?.includes("processing")) {
      await supabase.from("notarization_sessions").update({
        status: "in_session",
      }).eq("id", session.id);

    } else if (event?.includes("identity_check") || event?.includes("id_verification")) {
      await supabase.from("appointments").update({
        status: "id_verification",
      }).eq("id", appointmentId);

    } else if (event?.includes("paused")) {
      // Log pause events for audit
      await supabase.from("audit_log").insert({
        action: "ron_session_paused",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: { onenotary_session_id: session_id, event, pause_details: data?.pause_details },
      });

    } else {
      console.log("Unhandled OneNotary event:", event);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("OneNotary webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
