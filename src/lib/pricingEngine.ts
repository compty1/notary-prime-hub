/**
 * Centralized pricing engine for fee calculations.
 * Updated per Central Ohio Notary Competitive Pricing Audit 2026.
 * Addresses zone-based travel, facility surcharges, loan signing packages.
 */

export type TravelZone = 1 | 2 | 3 | 4;
export type FacilityType = "standard" | "hospital" | "jail" | "government";
export type LoanPackage = "standard" | "purchase" | "reverse_mortgage";

export interface PricingSettings {
  base_fee_per_signature: number;
  // Zone-based travel (from West Jefferson 43162)
  zone1_fee: number; // 0-15 mi
  zone2_fee: number; // 15-30 mi
  zone3_fee: number; // 30-45 mi
  zone4_base: number; // 45+ mi base
  zone4_per_mile: number; // per mile beyond 45
  travel_free_threshold: number; // miles waived (default 5)
  // RON
  ron_per_act_fee: number; // ORC statutory max $30/act for RON
  ron_tech_fee: number; // tech/platform fee per session
  // Surcharges
  rush_fee: number;
  after_hours_fee: number;
  holiday_fee: number;
  witness_fee: number;
  apostille_fee: number;
  max_witnesses: number;
  // Facility surcharges
  hospital_surcharge: number;
  jail_surcharge: number;
  government_surcharge: number;
  // Add-ons
  poa_surcharge: number;
  wait_time_fee: number; // per 15-min increment
  printing_fee: number; // per doc set
  scanback_fee: number;
  courier_fee: number;
  i9_fee: number;
  estate_bundle_fee: number;
  extra_signer_fee: number;
  // Loan signing packages
  loan_standard: number;
  loan_purchase: number;
  loan_reverse: number;
  // Cancellation / no-show
  cancel_under_2hr: number;
  cancel_2_to_24hr: number;
  no_show_fee: number;
}

export interface PricingInput {
  notarizationType: "in_person" | "ron";
  documentCount: number;
  signerCount?: number;
  // Zone-based travel (replaces travelMiles for zone calculation)
  travelMiles?: number;
  travelZone?: TravelZone;
  facilityType?: FacilityType;
  // Loan signing mode
  isLoanSigning?: boolean;
  loanPackage?: LoanPackage;
  // Toggles
  isRush?: boolean;
  isAfterHours?: boolean;
  isHoliday?: boolean;
  afterHoursAmount?: number;
  witnessCount?: number;
  needsApostille?: boolean;
  apostilleCount?: number;
  // Add-ons
  needsPOA?: boolean;
  waitTimePeriods?: number; // number of 15-min increments
  printingSets?: number;
  needsScanback?: boolean;
  needsCourier?: boolean;
  needsI9?: boolean;
  isEstatePlanBundle?: boolean;
  // Promo
  promoDiscount?: number;
  promoType?: "percentage" | "flat";
}

export interface PricingBreakdown {
  notarizationFees: number;
  travelFee: number;
  ronFees: number;
  rushFee: number;
  afterHoursFee: number;
  holidayFee: number;
  witnessFee: number;
  apostilleFee: number;
  facilitySurcharge: number;
  loanSigningFee: number;
  addOnFees: number;
  subtotal: number;
  discount: number;
  total: number;
  deposit: number;
  travelZone: TravelZone | null;
  lineItems: { label: string; amount: number }[];
}

export const DEFAULT_SETTINGS: PricingSettings = {
  base_fee_per_signature: 5,
  // Zone-based travel from West Jefferson 43162
  zone1_fee: 25,   // 0-15 mi
  zone2_fee: 40,   // 15-30 mi
  zone3_fee: 55,   // 30-45 mi
  zone4_base: 55,  // 45+ mi base
  zone4_per_mile: 1.50, // per mile beyond 45
  travel_free_threshold: 5,
  // RON per audit recommendations
  ron_per_act_fee: 30, // ORC allows up to $30/act for RON
  ron_tech_fee: 10,    // platform/tech fee per session
  // Surcharges per audit
  rush_fee: 25,
  after_hours_fee: 35,
  holiday_fee: 50,
  witness_fee: 15,
  apostille_fee: 175,
  max_witnesses: 5,
  // Facility surcharges
  hospital_surcharge: 20,
  jail_surcharge: 75,
  government_surcharge: 20,
  // Add-ons
  poa_surcharge: 25,
  wait_time_fee: 20,
  printing_fee: 15,
  scanback_fee: 15,
  courier_fee: 25,
  i9_fee: 45,
  estate_bundle_fee: 100,
  extra_signer_fee: 5,
  // Loan signing packages
  loan_standard: 125,
  loan_purchase: 150,
  loan_reverse: 175,
  // Cancellation/no-show
  cancel_under_2hr: 40,
  cancel_2_to_24hr: 25,
  no_show_fee: 50,
};

/** Determine travel zone from distance in miles */
export function getZoneFromMiles(miles: number): TravelZone {
  if (miles <= 15) return 1;
  if (miles <= 30) return 2;
  if (miles <= 45) return 3;
  return 4;
}

/** Calculate zone-based travel fee */
export function getZoneTravelFee(zone: TravelZone, miles: number, settings: PricingSettings): number {
  if (miles < settings.travel_free_threshold) return 0;
  switch (zone) {
    case 1: return settings.zone1_fee;
    case 2: return settings.zone2_fee;
    case 3: return settings.zone3_fee;
    case 4: return settings.zone4_base + Math.max(0, miles - 45) * settings.zone4_per_mile;
  }
}

export function parseSettings(raw: Record<string, string>): PricingSettings {
  const d = DEFAULT_SETTINGS;
  const p = (key: keyof PricingSettings) =>
    raw[key] !== undefined ? parseFloat(raw[key]) : d[key];
  return {
    base_fee_per_signature: p("base_fee_per_signature"),
    zone1_fee: p("zone1_fee"),
    zone2_fee: p("zone2_fee"),
    zone3_fee: p("zone3_fee"),
    zone4_base: p("zone4_base"),
    zone4_per_mile: p("zone4_per_mile"),
    travel_free_threshold: p("travel_free_threshold"),
    ron_per_act_fee: p("ron_per_act_fee"),
    ron_tech_fee: p("ron_tech_fee"),
    rush_fee: p("rush_fee"),
    after_hours_fee: p("after_hours_fee"),
    holiday_fee: p("holiday_fee"),
    witness_fee: p("witness_fee"),
    apostille_fee: p("apostille_fee"),
    max_witnesses: p("max_witnesses"),
    hospital_surcharge: p("hospital_surcharge"),
    jail_surcharge: p("jail_surcharge"),
    government_surcharge: p("government_surcharge"),
    poa_surcharge: p("poa_surcharge"),
    wait_time_fee: p("wait_time_fee"),
    printing_fee: p("printing_fee"),
    scanback_fee: p("scanback_fee"),
    courier_fee: p("courier_fee"),
    i9_fee: p("i9_fee"),
    estate_bundle_fee: p("estate_bundle_fee"),
    extra_signer_fee: p("extra_signer_fee"),
    loan_standard: p("loan_standard"),
    loan_purchase: p("loan_purchase"),
    loan_reverse: p("loan_reverse"),
    cancel_under_2hr: p("cancel_under_2hr"),
    cancel_2_to_24hr: p("cancel_2_to_24hr"),
    no_show_fee: p("no_show_fee"),
  };
}

export function calculatePrice(input: PricingInput, settings: PricingSettings): PricingBreakdown {
  const signers = Math.max(1, input.signerCount || 1);
  const cappedWitnesses = Math.min(input.witnessCount || 0, settings.max_witnesses);
  const cappedDocs = Math.max(1, Math.min(input.documentCount, 50));
  const apostilleCount = input.apostilleCount || (input.needsApostille ? 1 : 0);

  const totalActs = cappedDocs * signers;

  // ---- Loan signing mode ----
  let loanSigningFee = 0;
  let notarizationFees = 0;

  if (input.isLoanSigning && input.loanPackage) {
    // Loan signing is a flat package fee (includes notarization)
    switch (input.loanPackage) {
      case "standard": loanSigningFee = settings.loan_standard; break;
      case "purchase": loanSigningFee = settings.loan_purchase; break;
      case "reverse_mortgage": loanSigningFee = settings.loan_reverse; break;
    }
    // No separate notarization fees for loan signings — included in package
  } else {
    // Volume discount tiers
    let volumeRate = settings.base_fee_per_signature;
    if (totalActs >= 20) volumeRate = settings.base_fee_per_signature * 0.8;
    else if (totalActs >= 10) volumeRate = settings.base_fee_per_signature * 0.9;

    // Ohio fee cap (ORC §147.08) — $5 max per notarial act for in-person
    const OHIO_MAX_FEE_PER_ACT = input.notarizationType === "in_person" ? 5 : 30;
    volumeRate = Math.min(volumeRate, OHIO_MAX_FEE_PER_ACT);

    notarizationFees = volumeRate * totalActs;
  }

  // ---- Travel (zone-based) ----
  const miles = input.travelMiles || 0;
  const zone: TravelZone | null = input.notarizationType === "in_person"
    ? (input.travelZone || (miles > 0 ? getZoneFromMiles(miles) : null))
    : null;

  let travelFee = 0;
  if (input.notarizationType === "in_person" && zone) {
    travelFee = getZoneTravelFee(zone, miles, settings);
  }

  // ---- RON fees ----
  const ronFees = input.notarizationType === "ron"
    ? (settings.ron_per_act_fee * totalActs) + settings.ron_tech_fee
    : 0;

  // ---- Surcharges ----
  const rushFee = input.isRush ? settings.rush_fee : 0;
  const afterHoursFee = input.afterHoursAmount ?? (input.isAfterHours ? settings.after_hours_fee : 0);
  const holidayFee = input.isHoliday ? settings.holiday_fee : 0;
  const witnessFee = cappedWitnesses * settings.witness_fee;
  const apostilleFee = apostilleCount * settings.apostille_fee;

  // ---- Facility surcharge ----
  let facilitySurcharge = 0;
  if (input.facilityType === "hospital") facilitySurcharge = settings.hospital_surcharge;
  else if (input.facilityType === "jail") facilitySurcharge = settings.jail_surcharge;
  else if (input.facilityType === "government") facilitySurcharge = settings.government_surcharge;

  // ---- Add-ons ----
  let addOnFees = 0;
  const addOnItems: { label: string; amount: number }[] = [];

  if (input.needsPOA) {
    addOnFees += settings.poa_surcharge;
    addOnItems.push({ label: "POA Surcharge", amount: settings.poa_surcharge });
  }
  if (input.waitTimePeriods && input.waitTimePeriods > 0) {
    const wt = input.waitTimePeriods * settings.wait_time_fee;
    addOnFees += wt;
    addOnItems.push({ label: `Wait Time (${input.waitTimePeriods}×15 min)`, amount: wt });
  }
  if (input.printingSets && input.printingSets > 0) {
    const pf = input.printingSets * settings.printing_fee;
    addOnFees += pf;
    addOnItems.push({ label: `Document Printing (${input.printingSets} sets)`, amount: pf });
  }
  if (input.needsScanback) {
    addOnFees += settings.scanback_fee;
    addOnItems.push({ label: "Scanback Service", amount: settings.scanback_fee });
  }
  if (input.needsCourier) {
    addOnFees += settings.courier_fee;
    addOnItems.push({ label: "Courier Delivery", amount: settings.courier_fee });
  }
  if (input.needsI9) {
    addOnFees += settings.i9_fee;
    addOnItems.push({ label: "I-9 Verification", amount: settings.i9_fee });
  }
  if (input.isEstatePlanBundle) {
    addOnFees += settings.estate_bundle_fee;
    addOnItems.push({ label: "Estate Plan Bundle (flat)", amount: settings.estate_bundle_fee });
  }

  const subtotal = notarizationFees + loanSigningFee + travelFee + ronFees + rushFee + afterHoursFee + holidayFee + witnessFee + apostilleFee + facilitySurcharge + addOnFees;

  let discount = 0;
  if (input.promoDiscount && input.promoDiscount > 0) {
    discount = input.promoType === "percentage"
      ? subtotal * (input.promoDiscount / 100)
      : input.promoDiscount;
  }

  const total = Math.max(0, subtotal - discount);
  const deposit = Math.round(total * 0.25 * 100) / 100;

  // ---- Line items ----
  const lineItems: { label: string; amount: number }[] = [];

  if (input.isLoanSigning && loanSigningFee > 0) {
    const pkgLabel = input.loanPackage === "reverse_mortgage" ? "Reverse Mortgage" : input.loanPackage === "purchase" ? "Purchase" : "Standard";
    lineItems.push({ label: `Loan Signing — ${pkgLabel} Package`, amount: loanSigningFee });
  } else if (notarizationFees > 0) {
    const volumeRate = notarizationFees / totalActs;
    lineItems.push({
      label: `Notarization (${signers > 1 ? `${signers} signers × ` : ""}${cappedDocs} doc${cappedDocs > 1 ? "s" : ""} × $${volumeRate.toFixed(2)}${totalActs >= 10 ? " — volume rate" : ""})`,
      amount: notarizationFees,
    });
  }

  if (input.notarizationType === "in_person" && travelFee > 0 && zone) {
    lineItems.push({ label: `Travel Fee — Zone ${zone} (${Math.round(miles)} mi)`, amount: travelFee });
  } else if (input.notarizationType === "in_person" && miles > 0 && miles < settings.travel_free_threshold) {
    lineItems.push({ label: `Travel (waived < ${settings.travel_free_threshold} mi)`, amount: 0 });
  }

  if (input.notarizationType === "ron") {
    lineItems.push({ label: `RON Fee ($${settings.ron_per_act_fee}/act × ${totalActs})`, amount: settings.ron_per_act_fee * totalActs });
    lineItems.push({ label: "RON Tech/Platform Fee", amount: settings.ron_tech_fee });
  }

  if (facilitySurcharge > 0) {
    const fLabel = input.facilityType === "jail" ? "Jail/Prison" : input.facilityType === "hospital" ? "Hospital/Nursing" : "Government Facility";
    lineItems.push({ label: `${fLabel} Surcharge`, amount: facilitySurcharge });
  }

  if (rushFee > 0) lineItems.push({ label: "Rush Priority", amount: rushFee });
  if (afterHoursFee > 0) lineItems.push({ label: "After-Hours", amount: afterHoursFee });
  if (holidayFee > 0) lineItems.push({ label: "Holiday Surcharge", amount: holidayFee });
  if (cappedWitnesses > 0) lineItems.push({ label: `Witnesses (${cappedWitnesses} × $${settings.witness_fee})`, amount: witnessFee });
  if (apostilleFee > 0) lineItems.push({ label: `Apostille (${apostilleCount})`, amount: apostilleFee });

  // Add-on line items
  lineItems.push(...addOnItems);

  if (discount > 0) lineItems.push({ label: "Promo Discount", amount: -discount });

  return {
    notarizationFees,
    travelFee,
    ronFees,
    rushFee,
    afterHoursFee,
    holidayFee,
    witnessFee,
    apostilleFee,
    facilitySurcharge,
    loanSigningFee,
    addOnFees,
    subtotal,
    discount,
    total,
    deposit,
    travelZone: zone,
    lineItems: lineItems.filter(i => i.amount !== 0),
  };
}
