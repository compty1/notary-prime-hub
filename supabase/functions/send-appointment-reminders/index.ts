import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AppointmentWithProfile {
  id: string;
  client_id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  notarization_type: string;
  location: string | null;
  status: string;
}

const serviceChecklists: Record<string, string[]> = {
  ron: [
    "Computer with webcam and microphone",
    "Stable internet connection",
    "Valid government-issued photo ID",
    "Documents in digital format (PDF preferred)",
    "Quiet, well-lit environment",
  ],
  in_person: [
    "Valid government-issued photo ID (driver's license, passport, or state ID)",
    "Original documents to be notarized",
    "Payment method (cash, card, or digital)",
  ],
  apostille: [
    "Original notarized document(s)",
    "Ohio SOS request form (if applicable)",
    "Prepaid return envelope",
    "Destination country information",
  ],
  immigration: [
    "All USCIS forms completed (do not sign until notary is present)",
    "Certified translations of foreign documents",
    "Valid passport or government-issued photo ID",
    "Supporting evidence and documentation",
  ],
  i9: [
    "List A document (e.g., US Passport) OR List B + List C documents",
    "Employer's I-9 form (preferably pre-filled Section 1)",
    "Valid photo ID",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();

    // Find appointments in the next 24 hours that are scheduled/confirmed
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("*")
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_date", now.toISOString().split("T")[0])
      .lte("scheduled_date", tomorrow.toISOString().split("T")[0]);

    if (apptError) throw apptError;
    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming appointments" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const appt of appointments as AppointmentWithProfile[]) {
      const apptDateTime = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
      const hoursUntil = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Send reminders at ~24h and ~1h before
      const shouldSend24h = hoursUntil > 23 && hoursUntil <= 25;
      const shouldSend1h = hoursUntil > 0.5 && hoursUntil <= 1.5;

      if (!shouldSend24h && !shouldSend1h) continue;

      const emailType = shouldSend24h ? "reminder_24h" : "reminder_1h";

      // Check if already sent
      const { data: existing } = await supabase
        .from("appointment_emails")
        .select("id")
        .eq("appointment_id", appt.id)
        .eq("email_type", emailType)
        .maybeSingle();

      if (existing) continue;

      // Get client profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", appt.client_id)
        .maybeSingle();

      if (!profile?.email) continue;

      // Determine checklist
      const isRon = appt.notarization_type === "ron";
      const serviceKey = isRon ? "ron"
        : appt.service_type?.toLowerCase().includes("apostille") ? "apostille"
        : appt.service_type?.toLowerCase().includes("immigration") || appt.service_type?.toLowerCase().includes("uscis") ? "immigration"
        : appt.service_type?.toLowerCase().includes("i-9") || appt.service_type?.toLowerCase().includes("employment verification") ? "i9"
        : "in_person";

      const checklist = serviceChecklists[serviceKey] || serviceChecklists.in_person;
      const checklistText = checklist.map((item, i) => `${i + 1}. ${item}`).join("\n");

      const timeLabel = shouldSend24h ? "tomorrow" : "in about 1 hour";
      const subject = `Reminder: Your ${appt.service_type} appointment is ${timeLabel}`;
      const body = `Hi ${profile.full_name || "there"},

Your ${appt.service_type} appointment is ${timeLabel}:

📅 Date: ${appt.scheduled_date}
🕐 Time: ${appt.scheduled_time}
📍 Location: ${isRon ? "Remote (video call)" : appt.location || "TBD"}

${isRon && shouldSend1h ? "🔗 You can join your session from your Client Portal.\n\n💡 Tip: Run a quick tech check before your session to ensure your camera and microphone are working.\n\n" : ""}Please have the following ready:

${checklistText}

If you need to reschedule or cancel, please do so through your Client Portal or contact us directly.

Thank you,
Notar Notary Services`;

      // Record the email send
      await supabase.from("appointment_emails").insert({
        appointment_id: appt.id,
        email_type: emailType,
      });

      // Send via correspondence
      await supabase.from("client_correspondence").insert({
        client_id: appt.client_id,
        subject,
        body,
        direction: "outbound",
        to_address: profile.email,
        status: "sent",
      });

      // Attempt actual email send
      try {
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-correspondence`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ to: profile.email, subject, body }),
        });
        if (!sendResponse.ok) console.error("Email send failed:", await sendResponse.text());
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
      }

      sentCount++;
    }

    return new Response(JSON.stringify({ message: `Sent ${sentCount} reminder(s)` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Reminder error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
