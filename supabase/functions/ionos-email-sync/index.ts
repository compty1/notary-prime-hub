import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapFlow } from "npm:imapflow@1.0.164";

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
    const sinceDate = new Date(lastSync);

    console.log(`Connecting to IMAP: ${imapHost} as ${emailAddress}`);

    const client = new ImapFlow({
      host: imapHost,
      port: 993,
      secure: true,
      auth: {
        user: emailAddress,
        pass: emailPassword,
      },
      logger: false,
    });

    await client.connect();
    console.log("IMAP connected successfully");

    let synced = 0;
    const foldersToSync = ["INBOX", "Sent"];

    for (const folderName of foldersToSync) {
      try {
        const lock = await client.getMailboxLock(folderName);
        try {
          const folderKey = folderName === "INBOX" ? "inbox" : folderName.toLowerCase();
          
          // Search for messages since last sync
          const messages = client.fetch(
            { since: sinceDate },
            {
              envelope: true,
              bodyStructure: true,
              source: { maxBytes: 100000 },
            }
          );

          for await (const msg of messages) {
            const envelope = msg.envelope;
            if (!envelope) continue;

            const messageId = envelope.messageId || `<${msg.uid}-${folderName}@ionos>`;
            
            // Check if already cached
            const { data: existing } = await supabase
              .from("email_cache")
              .select("id")
              .eq("message_id", messageId)
              .limit(1);

            if (existing && existing.length > 0) continue;

            const fromAddr = envelope.from?.[0]?.address || "";
            const fromName = envelope.from?.[0]?.name || "";
            const toAddrs = (envelope.to || []).map((a: any) => a.address).filter(Boolean);
            const ccAddrs = (envelope.cc || []).map((a: any) => a.address).filter(Boolean);
            const subject = envelope.subject || "(no subject)";
            const date = envelope.date ? new Date(envelope.date).toISOString() : new Date().toISOString();

            // Extract body text from source
            let bodyText = "";
            let bodyHtml = "";
            if (msg.source) {
              const rawSource = new TextDecoder().decode(msg.source);
              // Simple extraction - get text after headers
              const headerEnd = rawSource.indexOf("\r\n\r\n");
              if (headerEnd > -1) {
                const body = rawSource.substring(headerEnd + 4);
                bodyText = body.replace(/<[^>]*>/g, "").substring(0, 10000);
                if (body.includes("<html") || body.includes("<div") || body.includes("<p")) {
                  bodyHtml = body.substring(0, 50000);
                }
              }
            }

            const hasAttachments = msg.bodyStructure?.childNodes?.some(
              (n: any) => n.disposition === "attachment"
            ) || false;

            await supabase.from("email_cache").insert({
              message_id: messageId,
              folder: folderKey,
              from_address: fromAddr,
              from_name: fromName,
              to_addresses: toAddrs,
              cc_addresses: ccAddrs,
              subject,
              body_text: bodyText || null,
              body_html: bodyHtml || null,
              date,
              is_read: folderKey !== "inbox",
              has_attachments: hasAttachments,
              in_reply_to: envelope.inReplyTo || null,
              synced_at: new Date().toISOString(),
            });

            synced++;
          }
        } finally {
          lock.release();
        }
      } catch (folderErr: any) {
        console.warn(`Could not sync folder ${folderName}:`, folderErr.message);
      }
    }

    await client.logout();
    console.log(`IMAP sync complete. Synced ${synced} new messages.`);

    // Log sync attempt
    await supabase.from("audit_log").insert({
      action: "email_sync_completed",
      entity_type: "email_cache",
      details: { last_sync: lastSync, imap_host: imapHost, email: emailAddress, synced },
    });

    // Auto-match unmatched cached emails to client profiles
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

        const { data: existing } = await supabase
          .from("client_correspondence")
          .select("id")
          .eq("subject", email.subject || "")
          .eq("from_address", email.from_address)
          .limit(1);

        if (existing && existing.length > 0) continue;

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
        message: `Sync complete. ${synced} new emails fetched, ${matched} matched to client profiles.`,
        synced,
        matched,
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
