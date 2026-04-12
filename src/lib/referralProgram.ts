/**
 * Referral program with tracking codes.
 * Enhancement #4 (Referral program with tracking)
 */

import { supabase } from "@/integrations/supabase/client";

/** Generate a shareable referral link */
export function generateReferralLink(referralCode: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://notary-prime-hub.lovable.app";
  return `${baseUrl}/?ref=${referralCode}`;
}

/** Capture referral code from URL */
export function captureReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    sessionStorage.setItem("referral_code", ref);
  }
  return ref || sessionStorage.getItem("referral_code");
}

/** Get referral stats for a user */
export async function getReferralStats(userId: string): Promise<{
  referralCode: string;
  totalReferrals: number;
  convertedReferrals: number;
  earnings: number;
}> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .maybeSingle();

  const code = profile?.referral_code || "";

  const { data: referrals } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("referred_by", code);

  const referralIds = referrals?.map((r: any) => r.user_id) || [];

  let earnings = 0;
  if (referralIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .in("client_id", referralIds)
      .eq("status", "paid");

    // 10% referral commission
    earnings = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0) * 0.1, 0);
  }

  return {
    referralCode: code,
    totalReferrals: referralIds.length,
    convertedReferrals: referralIds.length, // simplified
    earnings: Math.round(earnings * 100) / 100,
  };
}
