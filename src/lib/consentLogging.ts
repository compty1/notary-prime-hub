/**
 * SVC-166: Consent logging component
 * Records user consent with version, timestamp, and user agent.
 */
import { supabase } from "@/integrations/supabase/client";

export interface ConsentRecord {
  consentType: string;
  version: string;
  granted: boolean;
  metadata?: Record<string, string>;
}

/** Log consent to audit_log (works without consent_log table) */
export async function logConsent(record: ConsentRecord, userId?: string) {
  try {
    await supabase.from("audit_log").insert({
      action: `consent_${record.granted ? "granted" : "revoked"}`,
      entity_type: "consent",
      entity_id: record.consentType,
      details: {
        consent_type: record.consentType,
        version: record.version,
        granted: record.granted,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...record.metadata,
      } as any,
      user_id: userId || null,
    });
  } catch {
    // Never throw from consent logging
  }
}

/** Standard consent types */
export const CONSENT_TYPES = {
  TERMS_OF_SERVICE: "terms_of_service",
  PRIVACY_POLICY: "privacy_policy",
  RECORDING_CONSENT: "recording_consent",
  SMS_OPT_IN: "sms_opt_in",
  MARKETING_EMAIL: "marketing_email",
  COOKIE_ANALYTICS: "cookie_analytics",
  DATA_PROCESSING: "data_processing",
  UPL_DISCLAIMER: "upl_disclaimer",
} as const;
