/**
 * Terms of Service and Privacy Policy version management.
 * Enhancement #81 (TOS version management with re-consent)
 */

import { supabase } from "@/integrations/supabase/client";

export interface TermsVersion {
  key: string; // e.g., "terms_of_service", "privacy_policy"
  version: string;
  effectiveDate: string;
  content?: string;
}

/** Get current terms version from platform_settings */
export async function getCurrentTermsVersion(key: string): Promise<string | null> {
  const { data } = await supabase
    .from("platform_settings")
    .select("setting_value")
    .eq("setting_key", `${key}_version`)
    .maybeSingle();
  return data?.setting_value || null;
}

/** Check if user has accepted the current version */
export async function hasAcceptedCurrentTerms(userId: string, termsKey: string): Promise<boolean> {
  const version = await getCurrentTermsVersion(termsKey);
  if (!version) return true; // No version set = no consent required

  const { data } = await supabase
    .from("audit_log")
    .select("id")
    .eq("user_id", userId)
    .eq("action", `consent_${termsKey}`)
    .eq("entity_type", "terms")
    .eq("entity_id", version as any)
    .limit(1);

  return (data?.length || 0) > 0;
}

/** Record user acceptance of terms */
export async function recordTermsAcceptance(termsKey: string, version: string): Promise<void> {
  await supabase.rpc("log_audit_event", {
    _action: `consent_${termsKey}`,
    _entity_type: "terms",
    _entity_id: version as any,
    _details: { accepted_at: new Date().toISOString(), version } as any,
  });
}
