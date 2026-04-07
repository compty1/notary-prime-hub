import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface InvoicePDFExportProps {
  invoiceData: {
    invoiceNumber: string;
    date: string;
    clientName: string;
    clientEmail?: string;
    items: { description: string; qty: number; rate: number }[];
    taxRate?: number;
    notes?: string;
  };
}

export default function InvoicePDFExport({ invoiceData }: InvoicePDFExportProps) {
  const subtotal = invoiceData.items.reduce((sum, i) => sum + i.qty * i.rate, 0);
  const tax = subtotal * (invoiceData.taxRate || 0) / 100;
  const total = subtotal + tax;

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=800,height=1000");
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoiceData.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; }
  .brand { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; }
  .invoice-meta .number { font-size: 20px; font-weight: 600; }
  .section { margin-bottom: 24px; }
  .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f5f5f7; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 2px solid #e0e0e0; }
  td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .amount { text-align: right; }
  .totals { margin-left: auto; width: 250px; }
  .totals tr td { border: none; padding: 6px 12px; }
  .totals .total-row { font-weight: 700; font-size: 18px; border-top: 2px solid #1a1a2e; padding-top: 10px; }
  .notes { background: #f9f9fb; padding: 16px; border-radius: 6px; font-size: 13px; color: #666; margin-top: 30px; }
  .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 16px; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <div>
      <div class="brand">Notar</div>
      <div class="brand-sub">Ohio Notary & Document Services</div>
    </div>
    <div class="invoice-meta">
      <h2>Invoice</h2>
      <div class="number">${invoiceData.invoiceNumber}</div>
      <div style="font-size:13px;color:#666;margin-top:4px;">Date: ${invoiceData.date}</div>
    </div>
  </div>
  <div class="section">
    <div class="section-label">Bill To</div>
    <div style="font-weight:600;">${invoiceData.clientName}</div>
    ${invoiceData.clientEmail ? `<div style="font-size:13px;color:#666;">${invoiceData.clientEmail}</div>` : ""}
  </div>
  <table>
    <thead><tr><th>Description</th><th class="amount">Qty</th><th class="amount">Rate</th><th class="amount">Amount</th></tr></thead>
    <tbody>
      ${invoiceData.items.map(i => `<tr><td>${i.description}</td><td class="amount">${i.qty}</td><td class="amount">$${i.rate.toFixed(2)}</td><td class="amount">$${(i.qty * i.rate).toFixed(2)}</td></tr>`).join("")}
    </tbody>
  </table>
  <table class="totals">
    <tr><td>Subtotal</td><td class="amount">$${subtotal.toFixed(2)}</td></tr>
    ${invoiceData.taxRate ? `<tr><td>Tax (${invoiceData.taxRate}%)</td><td class="amount">$${tax.toFixed(2)}</td></tr>` : ""}
    <tr class="total-row"><td>Total Due</td><td class="amount">$${total.toFixed(2)}</td></tr>
  </table>
  ${invoiceData.notes ? `<div class="notes"><strong>Notes:</strong> ${invoiceData.notes}</div>` : ""}
  <div class="footer">
    <p>Notar — Ohio Notary & Document Services</p>
    <p>Franklin County, Columbus, OH · (614) 300-6890 · contact@notardex.com</p>
  </div>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <FileText className="mr-1 h-3 w-3" /> Export PDF
    </Button>
  );
}
