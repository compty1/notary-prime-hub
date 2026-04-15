/**
 * SVC-002: Post-session automated workflow.
 * Triggered when a notarization session is completed.
 * Handles: completion email, journal entry, profit share, review request scheduling.
 */
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const rl = rateLimitGuard(req, 10);
  if (rl) return rl;

  try {
    // EF-305: Auth check — require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const steps: { step: string; status: string; error?: string }[] = [];

    // Fetch session
    const { data: session, error: sessErr } = await supabase
      .from("notarization_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Send completion email
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", session.signer_user_id || session.client_id)
        .limit(1)
        .single();

      if (profile?.email) {
        await supabase.rpc("enqueue_email", {
          queue_name: "email_queue",
          payload: {
            template: "session_completed",
            to: profile.email,
            subject: "Your notarization session is complete",
            data: {
              client_name: profile.full_name || session.signer_name || "Client",
              session_id: session.session_unique_id || session_id,
              completed_at: session.completed_at || new Date().toISOString(),
            },
          },
        });
        steps.push({ step: "completion_email", status: "success" });
      } else {
        steps.push({ step: "completion_email", status: "skipped", error: "No client email found" });
      }
    } catch (e: unknown) {
      steps.push({ step: "completion_email", status: "failed", error: e instanceof Error ? e.message : "Unknown error" });
    }

    // Step 2: Create journal entries
    try {
      if (session.notary_user_id) {
        const { data: notaryProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.notary_user_id)
          .single();

        await supabase.rpc("create_per_document_journal_entries", {
          p_session_id: session_id,
          p_notary_user_id: session.notary_user_id,
          p_notary_name: notaryProfile?.full_name || "Notary",
          p_documents: JSON.stringify(session.documents || [{ document_name: "Session Document", act_type: "acknowledgment" }]),
        });
        steps.push({ step: "journal_entry", status: "success" });
      } else {
        steps.push({ step: "journal_entry", status: "skipped", error: "No notary_user_id" });
      }
    } catch (e: unknown) {
      steps.push({ step: "journal_entry", status: "failed", error: e instanceof Error ? e.message : "Unknown error" });
    }

    // Step 3: Calculate profit share
    try {
      if (session.appointment_id) {
        const { data: payment } = await supabase
          .from("payments")
          .select("id, referral_professional_id")
          .eq("appointment_id", session.appointment_id)
          .eq("status", "paid")
          .limit(1)
          .single();

        if (payment?.referral_professional_id) {
          await supabase.rpc("calculate_profit_share" as any, {
            p_payment_id: payment.id,
            p_professional_id: payment.referral_professional_id,
          });
          steps.push({ step: "profit_share", status: "success" });
        } else {
          steps.push({ step: "profit_share", status: "skipped", error: "No referral or payment" });
        }
      } else {
        steps.push({ step: "profit_share", status: "skipped", error: "No appointment linked" });
      }
    } catch (e: unknown) {
      steps.push({ step: "profit_share", status: "failed", error: e instanceof Error ? e.message : "Unknown error" });
    }

    // Step 4: Schedule review request (delayed 24h via queue)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", session.signer_user_id || session.client_id)
        .limit(1)
        .single();

      if (profile?.email) {
        await supabase.from("email_send_log").insert({
          template_name: "review_request",
          recipient_email: profile.email,
          status: "pending",
          message_id: `review-${session_id}`,
          metadata: { session_id, delay_hours: 24 },
        });
        steps.push({ step: "review_request", status: "scheduled" });
      }
    } catch (e: unknown) {
      steps.push({ step: "review_request", status: "failed", error: e instanceof Error ? e.message : "Unknown error" });
    }

    // Log all steps to audit
    await supabase.from("audit_log").insert({
      action: "post_session_workflow",
      entity_type: "notarization_session",
      entity_id: session_id,
      details: { steps },
    });

    return new Response(JSON.stringify({ success: true, steps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
