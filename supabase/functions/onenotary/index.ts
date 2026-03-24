import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ONENOTARY_BASE = "https://app.onenotary.us/api/v2";

async function onenotaryFetch(path: string, options: RequestInit = {}) {
  const token = Deno.env.get("ONENOTARY_API_TOKEN");
  if (!token) throw new Error("ONENOTARY_API_TOKEN not configured");
  const resp = await fetch(`${ONENOTARY_BASE}${path}`, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-ONENOTARY-API-TOKEN": token,
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error(`OneNotary API error ${resp.status}: ${text}`);
    throw new Error(`OneNotary API ${resp.status}: ${text}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin/notary role
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "notary"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Admin or notary access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create_session": {
        const { appointment_id, session_type, schedule_at, business_scenario } = body;
        const sessionPayload: Record<string, any> = { external_id: appointment_id };
        if (session_type) sessionPayload.session_type = session_type === "in_person" ? "mobile_paper" : "ron";
        if (schedule_at) sessionPayload.schedule_at = schedule_at;
        if (business_scenario) sessionPayload.business_scenario = business_scenario;

        const result = await onenotaryFetch("/sessions", {
          method: "POST",
          body: JSON.stringify(sessionPayload),
        });

        const sessionId = result?.id;
        if (sessionId) {
          await serviceClient.from("notarization_sessions").upsert({
            appointment_id,
            onenotary_session_id: sessionId,
            session_type: session_type === "in_person" ? "in_person" : "ron",
            status: "scheduled",
          }, { onConflict: "appointment_id" });
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_participant": {
        const { session_id, role, email, first_name, last_name, phone_number, date_of_birth, address, external_id, appointment_id: apptId } = body;
        const participantPayload: Record<string, any> = {
          email,
          role: role || "primary_signer",
        };
        if (first_name) participantPayload.first_name = first_name;
        if (last_name) participantPayload.last_name = last_name;
        if (phone_number) participantPayload.phone_number = phone_number;
        if (date_of_birth) participantPayload.date_of_birth = date_of_birth;
        if (external_id) participantPayload.external_id = external_id;
        if (address) participantPayload.address = address;
        participantPayload.custom = [
          { key: "signer_redirection_url", value: `${supabaseUrl?.replace('.supabase.co', '.lovable.app')}/portal` },
        ];

        const result = await onenotaryFetch(`/sessions/${session_id}/participants`, {
          method: "POST",
          body: JSON.stringify(participantPayload),
        });

        if (result?.link && apptId) {
          await serviceClient.from("notarization_sessions").update({
            participant_link: result.link,
          }).eq("onenotary_session_id", session_id);
        }

        return new Response(JSON.stringify({ ...result, join_url: result?.link }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_document": {
        const { session_id, file_name, file_content, file_url } = body;
        let docBody: any;
        if (file_content) {
          docBody = { file: { name: file_name, content: file_content } };
        } else if (file_url) {
          docBody = { file: { name: file_name, url: file_url } };
        } else {
          throw new Error("Either file_content (base64) or file_url is required");
        }

        const result = await onenotaryFetch(`/sessions/${session_id}/documents`, {
          method: "POST",
          body: JSON.stringify(docBody),
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "init_session": {
        const { session_id, send_email } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}/init`, {
          method: "POST",
          body: JSON.stringify({ send_email: send_email !== false }),
        });

        if (body.appointment_id) {
          await serviceClient.from("notarization_sessions").update({
            status: "confirmed",
          }).eq("onenotary_session_id", session_id);
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_sessions": {
        const result = await onenotaryFetch("/sessions", { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_session": {
        const { session_id } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}`, { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "download_document": {
        const { session_id, document_id } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}/documents/${document_id}/download`, { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_stamps": {
        const { session_id, document_id } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}/documents/${document_id}/stamps`, { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_video": {
        const { session_id } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}/video`, { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_documents": {
        const { session_id } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}/documents`, { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "request_witness": {
        const { session_id } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}/participants/witnesses/request`, { method: "POST" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_notary": {
        const { session_id, notary_email, notary_external_id } = body;
        const result = await onenotaryFetch(`/sessions/${session_id}/notary`, {
          method: "POST",
          body: JSON.stringify({ email: notary_email, external_id: notary_external_id }),
        });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "cancel_session": {
        const { session_id } = body;
        await onenotaryFetch(`/sessions/${session_id}`, { method: "DELETE" });
        if (body.appointment_id) {
          await serviceClient.from("notarization_sessions").update({ status: "cancelled" }).eq("onenotary_session_id", session_id);
          await serviceClient.from("appointments").update({ status: "cancelled" }).eq("id", body.appointment_id);
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err: any) {
    console.error("OneNotary function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
