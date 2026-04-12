/**
 * SVC-108/503: SMS consent management
 * Opt-in checkbox, consent flag tracking, and unsubscribe handling.
 */
import { supabase } from "@/integrations/supabase/client";
import { logConsent, CONSENT_TYPES } from "@/lib/consentLogging";

/** Check if user has SMS consent */
export async function hasSMSConsent(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("audit_log")
    .select("details")
    .eq("user_id", userId)
    .eq("entity_type", "consent")
    .eq("entity_id", CONSENT_TYPES.SMS_OPT_IN)
    .order("created_at", { ascending: false })
    .limit(1);
  
  if (!data?.length) return false;
  const details = data[0].details as Record<string, any> | null;
  return details?.granted === true;
}

/** Grant SMS consent */
export async function grantSMSConsent(userId: string) {
  await logConsent(
    { consentType: CONSENT_TYPES.SMS_OPT_IN, version: "1.0", granted: true },
    userId
  );
}

/** Revoke SMS consent */
export async function revokeSMSConsent(userId: string) {
  await logConsent(
    { consentType: CONSENT_TYPES.SMS_OPT_IN, version: "1.0", granted: false },
    userId
  );
}
