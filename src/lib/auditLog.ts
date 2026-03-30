import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/**
 * Log an action to the audit_log table via a secure RPC function.
 * Fails silently — audit logging should never break the user flow.
 */
export async function logAuditEvent(
  action: string,
  opts?: {
    entityType?: string;
    entityId?: string;
    details?: Record<string, Json | undefined>;
    userId?: string;
  }
) {
  try {
    await supabase.rpc("log_audit_event", {
      _action: action,
      _entity_type: opts?.entityType ?? null,
      _entity_id: opts?.entityId ?? null,
      _details: (opts?.details ?? null) as Json,
    });
  } catch {
    // Never throw from audit logging
  }
}
