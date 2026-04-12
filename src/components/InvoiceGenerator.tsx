import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, Trash2, FileText, Printer, Save } from "lucide-react";
import InvoicePDFExport from "@/components/InvoicePDFExport";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceGeneratorProps {
  clientName?: string;
  clientEmail?: string;
  appointmentId?: string;
  onGenerate?: (invoice: { items: LineItem[]; total: number; tax: number }) => void;
}

export function InvoiceGenerator({ clientName = "", clientEmail = "", appointmentId, onGenerate }: InvoiceGeneratorProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const downloadInvoice = () => {
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const lines = items.map(
      (item, i) => `${i + 1}. ${item.description || "Service"} — Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`
    ).join("\n");

    const content = `
INVOICE
${invoiceNumber}
Date: ${date}

Bill To: ${clientName || "Client"}
${clientEmail ? `Email: ${clientEmail}` : ""}

---
${lines}
---
Subtotal: $${subtotal.toFixed(2)}
${taxRate > 0 ? `Tax (${taxRate}%): $${tax.toFixed(2)}` : ""}
TOTAL: $${total.toFixed(2)}

Payment Terms: Due upon receipt
Thank you for your business.
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onGenerate?.({ items, total, tax });
  };

  const saveToDatabase = async () => {
    if (!user || subtotal <= 0) return;
    setSaving(true);
    try {
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("service_requests").insert({
        client_id: user.id,
        service_type: "invoice",
        status: "completed",
        reference_number: invoiceNumber,
        notes: JSON.stringify({
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_email: clientEmail,
          appointment_id: appointmentId,
          items: items.map(i => ({ description: i.description || "Service", qty: i.quantity, rate: i.unitPrice })),
          subtotal, tax, total, tax_rate: taxRate,
          generated_at: new Date().toISOString(),
        }),
      });
      if (error) throw error;
      toast.success(`Invoice ${invoiceNumber} saved to your records.`);
    } catch {
      toast.error("Failed to save invoice. Please try again.");
    }
    setSaving(false);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" /> Invoice Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><Label className="text-xs">Description</Label><Input className="h-8 text-sm" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Service description" /></div>
              <div className="w-16"><Label className="text-xs">Qty</Label><Input className="h-8 text-sm" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} /></div>
              <div className="w-24"><Label className="text-xs">Price</Label><Input className="h-8 text-sm" type="number" min="0" step="0.01" value={item.unitPrice || ""} onChange={e => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} /></div>
              <Button variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={items.length === 1}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" /> Add Line Item</Button>

        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <div className="w-24"><Label className="text-xs">Tax %</Label><Input className="h-8 text-sm" type="number" min="0" step="0.1" value={taxRate || ""} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} /></div>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</p>
            {taxRate > 0 && <p className="text-sm text-muted-foreground">Tax: ${tax.toFixed(2)}</p>}
            <p className="text-lg font-bold text-foreground">Total: ${total.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={downloadInvoice} disabled={subtotal <= 0} className="flex-1">
            <Download className="mr-2 h-4 w-4" /> Download Text Invoice
          </Button>
          <InvoicePDFExport
            invoiceData={{
              invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
              date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
              clientName: clientName || "Client",
              clientEmail: clientEmail || undefined,
              items: items.map(i => ({ description: i.description || "Service", qty: i.quantity, rate: i.unitPrice })),
              taxRate: taxRate > 0 ? taxRate : undefined,
            }}
          />
          {user && (
            <Button onClick={saveToDatabase} disabled={subtotal <= 0 || saving} variant="outline">
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save to Records"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
