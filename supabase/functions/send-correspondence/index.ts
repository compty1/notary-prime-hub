import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard, requireEnvVars, securityHeaders } from "../_shared/middleware.ts";

const BodySchema = z.object({
  to_address: z.string().email().max(255),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  client_id: z.string().uuid(),
  reply_to_id: z.string().uuid().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit: 15 correspondence emails per minute
    const rlResponse = rateLimitGuard(req, 15);
    if (rlResponse) return rlResponse;

    // Auth check — only admins/notaries should send correspondence
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(req, 401, "Unauthorized");
    }

    const envErr = requireEnvVars(req, "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
    if (envErr) return envErr;

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return errorResponse(req, 401, "Unauthorized");
    }

    const rawBody = await req.json();

    // Dry-run mode for integration testing
    if (rawBody.dry_run === true) {
      return jsonResponse(req, { success: true, dry_run: true });
    }

    // Validate input
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return errorResponse(req, 400, "Validation Error", JSON.stringify(parsed.error.flatten().fieldErrors));
    }
    const { to_address, subject, body, client_id, reply_to_id } = parsed.data;

    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || Deno.env.get("IONOS_EMAIL_ADDRESS") || "contact@notardex.com";

    // Use service role for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let emailSent = false;

    // Try IONOS SMTP first
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
      } catch (ionosErr) {
        console.error("IONOS SMTP failed:", ionosErr);
      }
    }

    // Fallback to Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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
          html: body,
        }),
      });
      if (emailRes.ok) emailSent = true;
      else console.error("Resend error:", await emailRes.json());
    }

    // Log correspondence
    await supabase.from("client_correspondence").insert({
      client_id,
      direction: "outbound",
      subject,
      body,
      from_address: FROM_EMAIL,
      to_address,
      status: emailSent ? "replied" : "pending",
      handled_by: user.id,
      handled_at: new Date().toISOString(),
    });

    if (reply_to_id) {
      await supabase
        .from("client_correspondence")
        .update({ status: "replied", handled_at: new Date().toISOString(), handled_by: user.id })
        .eq("id", reply_to_id);
    }

    // Audit log
    await supabase.from("audit_log").insert({
      action: "correspondence_sent",
      entity_type: "client_correspondence",
      user_id: user.id,
      details: { to_address, subject, email_sent: emailSent },
    });

    return jsonResponse(req, { success: true, email_sent: emailSent });
  } catch (error: unknown) {
    console.error("send-correspondence error:", error);
    return errorResponse(req, 500, "Internal Error", (error as Error).message);
  }
});
