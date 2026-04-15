import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Audit Item 48: Rate limiting (3 req/min for account deletion)
  const rlResponse = rateLimitGuard(req, 3);
  if (rlResponse) return rlResponse;

  try {
    // Auth check — user must be authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !caller?.id) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = caller.id;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // EF-310: Cascading delete including enterprise tables
    const tables = [
      { table: "document_reminders", column: "user_id" },
      { table: "document_reviews", column: "reviewed_by" },
      { table: "client_feedback", column: "client_id" },
      { table: "chat_messages", column: "sender_id" },
      { table: "document_tags", column: "document_id", subquery: true },
      { table: "document_versions", column: "document_id", subquery: true },
      { table: "e_seal_verifications", column: "document_id", subquery: true },
      { table: "documents", column: "uploaded_by" },
      { table: "fee_adjustments", column: "appointment_id", subquery_appt: true },
      { table: "appointment_emails", column: "appointment_id", subquery_appt: true },
      { table: "payments", column: "client_id" },
      { table: "appointments", column: "client_id" },
      { table: "apostille_requests", column: "client_id" },
      { table: "service_requests", column: "client_id" },
      { table: "client_correspondence", column: "client_id" },
      { table: "booking_drafts", column: "user_id" },
      { table: "client_style_profiles", column: "user_id" },
      { table: "tool_generations", column: "user_id" },
      { table: "referrals", column: "referrer_id" },
      { table: "saved_payment_methods", column: "user_id" },
      { table: "admin_saved_filters", column: "user_id" },
      // EF-310: Enterprise tables previously missing
      { table: "accounting_transactions", column: "user_id" },
      { table: "amortized_expenses", column: "user_id" },
      { table: "ai_document_grades", column: "user_id" },
      { table: "construction_projects", column: "user_id" },
      { table: "continuing_education", column: "user_id" },
      { table: "cover_letters", column: "user_id" },
      { table: "resumes", column: "user_id" },
      { table: "designs", column: "user_id" },
      { table: "client_brand_kits", column: "user_id" },
      { table: "consent_logs", column: "user_id" },
      { table: "data_deletion_requests", column: "user_id" },
      { table: "docudex_documents", column: "user_id" },
      { table: "e_course_enrollments", column: "user_id" },
      { table: "academy_lesson_progress", column: "user_id" },
      { table: "academy_quiz_attempts", column: "user_id" },
      { table: "academy_certificates", column: "user_id" },
      { table: "notification_preferences", column: "user_id" },
      { table: "session_tracking", column: "user_id" },
      // Keep last
      { table: "profiles", column: "user_id" },
      { table: "user_roles", column: "user_id" },
    ];

    const errors: string[] = [];

    for (const t of tables) {
      try {
        if (t.subquery) {
          // Delete related records via document IDs owned by user
          const { data: docs } = await adminClient.from("documents").select("id").eq("uploaded_by", userId);
          if (docs && docs.length > 0) {
            const docIds = docs.map(d => d.id);
            await adminClient.from(t.table).delete().in(t.column, docIds);
          }
        } else if (t.subquery_appt) {
          const { data: appts } = await adminClient.from("appointments").select("id").eq("client_id", userId);
          if (appts && appts.length > 0) {
            const apptIds = appts.map(a => a.id);
            await adminClient.from(t.table).delete().in(t.column, apptIds);
          }
        } else {
          await adminClient.from(t.table).delete().eq(t.column, userId);
        }
      } catch (e: any) {
        errors.push(`${t.table}: ${e.message}`);
      }
    }

    // Delete storage files
    try {
      const { data: files } = await adminClient.storage.from("documents").list(userId);
      if (files && files.length > 0) {
        await adminClient.storage.from("documents").remove(files.map(f => `${userId}/${f.name}`));
      }
    } catch {}

    // Delete auth user
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: `Failed to delete auth user: ${deleteErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log
    await adminClient.from("audit_log").insert({
      action: "account_deleted",
      entity_type: "user",
      entity_id: userId,
      details: { warnings: errors.length > 0 ? errors : undefined },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
