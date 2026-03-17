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

const formatDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

const formatTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

function buildEmailHtml(clientName: string, appt: Appointment, type: string): string {
  const isRon = appt.notarization_type === "ron";
  const dateFormatted = formatDate(appt.scheduled_date);
  const timeFormatted = formatTime(appt.scheduled_time);

  let heading = "";
  let body = "";

  switch (type) {
    case "confirmation":
      heading = "Appointment Confirmed";
      body = `
        <p>Hello ${clientName},</p>
        <p>Your notarization appointment has been confirmed. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Service</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${appt.service_type}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Date</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${dateFormatted}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Time</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${timeFormatted}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Type</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${isRon ? "Remote Online (RON)" : "In-Person"}</td></tr>
          ${appt.location ? `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Location</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${appt.location}</td></tr>` : ""}
        </table>
        ${isRon ? "<p><strong>For your RON session:</strong> Please have a valid government-issued photo ID ready. You will complete identity verification and knowledge-based authentication before the session begins.</p>" : "<p><strong>Please bring:</strong> A valid government-issued photo ID to your appointment.</p>"}
      `;
      break;
    case "reminder_24hr":
      heading = "Appointment Tomorrow";
      body = `
        <p>Hello ${clientName},</p>
        <p>This is a friendly reminder that your notarization appointment is <strong>tomorrow</strong>.</p>
        <p><strong>${dateFormatted}</strong> at <strong>${timeFormatted}</strong></p>
        <p>${isRon ? "Your RON session link will be available in your client portal." : `Location: ${appt.location || "To be confirmed"}`}</p>
        <p>Please have your valid government-issued photo ID ready.</p>
      `;
      break;
    case "reminder_30min":
      heading = "Starting in 30 Minutes";
      body = `
        <p>Hello ${clientName},</p>
        <p>Your notarization appointment begins in approximately <strong>30 minutes</strong>.</p>
        ${isRon ? "<p><strong>Please log in to your client portal now</strong> to begin the identity verification process.</p>" : `<p>Please head to: <strong>${appt.location || "the agreed location"}</strong></p>`}
      `;
      break;
    case "status_confirmed":
      heading = "Appointment Confirmed";
      body = `<p>Hello ${clientName},</p><p>Great news! Your appointment for <strong>${appt.service_type}</strong> on <strong>${dateFormatted}</strong> at <strong>${timeFormatted}</strong> has been confirmed by our team.</p><p>We look forward to assisting you!</p>`;
      break;
    case "status_in_session":
      heading = "Session In Progress";
      body = `<p>Hello ${clientName},</p><p>Your notarization session for <strong>${appt.service_type}</strong> is now in progress. ${isRon ? "Please join via your client portal if you haven't already." : "Thank you for being here!"}</p>`;
      break;
    case "status_completed":
      heading = "Notarization Complete";
      body = `<p>Hello ${clientName},</p><p>Your notarization for <strong>${appt.service_type}</strong> has been completed successfully!</p><p>Your notarized documents are now available in your client portal. Please log in to download them.</p><p>If you were satisfied with the service, we'd appreciate you leaving a review in your portal.</p>`;
      break;
    case "status_cancelled":
      heading = "Appointment Cancelled";
      body = `<p>Hello ${clientName},</p><p>Your appointment for <strong>${appt.service_type}</strong> on <strong>${dateFormatted}</strong> has been cancelled.</p><p>If you'd like to reschedule, please visit our booking page or contact us.</p>`;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background-color:#f8f7f4;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
        <div style="background-color:#1a2744;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#e8d5a3;margin:0;font-size:24px;font-family:Georgia,serif;">Shane Goble</h1>
          <p style="color:#b8c5d6;margin:4px 0 0;font-size:14px;">Ohio Commissioned Notary Public</p>
        </div>
        <div style="background-color:#ffffff;padding:32px 24px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <h2 style="color:#1a2744;margin:0 0 16px;font-size:20px;font-family:Georgia,serif;">${heading}</h2>
          ${body}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
            Shane Goble Notary Services · Franklin County, Ohio<br>
            Commissioned per Ohio Revised Code Chapter 147
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.log(`📧 [NO API KEY] Would send to: ${to} | Subject: ${subject}`);
    console.log("Set RESEND_API_KEY secret to enable real email delivery.");
    return false;
  }

  const fromEmail = Deno.env.get("FROM_EMAIL") || "notifications@resend.dev";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Shane Goble Notary <${fromEmail}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error(`Resend API error [${response.status}]: ${errBody}`);
    return false;
  }

  console.log(`✅ Email sent to ${to}: ${subject}`);
  return true;
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

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    const results = { confirmation: 0, reminder_24hr: 0, reminder_30min: 0, status_change: 0, skipped_no_key: false };

    if (!Deno.env.get("RESEND_API_KEY")) {
      results.skipped_no_key = true;
    }

    // Handle status change notification
    if (body.appointment_id && body.status_change) {
      const { data: appt } = await supabase.from("appointments").select("*").eq("id", body.appointment_id).single();
      if (appt) {
        const { data: profile } = await supabase.from("profiles").select("user_id, full_name").eq("user_id", appt.client_id).single();
        const { data: userData } = await supabase.auth.admin.getUserById(appt.client_id);
        const clientEmail = userData?.user?.email;
        const clientName = profile?.full_name || "Client";
        if (clientEmail) {
          const statusMap: Record<string, string> = { confirmed: "status_confirmed", in_session: "status_in_session", completed: "status_completed", cancelled: "status_cancelled" };
          const emailType = statusMap[body.status_change];
          if (emailType) {
            const dateFormatted = formatDate(appt.scheduled_date);
            const subject = `Appointment Update — ${dateFormatted}`;
            const html = buildEmailHtml(clientName, appt as Appointment, emailType);
            await sendEmail(clientEmail, subject, html);
            await supabase.from("appointment_emails").insert({ appointment_id: appt.id, email_type: emailType });
            results.status_change++;
          }
        }
      }
      return new Response(JSON.stringify({ message: "Status email sent", results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Deno.env.get("RESEND_API_KEY")) {
      results.skipped_no_key = true;
    }

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

      const dateFormatted = formatDate(appt.scheduled_date);

      // 1. Confirmation email (sent once)
      if (!sentSet.has(`${appt.id}:confirmation`)) {
        const subject = `Appointment Confirmed — ${dateFormatted}`;
        const html = buildEmailHtml(clientName, appt, "confirmation");
        await sendEmail(clientEmail, subject, html);
        await supabase.from("appointment_emails").insert({
          appointment_id: appt.id,
          email_type: "confirmation",
        });
        results.confirmation++;
        sentSet.add(`${appt.id}:confirmation`);
      }

      // 2. 24-hour reminder
      if (hoursUntil <= 25 && hoursUntil >= 23 && !sentSet.has(`${appt.id}:reminder_24hr`)) {
        const subject = `Reminder: Appointment Tomorrow — ${dateFormatted}`;
        const html = buildEmailHtml(clientName, appt, "reminder_24hr");
        await sendEmail(clientEmail, subject, html);
        await supabase.from("appointment_emails").insert({
          appointment_id: appt.id,
          email_type: "reminder_24hr",
        });
        results.reminder_24hr++;
        sentSet.add(`${appt.id}:reminder_24hr`);
      }

      // 3. 30-minute reminder
      if (minutesUntil <= 35 && minutesUntil >= 25 && !sentSet.has(`${appt.id}:reminder_30min`)) {
        const subject = `Starting Soon: Your Notarization in 30 Minutes`;
        const html = buildEmailHtml(clientName, appt, "reminder_30min");
        await sendEmail(clientEmail, subject, html);
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
