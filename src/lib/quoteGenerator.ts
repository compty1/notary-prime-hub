/**
 * Automated pricing quote generator.
 * Enhancement #107 (Automated pricing quote generator)
 */

import { supabase } from "@/integrations/supabase/client";

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PricingQuote {
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  clientName: string;
  serviceType: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string[];
}

/** Generate a pricing quote */
export async function generateQuote(params: {
  clientName: string;
  serviceType: string;
  signerCount?: number;
  documentCount?: number;
  isMobile?: boolean;
  travelZone?: number;
  isRON?: boolean;
  isAfterHours?: boolean;
}): Promise<PricingQuote> {
  const items: QuoteLineItem[] = [];
  const notes: string[] = [];
  const docCount = params.documentCount || 1;
  const signerCount = params.signerCount || 1;

  // Base notarial act fee
  if (params.isRON) {
    items.push({ description: "RON Notarial Act Fee (per act)", quantity: docCount, unitPrice: 30, total: docCount * 30 });
    items.push({ description: "Technology Fee", quantity: 1, unitPrice: 10, total: 10 });
    notes.push("RON fee per ORC §147.08: $30/act maximum for electronic notarization");
  } else {
    items.push({ description: "Notarial Act Fee (per act)", quantity: docCount, unitPrice: 5, total: docCount * 5 });
    notes.push("Ohio statutory fee per ORC §147.08: $5/act maximum");
  }

  // Additional signers
  if (signerCount > 1) {
    items.push({ description: "Additional Signer Fee", quantity: signerCount - 1, unitPrice: 10, total: (signerCount - 1) * 10 });
  }

  // Travel fee
  if (params.isMobile && params.travelZone) {
    const travelFees: Record<number, number> = { 1: 25, 2: 35, 3: 45, 4: 55 };
    const fee = travelFees[params.travelZone] || 55;
    items.push({ description: `Mobile Travel Fee (Zone ${params.travelZone})`, quantity: 1, unitPrice: fee, total: fee });
  }

  // After hours
  if (params.isAfterHours) {
    items.push({ description: "After-Hours Surcharge", quantity: 1, unitPrice: 25, total: 25 });
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  // Get tax rate from settings
  const { data: taxSetting } = await supabase
    .from("platform_settings")
    .select("setting_value")
    .eq("setting_key", "tax_rate")
    .maybeSingle();

  const taxRate = parseFloat(taxSetting?.setting_value || "0") / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

  return {
    quoteNumber: `Q-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    clientName: params.clientName,
    serviceType: params.serviceType,
    lineItems: items,
    subtotal,
    taxRate: taxRate * 100,
    taxAmount,
    total: subtotal + taxAmount,
    notes,
  };
}
