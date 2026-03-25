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
 * Shorthand for calling an edge function with proper auth.
 */
export async function callEdgeFunction(
  functionName: string,
  body: Record<string, unknown>
): Promise<Response> {
  const headers = await getEdgeFunctionHeaders();
  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
