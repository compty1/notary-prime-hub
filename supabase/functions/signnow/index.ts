import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const SIGNNOW_BASE = "https://api.signnow.com";

// --- Zod schemas for each action ---
const UploadDocumentSchema = z.object({
  action: z.literal("upload_document"),
  appointment_id: z.string().uuid().optional(),
  file_content: z.string().min(1, "file_content (base64) is required"),
  file_name: z.string().min(1, "file_name is required"),
});

const AddFieldsSchema = z.object({
  action: z.literal("add_fields"),
  document_id: z.string().min(1, "document_id is required"),
  fields: z.array(z.any()).optional().default([]),
});

const SendInviteSchema = z.object({
  action: z.literal("send_invite"),
  document_id: z.string().min(1, "document_id is required"),
  to: z.array(z.any()).min(1, "to[] is required"),
  from_email: z.string().email().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  appointment_id: z.string().uuid().optional(),
});

const DocumentIdSchema = z.object({
  action: z.enum(["get_document", "download_document", "create_signing_link", "check_document_webhooks"]),
  document_id: z.string().min(1, "document_id is required"),
});

const CancelInviteSchema = z.object({
  action: z.literal("cancel_invite"),
  document_id: z.string().min(1, "document_id is required"),
  appointment_id: z.string().uuid().optional(),
});

const NoParamsSchema = z.object({
  action: z.enum(["list_documents", "verify_token", "refresh_token", "check_webhooks"]),
});

const WEBHOOK_CALLBACK = `${Deno.env.get("SUPABASE_URL")}/functions/v1/signnow-webhook`;
const WEBHOOK_EVENTS = [
  "document.complete",
  "document.update",
  "document.delete",
  "invite.create",
  "invite.update",
  "invite.cancel",
];

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelay = 500
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok || attempt === retries) return resp;
      if (resp.status >= 500) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Retry ${attempt + 1}/${retries} for ${url} after ${delay}ms (status ${resp.status})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return resp; // 4xx errors don't retry
    } catch (e) {
      if (attempt === retries) throw e;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Retry ${attempt + 1}/${retries} for ${url} after ${delay}ms (network error)`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("fetchWithRetry exhausted");
}

async function registerDocumentWebhooks(
  documentId: string,
  token: string,
  serviceClient?: any
): Promise<{ succeeded: number; total: number }> {
  const secret = Deno.env.get("SIGNNOW_WEBHOOK_SECRET");
  const results = await Promise.allSettled(
    WEBHOOK_EVENTS.map((event) =>
      fetchWithRetry(
        `${SIGNNOW_BASE}/api/v2/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            event,
            entity_id: documentId,
            action: "callback",
            attributes: {
              callback: WEBHOOK_CALLBACK,
              use_tls_12: true,
              ...(secret ? { secret_key: secret } : {}),
            },
          }),
        },
        2, // 2 retries per event
        300
      ).then(async (r) => {
        if (!r.ok) {
          const t = await r.text();
          console.error(`Webhook register ${event} failed ${r.status}: ${t}`);
          throw new Error(`${event}: ${r.status}`);
        }
        return r;
      })
    )
  );
  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const total = WEBHOOK_EVENTS.length;
  console.log(`Webhook registration: ${succeeded}/${total} succeeded for doc ${documentId}`);

  // Update webhook status in notarization_sessions if serviceClient provided
  if (serviceClient) {
    const status = succeeded === total ? "active" : succeeded > 0 ? "partial" : "failed";
    await serviceClient
      .from("notarization_sessions")
      .update({ webhook_status: status, webhook_events_registered: succeeded })
      .eq("signnow_document_id", documentId);
  }

  return { succeeded, total };
}

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

function zodError(error: z.ZodError) {
  return new Response(JSON.stringify({ error: "Validation failed", details: error.flatten().fieldErrors }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    // --- Commission expiry check for session-creating actions ---
    if (["upload_document", "send_invite"].includes(action)) {
      const { data: certs } = await serviceClient
        .from("notary_certifications")
        .select("expiry_date")
        .eq("user_id", user.id)
        .eq("certification_name", "Notary Commission")
        .order("expiry_date", { ascending: false })
        .limit(1);

      if (certs && certs.length > 0 && certs[0].expiry_date) {
        const expiryDate = new Date(certs[0].expiry_date);
        if (expiryDate < new Date()) {
          return new Response(JSON.stringify({
            error: "Your notary commission has expired. Per Ohio ORC §147.03, you cannot perform notarial acts with an expired commission. Please renew your commission before proceeding.",
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Also check platform_settings for commission_expiry_date
      const { data: setting } = await serviceClient
        .from("platform_settings")
        .select("setting_value")
        .eq("setting_key", "commission_expiry_date")
        .single();

      if (setting?.setting_value) {
        const expiryDate = new Date(setting.setting_value);
        if (expiryDate < new Date()) {
          return new Response(JSON.stringify({
            error: "Notary commission has expired per platform settings. Update your commission expiry date in Settings before proceeding.",
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    switch (action) {
      case "upload_document": {
        const parsed = UploadDocumentSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { appointment_id, file_content, file_name } = parsed.data;

        const token = Deno.env.get("SIGNNOW_API_TOKEN");
        if (!token) throw new Error("SIGNNOW_API_TOKEN not configured");

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

        if (documentId) {
          if (appointment_id) {
            await serviceClient.from("notarization_sessions").upsert({
              appointment_id,
              signnow_document_id: documentId,
              session_type: "ron",
              status: "scheduled",
              webhook_status: "pending",
            }, { onConflict: "appointment_id" });
          }

          // Register per-document webhooks (awaited so we can track status)
          registerDocumentWebhooks(documentId, token, serviceClient).catch((e) =>
            console.error("Webhook registration error:", e)
          );
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add_fields": {
        const parsed = AddFieldsSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { document_id, fields } = parsed.data;

        const result = await signnowFetch(`/document/${document_id}`, {
          method: "PUT",
          body: JSON.stringify({ fields }),
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_invite": {
        const parsed = SendInviteSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { document_id, to, from_email, subject, message, appointment_id } = parsed.data;

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
        const parsed = DocumentIdSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { document_id } = parsed.data;
        const result = await signnowFetch(`/document/${document_id}`, { method: "GET" });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "download_document": {
        const parsed = DocumentIdSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { document_id } = parsed.data;
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
        const parsed = CancelInviteSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { document_id, appointment_id } = parsed.data;
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
        const parsed = DocumentIdSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { document_id } = parsed.data;
        const result = await signnowFetch("/link", {
          method: "POST",
          body: JSON.stringify({ document_id }),
        });
        if (!result?.url && !result?.url_no_es) {
          throw new Error("SignNow did not return a valid signing link");
        }
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
            await resp.text(); // consume body
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
        const masked = tokenData.access_token
          ? `***${tokenData.access_token.slice(-8)}`
          : null;
        return new Response(JSON.stringify({
          success: true,
          access_token_masked: masked,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          note: "Token refreshed. Update the SIGNNOW_API_TOKEN secret with the new token via your dashboard.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check_webhooks": {
        const { data: sessions } = await serviceClient
          .from("notarization_sessions")
          .select("id, appointment_id, signnow_document_id, webhook_status, webhook_events_registered, status, created_at")
          .not("signnow_document_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        return new Response(JSON.stringify({ sessions: sessions || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check_document_webhooks": {
        const parsed = DocumentIdSchema.safeParse(body);
        if (!parsed.success) return zodError(parsed.error);
        const { document_id } = parsed.data;
        const token = Deno.env.get("SIGNNOW_API_TOKEN");
        if (!token) throw new Error("SIGNNOW_API_TOKEN not configured");

        // Query SignNow API for active event subscriptions on this document
        const resp = await fetchWithRetry(
          `${SIGNNOW_BASE}/api/v2/events?entity_id=${document_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
          2,
          300
        );

        if (!resp.ok) {
          const text = await resp.text();
          console.error(`Check webhooks failed ${resp.status}: ${text}`);
          return new Response(JSON.stringify({
            document_id,
            subscriptions: [],
            error: `SignNow API ${resp.status}: ${text}`,
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await resp.json();
        const subscriptions = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

        // Also fetch local DB status
        const { data: sessionData } = await serviceClient
          .from("notarization_sessions")
          .select("webhook_status, webhook_events_registered")
          .eq("signnow_document_id", document_id)
          .single();

        return new Response(JSON.stringify({
          document_id,
          subscriptions,
          total_active: subscriptions.length,
          db_status: sessionData?.webhook_status || null,
          db_events_registered: sessionData?.webhook_events_registered || 0,
        }), {
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
