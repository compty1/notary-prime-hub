/**
 * Automated pricing quote generator.
 * Builds itemized quotes based on service selection and client details.
 */
import { getServiceById } from "@/lib/serviceRegistry";
import { formatDuration } from "@/lib/serviceDurationEngine";
import { BRAND_CONFIG } from "@/lib/brandConfig";

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  note?: string;
}

export interface PricingQuote {
  items: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  estimatedDuration: string;
  disclaimer: string;
  generatedAt: string;
  validUntil: string;
  quoteNumber: string;
}

interface QuoteParams {
  serviceId: string;
  signerCount?: number;
  documentCount?: number;
  isRush?: boolean;
  isAfterHours?: boolean;
  isMobile?: boolean;
  travelZone?: number; // 1-4
  notarizationType?: "in_person" | "ron";
  additionalServices?: string[];
}

const TRAVEL_FEES: Record<number, number> = { 1: 0, 2: 25, 3: 35, 4: 55 };
const RUSH_MULTIPLIER = 1.5;
const AFTER_HOURS_FEE = 25;
const RON_TECH_FEE = 10;
const MAX_FEE_PER_ACT = 5.0;
const MAX_RON_FEE_PER_ACT = 30.0;

export function generateQuote(params: QuoteParams): PricingQuote {
  const service = getServiceById(params.serviceId);
  const items: QuoteLineItem[] = [];
  const signerCount = params.signerCount || 1;
  const docCount = params.documentCount || 1;

  // Base service fee
  let basePrice = 25; // Default
  if (service?.category === "notarization") {
    const feePerAct = params.notarizationType === "ron" ? MAX_RON_FEE_PER_ACT : MAX_FEE_PER_ACT;
    basePrice = feePerAct * docCount;
  }

  items.push({
    description: service?.name || "Service",
    quantity: 1,
    unitPrice: basePrice,
    total: basePrice,
    note: service?.orcReference ? `Per ${service.orcReference}` : undefined,
  });

  // Extra signers
  if (signerCount > 1) {
    const perSigner = params.notarizationType === "ron" ? MAX_RON_FEE_PER_ACT : MAX_FEE_PER_ACT;
    const extraTotal = (signerCount - 1) * perSigner * docCount;
    items.push({
      description: `Additional signers (${signerCount - 1})`,
      quantity: signerCount - 1,
      unitPrice: perSigner * docCount,
      total: extraTotal,
    });
  }

  // RON technology fee
  if (params.notarizationType === "ron") {
    items.push({
      description: "RON Technology Fee",
      quantity: 1,
      unitPrice: RON_TECH_FEE,
      total: RON_TECH_FEE,
      note: "Audio-video platform & credential analysis",
    });
  }

  // Travel fee
  if (params.isMobile && params.travelZone) {
    const travelFee = TRAVEL_FEES[params.travelZone] || 55;
    if (travelFee > 0) {
      items.push({
        description: `Travel fee (Zone ${params.travelZone})`,
        quantity: 1,
        unitPrice: travelFee,
        total: travelFee,
      });
    }
  }

  // After-hours fee
  if (params.isAfterHours) {
    items.push({
      description: "After-hours surcharge",
      quantity: 1,
      unitPrice: AFTER_HOURS_FEE,
      total: AFTER_HOURS_FEE,
    });
  }

  // Additional services
  if (params.additionalServices) {
    for (const addOnId of params.additionalServices) {
      const addOn = getServiceById(addOnId);
      if (addOn) {
        const price = 25; // Default add-on price
        items.push({
          description: addOn.name,
          quantity: 1,
          unitPrice: price,
          total: price,
        });
      }
    }
  }

  // Rush multiplier
  if (params.isRush) {
    const subtotalBeforeRush = items.reduce((s, i) => s + i.total, 0);
    const rushSurcharge = Math.round(subtotalBeforeRush * (RUSH_MULTIPLIER - 1) * 100) / 100;
    items.push({
      description: "Rush service surcharge (50%)",
      quantity: 1,
      unitPrice: rushSurcharge,
      total: rushSurcharge,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxRate = 0; // Ohio does not charge sales tax on notary fees
  const tax = 0;
  const total = subtotal + tax;
  const duration = service?.estimatedDuration ?? 30;

  const now = new Date();
  const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    items,
    subtotal,
    taxRate,
    tax,
    total,
    estimatedDuration: formatDuration(duration),
    disclaimer: `Quote valid for 7 days. Ohio notary fees capped at $${MAX_FEE_PER_ACT}/act (in-person) and $${MAX_RON_FEE_PER_ACT}/act (RON) per ORC §147.08. Travel and technology fees are separate from statutory notary fees.`,
    generatedAt: now.toISOString(),
    validUntil: validUntil.toISOString(),
    quoteNumber: `Q-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  };
}
