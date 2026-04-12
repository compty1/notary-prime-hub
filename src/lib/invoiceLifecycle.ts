/**
 * AP-005: Invoice lifecycle management.
 * Create, send, and track invoices from appointments.
 * Uses billing_history table until dedicated invoices table is created.
 */
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/auditLogger";

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled" | "refunded";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceParams {
  clientId: string;
  appointmentId?: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  dueDate?: string;
}

/**
 * Create an invoice record (stored in payments table as type=invoice).
 */
export async function createInvoice(params: CreateInvoiceParams) {
  const total = params.lineItems.reduce((sum, item) => sum + item.total, 0);

  const { data, error } = await supabase
    .from("payments")
    .insert({
      client_id: params.clientId,
      appointment_id: params.appointmentId || null,
      amount: total,
      method: "invoice",
      status: "pending",
      notes: JSON.stringify({ lineItems: params.lineItems, invoiceNotes: params.notes }),
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminAction({
    action: "invoice_created",
    entityType: "payment",
    entityId: data.id,
    details: { total, lineItemCount: params.lineItems.length },
  });

  return data;
}

/**
 * Update invoice/payment status.
 */
export async function updateInvoiceStatus(paymentId: string, status: string) {
  const { error } = await supabase
    .from("payments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", paymentId);

  if (error) throw error;

  await logAdminAction({
    action: `invoice_${status}`,
    entityType: "payment",
    entityId: paymentId,
    details: { status },
  });
}

/**
 * Build line items from appointment + pricing rules.
 */
export function buildLineItemsFromAppointment(
  serviceType: string,
  basePrice: number,
  extras: {
    signerCount?: number;
    perSignerFee?: number;
    travelFee?: number;
    rushFee?: number;
    afterHoursFee?: number;
    technologyFee?: number;
  } = {}
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [
    { description: serviceType, quantity: 1, unitPrice: basePrice, total: basePrice },
  ];

  if (extras.signerCount && extras.signerCount > 1 && extras.perSignerFee) {
    const extraSigners = extras.signerCount - 1;
    items.push({
      description: `Additional signers (${extraSigners})`,
      quantity: extraSigners,
      unitPrice: extras.perSignerFee,
      total: extraSigners * extras.perSignerFee,
    });
  }

  if (extras.travelFee && extras.travelFee > 0) {
    items.push({ description: "Travel fee", quantity: 1, unitPrice: extras.travelFee, total: extras.travelFee });
  }

  if (extras.rushFee && extras.rushFee > 0) {
    items.push({ description: "Rush service fee", quantity: 1, unitPrice: extras.rushFee, total: extras.rushFee });
  }

  if (extras.afterHoursFee && extras.afterHoursFee > 0) {
    items.push({ description: "After-hours fee", quantity: 1, unitPrice: extras.afterHoursFee, total: extras.afterHoursFee });
  }

  if (extras.technologyFee && extras.technologyFee > 0) {
    items.push({ description: "Technology fee (RON platform)", quantity: 1, unitPrice: extras.technologyFee, total: extras.technologyFee });
  }

  return items;
}
