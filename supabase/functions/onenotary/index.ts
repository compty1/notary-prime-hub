import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ONE_NOTARY_BASE = "https://app.onenotary.us/api/v2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub;

    // Check admin or notary role
    const { data: hasAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: hasNotary } = await supabase.rpc("has_role", { _user_id: userId, _role: "notary" });
    if (!hasAdmin && !hasNotary) {
      return new Response(JSON.stringify({ error: "Forbidden — admin or notary role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiToken = Deno.env.get("ONENOTARY_API_TOKEN");
    if (!apiToken || apiToken === "REPLACE_ME") {
      return new Response(JSON.stringify({ error: "OneNotary API token not configured. Please update the ONENOTARY_API_TOKEN secret." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action, ...params } = body;

    const oneNotaryHeaders = {
      "Content-Type": "application/json",
      "X-ONENOTARY-API-TOKEN": apiToken,
    };

    let result: any;

    switch (action) {
      case "create_session": {
        // Create a new RON session
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions`, {
          method: "POST",
          headers: oneNotaryHeaders,
          body: JSON.stringify({
            session_type: params.session_type || "ron",
            callback_url: params.callback_url || null,
          }),
        });
        result = await resp.json();

        // Store the session ID in our DB
        if (result.id && params.appointment_id) {
          await supabase.from("notarization_sessions").upsert({
            appointment_id: params.appointment_id,
            onenotary_session_id: result.id,
            session_type: "ron",
            status: "scheduled",
          }, { onConflict: "appointment_id" });
        }
        break;
      }

      case "add_participant": {
        // Add a signer/participant to the session
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions/${params.session_id}/participants`, {
          method: "POST",
          headers: oneNotaryHeaders,
          body: JSON.stringify({
            role: params.role || "primary_signer",
            first_name: params.first_name,
            last_name: params.last_name,
            email: params.email,
          }),
        });
        result = await resp.json();

        // Store participant link if returned
        if (result.join_url && params.appointment_id) {
          await supabase.from("notarization_sessions").update({
            participant_link: result.join_url,
          }).eq("appointment_id", params.appointment_id);
        }
        break;
      }

      case "add_document": {
        // Add a document to the session (URL-based)
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions/${params.session_id}/documents`, {
          method: "POST",
          headers: oneNotaryHeaders,
          body: JSON.stringify({
            name: params.document_name,
            url: params.document_url,
          }),
        });
        result = await resp.json();
        break;
      }

      case "init_session": {
        // Initialize/start the session (sends invites to participants)
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions/${params.session_id}/init`, {
          method: "POST",
          headers: oneNotaryHeaders,
        });
        result = await resp.json();

        // Update session status
        if (params.appointment_id) {
          await supabase.from("notarization_sessions").update({
            status: "in_session",
            started_at: new Date().toISOString(),
          }).eq("appointment_id", params.appointment_id);

          await supabase.from("appointments").update({
            status: "in_session",
          }).eq("id", params.appointment_id);
        }
        break;
      }

      case "cancel_session": {
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions/${params.session_id}/cancel`, {
          method: "POST",
          headers: oneNotaryHeaders,
        });
        result = await resp.json();

        if (params.appointment_id) {
          await supabase.from("notarization_sessions").update({
            status: "cancelled",
          }).eq("appointment_id", params.appointment_id);
        }
        break;
      }

      case "get_session": {
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions/${params.session_id}`, {
          method: "GET",
          headers: oneNotaryHeaders,
        });
        result = await resp.json();
        break;
      }

      case "get_video": {
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions/${params.session_id}/video`, {
          method: "GET",
          headers: oneNotaryHeaders,
        });
        result = await resp.json();
        break;
      }

      case "get_documents": {
        const resp = await fetch(`${ONE_NOTARY_BASE}/sessions/${params.session_id}/documents`, {
          method: "GET",
          headers: oneNotaryHeaders,
        });
        result = await resp.json();
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("OneNotary proxy error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
