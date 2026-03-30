import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@shanegoble.com";

    if (!RESEND_API_KEY) {
      // If no Resend key, just log the correspondence without sending
      console.warn("RESEND_API_KEY not configured - logging correspondence only");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to_address, subject, body, client_id, reply_to_id } = await req.json();

    if (!to_address || !subject || !body || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_address, subject, body, client_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailSent = false;

    // Try IONOS SMTP first, fallback to Resend
    const IONOS_EMAIL = Deno.env.get("IONOS_EMAIL_ADDRESS");
    const IONOS_PASSWORD = Deno.env.get("IONOS_EMAIL_PASSWORD");
    const IONOS_SMTP = Deno.env.get("IONOS_SMTP_HOST") || "smtp.ionos.com";

    if (IONOS_EMAIL && IONOS_PASSWORD) {
      try {
        const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
        const client = new SMTPClient({
          connection: {
            hostname: IONOS_SMTP,
            port: 587,
            tls: true,
            auth: { username: IONOS_EMAIL, password: IONOS_PASSWORD },
          },
        });
        await client.send({
          from: IONOS_EMAIL,
          to: to_address,
          subject,
          content: "auto",
          html: body,
        });
        await client.close();
        emailSent = true;
        console.log("Email sent via IONOS SMTP");
      } catch (ionosErr) {
        console.error("IONOS SMTP failed, falling back to Resend:", ionosErr);
      }
    }

    // Fallback to Resend if IONOS failed or not configured
    if (!emailSent && RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to_address],
          subject,
          text: body,
        }),
      });

      if (!emailRes.ok) {
        const errData = await emailRes.json();
        console.error("Resend API error:", errData);
      } else {
        emailSent = true;
      }
    }

    // Log outbound correspondence record
    const { error: insertError } = await supabase
      .from("client_correspondence")
      .insert({
        client_id,
        direction: "outbound",
        subject,
        body,
        from_address: FROM_EMAIL,
        to_address,
        status: emailSent ? "replied" : "pending",
        handled_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to log correspondence:", insertError);
    }

    // If replying to an existing correspondence, update its status
    if (reply_to_id) {
      await supabase
        .from("client_correspondence")
        .update({ status: "replied", handled_at: new Date().toISOString() })
        .eq("id", reply_to_id);
    }

    // Log to audit
    await supabase.from("audit_log").insert({
      action: "correspondence_sent",
      entity_type: "client_correspondence",
      details: { to_address, subject, email_sent: emailSent },
    });

    return new Response(
      JSON.stringify({ success: true, email_sent: emailSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-correspondence error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
