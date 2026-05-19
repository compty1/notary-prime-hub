// Periodic cleanup of stale unpaid slot reservations.
// Releases appointments that were inserted via `check_and_reserve_slot` but
// never received a paid Stripe payment_intent within the grace window.
// Schedule via Lovable Cloud cron (every 5 minutes) once enabled.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Cancel appointments older than 15 minutes that are still 'scheduled' and have no paid payment.
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: stale, error: selErr } = await supabase
    .from("appointments")
    .select("id, created_at, status")
    .eq("status", "scheduled")
    .lt("created_at", cutoff)
    .limit(200);

  if (selErr) {
    console.error("select stale", selErr);
    return new Response(JSON.stringify({ error: selErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ids: string[] = [];
  for (const appt of stale ?? []) {
    const { data: pay } = await supabase
      .from("payments")
      .select("id, status")
      .eq("appointment_id", appt.id)
      .in("status", ["paid", "processing", "requires_action"])
      .limit(1);
    if (!pay || pay.length === 0) ids.push(appt.id);
  }

  if (ids.length === 0) {
    return new Response(JSON.stringify({ released: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: updErr } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .in("id", ids);
  if (updErr) {
    console.error("update stale", updErr);
    return new Response(JSON.stringify({ error: updErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase.from("audit_log").insert({
    action: "cleanup_stale_reservations",
    entity_type: "appointments",
    details: { released_count: ids.length, ids },
  });

  return new Response(JSON.stringify({ released: ids.length, ids }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
