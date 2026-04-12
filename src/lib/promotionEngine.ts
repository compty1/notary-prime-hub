/**
 * Seasonal promotion engine.
 * Enhancement #9 (Seasonal promotion engine)
 */

export interface Promotion {
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validFrom: string;
  validUntil: string;
  applicableServices?: string[];
  maxUses?: number;
  currentUses: number;
}

/** Check if a promotion code is currently valid */
export function isPromotionValid(promo: Promotion): boolean {
  const now = new Date().toISOString();
  if (now < promo.validFrom || now > promo.validUntil) return false;
  if (promo.maxUses && promo.currentUses >= promo.maxUses) return false;
  return true;
}

/** Apply promotion to a price */
export function applyPromotion(price: number, promo: Promotion): { discountedPrice: number; savings: number } {
  if (!isPromotionValid(promo)) return { discountedPrice: price, savings: 0 };

  let savings = 0;
  if (promo.discountType === "percentage") {
    savings = Math.round(price * (promo.discountValue / 100) * 100) / 100;
  } else {
    savings = Math.min(promo.discountValue, price);
  }

  return { discountedPrice: Math.max(0, price - savings), savings };
}

/** Default seasonal promotions */
export const SEASONAL_PROMOTIONS: Promotion[] = [
  {
    code: "NEWYEAR2026",
    name: "New Year Special",
    description: "10% off all notary services",
    discountType: "percentage",
    discountValue: 10,
    validFrom: "2026-01-01",
    validUntil: "2026-01-31",
    currentUses: 0,
    maxUses: 100,
  },
  {
    code: "SPRING2026",
    name: "Spring Business Formation",
    description: "$25 off business formation packages",
    discountType: "fixed",
    discountValue: 25,
    validFrom: "2026-03-01",
    validUntil: "2026-05-31",
    applicableServices: ["business-formation", "llc-formation"],
    currentUses: 0,
    maxUses: 50,
  },
];
