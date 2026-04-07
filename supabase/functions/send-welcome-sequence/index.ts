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
      userId: z.string().uuid(),
      email: z.string().email().max(255),
      fullName: z.string().max(200).optional(),
    });
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { userId, email, fullName } = parsed.data;

    const name = fullName || "there";
    const portalUrl = "https://notary-prime-hub.lovable.app";

    // Email 1: Welcome (immediate)
    await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: email,
        subject: "Welcome to NotarDex — Your Notarization Partner",
        html: `
          <h2>Welcome to NotarDex, ${name}!</h2>
          <p>Thank you for creating your account. We're Ohio's trusted platform for notarization services.</p>
          <h3>What you can do:</h3>
          <ul>
            <li>📅 <strong>Book appointments</strong> — in-person or Remote Online Notarization (RON)</li>
            <li>📄 <strong>Upload documents</strong> — securely store and manage your files</li>
            <li>✅ <strong>Track progress</strong> — real-time status updates on your notarizations</li>
          </ul>
          <p><a href="${portalUrl}/book">Book Your First Appointment →</a></p>
          <p>— The NotarDex Team</p>
        `,
      },
    });

    // Email 2: Getting started tips (24h delay)
    await supabase.rpc("enqueue_email", {
      queue_name: "followup_emails",
      payload: {
        to: email,
        subject: "Getting Started with NotarDex — Quick Tips",
        html: `
          <h2>Quick Start Guide</h2>
          <p>Hi ${name},</p>
          <p>Here are some tips to get the most out of NotarDex:</p>
          <ol>
            <li><strong>Complete your profile</strong> — Add your address and phone for faster booking</li>
            <li><strong>Upload documents early</strong> — Our AI reviews them for compliance before your session</li>
            <li><strong>Try Remote Notarization</strong> — Complete notarizations from anywhere via video</li>
          </ol>
          <p><a href="${portalUrl}/portal">Go to Your Portal →</a></p>
          <p>Questions? Use the chat feature in your portal to reach us anytime.</p>
          <p>— NotarDex Team</p>
        `,
        delay_hours: 24,
      },
    });

    // Email 3: Services overview (72h delay)
    await supabase.rpc("enqueue_email", {
      queue_name: "followup_emails",
      payload: {
        to: email,
        subject: "Explore NotarDex Services — More Than Just Notarization",
        html: `
          <h2>Did You Know?</h2>
          <p>Hi ${name},</p>
          <p>Beyond standard notarization, NotarDex offers:</p>
          <ul>
            <li>🏠 <strong>Loan Signing Services</strong> — For real estate closings</li>
            <li>🌍 <strong>Apostille Services</strong> — For international document use</li>
            <li>📋 <strong>Document Preparation</strong> — We help prepare common legal documents</li>
            <li>🏥 <strong>Hospital & Facility Visits</strong> — We come to you</li>
          </ul>
          <p><a href="${portalUrl}/services">Browse All Services →</a></p>
          <p>— NotarDex Team</p>
        `,
        delay_hours: 72,
      },
    });

    console.log(`send-welcome-sequence completed in ${Date.now() - start}ms`);
    return new Response(JSON.stringify({ success: true, emails_queued: 3 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`send-welcome-sequence error (${Date.now() - start}ms):`, (error as Error).message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
