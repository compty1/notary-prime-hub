/**
 * SVC-122: Document redaction audit trail
 * Logs redaction actions for compliance.
 */
import { supabase } from "@/integrations/supabase/client";

export interface RedactionRecord {
  documentId: string;
  fieldName: string;
  redactionType: "full" | "partial" | "pii";
  reason: string;
}

export async function logRedaction(record: RedactionRecord): Promise<void> {
  await supabase.rpc("log_audit_event", {
    _action: "document.redaction",
    _entity_type: "document",
    _entity_id: record.documentId,
    _details: {
      field: record.fieldName,
      type: record.redactionType,
      reason: record.reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * SVC-123: Dynamic watermark generation
 * Creates watermark text for PDF overlays.
 */
export function generateWatermark(opts: {
  notaryName: string;
  commissionNumber?: string;
  status?: "draft" | "copy" | "certified";
}): string {
  const lines = [];
  if (opts.status === "draft") lines.push("DRAFT — NOT FOR OFFICIAL USE");
  if (opts.status === "copy") lines.push("COPY — ORIGINAL ON FILE");
  if (opts.status === "certified") lines.push("CERTIFIED TRUE COPY");
  lines.push(`Notary: ${opts.notaryName}`);
  if (opts.commissionNumber) lines.push(`Commission: ${opts.commissionNumber}`);
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  return lines.join("\n");
}
