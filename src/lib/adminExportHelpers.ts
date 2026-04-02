/**
 * Batch 11: Admin data export helpers
 * Extended CSV/JSON export utilities for admin tables.
 */
import { exportToCSV } from "./csvExport";

/** Export data as JSON file download */
export function exportToJSON<T>(data: T[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Generate notary journal CSV export columns */
export const journalExportColumns = [
  { key: "created_at" as const, label: "Date" },
  { key: "signer_name" as const, label: "Signer Name" },
  { key: "signer_address" as const, label: "Signer Address" },
  { key: "document_type" as const, label: "Document Type" },
  { key: "service_performed" as const, label: "Service" },
  { key: "notarization_type" as const, label: "Type" },
  { key: "id_type" as const, label: "ID Type" },
  { key: "id_number" as const, label: "ID Number" },
  { key: "id_expiration" as const, label: "ID Expiration" },
  { key: "fees_charged" as const, label: "Fees Charged" },
  { key: "witnesses_present" as const, label: "Witnesses" },
  { key: "oath_administered" as const, label: "Oath" },
  { key: "notes" as const, label: "Notes" },
];

/** Generate appointments CSV export columns */
export const appointmentExportColumns = [
  { key: "scheduled_date" as const, label: "Date" },
  { key: "scheduled_time" as const, label: "Time" },
  { key: "service_type" as const, label: "Service" },
  { key: "notarization_type" as const, label: "Type" },
  { key: "status" as const, label: "Status" },
  { key: "confirmation_number" as const, label: "Confirmation #" },
  { key: "location" as const, label: "Location" },
  { key: "notes" as const, label: "Notes" },
];

/** Generate document inventory CSV export columns */
export const documentExportColumns = [
  { key: "file_name" as const, label: "File Name" },
  { key: "status" as const, label: "Status" },
  { key: "created_at" as const, label: "Uploaded" },
  { key: "uploaded_by" as const, label: "Uploaded By" },
];

/** Export journal entries to CSV for Ohio compliance */
export function exportJournalToCSV(entries: Record<string, unknown>[]) {
  exportToCSV(entries, journalExportColumns, `notary-journal-${new Date().toISOString().slice(0, 10)}.csv`);
}

/** Export appointments to CSV */
export function exportAppointmentsToCSV(appointments: Record<string, unknown>[]) {
  exportToCSV(appointments, appointmentExportColumns, `appointments-${new Date().toISOString().slice(0, 10)}.csv`);
}
