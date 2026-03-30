import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: hasAdmin } = await serviceClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (!hasAdmin) throw new Error("Forbidden: Admin only");
  return { user, serviceClient };
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  references?: string;
}) {
  const smtpHost = Deno.env.get("IONOS_SMTP_HOST") || "smtp.ionos.com";
  const emailAddress = Deno.env.get("IONOS_EMAIL_ADDRESS");
  const emailPassword = Deno.env.get("IONOS_EMAIL_PASSWORD");

  if (!emailAddress || !emailPassword) {
    throw new Error("IONOS email credentials not configured");
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: 587,
      tls: true,
      auth: {
        username: emailAddress,
        password: emailPassword,
      },
    },
  });

  await client.send({
    from: emailAddress,
    to: params.to,
    cc: params.cc || undefined,
    bcc: params.bcc || undefined,
    subject: params.subject,
    content: "auto",
    html: params.html,
    headers: {
      ...(params.inReplyTo ? { "In-Reply-To": params.inReplyTo } : {}),
      ...(params.references ? { "References": params.references } : {}),
    },
  });

  await client.close();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, serviceClient } = await verifyAdmin(req);
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "list": {
        const { folder = "inbox", limit = 50, offset = 0, search } = body;
        let query = serviceClient
          .from("email_cache")
          .select("id, message_id, folder, from_address, from_name, to_addresses, subject, date, is_read, is_starred, has_attachments, attachments")
          .eq("folder", folder)
          .order("date", { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.or(`subject.ilike.%${search}%,from_address.ilike.%${search}%,from_name.ilike.%${search}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ emails: data, total: count }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "read": {
        const { id } = body;
        if (!id) throw new Error("Missing email id");

        const { data, error } = await serviceClient
          .from("email_cache")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        // Mark as read
        if (!data.is_read) {
          await serviceClient
            .from("email_cache")
            .update({ is_read: true })
            .eq("id", id);
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send": {
        const { to, cc, bcc, subject, html, inReplyTo, references: refs } = body;
        if (!to || !subject || !html) throw new Error("Missing to, subject, or html");

        await sendEmail({ to, cc, bcc, subject, html, inReplyTo, references: refs });

        // Cache sent email
        const emailAddress = Deno.env.get("IONOS_EMAIL_ADDRESS") || "";
        await serviceClient.from("email_cache").insert({
          message_id: `<${crypto.randomUUID()}@notar.local>`,
          folder: "sent",
          from_address: emailAddress,
          from_name: "Notar",
          to_addresses: [to],
          cc_addresses: cc ? [cc] : [],
          subject,
          body_html: html,
          body_text: html.replace(/<[^>]*>/g, ""),
          date: new Date().toISOString(),
          is_read: true,
          in_reply_to: inReplyTo || null,
          references: refs || null,
        });

        // Auto-match to client correspondence
        const { data: matchedProfile } = await serviceClient
          .from("profiles")
          .select("user_id")
          .eq("email", to)
          .single();

        if (matchedProfile) {
          await serviceClient.from("client_correspondence").insert({
            client_id: matchedProfile.user_id,
            direction: "outbound",
            subject,
            body: html,
            from_address: emailAddress,
            to_address: to,
            status: "replied",
            handled_at: new Date().toISOString(),
            handled_by: user.id,
          });
        }

        // Audit log
        await serviceClient.from("audit_log").insert({
          action: "email_sent",
          entity_type: "email",
          user_id: user.id,
          details: { to, subject },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { id } = body;
        if (!id) throw new Error("Missing email id");

        const { data: email } = await serviceClient
          .from("email_cache")
          .select("folder")
          .eq("id", id)
          .single();

        if (email?.folder === "trash") {
          await serviceClient.from("email_cache").delete().eq("id", id);
        } else {
          await serviceClient
            .from("email_cache")
            .update({ folder: "trash" })
            .eq("id", id);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "move": {
        const { id, folder } = body;
        if (!id || !folder) throw new Error("Missing id or folder");

        await serviceClient
          .from("email_cache")
          .update({ folder })
          .eq("id", id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "mark_read":
      case "mark_unread": {
        const { id } = body;
        if (!id) throw new Error("Missing email id");

        await serviceClient
          .from("email_cache")
          .update({ is_read: action === "mark_read" })
          .eq("id", id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "star":
      case "unstar": {
        const { id } = body;
        if (!id) throw new Error("Missing email id");

        await serviceClient
          .from("email_cache")
          .update({ is_starred: action === "star" })
          .eq("id", id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "folders": {
        const { data } = await serviceClient
          .from("email_cache")
          .select("folder")
          .limit(1000);

        const folders = [...new Set((data || []).map((e: any) => e.folder))];
        const defaultFolders = ["inbox", "sent", "drafts", "starred", "archive", "trash"];
        const allFolders = [...new Set([...defaultFolders, ...folders])];

        // Get unread counts
        const counts: Record<string, number> = {};
        for (const f of allFolders) {
          const { count } = await serviceClient
            .from("email_cache")
            .select("id", { count: "exact", head: true })
            .eq("folder", f)
            .eq("is_read", false);
          counts[f] = count || 0;
        }

        return new Response(JSON.stringify({ folders: allFolders, unreadCounts: counts }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "search": {
        const { query: searchQuery, folder, from, dateFrom, dateTo, hasAttachment } = body;
        let q = serviceClient
          .from("email_cache")
          .select("id, message_id, folder, from_address, from_name, to_addresses, subject, date, is_read, is_starred, has_attachments")
          .order("date", { ascending: false })
          .limit(100);

        if (folder) q = q.eq("folder", folder);
        if (searchQuery) q = q.or(`subject.ilike.%${searchQuery}%,body_text.ilike.%${searchQuery}%,from_address.ilike.%${searchQuery}%`);
        if (from) q = q.ilike("from_address", `%${from}%`);
        if (dateFrom) q = q.gte("date", dateFrom);
        if (dateTo) q = q.lte("date", dateTo);
        if (hasAttachment) q = q.eq("has_attachments", true);

        const { data, error } = await q;
        if (error) throw error;

        return new Response(JSON.stringify({ emails: data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "bulk_action": {
        const { ids, bulkAction } = body;
        if (!ids?.length || !bulkAction) throw new Error("Missing ids or bulkAction");

        if (bulkAction === "mark_read") {
          await serviceClient.from("email_cache").update({ is_read: true }).in("id", ids);
        } else if (bulkAction === "mark_unread") {
          await serviceClient.from("email_cache").update({ is_read: false }).in("id", ids);
        } else if (bulkAction === "delete") {
          await serviceClient.from("email_cache").update({ folder: "trash" }).in("id", ids);
        } else if (bulkAction === "archive") {
          await serviceClient.from("email_cache").update({ folder: "archive" }).in("id", ids);
        }

        return new Response(JSON.stringify({ success: true }), {
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
    const status = err.message === "Unauthorized" ? 401 : err.message?.startsWith("Forbidden") ? 403 : 400;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
