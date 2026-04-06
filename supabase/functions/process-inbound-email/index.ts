import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify shared secret to prevent unauthorized invocation
    const authHeader = req.headers.get("Authorization");
    const expectedToken = Deno.env.get("ONENOTARY_API_TOKEN");
    if (expectedToken) {
      const token = authHeader?.replace("Bearer ", "");
      if (token !== expectedToken) {
        console.error("process-inbound-email: invalid auth token");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { from, to, subject, text, html } = body;

    if (!from || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing from or subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract sender email
    const senderEmail = from.match(/<(.+?)>/)?.[1] || from.trim();

    // Try to match to an existing client by email
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("email", senderEmail)
      .limit(1)
      .single();

    if (!profile) {
      console.log(`No matching client for email: ${senderEmail}`);
      return new Response(
        JSON.stringify({ message: "No matching client found", email: senderEmail }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create correspondence record
    const { error } = await supabase.from("client_correspondence").insert({
      client_id: profile.user_id,
      direction: "inbound",
      from_address: senderEmail,
      to_address: to || null,
      subject: subject,
      body: text || html || "(no body)",
      status: "pending",
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Inbound email logged for client ${profile.user_id}: ${subject}`);

    return new Response(
      JSON.stringify({ success: true, client_id: profile.user_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Process inbound email error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
