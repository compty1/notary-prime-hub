/**
 * F-101: Client-side feature flag system backed by platform_settings.
 * Falls back to defaults when DB is unreachable.
 */
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
}

const FLAG_DEFAULTS: Record<string, boolean> = {
  // Core features
  "booking.enabled": true,
  "ron.enabled": true,
  "directory.enabled": true,
  "reviews.enabled": true,
  "lead_capture.enabled": true,
  "ai_chatbot.enabled": true,
  "cookie_consent.enabled": true,
  "maintenance_mode": false,

  // Service categories
  "services.court_forms": true,
  "services.business_formation": true,
  "services.apostille": true,
  "services.document_digitization": true,
  "services.virtual_mailroom": false,
  "services.process_serving": true,

  // UI features
  "ui.dark_mode": true,
  "ui.social_proof": true,
  "ui.urgency_indicators": false,
  "ui.exit_intent_popup": false,
  "ui.pwa_install_prompt": false,

  // Notary page features
  "notary_page.reviews_section": true,
  "notary_page.faq_section": true,
  "notary_page.booking_widget": true,
  "notary_page.qr_code": true,
  "notary_page.service_area_map": false,

  // Admin features
  "admin.bulk_email": true,
  "admin.analytics": true,
  "admin.revenue_forecast": false,
  "admin.batch_operations": true,
};

let cachedFlags: Record<string, boolean> | null = null;

/**
 * Load feature flags from platform_settings (key = "feature_flags").
 * Caches result for the session.
 */
export async function loadFeatureFlags(): Promise<Record<string, boolean>> {
  if (cachedFlags) return cachedFlags;

  try {
    const { data } = await supabase
      .from("platform_settings")
      .select("setting_key, setting_value")
      .like("setting_key", "ff_%");

    const dbFlags: Record<string, boolean> = {};
    if (data) {
      for (const row of data) {
        const key = row.setting_key.replace("ff_", "").replace(/_/g, ".");
        dbFlags[key] = row.setting_value === "true" || row.setting_value === "1";
      }
    }

    cachedFlags = { ...FLAG_DEFAULTS, ...dbFlags };
    return cachedFlags;
  } catch {
    cachedFlags = { ...FLAG_DEFAULTS };
    return cachedFlags;
  }
}

/** Synchronous check using cached flags (returns default if not loaded yet) */
export function isFeatureEnabled(key: string): boolean {
  if (cachedFlags) return cachedFlags[key] ?? FLAG_DEFAULTS[key] ?? false;
  return FLAG_DEFAULTS[key] ?? false;
}

/** Clear cache to force reload */
export function clearFeatureFlagCache(): void {
  cachedFlags = null;
}

/** Get all flags for admin display */
export function getAllFlags(): Record<string, boolean> {
  return { ...FLAG_DEFAULTS, ...(cachedFlags || {}) };
}
