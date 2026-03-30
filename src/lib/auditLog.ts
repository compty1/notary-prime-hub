import { supabase } from "@/integrations/supabase/client";

/**
 * Log an action to the audit_log table.
 * Fails silently — audit logging should never break the user flow.
 */
export async function logAuditEvent(
  action: string,
  opts?: {
    entityType?: string;
    entityId?: string;
    details?: Record<string, unknown>;
    userId?: string;
  }
) {
  try {
    await supabase.from("audit_log").insert({
      action,
      entity_type: opts?.entityType ?? null,
      entity_id: opts?.entityId ?? null,
      details: opts?.details ?? null,
      user_id: opts?.userId ?? null,
    });
  } catch {
    // Never throw from audit logging
  }
}
