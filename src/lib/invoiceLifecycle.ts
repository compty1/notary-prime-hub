/**
 * AP-005: Invoice lifecycle management.
 * Create, send, and track invoices from appointments.
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

export async function createInvoice(params: CreateInvoiceParams) {
  const total = params.lineItems.reduce((sum, item) => sum + item.total, 0);
  const dueDate = params.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      client_id: params.clientId,
      appointment_id: params.appointmentId || null,
      line_items: params.lineItems as any,
      total_amount: total,
      status: "draft",
      due_date: dueDate,
      notes: params.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  await logAdminAction({
    action: "invoice_created",
    entityType: "invoice",
    entityId: data.id,
    details: { total, lineItemCount: params.lineItems.length },
  });

  return data;
}

export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const { error } = await supabase
    .from("invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", invoiceId);

  if (error) throw error;

  await logAdminAction({
    action: `invoice_${status}`,
    entityType: "invoice",
    entityId: invoiceId,
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
