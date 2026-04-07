import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { documentId, newStatus, clientId, fileName } = await req.json();

    if (!documentId || !newStatus || !clientId) {
      return new Response(JSON.stringify({ error: "documentId, newStatus, and clientId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          <p><a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/portal?tab=documents">View in Portal →</a></p>
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
