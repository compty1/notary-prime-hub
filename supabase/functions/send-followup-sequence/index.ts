import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { appointmentId, clientId } = await req.json();

    if (!appointmentId || !clientId) {
      return new Response(JSON.stringify({ error: "appointmentId and clientId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", clientId)
      .single();

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: appointment } = await supabase
      .from("appointments")
      .select("service_type, confirmation_number")
      .eq("id", appointmentId)
      .single();

    const name = profile.full_name || "there";
    const svc = appointment?.service_type || "your session";
    const confNum = appointment?.confirmation_number || "";

    // Email 1: Thank you (immediate)
    await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: profile.email,
        subject: `Thank you for choosing NotarDex — ${svc}`,
        html: `
          <h2>Thank You, ${name}!</h2>
          <p>Your ${svc} session${confNum ? ` (${confNum})` : ""} has been completed successfully.</p>
          <p>Your notarized documents are available for download in your <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/portal?tab=documents">Client Portal</a>.</p>
          <p>Thank you for trusting NotarDex with your notarization needs.</p>
          <p>— The NotarDex Team</p>
        `,
      },
    });

    // Email 2: Feedback request (delayed — handled by process-email-queue timing)
    await supabase.rpc("enqueue_email", {
      queue_name: "followup_emails",
      payload: {
        to: profile.email,
        subject: "How was your NotarDex experience?",
        html: `
          <h2>We'd Love Your Feedback</h2>
          <p>Hi ${name},</p>
          <p>Your recent ${svc} session is complete. We'd love to hear how it went!</p>
          <p><a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/portal?tab=appointments">Leave Feedback →</a></p>
          <p>Your feedback helps us improve our service and helps other clients make informed decisions.</p>
          <p>— NotarDex Team</p>
        `,
        delay_hours: 24,
      },
    });

    // Email 3: Referral invitation (delayed)
    await supabase.rpc("enqueue_email", {
      queue_name: "followup_emails",
      payload: {
        to: profile.email,
        subject: "Share NotarDex with a friend — Earn rewards!",
        html: `
          <h2>Refer a Friend to NotarDex</h2>
          <p>Hi ${name},</p>
          <p>Know someone who needs notarization services? Share your referral link and help them get started.</p>
          <p><a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/portal?tab=referrals">Get Your Referral Link →</a></p>
          <p>Thank you for being part of the NotarDex community!</p>
          <p>— NotarDex Team</p>
        `,
        delay_hours: 72,
      },
    });

    return new Response(JSON.stringify({ success: true, emails_queued: 3 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
