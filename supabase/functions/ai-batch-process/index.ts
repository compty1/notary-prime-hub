import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentIds } = await req.json();
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return new Response(JSON.stringify({ error: "documentIds array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (documentIds.length > 20) {
      return new Response(JSON.stringify({ error: "Maximum 20 documents per batch" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: { document_id: string; file_name: string; status: string; findings: string[] }[] = [];

    for (const docId of documentIds) {
      try {
        const { data: doc } = await serviceClient.from("documents").select("*").eq("id", docId).single();
        if (!doc) {
          results.push({ document_id: docId, file_name: "Unknown", status: "error", findings: ["Document not found"] });
          continue;
        }

        const { data: fileData, error: dlErr } = await serviceClient.storage.from("documents").download(doc.file_path);
        if (dlErr || !fileData) {
          results.push({ document_id: docId, file_name: doc.file_name, status: "error", findings: ["Could not download file"] });
          continue;
        }

        const text = await fileData.text();
        const truncated = text.slice(0, 30000);

        const findings: string[] = [];
        // Basic automated checks
        if (!truncated.match(/signature|signed/i)) findings.push("No signature field detected");
        if (!truncated.match(/date|dated/i)) findings.push("No date field detected");
        if (!truncated.match(/notary|notarize/i)) findings.push("Missing notary block");
        if (!truncated.match(/state of ohio|ohio/i)) findings.push("Missing Ohio venue/jurisdiction");
        if (!truncated.match(/county/i)) findings.push("Missing county reference");

        const status = findings.length === 0 ? "pass" : "review";
        results.push({ document_id: docId, file_name: doc.file_name, status, findings });
      } catch (e: unknown) {
        results.push({ document_id: docId, file_name: "Unknown", status: "error", findings: [e.message] });
      }
    }

    const passCount = results.filter(r => r.status === "pass").length;
    const reviewCount = results.filter(r => r.status === "review").length;
    const errorCount = results.filter(r => r.status === "error").length;

    return new Response(JSON.stringify({
      summary: { total: results.length, pass: passCount, review: reviewCount, errors: errorCount },
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
