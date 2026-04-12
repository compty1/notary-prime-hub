/**
 * H-061: Audit logging helper for admin mutations.
 * Wraps Supabase operations with automatic audit trail.
 */
import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

/**
 * Log an admin action to the audit trail.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert([{
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      details: (entry.details || null) as any,
      user_id: user?.id || null,
    }]);
  } catch (err) {
    console.error("Audit log failed:", err);
    // Never throw from audit logging
  }
}

/**
 * Wrap a Supabase mutation with automatic audit logging.
 * Returns the mutation result.
 */
export async function auditedMutation<T>(
  mutation: () => Promise<{ data: T; error: any }>,
  auditEntry: AuditEntry
): Promise<{ data: T; error: any }> {
  const result = await mutation();
  
  if (!result.error) {
    await logAdminAction({
      ...auditEntry,
      details: {
        ...auditEntry.details,
        success: true,
      },
    });
  } else {
    await logAdminAction({
      ...auditEntry,
      details: {
        ...auditEntry.details,
        success: false,
        error: result.error.message,
      },
    });
  }

  return result;
}

/** Common audit action names */
export const AUDIT_ACTIONS = {
  // Appointments
  APPOINTMENT_CREATED: "appointment_created",
  APPOINTMENT_UPDATED: "appointment_updated",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  APPOINTMENT_REASSIGNED: "appointment_reassigned",

  // Clients
  CLIENT_CREATED: "client_created",
  CLIENT_UPDATED: "client_updated",
  CLIENT_DELETED: "client_deleted",

  // Documents
  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_APPROVED: "document_approved",
  DOCUMENT_REJECTED: "document_rejected",
  DOCUMENT_DELETED: "document_deleted",

  // Notary
  NOTARY_APPROVED: "notary_approved",
  NOTARY_SUSPENDED: "notary_suspended",
  NOTARY_PAGE_PUBLISHED: "notary_page_published",
  NOTARY_PAGE_UNPUBLISHED: "notary_page_unpublished",

  // Financial
  PAYMENT_RECORDED: "payment_recorded",
  REFUND_ISSUED: "refund_issued",
  INVOICE_GENERATED: "invoice_generated",
  FEE_OVERRIDE: "fee_override",

  // Settings
  SETTING_CHANGED: "setting_changed",
  ROLE_ASSIGNED: "role_assigned",
  ROLE_REMOVED: "role_removed",

  // Service
  SERVICE_CREATED: "service_created",
  SERVICE_UPDATED: "service_updated",
  SERVICE_DEACTIVATED: "service_deactivated",

  // Compliance
  JOURNAL_ENTRY_CREATED: "journal_entry_created",
  SEAL_APPLIED: "seal_applied",
  COMPLIANCE_REPORT_GENERATED: "compliance_report_generated",
} as const;
