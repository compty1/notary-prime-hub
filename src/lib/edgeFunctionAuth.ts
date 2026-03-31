import { supabase } from "@/integrations/supabase/client";

/**
 * Returns authorization headers for edge function calls.
 * Uses the user's session access_token when available,
 * falls back to the anon key for public endpoints.
 */
export async function getEdgeFunctionHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
    // Always clear timeout — caller manages stream lifetime
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}
