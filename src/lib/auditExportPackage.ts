/**
 * SVC-170/510: Audit export package builder
 * Bundles job, journal, recordings, and metadata for compliance export.
 */
import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "@/lib/auditLog";

interface AuditPackageOptions {
  appointmentId: string;
  includeJournal?: boolean;
  includePayments?: boolean;
  includeDocuments?: boolean;
}

export async function buildAuditExportPackage(opts: AuditPackageOptions) {
  const pkg: Record<string, any> = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      appointment_id: opts.appointmentId,
      platform: "Notar",
      format_version: "1.0",
    },
  };

  // Get appointment details
  const { data: appt } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", opts.appointmentId)
    .single();
  if (appt) pkg.appointment = appt;

  // Get RON session if exists
  const { data: sessions } = await supabase
    .from("notarization_sessions")
    .select("*")
    .eq("appointment_id", opts.appointmentId)
    .limit(1);
  if (sessions?.length) pkg.notarization_session = sessions[0];

  // Journal entries
  if (opts.includeJournal !== false) {
    const sessionId = sessions?.[0]?.id;
    if (sessionId) {
      const { data: journal } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("session_id", sessionId)
        .limit(50);
      if (journal?.length) pkg.journal_entries = journal;
    }
  }

  // Payments
  if (opts.includePayments !== false) {
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("appointment_id", opts.appointmentId)
      .limit(20);
    if (payments?.length) pkg.payments = payments;
  }

  // Documents
  if (opts.includeDocuments !== false) {
    const { data: docs } = await supabase
      .from("documents")
      .select("id, file_name, status, created_at, document_hash")
      .eq("appointment_id", opts.appointmentId)
      .limit(50);
    if (docs?.length) pkg.documents = docs;
  }

  // E-seal verifications
  const { data: seals } = await supabase
    .from("e_seal_verifications")
    .select("*")
    .eq("appointment_id", opts.appointmentId)
    .limit(50);
  if (seals?.length) pkg.e_seal_verifications = seals;

  // Generate checksum
  const content = JSON.stringify(pkg);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(content));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  pkg.export_metadata.sha256_checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Audit log
  await logAuditEvent("audit_package_exported", {
    entityType: "appointment",
    entityId: opts.appointmentId,
    details: { checksum: pkg.export_metadata.sha256_checksum },
  });

  return pkg;
}

export function downloadAuditPackage(pkg: Record<string, any>, appointmentId: string) {
  const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit_package_${appointmentId}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
