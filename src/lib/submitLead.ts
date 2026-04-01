/**
 * Simple client-side rate limiter for lead submissions.
 */
const _submitTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 submissions per minute

function isRateLimited(): boolean {
  const now = Date.now();
  // Purge old entries
  while (_submitTimestamps.length > 0 && now - _submitTimestamps[0] > RATE_LIMIT_WINDOW) {
    _submitTimestamps.shift();
  }
  return _submitTimestamps.length >= RATE_LIMIT_MAX;
}

/**
 * Submit a lead through the validated edge function.
 * Used for all public-facing (anonymous) lead forms.
 */
export async function submitLead(
  data: Record<string, string | null | undefined>
): Promise<{ success: boolean; error?: string }> {
  if (isRateLimited()) {
    return { success: false, error: "Too many submissions. Please wait a moment and try again." };
  }

  try {
    _submitTimestamps.push(Date.now());

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-lead`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(data),
      }
    );
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error || "Submission failed" };
    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
