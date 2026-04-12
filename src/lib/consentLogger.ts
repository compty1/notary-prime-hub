/**
 * CO-004 / DM-004: Consent logging utility.
 * Records immutable consent events for compliance tracking.
 */
import { supabase } from "@/integrations/supabase/client";

export type ConsentType =
  | "recording_consent"
  | "esign_consent"
  | "privacy_policy"
  | "terms_of_service"
  | "data_processing"
  | "marketing_email"
  | "sms_notifications"
  | "biometric_data"
  | "kba_authorization"
  | "hipaa_authorization";

interface ConsentRecord {
  consentType: ConsentType;
  granted: boolean;
  /** Additional context — e.g., appointment ID, document ID */
  context?: Record<string, unknown>;
  /** IP address if available */
  ipAddress?: string;
  /** Version of the terms/policy consented to */
  policyVersion?: string;
}

/**
 * Log a consent event. These records are immutable — never deleted.
 */
export async function logConsent(record: ConsentRecord): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("Cannot log consent without authenticated user");
      return false;
    }

    // Use audit_log for consent tracking until consent_logs table exists
    const { error } = await supabase.from("audit_log").insert({
      action: `consent_${record.granted ? "granted" : "revoked"}`,
      entity_type: "consent",
      entity_id: null,
      user_id: user.id,
      details: {
        consent_type: record.consentType,
        granted: record.granted,
        policy_version: record.policyVersion || "1.0",
        context: record.context || {},
        ip_address: record.ipAddress || null,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      } as any,
    });

    if (error) {
      console.error("Failed to log consent:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Consent logging error:", err);
    return false;
  }
}

/**
 * Check if user has granted a specific consent type.
 */
export async function hasConsent(consentType: ConsentType): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("audit_log")
      .select("details")
      .eq("user_id", user.id)
      .eq("entity_type", "consent")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return false;

    // Find the most recent consent record for this type
    for (const entry of data) {
      const details = entry.details as any;
      if (details?.consent_type === consentType) {
        return details.granted === true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Consent types that must be collected before specific actions.
 */
export const REQUIRED_CONSENTS: Record<string, ConsentType[]> = {
  ron_session: ["recording_consent", "esign_consent", "kba_authorization"],
  notarization: ["esign_consent"],
  booking: ["terms_of_service", "privacy_policy"],
  data_export: ["data_processing"],
  hipaa_document: ["hipaa_authorization"],
};
