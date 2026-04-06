import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- MIME Decoding Utilities ---

function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, "") // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeBase64(input: string): string {
  try {
    const clean = input.replace(/\r?\n/g, "");
    const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return input;
  }
}

function decodeContent(body: string, encoding: string): string {
  const enc = (encoding || "").toLowerCase().trim();
  if (enc === "quoted-printable") return decodeQuotedPrintable(body);
  if (enc === "base64") return decodeBase64(body);
  return body;
}

/**
 * Parse a MIME multipart message and extract text/plain and text/html parts.
 */
function parseMimeParts(rawBody: string): { textPlain: string; textHtml: string } {
  let textPlain = "";
  let textHtml = "";

  // Find boundary from Content-Type header embedded in body
  const boundaryMatch = rawBody.match(/boundary="?([^\s";\r\n]+)"?/i);
  if (!boundaryMatch) {
    // Not multipart — check if it looks like HTML
    const stripped = rawBody.replace(/^Content-[^\r\n]+\r?\n/gim, "").replace(/^\r?\n/, "");
    if (/<html|<div|<p|<table/i.test(stripped)) {
      textHtml = stripped;
      textPlain = stripped.replace(/<[^>]*>/g, "").substring(0, 10000);
    } else {
      textPlain = stripped.substring(0, 10000);
    }
    return { textPlain, textHtml };
  }

  const boundary = boundaryMatch[1];
  const parts = rawBody.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "g"));

  for (const part of parts) {
    if (part.trim() === "--" || !part.trim()) continue;

    const headerBodySplit = part.match(/^([\s\S]*?)\r?\n\r?\n([\s\S]*)$/);
    if (!headerBodySplit) continue;

    const headers = headerBodySplit[1];
    let body = headerBodySplit[2];

    const ctMatch = headers.match(/Content-Type:\s*([^\s;]+)/i);
    const cteMatch = headers.match(/Content-Transfer-Encoding:\s*(\S+)/i);
    const contentType = (ctMatch?.[1] || "").toLowerCase();
    const encoding = cteMatch?.[1] || "";

    // Handle nested multipart (e.g., multipart/alternative inside multipart/mixed)
    if (contentType.startsWith("multipart/")) {
      const nested = parseMimeParts(headers + "\r\n\r\n" + body);
      if (!textPlain && nested.textPlain) textPlain = nested.textPlain;
      if (!textHtml && nested.textHtml) textHtml = nested.textHtml;
      continue;
    }

    body = decodeContent(body.trim(), encoding);

    if (contentType === "text/plain" && !textPlain) {
      textPlain = body.substring(0, 10000);
    } else if (contentType === "text/html" && !textHtml) {
      textHtml = body.substring(0, 50000);
      if (!textPlain) {
        textPlain = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 10000);
      }
    }
  }

  return { textPlain, textHtml };
}

// --- IMAP Utilities ---

async function imapCommand(conn: Deno.TlsConn, command: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  await conn.write(encoder.encode(command + "\r\n"));

  let response = "";
  const buf = new Uint8Array(16384);
  const tagMatch = command.match(/^(A\d+)\s/);
  const tag = tagMatch ? tagMatch[1] : null;

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const n = await conn.read(buf);
    if (n === null) break;
    response += decoder.decode(buf.subarray(0, n));
    if (tag && (response.includes(`${tag} OK`) || response.includes(`${tag} NO`) || response.includes(`${tag} BAD`))) break;
    if (!tag && (response.includes("OK") || response.includes("NO"))) break;
  }
  return response;
}

function parseEnvelope(line: string) {
  const subjectMatch = line.match(/BODY\[HEADER\.FIELDS \(SUBJECT\)\]\s*\{?\d*\}?\r?\n?Subject:\s*([^\r\n]*)/i);
  const fromMatch = line.match(/BODY\[HEADER\.FIELDS \(FROM\)\]\s*\{?\d*\}?\r?\n?From:\s*([^\r\n]*)/i);
  const toMatch = line.match(/BODY\[HEADER\.FIELDS \(TO\)\]\s*\{?\d*\}?\r?\n?To:\s*([^\r\n]*)/i);
  const dateMatch = line.match(/BODY\[HEADER\.FIELDS \(DATE\)\]\s*\{?\d*\}?\r?\n?Date:\s*([^\r\n]*)/i);
  const msgIdMatch = line.match(/BODY\[HEADER\.FIELDS \(MESSAGE-ID\)\]\s*\{?\d*\}?\r?\n?Message-ID?:\s*([^\r\n]*)/i);
  const inReplyToMatch = line.match(/BODY\[HEADER\.FIELDS \(IN-REPLY-TO\)\]\s*\{?\d*\}?\r?\n?In-Reply-To:\s*([^\r\n]*)/i);

  return {
    subject: subjectMatch?.[1]?.trim() || "(no subject)",
    from: fromMatch?.[1]?.trim() || "",
    to: toMatch?.[1]?.trim() || "",
    date: dateMatch?.[1]?.trim() || "",
    messageId: msgIdMatch?.[1]?.trim() || "",
    inReplyTo: inReplyToMatch?.[1]?.trim() || null,
  };
}

function extractEmailAddress(headerValue: string): string {
  const match = headerValue.match(/<([^>]+)>/);
  return match ? match[1] : headerValue.split(",")[0]?.trim() || "";
}

function extractEmailName(headerValue: string): string {
  const match = headerValue.match(/^"?([^"<]*)"?\s*</);
  return match ? match[1].trim() : "";
}

function extractAddresses(headerValue: string): string[] {
  if (!headerValue) return [];
  return headerValue.split(",").map(a => {
    const match = a.match(/<([^>]+)>/);
    return match ? match[1].trim() : a.trim();
  }).filter(Boolean);
}

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
    const sinceDateStr = `${sinceDate.getDate()}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;

    console.log(`Connecting to IMAP: ${imapHost} as ${emailAddress}`);

    const conn = await Deno.connectTls({ hostname: imapHost, port: 993 });

    const greetBuf = new Uint8Array(4096);
    await conn.read(greetBuf);

    const loginResp = await imapCommand(conn, `A001 LOGIN "${emailAddress}" "${emailPassword}"`);
    if (!loginResp.includes("A001 OK")) {
      conn.close();
      throw new Error(`IMAP login failed: ${loginResp.substring(0, 200)}`);
    }
    console.log("IMAP login successful");

    let synced = 0;
    const foldersToSync = ["INBOX", "Sent", "INBOX.Sent", "Sent Messages", "Sent Items"];

    for (const folderName of foldersToSync) {
      const folderKey = folderName === "INBOX" ? "inbox" : folderName.toLowerCase();

      try {
        const selectResp = await imapCommand(conn, `A002 SELECT "${folderName}"`);
        if (!selectResp.includes("A002 OK")) {
          console.warn(`Could not select folder ${folderName}`);
          continue;
        }

        const searchResp = await imapCommand(conn, `A003 SEARCH SINCE ${sinceDateStr}`);
        const uidLine = searchResp.split("\r\n").find(l => l.startsWith("* SEARCH"));
        if (!uidLine) { console.log(`No new messages in ${folderName}`); continue; }

        const uids = uidLine.replace("* SEARCH", "").trim().split(/\s+/).filter(Boolean);
        if (uids.length === 0) { console.log(`No new messages in ${folderName}`); continue; }

        console.log(`Found ${uids.length} messages in ${folderName} since ${sinceDateStr}`);

        const batchSize = 20;
        for (let i = 0; i < uids.length && i < 100; i += batchSize) {
          const batch = uids.slice(i, i + batchSize);
          const uidRange = batch.join(",");

          // Fetch full message (BODY[] instead of TEXT only) for proper MIME parsing
          const fetchResp = await imapCommand(
            conn,
            `A004 FETCH ${uidRange} (BODY.PEEK[HEADER.FIELDS (SUBJECT FROM TO DATE MESSAGE-ID IN-REPLY-TO CONTENT-TYPE)] BODY.PEEK[] FLAGS)`
          );

          const messages = fetchResp.split(/\* \d+ FETCH/);

          for (const msgBlock of messages) {
            if (!msgBlock.trim()) continue;

            const parsed = parseEnvelope(msgBlock);
            if (!parsed.messageId && !parsed.subject) continue;

            const messageId = parsed.messageId || `<${crypto.randomUUID()}@ionos-sync>`;

            const { data: existing } = await supabase
              .from("email_cache")
              .select("id")
              .eq("message_id", messageId)
              .limit(1);

            if (existing && existing.length > 0) continue;

            const fromAddr = extractEmailAddress(parsed.from);
            const fromName = extractEmailName(parsed.from);
            const toAddrs = extractAddresses(parsed.to);
            const date = parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString();

            // Extract raw body and parse MIME parts
            const bodyMatch = msgBlock.match(/BODY\[\]\s*\{(\d+)\}\r?\n([\s\S]*?)(?:\)\r?\n|$)/);
            const rawBody = bodyMatch ? bodyMatch[2] : msgBlock;

            const { textPlain, textHtml } = parseMimeParts(rawBody);

            const isRead = msgBlock.includes("\\Seen");

            await supabase.from("email_cache").insert({
              message_id: messageId,
              folder: folderKey,
              from_address: fromAddr,
              from_name: fromName,
              to_addresses: toAddrs,
              cc_addresses: [],
              subject: parsed.subject,
              body_text: textPlain || null,
              body_html: textHtml || null,
              date,
              is_read: isRead || folderKey !== "inbox",
              has_attachments: false,
              in_reply_to: parsed.inReplyTo || null,
              synced_at: new Date().toISOString(),
            });

            synced++;
          }
        }
      } catch (folderErr: any) {
        console.warn(`Could not sync folder ${folderName}:`, folderErr.message);
      }
    }

    try {
      await imapCommand(conn, "A099 LOGOUT");
      conn.close();
    } catch { /* ignore close errors */ }

    console.log(`IMAP sync complete. Synced ${synced} new messages.`);

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
    console.error("Email sync error:", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
