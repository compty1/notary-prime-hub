import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Props {
  appointments: any[];
  profiles: Record<string, string>;
  onComplete?: () => void;
}

export function BulkInvoiceGenerator({ appointments, profiles, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const unpaid = appointments.filter(a =>
    ["completed", "notarized"].includes(a.status) && a.estimated_price
  );

  const toggleAll = () => {
    if (selected.size === unpaid.length) setSelected(new Set());
    else setSelected(new Set(unpaid.map(a => a.id)));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const generate = async () => {
    if (selected.size === 0) { toast.error("Select at least one appointment"); return; }
    setGenerating(true);
    let created = 0;
    for (const id of selected) {
      const appt = unpaid.find(a => a.id === id);
      if (!appt) continue;
      const { error } = await supabase.from("payments").insert({
        client_id: appt.client_id,
        appointment_id: appt.id,
        amount: appt.estimated_price,
        status: "pending",
        method: "stripe",
        notes: `Bulk invoice for ${appt.service_type} on ${appt.scheduled_date}`,
      });
      if (!error) created++;
    }
    toast.success(`${created} invoice(s) created`);
    setSelected(new Set());
    setOpen(false);
    onComplete?.();
    setGenerating(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="mr-1.5 h-3.5 w-3.5" /> Bulk Invoices
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Bulk Invoices</DialogTitle>
          </DialogHeader>
          {unpaid.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No completed appointments without invoices found.</p>
          ) : (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.size === unpaid.length} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaid.map(a => (
                    <TableRow key={a.id}>
                      <TableCell><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} /></TableCell>
                      <TableCell>{profiles[a.client_id] || a.client_id.slice(0, 8)}</TableCell>
                      <TableCell>{a.service_type}</TableCell>
                      <TableCell>{formatDate(a.scheduled_date)}</TableCell>
                      <TableCell>${Number(a.estimated_price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Badge variant="secondary">{selected.size} selected</Badge>
            <Button onClick={generate} disabled={generating || selected.size === 0}>
              {generating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...</> : `Generate ${selected.size} Invoice(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
