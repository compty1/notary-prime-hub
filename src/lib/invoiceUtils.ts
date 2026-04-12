/**
 * Batch 14: Invoice & payment utilities
 * Shared helpers for invoice generation and payment calculations.
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: InvoiceLineItem[];
  taxRate: number;
  notes?: string;
}

/** Generate a unique invoice number */
export function generateInvoiceNumber(): string {
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSegment = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${dateSegment}-${randomSegment}`;
}

/** Calculate invoice totals */
export function calculateInvoiceTotals(items: InvoiceLineItem[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100) / 100, 0);
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}

/** Format currency amount */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

/** Generate a plain-text invoice for download */
export function generateInvoiceText(data: InvoiceData): string {
  const { subtotal, tax, total } = calculateInvoiceTotals(data.items, data.taxRate);
  const lines = data.items.map(
    (item, i) =>
      `${i + 1}. ${item.description || "Service"} — Qty: ${item.quantity} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`
  );

  return `
INVOICE
${data.invoiceNumber}
Date: ${data.date}
Due: ${data.dueDate}

Bill To: ${data.clientName}
${data.clientEmail ? `Email: ${data.clientEmail}` : ""}
${data.clientAddress ? `Address: ${data.clientAddress}` : ""}

─────────────────────────────────
ITEMS
─────────────────────────────────
${lines.join("\n")}

─────────────────────────────────
Subtotal: ${formatCurrency(subtotal)}
Tax (${data.taxRate}%): ${formatCurrency(tax)}
TOTAL: ${formatCurrency(total)}
─────────────────────────────────

${data.notes ? `Notes: ${data.notes}` : ""}

Notar — Ohio Notary & Document Services
Columbus, OH 43215 · (614) 300-6890
contact@notar.com
`.trim();
}

/** Download invoice as text file */
export function downloadInvoice(data: InvoiceData) {
  const content = generateInvoiceText(data);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.invoiceNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Validate payment amount */
export function validatePaymentAmount(amount: number): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) return { valid: false, error: "Amount must be greater than $0" };
  if (amount > 50000) return { valid: false, error: "Amount exceeds maximum ($50,000)" };
  if (!Number.isFinite(amount)) return { valid: false, error: "Invalid amount" };
  return { valid: true };
}
