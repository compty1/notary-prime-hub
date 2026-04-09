import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    const { content, format, filename } = await req.json();
    if (!content || !format) {
      return new Response(JSON.stringify({ error: "Missing content or format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (format === "html") {
      // Return styled HTML that can be printed to PDF client-side
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${filename || "Document"}</title>
<style>
body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
h1 { font-size: 24px; border-bottom: 2px solid #1a365d; padding-bottom: 8px; color: #1a365d; }
h2 { font-size: 20px; color: #2d3748; margin-top: 24px; }
h3 { font-size: 16px; color: #4a5568; }
pre { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 12px; overflow-x: auto; font-size: 13px; }
code { background: #f7fafc; padding: 2px 4px; border-radius: 2px; font-size: 13px; }
table { border-collapse: collapse; width: 100%; margin: 16px 0; }
th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
th { background: #f7fafc; font-weight: 600; }
blockquote { border-left: 4px solid #1a365d; margin: 16px 0; padding: 8px 16px; color: #4a5568; background: #f7fafc; }
ul, ol { padding-left: 24px; }
@media print { body { margin: 0; } }
</style></head><body>${content}</body></html>`;

      return new Response(JSON.stringify({ html, filename: filename || "document" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Plain text / markdown export
    return new Response(JSON.stringify({ content, filename: filename || "document" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
