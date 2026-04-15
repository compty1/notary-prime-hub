import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard, requireEnvVars } from "../_shared/middleware.ts";

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
  } catch (e: unknown) {
    console.error("Google token refresh error:", (e as Error).message);
    return { token: null, error: "Failed to connect to Google OAuth" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit: 20 requests per minute
    const rlResponse = rateLimitGuard(req, 20);
    if (rlResponse) return rlResponse;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse(req, 401, "Unauthorized");

    const envErr = requireEnvVars(req, "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
    if (envErr) return envErr;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return errorResponse(req, 401, "Unauthorized");

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    if (!roles?.some((r: { role: string }) => ["admin", "notary"].includes(r.role))) {
      return errorResponse(req, 403, "Access Denied", "Admin or notary role required");
    }

    const { token: accessToken, error: tokenError } = await getAccessToken();
    const { action, ...params } = await req.json();

    if (!accessToken) {
      return jsonResponse(req, { error: tokenError || "Google Calendar not configured", connected: false });
    }

    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    if (action === "list_events") {
      const { timeMin, timeMax } = params;
      const url = `${GOOGLE_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      return jsonResponse(req, { connected: true, events: data.items || [] });
    }

    if (action === "create_event") {
      const { summary, description, start, end, location, timeZone: tz } = params;
      const timeZone = tz || "America/New_York";
      const event = { summary, description, location, start: { dateTime: start, timeZone }, end: { dateTime: end, timeZone }, reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] } };
      const res = await fetch(`${GOOGLE_API}/calendars/primary/events`, { method: "POST", headers, body: JSON.stringify(event) });
      const data = await res.json();
      return jsonResponse(req, { connected: true, event: data });
    }

    if (action === "check_conflicts") {
      const { timeMin, timeMax } = params;
      const url = `${GOOGLE_API}/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      const conflicts = (data.items || []).filter((e: Record<string, unknown>) => e.status !== "cancelled");
      return jsonResponse(req, { connected: true, hasConflicts: conflicts.length > 0, conflicts });
    }

    if (action === "status") {
      const res = await fetch(`${GOOGLE_API}/calendars/primary`, { headers });
      const data = await res.json();
      return jsonResponse(req, { connected: true, calendar: { id: data.id, summary: data.summary } });
    }

    return errorResponse(req, 400, "Unknown action");
  } catch (e: unknown) {
    console.error("google-calendar-sync error:", (e as Error).message);
    return errorResponse(req, 500, "Internal server error");
  }
});
