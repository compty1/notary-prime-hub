/**
 * Payment receipt PDF generation via browser print
 */
import { formatCurrency } from "./invoiceUtils";

export interface ReceiptData {
  paymentId: string;
  date: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  method: string;
  description?: string;
  confirmationNumber?: string;
}

export function generateReceiptHTML(data: ReceiptData): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Payment Receipt</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 40px; color: #1a3a5c; }
  .header { text-align: center; border-bottom: 2px solid #1B998B; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; margin: 0; color: #1B998B; }
  .header p { margin: 5px 0 0; color: #666; font-size: 13px; }
  .badge { display: inline-block; background: #e6f7f5; color: #1B998B; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 10px; }
  .details { margin: 20px 0; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 14px; }
  .row .label { color: #666; }
  .row .value { font-weight: 600; }
  .total { font-size: 20px; text-align: center; margin: 30px 0; padding: 20px; background: #f0faf8; border-radius: 8px; }
  .total .amount { font-size: 28px; font-weight: 700; color: #1B998B; }
  .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
  @media print { body { margin: 0; padding: 20px; } }
</style></head><body>
<div class="header">
  <h1>Notar</h1>
  <p>Ohio Notary & Document Services</p>
  <span class="badge">PAYMENT RECEIPT</span>
</div>
<div class="details">
  <div class="row"><span class="label">Receipt #</span><span class="value">${data.paymentId.slice(0, 8).toUpperCase()}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span></div>
  <div class="row"><span class="label">Client</span><span class="value">${data.clientName}</span></div>
  ${data.clientEmail ? `<div class="row"><span class="label">Email</span><span class="value">${data.clientEmail}</span></div>` : ""}
  <div class="row"><span class="label">Payment Method</span><span class="value" style="text-transform:capitalize">${data.method}</span></div>
  ${data.confirmationNumber ? `<div class="row"><span class="label">Confirmation</span><span class="value">${data.confirmationNumber}</span></div>` : ""}
  ${data.description ? `<div class="row"><span class="label">Description</span><span class="value">${data.description}</span></div>` : ""}
</div>
<div class="total">
  <p style="margin:0 0 5px;color:#666;font-size:13px;">Amount Paid</p>
  <p class="amount">${formatCurrency(data.amount)}</p>
</div>
<div class="footer">
  <p>Notar — Columbus, OH 43215 · (614) 300-6890 · contact@notardex.com</p>
  <p>Thank you for your business!</p>
</div>
</body></html>`;
}

export function printReceipt(data: ReceiptData) {
  const html = generateReceiptHTML(data);
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}
