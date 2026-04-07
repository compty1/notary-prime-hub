import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  const start = Date.now();
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { z } = await import("https://esm.sh/zod@3.23.8");
    const BodySchema = z.object({
      documentId: z.string().uuid(),
      newStatus: z.string().max(50),
      clientId: z.string().uuid(),
      fileName: z.string().max(500).optional(),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { documentId, newStatus, clientId, fileName } = parsed.data;

    // Get client email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", clientId)
      .single();

    if (!profile?.email) {
      return new Response(JSON.stringify({ error: "Client email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusMessages: Record<string, string> = {
      pending_review: "Your document is now under review by our team.",
      approved: "Your document has been approved and is ready for notarization.",
      notarized: "Your document has been notarized. You can download the notarized copy from your portal.",
      rejected: "Your document requires attention. Please check your portal for details.",
    };

    const message = statusMessages[newStatus] || `Your document status has been updated to: ${newStatus}`;
    const subject = `Document Update: ${fileName || "Your Document"} — ${newStatus.replace(/_/g, " ").toUpperCase()}`;

    // Enqueue notification email
    await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: profile.email,
        subject,
        html: `
          <h2>Document Status Update</h2>
          <p>Hi ${profile.full_name || "there"},</p>
          <p>${message}</p>
          <p><strong>Document:</strong> ${fileName || "N/A"}</p>
          <p><strong>New Status:</strong> ${newStatus.replace(/_/g, " ")}</p>
          <p><a href="https://notary-prime-hub.lovable.app/portal?tab=documents">View in Portal →</a></p>
          <p>— NotarDex Team</p>
        `,
      },
    });

    // Also create correspondence record
    await supabase.from("client_correspondence").insert({
      client_id: clientId,
      direction: "outbound",
      subject,
      body: message,
      status: "sent",
      from_address: "notifications@notardex.com",
      to_address: profile.email,
    });

    console.log(`send-document-notification completed in ${Date.now() - start}ms`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`send-document-notification error (${Date.now() - start}ms):`, (error as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
