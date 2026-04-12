/**
 * SVC-105: Billing CSV Export
 * Export payments data with date range and service type filters.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface BillingCSVExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingCSVExport({ open, onOpenChange }: BillingCSVExportProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleExport = async () => {
    try {
      let q = supabase
        .from("payments")
        .select("id, amount, status, method, created_at, paid_at, client_id, appointment_id, refund_amount, refunded_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (startDate) q = q.gte("created_at", startDate);
      if (endDate) q = q.lte("created_at", `${endDate}T23:59:59`);
      if (statusFilter !== "all") q = q.eq("status", statusFilter as any);

      const { data, error } = await q;
      if (error) throw error;
      if (!data?.length) {
        toast.info("No records match your filters");
        return;
      }

      const headers = ["ID", "Amount", "Status", "Method", "Created", "Paid At", "Client ID", "Appointment ID", "Refund Amount", "Refunded At"];
      const rows = data.map(p => [
        p.id, p.amount, p.status, p.method || "", p.created_at,
        p.paid_at || "", p.client_id || "", p.appointment_id || "",
        p.refund_amount || "", p.refunded_at || "",
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} records`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Billing Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
