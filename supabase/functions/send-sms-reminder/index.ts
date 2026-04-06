import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for Twilio gateway credentials
    const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM_NUMBER) {
      console.log("SMS reminders skipped — Twilio not configured");
      return new Response(JSON.stringify({ 
        message: "SMS reminders not configured. Connect Twilio to enable.",
        sent: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find appointments in next 24h and 1h that haven't been reminded
    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, client_id, scheduled_date, scheduled_time, service_type, notarization_type, confirmation_number")
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_date", now.toISOString().slice(0, 10))
      .lte("scheduled_date", in24h.toISOString().slice(0, 10));

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming appointments", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;

    for (const appt of appointments) {
      // Get client phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, full_name")
        .eq("user_id", appt.client_id)
        .single();

      if (!profile?.phone) continue;

      // Bug 36: Validate E.164 phone format before sending to Twilio
      const phoneDigits = profile.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) continue;
      const e164Phone = phoneDigits.startsWith("1") ? `+${phoneDigits}` : `+1${phoneDigits}`;
      // Check if already sent for this appointment
      const { data: existing } = await supabase
        .from("appointment_emails")
        .select("id")
        .eq("appointment_id", appt.id)
        .eq("email_type", "sms_reminder");

      if (existing && existing.length > 0) continue;

      const apptDateTime = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
      const diffMs = apptDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Send if within 1h or within 24h window
      if (diffHours <= 0 || (diffHours > 1.5 && diffHours < 23)) continue;

      const timeLabel = diffHours <= 1.5 ? "in 1 hour" : "tomorrow";
      const message = `Hi ${profile.full_name || "there"}! Your ${appt.service_type} appointment is ${timeLabel} (${appt.scheduled_date} at ${appt.scheduled_time}). Confirmation: ${appt.confirmation_number}. Reply STOP to opt out. — Notar`;

      try {
        const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: e164Phone,
            From: TWILIO_FROM_NUMBER,
            Body: message,
          }),
        });

        if (response.ok) {
          sent++;
          await supabase.from("appointment_emails").insert({
            appointment_id: appt.id,
            email_type: "sms_reminder",
          });
          await supabase.from("audit_log").insert({
            action: "sms_reminder_sent",
            entity_type: "appointment",
            entity_id: appt.id,
            details: { phone: profile.phone.slice(-4), timeLabel },
          });
        } else {
          const err = await response.text();
          console.error(`SMS send failed for ${appt.id}:`, err);
        }
      } catch (e: any) {
        console.error(`SMS error for ${appt.id}:`, e.message);
      }
    }

    return new Response(JSON.stringify({ message: `Sent ${sent} SMS reminders`, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
