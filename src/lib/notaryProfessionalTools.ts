/**
 * Notary professional tools — earnings calculator and availability presets.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Calculate projected notary earnings based on session volume.
 */
export interface EarningsProjection {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  breakdown: {
    notaryFees: number;
    travelFees: number;
    technologyFees: number;
    rushFees: number;
  };
}

export function calculateEarnings(params: {
  sessionsPerDay: number;
  avgDocsPerSession: number;
  ronPercentage: number; // 0-100
  mobilePercentage: number; // 0-100
  rushPercentage: number;
  avgTravelFee: number;
  workDaysPerWeek: number;
}): EarningsProjection {
  const {
    sessionsPerDay, avgDocsPerSession, ronPercentage, mobilePercentage,
    rushPercentage, avgTravelFee, workDaysPerWeek
  } = params;

  const ronSessions = sessionsPerDay * (ronPercentage / 100);
  const inPersonSessions = sessionsPerDay - ronSessions;
  const mobileSessions = inPersonSessions * (mobilePercentage / 100);
  const rushSessions = sessionsPerDay * (rushPercentage / 100);

  // Per-day calculations
  const notaryFees = (inPersonSessions * avgDocsPerSession * 5) + (ronSessions * avgDocsPerSession * 30);
  const travelFees = mobileSessions * avgTravelFee;
  const technologyFees = ronSessions * 10;
  const rushFees = rushSessions * 25;

  const daily = notaryFees + travelFees + technologyFees + rushFees;
  const weekly = daily * workDaysPerWeek;
  const monthly = weekly * 4.33;
  const yearly = weekly * 52;

  return {
    daily: Math.round(daily * 100) / 100,
    weekly: Math.round(weekly * 100) / 100,
    monthly: Math.round(monthly * 100) / 100,
    yearly: Math.round(yearly * 100) / 100,
    breakdown: {
      notaryFees: Math.round(notaryFees * workDaysPerWeek * 4.33 * 100) / 100,
      travelFees: Math.round(travelFees * workDaysPerWeek * 4.33 * 100) / 100,
      technologyFees: Math.round(technologyFees * workDaysPerWeek * 4.33 * 100) / 100,
      rushFees: Math.round(rushFees * workDaysPerWeek * 4.33 * 100) / 100,
    },
  };
}

/**
 * Availability preset templates.
 */
export interface AvailabilityPreset {
  id: string;
  name: string;
  description: string;
  schedule: Record<string, { start: string; end: string } | null>;
}

export const AVAILABILITY_PRESETS: AvailabilityPreset[] = [
  {
    id: "standard",
    name: "Standard Business Hours",
    description: "Mon–Fri 9 AM – 5 PM",
    schedule: {
      monday: { start: "09:00", end: "17:00" },
      tuesday: { start: "09:00", end: "17:00" },
      wednesday: { start: "09:00", end: "17:00" },
      thursday: { start: "09:00", end: "17:00" },
      friday: { start: "09:00", end: "17:00" },
      saturday: null,
      sunday: null,
    },
  },
  {
    id: "extended",
    name: "Extended Hours",
    description: "Mon–Sat 8 AM – 8 PM",
    schedule: {
      monday: { start: "08:00", end: "20:00" },
      tuesday: { start: "08:00", end: "20:00" },
      wednesday: { start: "08:00", end: "20:00" },
      thursday: { start: "08:00", end: "20:00" },
      friday: { start: "08:00", end: "20:00" },
      saturday: { start: "09:00", end: "17:00" },
      sunday: null,
    },
  },
  {
    id: "emergency",
    name: "Emergency / On-Call",
    description: "7 days, 7 AM – 10 PM",
    schedule: {
      monday: { start: "07:00", end: "22:00" },
      tuesday: { start: "07:00", end: "22:00" },
      wednesday: { start: "07:00", end: "22:00" },
      thursday: { start: "07:00", end: "22:00" },
      friday: { start: "07:00", end: "22:00" },
      saturday: { start: "07:00", end: "22:00" },
      sunday: { start: "10:00", end: "18:00" },
    },
  },
  {
    id: "weekends",
    name: "Weekends Only",
    description: "Sat–Sun 10 AM – 4 PM",
    schedule: {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: { start: "10:00", end: "16:00" },
      sunday: { start: "10:00", end: "16:00" },
    },
  },
];

/**
 * Get actual notary earnings from DB.
 */
export async function getNotaryEarnings(notaryUserId: string, startDate: string, endDate: string) {
  const { data } = await supabase
    .from("profit_share_transactions")
    .select("professional_share, gross_amount, platform_fee, status, created_at")
    .eq("professional_user_id", notaryUserId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (!data) return { totalEarnings: 0, totalGross: 0, platformFees: 0, transactions: [] };

  const totalEarnings = data.reduce((s, t) => s + (t.professional_share || 0), 0);
  const totalGross = data.reduce((s, t) => s + (t.gross_amount || 0), 0);
  const platformFees = data.reduce((s, t) => s + (t.platform_fee || 0), 0);

  return { totalEarnings, totalGross, platformFees, transactions: data };
}
