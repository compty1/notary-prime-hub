import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_API = "https://www.googleapis.com/calendar/v3";

async function getAccessToken(): Promise<{ token: string | null; error?: string }> {
  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_CALENDAR_REFRESH_TOKEN");
  if (!clientId || !clientSecret || !refreshToken) return { token: null };

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      console.error("Google token refresh failed:", data.error || res.status);
      return { token: null, error: data.error_description || "Token refresh failed. Please re-authorize Google Calendar." };
    }
    return { token: data.access_token };
  } catch (e) {
    console.error("Google token refresh error:", e.message);
    return { token: null, error: "Failed to connect to Google OAuth" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some(r => ["admin", "notary"].includes(r.role))) return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { token: accessToken, error: tokenError } = await getAccessToken();
    const { action, ...params } = await req.json();

    if (!accessToken) {
      return new Response(JSON.stringify({ error: tokenError || "Google Calendar not configured", connected: false }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // GET EVENTS
    if (action === "list_events") {
      const { timeMin, timeMax } = params;
      const url = `${GOOGLE_API}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      return new Response(JSON.stringify({ connected: true, events: data.items || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CREATE EVENT
    if (action === "create_event") {
      const { summary, description, start, end, location } = params;
      const event = { summary, description, location, start: { dateTime: start, timeZone: "America/New_York" }, end: { dateTime: end, timeZone: "America/New_York" }, reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] } };
      const res = await fetch(`${GOOGLE_API}/calendars/primary/events`, { method: "POST", headers, body: JSON.stringify(event) });
      const data = await res.json();
      return new Response(JSON.stringify({ connected: true, event: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // CHECK CONFLICTS
    if (action === "check_conflicts") {
      const { timeMin, timeMax } = params;
      const url = `${GOOGLE_API}/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      const conflicts = (data.items || []).filter((e: any) => e.status !== "cancelled");
      return new Response(JSON.stringify({ connected: true, hasConflicts: conflicts.length > 0, conflicts }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STATUS CHECK
    if (action === "status") {
      const res = await fetch(`${GOOGLE_API}/calendars/primary`, { headers });
      const data = await res.json();
      return new Response(JSON.stringify({ connected: true, calendar: { id: data.id, summary: data.summary } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("google-calendar-sync error:", e.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
