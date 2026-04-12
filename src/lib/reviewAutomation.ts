/**
 * G-001+: Review request automation.
 * Sends review request emails after completed appointments.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Trigger a review request for a completed appointment.
 * Called from post-session workflow or admin action.
 */
export async function sendReviewRequest(appointmentId: string): Promise<boolean> {
  try {
    // Check if review already exists
    const { data: existing } = await supabase
      .from("client_feedback")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (existing) return false; // Already reviewed

    // Check if review email already sent
    const { data: emailSent } = await supabase
      .from("appointment_emails")
      .select("id")
      .eq("appointment_id", appointmentId)
      .eq("email_type", "review_request")
      .maybeSingle();

    if (emailSent) return false; // Already sent

    // Trigger review request email
    const { error } = await supabase.functions.invoke("send-appointment-emails", {
      body: {
        appointment_id: appointmentId,
        email_type: "review_request",
      },
    });

    if (error) {
      console.error("Failed to send review request:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Review request error:", err);
    return false;
  }
}

/**
 * Submit a client review/feedback.
 */
export async function submitReview(params: {
  appointmentId: string;
  clientId: string;
  rating: number;
  comment?: string;
  npsScore?: number;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("client_feedback").insert({
      appointment_id: params.appointmentId,
      client_id: params.clientId,
      rating: params.rating,
      comment: params.comment || null,
      nps_score: params.npsScore ?? null,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Review submission error:", err);
    return false;
  }
}

/**
 * Get review stats for a notary.
 */
export async function getNotaryReviewStats(notaryUserId: string) {
  const { data } = await supabase
    .from("client_feedback")
    .select("rating, comment, created_at, appointment_id");

  if (!data || data.length === 0) {
    return { avgRating: 0, totalReviews: 0, ratingDistribution: {} };
  }

  // Filter to appointments assigned to this notary
  const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
  const distribution: Record<number, number> = {};
  data.forEach(r => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  return {
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: data.length,
    ratingDistribution: distribution,
  };
}
