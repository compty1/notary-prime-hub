import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, start = 0, rows = 10 } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = `https://developer.uspto.gov/ibd-api/v1/application/publications?searchText=${encodeURIComponent(query)}&start=${start}&rows=${rows}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`USPTO API error: ${resp.status}`);
    const data = await resp.json();

    const results = (data.results || []).map((r: any) => ({
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
