/**
 * CO-008: Privacy policy versioning with re-consent tracking
 */
import { supabase } from "@/integrations/supabase/client";

export const CURRENT_PRIVACY_VERSION = "2.1";
export const CURRENT_TERMS_VERSION = "2.0";

export interface ConsentRecord {
  consentType: string;
  version: string;
  grantedAt: string;
}

export async function checkUserConsent(
  userId: string,
  consentType: string,
  requiredVersion: string
): Promise<boolean> {
  const { data } = await supabase
    .from("consent_logs")
    .select("version, granted_at, revoked_at")
    .eq("user_id", userId)
    .eq("consent_type", consentType)
    .order("granted_at", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return false;
  const latest = data[0];
  if (latest.revoked_at) return false;
  return latest.version === requiredVersion;
}

export async function recordConsent(
  userId: string,
  consentType: string,
  version: string
): Promise<void> {
  await supabase.from("consent_logs").insert({
    user_id: userId,
    consent_type: consentType,
    version,
    ip_address: null, // Set server-side if needed
    user_agent: navigator.userAgent,
  });
}

export async function revokeConsent(
  userId: string,
  consentType: string
): Promise<void> {
  // Mark the latest as revoked
  const { data } = await supabase
    .from("consent_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("consent_type", consentType)
    .is("revoked_at", null)
    .order("granted_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    await supabase.from("consent_logs").update({
      revoked_at: new Date().toISOString(),
    }).eq("id", data[0].id);
  }
}

export function needsReConsent(
  currentVersion: string,
  acceptedVersion: string | null
): boolean {
  if (!acceptedVersion) return true;
  return currentVersion !== acceptedVersion;
}
