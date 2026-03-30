/**
 * Submit a lead through the validated edge function.
 * Used for all public-facing (anonymous) lead forms.
 */
export async function submitLead(
  data: Record<string, string | null | undefined>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-lead`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
