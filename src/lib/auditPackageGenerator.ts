/**
 * SVC-170/510: Audit export package builder
 * Generates downloadable compliance audit packages.
 */
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditPackageOptions {
  appointmentId?: string;
  sessionId?: string;
  dateRange?: { from: string; to: string };
  includeJournal?: boolean;
  includeDocuments?: boolean;
  includePayments?: boolean;
  includeAuditLog?: boolean;
}

export async function generateAuditPackage(options: AuditPackageOptions) {
  const packageData: Record<string, unknown> = {
    generated_at: new Date().toISOString(),
    generated_by: (await supabase.auth.getUser()).data.user?.id,
    package_type: "compliance_audit",
  };

  try {
    // Appointments
    if (options.appointmentId) {
      const { data } = await supabase.from("appointments").select("*").eq("id", options.appointmentId).single();
      packageData.appointment = data;
    }

    // Journal entries
    if (options.includeJournal) {
      const query = supabase.from("journal_entries").select("*");
      if (options.appointmentId) {
        const { data } = await query.limit(50);
        packageData.journal_entries = data;
      } else if (options.dateRange) {
        const { data } = await query
          .gte("entry_date", options.dateRange.from)
          .lte("entry_date", options.dateRange.to)
          .limit(500);
        packageData.journal_entries = data;
      }
    }

    // Audit log
    if (options.includeAuditLog) {
      const query = supabase.from("audit_log").select("*").order("created_at", { ascending: false });
      if (options.dateRange) {
        const { data } = await query
          .gte("created_at", options.dateRange.from)
          .lte("created_at", options.dateRange.to)
          .limit(1000);
        packageData.audit_log = data;
      } else {
        const { data } = await query.limit(100);
        packageData.audit_log = data;
      }
    }

    // Generate checksum
    const content = JSON.stringify(packageData, null, 2);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(content));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    packageData.integrity = { algorithm: "SHA-256", checksum };

    // Download as JSON
    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-package-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Audit package downloaded with SHA-256 checksum");
    return packageData;
  } catch (e: any) {
    toast.error("Failed to generate audit package: " + e.message);
    throw e;
  }
}
