/**
 * SVC-196: Data Export Tool
 * Allows users to export their personal data (GDPR/privacy compliance).
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

const DATA_CATEGORIES = [
  { key: "profile", label: "Profile Information" },
  { key: "appointments", label: "Appointments & Bookings" },
  { key: "documents", label: "Documents" },
  { key: "payments", label: "Payment History" },
  { key: "journal", label: "Journal Entries" },
  { key: "service_requests", label: "Service Requests" },
];

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataExportDialog({ open, onOpenChange }: DataExportDialogProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set(DATA_CATEGORIES.map(c => c.key)));

  const toggleCategory = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const exportData = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const exportResult: Record<string, any> = { exported_at: new Date().toISOString(), user_id: user.id };

      if (selected.has("profile")) {
        const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
        exportResult.profile = data;
      }
      if (selected.has("appointments")) {
        const { data } = await supabase.from("appointments").select("*").eq("client_id", user.id).limit(500);
        exportResult.appointments = data;
      }
      if (selected.has("documents")) {
        const { data } = await supabase.from("documents").select("id, file_name, status, created_at").eq("uploaded_by", user.id).limit(500);
        exportResult.documents = data;
      }
      if (selected.has("payments")) {
        const { data } = await supabase.from("payments").select("id, amount, status, method, created_at, paid_at").eq("client_id", user.id).limit(500);
        exportResult.payments = data;
      }
      if (selected.has("service_requests")) {
        const { data } = await supabase.from("service_requests").select("*").eq("client_id", user.id).limit(500);
        exportResult.service_requests = data;
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportResult, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notar_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await logAuditEvent("data_export_completed", {
        entityType: "user",
        entityId: user.id,
        details: { categories: [...selected].join(",") },
      });
    },
    onSuccess: () => {
      toast.success("Data exported successfully");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogDescription>
            Select which data categories to include in your export. The data will be downloaded as a JSON file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {DATA_CATEGORIES.map(cat => (
            <div key={cat.key} className="flex items-center gap-2">
              <Checkbox
                id={`export-${cat.key}`}
                checked={selected.has(cat.key)}
                onCheckedChange={() => toggleCategory(cat.key)}
              />
              <label htmlFor={`export-${cat.key}`} className="text-sm">{cat.label}</label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => exportData.mutate()} disabled={exportData.isPending || selected.size === 0}>
            <Download className="h-4 w-4 mr-1" />
            {exportData.isPending ? "Exporting..." : "Export Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
