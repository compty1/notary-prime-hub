import { supabase } from "@/integrations/supabase/client";

/**
 * Returns authorization headers for edge function calls.
 * Refreshes token if needed before generating headers.
 * Falls back to anon key only for truly public endpoints.
 */
export async function getEdgeFunctionHeaders(): Promise<Record<string, string>> {
  // Attempt token refresh if session exists but may be stale (item 2533)
  const { data: { session } } = await supabase.auth.getSession();
  
  let accessToken = session?.access_token;
  
  // If session exists but token might be expiring soon, refresh it
  if (session?.expires_at) {
    const expiresInMs = (session.expires_at * 1000) - Date.now();
    if (expiresInMs < 60_000 && expiresInMs > 0) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session?.access_token) {
        accessToken = refreshed.session.access_token;
      }
    }
  }

  // Only use anon key if there truly is no session (item 2532)
  const token = accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

/**
 * Shorthand for calling an edge function with proper auth and timeout.
 */
export async function callEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs = 30000
): Promise<Response> {
  const headers = await getEdgeFunctionHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Streaming edge function call with proper auth. Returns a ReadableStream reader.
 */
export async function callEdgeFunctionStream(
  functionName: string,
  body: Record<string, unknown>,
  timeoutMs = 60000
): Promise<Response> {
  const headers = await getEdgeFunctionHeaders();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}
