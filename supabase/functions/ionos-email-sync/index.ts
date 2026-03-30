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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const emailAddress = Deno.env.get("IONOS_EMAIL_ADDRESS");
    const emailPassword = Deno.env.get("IONOS_EMAIL_PASSWORD");
    const imapHost = Deno.env.get("IONOS_IMAP_HOST") || "imap.ionos.com";

    if (!emailAddress || !emailPassword) {
      return new Response(
        JSON.stringify({ error: "IONOS credentials not configured", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get last sync timestamp
    const { data: lastEmail } = await supabase
      .from("email_cache")
      .select("synced_at")
      .order("synced_at", { ascending: false })
      .limit(1)
      .single();

    const lastSync = lastEmail?.synced_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // NOTE: Full IMAP sync requires imapflow which needs Node.js runtime.
    // For Deno edge functions, we use a polling approach where the admin
    // manually triggers sync or emails are cached when read/sent.
    // 
    // In production, this would connect to IONOS IMAP:
    // const { ImapFlow } = await import("npm:imapflow");
    // const client = new ImapFlow({
    //   host: imapHost,
    //   port: 993,
    //   secure: true,
    //   auth: { user: emailAddress, pass: emailPassword },
    // });
    //
    // For now, this endpoint serves as a manual sync trigger
    // that can be extended with a proper IMAP library or
    // an external email-to-webhook service.

    console.log(`Email sync triggered. Last sync: ${lastSync}. IMAP host: ${imapHost}`);

    // Log sync attempt
    await supabase.from("audit_log").insert({
      action: "email_sync_triggered",
      entity_type: "email_cache",
      details: { last_sync: lastSync, imap_host: imapHost, email: emailAddress },
    });

    // Auto-match any unmatched cached emails to client profiles
    const { data: unmatchedEmails } = await supabase
      .from("email_cache")
      .select("id, from_address, subject, body_text, date")
      .eq("folder", "inbox")
      .order("date", { ascending: false })
      .limit(50);

    let matched = 0;
    if (unmatchedEmails) {
      for (const email of unmatchedEmails) {
        if (!email.from_address) continue;

        // Check if correspondence already exists
        const { data: existing } = await supabase
          .from("client_correspondence")
          .select("id")
          .eq("subject", email.subject || "")
          .eq("from_address", email.from_address)
          .limit(1);

        if (existing && existing.length > 0) continue;

        // Match sender to profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", email.from_address)
          .single();

        if (profile) {
          await supabase.from("client_correspondence").insert({
            client_id: profile.user_id,
            direction: "inbound",
            subject: email.subject || "(no subject)",
            body: email.body_text || "",
            from_address: email.from_address,
            status: "pending",
          });
          matched++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync complete. Matched ${matched} emails to client profiles.`,
        last_sync: lastSync,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Email sync error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
