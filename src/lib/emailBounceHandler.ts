/**
 * SVC-385: Email bounce handling utilities
 * Processes bounce webhooks and marks contacts as invalid.
 */
import { supabase } from "@/integrations/supabase/client";

export type BounceType = "hard" | "soft" | "complaint";

export interface BounceEvent {
  email: string;
  bounceType: BounceType;
  reason: string;
  timestamp: string;
}

/** Process an email bounce event */
export async function processEmailBounce(event: BounceEvent): Promise<void> {
  // Log the bounce in audit
  await supabase.from("audit_log").insert({
    action: `email_bounce_${event.bounceType}`,
    entity_type: "email",
    entity_id: event.email,
    details: {
      bounce_type: event.bounceType,
      reason: event.reason,
      timestamp: event.timestamp,
    } as any,
  });

  // For hard bounces, mark the profile email as invalid
  if (event.bounceType === "hard") {
    await supabase
      .from("profiles")
      .update({ email_verified: false } as any)
      .eq("email", event.email);
  }

  // Log to email_send_log
  await supabase.from("email_send_log").insert({
    recipient_email: event.email,
    template_name: "bounce_detected",
    status: "bounced",
    error_message: `${event.bounceType}: ${event.reason}`,
  });
}

/** Check if an email has bounced recently */
export async function hasRecentBounce(email: string): Promise<boolean> {
  const { data } = await supabase
    .from("email_send_log")
    .select("id")
    .eq("recipient_email", email)
    .eq("status", "bounced")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1);
  return (data?.length || 0) > 0;
}
