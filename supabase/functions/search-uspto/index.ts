// EF-320: Added auth check + migrated to Deno.serve + rate limiting
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
  const rl = rateLimitGuard(req, 20);
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

    const { query, start = 0, rows = 10 } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = `https://developer.uspto.gov/ibd-api/v1/application/publications?searchText=${encodeURIComponent(query)}&start=${start}&rows=${rows}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`USPTO API error: ${resp.status}`);
    const data = await resp.json();

    const results = (data.results || []).map((r: { patentNumber?: string; publicationReferenceDocumentNumber?: string; inventionTitle?: string; abstractText?: string[]; assigneeEntityName?: string; filingDate?: string; publicationDate?: string; inventorNameArrayText?: string[] }) => ({
      patentNumber: r.patentNumber || r.publicationReferenceDocumentNumber,
      title: r.inventionTitle,
      abstract: r.abstractText?.[0] || "",
      assignee: r.assigneeEntityName,
      filingDate: r.filingDate,
      publicationDate: r.publicationDate,
      inventors: r.inventorNameArrayText || [],
    }));

    return new Response(JSON.stringify({ results, total: data.recordTotalQuantity || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("search-uspto error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
