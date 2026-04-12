/**
 * Accounting export utilities — CSV/QuickBooks/Xero compatible formats.
 * Enhancement #92 (QuickBooks/Xero export)
 */

import { supabase } from "@/integrations/supabase/client";

export interface ExportTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  reference: string;
  client: string;
  method: string;
  status: string;
}

/** Fetch payment data for export */
export async function fetchExportData(
  startDate: string,
  endDate: string
): Promise<ExportTransaction[]> {
  const { data } = await supabase
    .from("payments")
    .select("*, appointments(service_type, confirmation_number), profiles:client_id(full_name)")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .eq("status", "paid")
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((p: any) => ({
    date: new Date(p.created_at).toISOString().split("T")[0],
    description: `Notary Service - ${p.appointments?.service_type || "General"}`,
    amount: p.amount || 0,
    category: "Notary Services Revenue",
    reference: p.appointments?.confirmation_number || p.id,
    client: p.profiles?.full_name || "Unknown",
    method: p.method || "Unknown",
    status: p.status,
  }));
}

/** Convert transactions to CSV string */
export function toCSV(transactions: ExportTransaction[]): string {
  const headers = ["Date", "Description", "Amount", "Category", "Reference", "Client", "Method", "Status"];
  const rows = transactions.map((t) =>
    [t.date, `"${t.description}"`, t.amount.toFixed(2), t.category, t.reference, `"${t.client}"`, t.method, t.status].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/** Convert to QuickBooks IIF format */
export function toQuickBooksIIF(transactions: ExportTransaction[]): string {
  const header = "!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO\n!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO\n!ENDTRNS";
  const rows = transactions.map((t) => {
    const trns = `TRNS\tINVOICE\t${t.date}\tAccounts Receivable\t${t.client}\t${t.amount.toFixed(2)}\t${t.description}`;
    const spl = `SPL\tINVOICE\t${t.date}\tNotary Services Income\t${t.client}\t-${t.amount.toFixed(2)}\t${t.description}`;
    return `${trns}\n${spl}\nENDTRNS`;
  });
  return [header, ...rows].join("\n");
}

/** Download helper */
export function downloadFile(content: string, filename: string, mime = "text/csv") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
