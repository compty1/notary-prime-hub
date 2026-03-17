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

    const { event, session_id, data } = body;

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

    switch (event) {
      case "session_started":
      case "ready_to_start": {
        await supabase.from("notarization_sessions").update({
          status: "in_session",
          started_at: new Date().toISOString(),
        }).eq("id", session.id);

        await supabase.from("appointments").update({
          status: "in_session",
        }).eq("id", appointmentId);
        break;
      }

      case "completed_successfully": {
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
            notes: `RON session completed via OneNotary — ${appt.service_type}`,
          });
        }

        // Audit log
        await supabase.from("audit_log").insert({
          action: "ron_session_completed_webhook",
          entity_type: "appointment",
          entity_id: appointmentId,
          details: { onenotary_session_id: session_id, event },
        });
        break;
      }

      case "canceled":
      case "cancelled": {
        await supabase.from("notarization_sessions").update({
          status: "cancelled",
        }).eq("id", session.id);

        await supabase.from("appointments").update({
          status: "cancelled",
        }).eq("id", appointmentId);
        break;
      }

      default:
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
