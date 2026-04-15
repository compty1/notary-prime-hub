import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard, requireEnvVars } from "../_shared/middleware.ts";

Deno.serve(async (req: Request) => {
  const start = Date.now();
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit: 10 followup sequences per minute
    const rlResponse = rateLimitGuard(req, 10);
    if (rlResponse) return rlResponse;

    // Auth check (EF-307)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse(req, 401, "Missing authorization header");

    const envErr = requireEnvVars(req, "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
    if (envErr) return envErr;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { z } = await import("https://esm.sh/zod@3.23.8");
    const BodySchema = z.object({
      appointmentId: z.string().uuid(),
      clientId: z.string().uuid(),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return errorResponse(req, 400, "Invalid input", JSON.stringify(parsed.error.flatten().fieldErrors));
    }
    const { appointmentId, clientId } = parsed.data;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", clientId)
      .single();

    if (!profile?.email) {
      return errorResponse(req, 404, "Client not found");
    }

    const { data: appointment } = await supabase
      .from("appointments")
      .select("service_type, confirmation_number")
      .eq("id", appointmentId)
      .single();

    const name = profile.full_name || "there";
    const svc = appointment?.service_type || "your session";
    const confNum = appointment?.confirmation_number || "";
    const portalUrl = "https://notardex.com";

    // Email 1: Thank you (immediate)
    await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: profile.email,
        subject: `Thank you for choosing NotarDex — ${svc}`,
        html: `
          <h2>Thank You, ${name}!</h2>
          <p>Your ${svc} session${confNum ? ` (${confNum})` : ""} has been completed successfully.</p>
          <p>Your notarized documents are available for download in your <a href="${portalUrl}/portal?tab=documents">Client Portal</a>.</p>
          <p>Thank you for trusting NotarDex with your notarization needs.</p>
          <p>— The NotarDex Team</p>
        `,
      },
    });

    // Email 2: Feedback request (delayed)
    await supabase.rpc("enqueue_email", {
      queue_name: "followup_emails",
      payload: {
        to: profile.email,
        subject: "How was your NotarDex experience?",
        html: `
          <h2>We'd Love Your Feedback</h2>
          <p>Hi ${name},</p>
          <p>Your recent ${svc} session is complete. We'd love to hear how it went!</p>
          <p><a href="${portalUrl}/portal?tab=appointments">Leave Feedback →</a></p>
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
          <p><a href="${portalUrl}/portal?tab=referrals">Get Your Referral Link →</a></p>
          <p>Thank you for being part of the NotarDex community!</p>
          <p>— NotarDex Team</p>
        `,
        delay_hours: 72,
      },
    });

    console.log(`send-followup-sequence completed in ${Date.now() - start}ms`);
    return jsonResponse(req, { success: true, emails_queued: 3 });
  } catch (error) {
    console.error(`send-followup-sequence error (${Date.now() - start}ms):`, (error as Error).message);
    return errorResponse(req, 500, "Internal server error");
  }
});
