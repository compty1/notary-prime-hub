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
  const code = userId.slice(0, 8);

  const { data: referrals } = await supabase
    .from("audit_log")
    .select("entity_id")
    .eq("action", "referral_signup")
    .eq("entity_type", code)
    .limit(100);

  const totalReferrals = referrals?.length || 0;

  return {
    referralCode: code,
    totalReferrals,
    convertedReferrals: totalReferrals,
    earnings: 0,
  };
}
