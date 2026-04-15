import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard, requireEnvVars } from "../_shared/middleware.ts";

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
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit: 5 reminder batches per minute
    const rlResponse = rateLimitGuard(req, 5);
    if (rlResponse) return rlResponse;

    // Auth check (EF-308)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse(req, 401, "Missing authorization header");

    const envErr = requireEnvVars(req, "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
    if (envErr) return envErr;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("*")
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_date", now.toISOString().split("T")[0])
      .lte("scheduled_date", tomorrow.toISOString().split("T")[0]);

    if (apptError) throw apptError;
    if (!appointments || appointments.length === 0) {
      return jsonResponse(req, { message: "No upcoming appointments" });
    }

    let sentCount = 0;

    for (const appt of appointments as AppointmentWithProfile[]) {
      const apptDateTime = new Date(`${appt.scheduled_date}T${appt.scheduled_time}`);
      const hoursUntil = (apptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const shouldSend24h = hoursUntil > 23 && hoursUntil <= 25;
      const shouldSend1h = hoursUntil > 0.5 && hoursUntil <= 1.5;

      if (!shouldSend24h && !shouldSend1h) continue;

      const emailType = shouldSend24h ? "reminder_24h" : "reminder_1h";

      const { data: existing } = await supabase
        .from("appointment_emails")
        .select("id")
        .eq("appointment_id", appt.id)
        .eq("email_type", emailType)
        .maybeSingle();

      if (existing) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", appt.client_id)
        .maybeSingle();

      if (!profile?.email) continue;

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

      await supabase.from("appointment_emails").insert({
        appointment_id: appt.id,
        email_type: emailType,
      });

      await supabase.from("client_correspondence").insert({
        client_id: appt.client_id,
        subject,
        body,
        direction: "outbound",
        to_address: profile.email,
        status: "sent",
      });

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

    return jsonResponse(req, { message: `Sent ${sentCount} reminder(s)` });
  } catch (error: unknown) {
    console.error("Reminder error:", error);
    return errorResponse(req, 500, "Internal Error", (error as Error).message);
  }
});
