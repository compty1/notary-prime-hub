/**
 * Data export utilities for admin bulk operations.
 * Category F items (bulk export), Enhancement #84 (CCPA data access)
 */

import { supabase } from "@/integrations/supabase/client";

/** Export client data for CCPA/GDPR compliance requests */
export async function exportClientData(clientId: string): Promise<Record<string, unknown>> {
  const [profile, appointments, documents, payments, journal] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", clientId).maybeSingle(),
    supabase.from("appointments").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("documents").select("id, file_name, status, created_at").eq("uploaded_by", clientId),
    supabase.from("payments").select("id, amount, status, method, created_at").eq("client_id", clientId),
    supabase.from("journal_entries").select("id, entry_date, document_type_description, notarial_act_type").eq("signer_name", profile.data?.full_name || ""),
  ]);

  return {
    exportDate: new Date().toISOString(),
    profile: profile.data,
    appointments: appointments.data || [],
    documents: documents.data || [],
    payments: payments.data || [],
    journalEntries: journal.data || [],
  };
}

/** Export appointments to CSV */
export function appointmentsToCSV(appointments: any[]): string {
  const headers = ["Date", "Time", "Service", "Status", "Location", "Confirmation #", "Price"];
  const rows = appointments.map((a) =>
    [
      a.scheduled_date,
      a.scheduled_time,
      a.service_type,
      a.status,
      a.location || "",
      a.confirmation_number || "",
      a.estimated_price?.toFixed(2) || "0.00",
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/** Export journal entries to CSV (ORC compliant) */
export function journalToCSV(entries: any[]): string {
  const headers = [
    "Journal #", "Date", "Time", "Document Type", "Act Type",
    "Signer Name", "Signer Address", "ID Type", "ID Number",
    "Communication Technology", "Notes"
  ];
  const rows = entries.map((e) =>
    [
      e.journal_number,
      e.entry_date,
      e.entry_time,
      `"${e.document_type_description || ""}"`,
      e.notarial_act_type,
      `"${e.signer_name || ""}"`,
      `"${e.signer_address || ""}"`,
      e.id_type || "",
      e.id_number || "",
      e.communication_technology || "",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/** Generic download helper */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
