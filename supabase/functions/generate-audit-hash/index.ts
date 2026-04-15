// EF-316/317: Added auth check, salt/nonce, migrated to Deno.serve
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimitGuard } from "../_shared/middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rl = rateLimitGuard(req, 30);
  if (rl) return rl;

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { document_name, signer_name, notary_name, timestamp, session_id } = await req.json();
    if (!document_name || !signer_name || !notary_name || !timestamp) {
      return new Response(JSON.stringify({ error: "document_name, signer_name, notary_name, and timestamp are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // EF-316: Add nonce to prevent identical hashes for same inputs
    const nonce = crypto.randomUUID();
    const payload = `${document_name}|${signer_name}|${notary_name}|${timestamp}|${nonce}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    let chain_of_custody: { event: string; timestamp: string }[] = [];
    if (session_id) {
      const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: session } = await adminClient.from("notarization_sessions").select("*").eq("id", session_id).single();
      if (session) {
        chain_of_custody = [
          { event: "Session Created", timestamp: session.created_at },
          session.id_verified_at && { event: "ID Verified", timestamp: session.id_verified_at },
          session.kba_passed_at && { event: "KBA Passed", timestamp: session.kba_passed_at },
          session.started_at && { event: "Session Started", timestamp: session.started_at },
          session.completed_at && { event: "Session Completed", timestamp: session.completed_at },
        ].filter(Boolean) as { event: string; timestamp: string }[];
      }
    }

    return new Response(JSON.stringify({
      hash,
      nonce,
      fingerprint: hash.substring(0, 16),
      metadata: { document_name, signer_name, notary_name, timestamp },
      chain_of_custody,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-audit-hash error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
