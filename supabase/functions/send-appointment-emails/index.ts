import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Appointment {
  id: string;
  client_id: string;
  service_type: string;
  notarization_type: string;
  scheduled_date: string;
  scheduled_time: string;
  location: string | null;
  status: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const results = { confirmation: 0, reminder_24hr: 0, reminder_30min: 0 };

    const { data: appointments, error: apptErr } = await supabase
      .from("appointments")
      .select("*")
      .in("status", ["scheduled", "confirmed", "id_verification", "kba_pending"])
      .order("scheduled_date", { ascending: true });

    if (apptErr) throw apptErr;
    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: "No pending appointments", results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appointmentIds = appointments.map((a: Appointment) => a.id);
    const { data: sentEmails } = await supabase
      .from("appointment_emails")
      .select("appointment_id, email_type")
      .in("appointment_id", appointmentIds);

    const sentSet = new Set(
      (sentEmails || []).map((e: any) => `${e.appointment_id}:${e.email_type}`)
    );

    const clientIds = [...new Set(appointments.map((a: Appointment) => a.client_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", clientIds);

    const profileMap = new Map(
      (profiles || []).map((p: Profile) => [p.user_id, p])
    );

    const emailMap = new Map<string, string>();
    for (const clientId of clientIds) {
      const { data: userData } = await supabase.auth.admin.getUserById(clientId);
      if (userData?.user?.email) {
        emailMap.set(clientId, userData.user.email);
      }
    }

    for (const appt of appointments as Appointment[]) {
      const sessionDateTime = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
      const hoursUntil = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const minutesUntil = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60);
      const profile = profileMap.get(appt.client_id);
      const clientEmail = emailMap.get(appt.client_id);
      const clientName = profile?.full_name || "Client";

      if (!clientEmail) continue;

      // 1. Confirmation email (sent once)
      if (!sentSet.has(`${appt.id}:confirmation`)) {
        logEmail(clientEmail, clientName, appt, "confirmation");
        await supabase.from("appointment_emails").insert({
          appointment_id: appt.id,
          email_type: "confirmation",
        });
        results.confirmation++;
        sentSet.add(`${appt.id}:confirmation`);
      }

      // 2. 24-hour reminder
      if (hoursUntil <= 25 && hoursUntil >= 23 && !sentSet.has(`${appt.id}:reminder_24hr`)) {
        logEmail(clientEmail, clientName, appt, "reminder_24hr");
        await supabase.from("appointment_emails").insert({
          appointment_id: appt.id,
          email_type: "reminder_24hr",
        });
        results.reminder_24hr++;
        sentSet.add(`${appt.id}:reminder_24hr`);
      }

      // 3. 30-minute reminder
      if (minutesUntil <= 35 && minutesUntil >= 25 && !sentSet.has(`${appt.id}:reminder_30min`)) {
        logEmail(clientEmail, clientName, appt, "reminder_30min");
        await supabase.from("appointment_emails").insert({
          appointment_id: appt.id,
          email_type: "reminder_30min",
        });
        results.reminder_30min++;
        sentSet.add(`${appt.id}:reminder_30min`);
      }
    }

    return new Response(JSON.stringify({ message: "Email check complete", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function logEmail(to: string, clientName: string, appt: Appointment, type: string) {
  const isRon = appt.notarization_type === "ron";
  const dateFormatted = new Date(`${appt.scheduled_date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  let subject = "";
  switch (type) {
    case "confirmation":
      subject = `Appointment Confirmed — ${dateFormatted}`;
      break;
    case "reminder_24hr":
      subject = `Reminder: Appointment Tomorrow — ${dateFormatted}`;
      break;
    case "reminder_30min":
      subject = `Starting Soon: Your Notarization in 30 Minutes`;
      break;
  }

  // Log the email for now. In production, integrate with Resend/SendGrid.
  // To connect an email service:
  // 1. Add RESEND_API_KEY or SENDGRID_API_KEY as a secret
  // 2. Replace this log with an API call to the email provider
  // 3. Include the HTML templates from the original implementation
  console.log(`📧 [${type}] To: ${to} (${clientName}) | Subject: ${subject} | Type: ${isRon ? "RON" : "In-Person"}`);
}
