const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");

  return new Response(
    JSON.stringify({ publishableKey: publishableKey || "" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
