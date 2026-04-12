/**
 * Loyalty rewards program tracking.
 * Enhancement #8 (Loyalty rewards)
 */

import { supabase } from "@/integrations/supabase/client";

export interface LoyaltyStatus {
  clientId: string;
  pointsBalance: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  totalAppointments: number;
  totalSpent: number;
  nextTierAt: number;
}

const TIER_THRESHOLDS = { bronze: 0, silver: 500, gold: 1500, platinum: 5000 };

/** Calculate loyalty tier from total spending */
export function calculateTier(totalSpent: number): LoyaltyStatus["tier"] {
  if (totalSpent >= TIER_THRESHOLDS.platinum) return "platinum";
  if (totalSpent >= TIER_THRESHOLDS.gold) return "gold";
  if (totalSpent >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

/** Get loyalty status for a client */
export async function getLoyaltyStatus(clientId: string): Promise<LoyaltyStatus> {
  const [paymentsRes, appointmentsRes] = await Promise.all([
    supabase.from("payments").select("amount").eq("client_id", clientId).eq("status", "paid"),
    supabase.from("appointments").select("id").eq("client_id", clientId).not("status", "in", '("cancelled","no_show")'),
  ]);

  const totalSpent = (paymentsRes.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalAppointments = appointmentsRes.data?.length || 0;
  const tier = calculateTier(totalSpent);
  const pointsBalance = Math.floor(totalSpent); // 1 point per dollar

  // Next tier threshold
  const tierOrder: LoyaltyStatus["tier"][] = ["bronze", "silver", "gold", "platinum"];
  const currentIdx = tierOrder.indexOf(tier);
  const nextTier = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : tier;
  const nextTierAt = TIER_THRESHOLDS[nextTier] - totalSpent;

  return { clientId, pointsBalance, tier, totalAppointments, totalSpent, nextTierAt: Math.max(0, nextTierAt) };
}

/** Get tier discount percentage */
export function getTierDiscount(tier: LoyaltyStatus["tier"]): number {
  const discounts = { bronze: 0, silver: 5, gold: 10, platinum: 15 };
  return discounts[tier];
}
