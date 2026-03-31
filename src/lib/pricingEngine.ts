/**
 * Centralized pricing engine for fee calculations.
 * Addresses Batch 7 (Gaps 281–320) from the implementation plan.
 */

export interface PricingSettings {
  base_fee_per_signature: number;
  travel_fee_minimum: number;
  travel_fee_per_mile: number;
  ron_platform_fee: number;
  kba_fee: number;
  rush_fee: number;
  after_hours_fee: number;
  witness_fee: number;
  apostille_fee: number;
  max_witnesses: number;
}

export interface PricingInput {
  notarizationType: "in_person" | "ron";
  documentCount: number;
  travelMiles?: number;
  isRush?: boolean;
  isAfterHours?: boolean;
  witnessCount?: number;
  needsApostille?: boolean;
  apostilleCount?: number;
  promoDiscount?: number; // percentage 0-100 or flat amount
  promoType?: "percentage" | "flat";
}

export interface PricingBreakdown {
  notarizationFees: number;
  travelFee: number;
  ronFees: number;
  rushFee: number;
  afterHoursFee: number;
  witnessFee: number;
  apostilleFee: number;
  subtotal: number;
  discount: number;
  total: number;
  deposit: number; // 25% deposit
  lineItems: { label: string; amount: number }[];
}

export const DEFAULT_SETTINGS: PricingSettings = {
  base_fee_per_signature: 5,
  travel_fee_minimum: 25,
  travel_fee_per_mile: 0.655,
  ron_platform_fee: 25,
  kba_fee: 15,
  rush_fee: 35,
  after_hours_fee: 25,
  witness_fee: 10,
  apostille_fee: 75,
  max_witnesses: 5,
};

export function parseSettings(raw: Record<string, string>): PricingSettings {
  return {
    base_fee_per_signature: parseFloat(raw.base_fee_per_signature || String(DEFAULT_SETTINGS.base_fee_per_signature)),
    travel_fee_minimum: parseFloat(raw.travel_fee_minimum || String(DEFAULT_SETTINGS.travel_fee_minimum)),
    travel_fee_per_mile: parseFloat(raw.travel_fee_per_mile || String(DEFAULT_SETTINGS.travel_fee_per_mile)),
    ron_platform_fee: parseFloat(raw.ron_platform_fee || String(DEFAULT_SETTINGS.ron_platform_fee)),
    kba_fee: parseFloat(raw.kba_fee || String(DEFAULT_SETTINGS.kba_fee)),
    rush_fee: parseFloat(raw.rush_fee || String(DEFAULT_SETTINGS.rush_fee)),
    after_hours_fee: parseFloat(raw.after_hours_fee || String(DEFAULT_SETTINGS.after_hours_fee)),
    witness_fee: parseFloat(raw.witness_fee || String(DEFAULT_SETTINGS.witness_fee)),
    apostille_fee: parseFloat(raw.apostille_fee || String(DEFAULT_SETTINGS.apostille_fee)),
    max_witnesses: parseInt(raw.max_witnesses || String(DEFAULT_SETTINGS.max_witnesses)),
  };
}

export function calculatePrice(input: PricingInput, settings: PricingSettings): PricingBreakdown {
  const cappedWitnesses = Math.min(input.witnessCount || 0, settings.max_witnesses);
  const cappedDocs = Math.max(1, Math.min(input.documentCount, 50));
  const apostilleCount = input.apostilleCount || (input.needsApostille ? 1 : 0);

  // Volume discount tiers
  let volumeRate = settings.base_fee_per_signature;
  if (cappedDocs >= 20) volumeRate = settings.base_fee_per_signature * 0.8;
  else if (cappedDocs >= 10) volumeRate = settings.base_fee_per_signature * 0.9;

  const notarizationFees = volumeRate * cappedDocs;

  // Travel: waive if < 5 miles, otherwise max(minimum, miles * rate)
  const miles = input.travelMiles || 0;
  const travelFee = input.notarizationType === "in_person"
    ? (miles < 5 ? 0 : Math.max(settings.travel_fee_minimum, miles * settings.travel_fee_per_mile))
    : 0;

  const ronFees = input.notarizationType === "ron"
    ? settings.ron_platform_fee + settings.kba_fee
    : 0;

  const rushFee = input.isRush ? settings.rush_fee : 0;
  const afterHoursFee = input.isAfterHours ? settings.after_hours_fee : 0;
  const witnessFee = cappedWitnesses * settings.witness_fee;
  const apostilleFee = apostilleCount * settings.apostille_fee;

  const subtotal = notarizationFees + travelFee + ronFees + rushFee + afterHoursFee + witnessFee + apostilleFee;

  let discount = 0;
  if (input.promoDiscount && input.promoDiscount > 0) {
    discount = input.promoType === "percentage"
      ? subtotal * (input.promoDiscount / 100)
      : input.promoDiscount;
  }

  const total = Math.max(0, subtotal - discount);
  const deposit = Math.round(total * 0.25 * 100) / 100; // 25% deposit

  const lineItems: { label: string; amount: number }[] = [
    { label: `Notarization (${cappedDocs} doc${cappedDocs > 1 ? "s" : ""} × $${settings.base_fee_per_signature.toFixed(2)})`, amount: notarizationFees },
  ];

  if (input.notarizationType === "in_person" && travelFee > 0) {
    lineItems.push({ label: `Travel Fee (${Math.round(miles)} mi)`, amount: travelFee });
  } else if (input.notarizationType === "in_person" && miles < 5) {
    lineItems.push({ label: "Travel Fee (waived < 5 mi)", amount: 0 });
  }

  if (input.notarizationType === "ron") {
    lineItems.push({ label: "RON Platform Fee", amount: settings.ron_platform_fee });
    lineItems.push({ label: "KBA Fee", amount: settings.kba_fee });
  }

  if (rushFee > 0) lineItems.push({ label: "Rush Priority", amount: rushFee });
  if (afterHoursFee > 0) lineItems.push({ label: "After-Hours", amount: afterHoursFee });
  if (cappedWitnesses > 0) lineItems.push({ label: `Witnesses (${cappedWitnesses})`, amount: witnessFee });
  if (apostilleFee > 0) lineItems.push({ label: `Apostille (${apostilleCount})`, amount: apostilleFee });
  if (discount > 0) lineItems.push({ label: "Promo Discount", amount: -discount });

  return {
    notarizationFees,
    travelFee,
    ronFees,
    rushFee,
    afterHoursFee,
    witnessFee,
    apostilleFee,
    subtotal,
    discount,
    total,
    deposit,
    lineItems: lineItems.filter(i => i.amount !== 0),
  };
}
