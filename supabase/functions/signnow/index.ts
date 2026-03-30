import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIGNNOW_BASE = "https://api.signnow.com";

async function signnowFetch(path: string, options: RequestInit = {}) {
  const token = Deno.env.get("SIGNNOW_API_TOKEN");
  if (!token) throw new Error("SIGNNOW_API_TOKEN not configured");
  const resp = await fetch(`${SIGNNOW_BASE}${path}`, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    console.error(`SignNow API error ${resp.status}: ${text}`);
    throw new Error(`SignNow API ${resp.status}: ${text}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      case "upload_document": {
        const { appointment_id, file_content, file_name } = body;
        if (!file_content || !file_name) throw new Error("file_content (base64) and file_name are required");

        // SignNow expects multipart/form-data for document upload
        const token = Deno.env.get("SIGNNOW_API_TOKEN");
        if (!token) throw new Error("SIGNNOW_API_TOKEN not configured");

        // Decode base64 to binary
        const binaryStr = atob(file_content);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const formData = new FormData();
        formData.append("file", new Blob([bytes], { type: "application/pdf" }), file_name);

        const resp = await fetch(`${SIGNNOW_BASE}/document`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
          body: formData,
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`SignNow upload error ${resp.status}: ${text}`);
        }

        const result = await resp.json();
        const documentId = result.id;

        if (documentId && appointment_id) {
          await serviceClient.from("notarization_sessions").upsert({
            appointment_id,
            signnow_document_id: documentId,
            session_type: "ron",
            status: "scheduled",
          }, { onConflict: "appointment_id" });
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_fields": {
        const { document_id, fields } = body;
        if (!document_id) throw new Error("document_id is required");

        // PUT /document/{id} with fields array
        const result = await signnowFetch(`/document/${document_id}`, {
          method: "PUT",
          body: JSON.stringify({ fields: fields || [] }),
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_invite": {
        const { document_id, to, from_email, subject, message, appointment_id } = body;
        if (!document_id || !to) throw new Error("document_id and to[] are required");

        const invitePayload: Record<string, any> = {
          document_id,
          to,
          from: from_email || "noreply@notardex.com",
          subject: subject || "Please sign this document",
          message: message || "You have a document to sign. Please review and sign at your earliest convenience.",
        };

        const result = await signnowFetch(`/document/${document_id}/invite`, {
          method: "POST",
          body: JSON.stringify(invitePayload),
        });

        if (appointment_id) {
          await serviceClient.from("notarization_sessions").update({
            status: "confirmed",
            participant_link: `https://app.signnow.com/webapp/document/${document_id}`,
          }).eq("signnow_document_id", document_id);
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_document": {
        const { document_id } = body;
        if (!document_id) throw new Error("document_id is required");
        const result = await signnowFetch(`/document/${document_id}`, { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "download_document": {
        const { document_id } = body;
        if (!document_id) throw new Error("document_id is required");
        const token = Deno.env.get("SIGNNOW_API_TOKEN");
        if (!token) throw new Error("SIGNNOW_API_TOKEN not configured");
        const resp = await fetch(`${SIGNNOW_BASE}/document/${document_id}/download?type=collapsed`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/pdf",
          },
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`SignNow download error ${resp.status}: ${text}`);
        }
        // Return the binary PDF directly
        const pdfData = await resp.arrayBuffer();
        return new Response(pdfData, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${document_id}.pdf"`,
          },
        });
      }

      case "cancel_invite": {
        const { document_id, appointment_id } = body;
        if (!document_id) throw new Error("document_id is required");
        await signnowFetch(`/document/${document_id}/invite/cancel`, { method: "PUT" });
        if (appointment_id) {
          await serviceClient.from("notarization_sessions").update({ status: "cancelled" }).eq("signnow_document_id", document_id);
          await serviceClient.from("appointments").update({ status: "cancelled" }).eq("id", appointment_id);
        }
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_documents": {
        const result = await signnowFetch("/user/documentsv2", { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_signing_link": {
        const { document_id } = body;
        if (!document_id) throw new Error("document_id is required");
        const result = await signnowFetch("/link", {
          method: "POST",
          body: JSON.stringify({ document_id }),
        });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "verify_token": {
        const token = Deno.env.get("SIGNNOW_API_TOKEN");
        if (!token) {
          return new Response(JSON.stringify({ valid: false, error: "SIGNNOW_API_TOKEN not configured" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        try {
          const resp = await fetch(`${SIGNNOW_BASE}/oauth2/token`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
          });
          if (!resp.ok) {
            return new Response(JSON.stringify({ valid: false, error: `Token invalid (${resp.status})` }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          const data = await resp.json();
          return new Response(JSON.stringify({ valid: true, expires_in: data.expires_in, scope: data.scope, token_type: data.token_type }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ valid: false, error: e.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      case "refresh_token": {
        const basicToken = Deno.env.get("SIGNNOW_BASIC_TOKEN");
        const username = Deno.env.get("SIGNNOW_USERNAME");
        const password = Deno.env.get("SIGNNOW_PASSWORD");
        if (!basicToken || !username || !password) {
          return new Response(JSON.stringify({ error: "SIGNNOW_BASIC_TOKEN, SIGNNOW_USERNAME, and SIGNNOW_PASSWORD secrets are required for token refresh" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const tokenResp = await fetch(`${SIGNNOW_BASE}/oauth2/token`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${basicToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: new URLSearchParams({ username, password, grant_type: "password", scope: "*", expiration_time: "2592000" }),
        });
        if (!tokenResp.ok) {
          const text = await tokenResp.text();
          return new Response(JSON.stringify({ error: `Token refresh failed (${tokenResp.status}): ${text}` }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const tokenData = await tokenResp.json();
        return new Response(JSON.stringify({ success: true, access_token: tokenData.access_token, expires_in: tokenData.expires_in, token_type: tokenData.token_type }), {
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
    console.error("SignNow function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
