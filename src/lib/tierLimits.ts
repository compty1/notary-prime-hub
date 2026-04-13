/**
 * SC-001/002/003: Subscription tier enforcement and usage metering
 */

export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface TierLimits {
  bookingsPerMonth: number;
  aiGenerationsPerDay: number;
  documentUploads: number;
  ronSessions: number;
  storageGB: number;
  notaryPageCustomization: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    bookingsPerMonth: 5,
    aiGenerationsPerDay: 3,
    documentUploads: 10,
    ronSessions: 2,
    storageGB: 1,
    notaryPageCustomization: false,
    apiAccess: false,
    prioritySupport: false,
    whiteLabel: false,
  },
  pro: {
    bookingsPerMonth: 100,
    aiGenerationsPerDay: 50,
    documentUploads: 500,
    ronSessions: 50,
    storageGB: 25,
    notaryPageCustomization: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: false,
  },
  enterprise: {
    bookingsPerMonth: Infinity,
    aiGenerationsPerDay: Infinity,
    documentUploads: Infinity,
    ronSessions: Infinity,
    storageGB: 100,
    notaryPageCustomization: true,
    apiAccess: true,
    prioritySupport: true,
    whiteLabel: true,
  },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

export function isFeatureAvailable(tier: SubscriptionTier, feature: keyof TierLimits): boolean {
  const limits = TIER_LIMITS[tier];
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

export function checkUsageLimit(
  tier: SubscriptionTier,
  metric: "bookingsPerMonth" | "aiGenerationsPerDay" | "documentUploads" | "ronSessions",
  currentUsage: number
): { allowed: boolean; remaining: number; limit: number; upgradeNeeded: boolean } {
  const limit = TIER_LIMITS[tier][metric];
  const remaining = Math.max(0, limit - currentUsage);
  return {
    allowed: currentUsage < limit,
    remaining,
    limit,
    upgradeNeeded: currentUsage >= limit && tier !== "enterprise",
  };
}

export function getUpgradeCTA(tier: SubscriptionTier): { message: string; targetTier: SubscriptionTier } | null {
  if (tier === "enterprise") return null;
  if (tier === "pro") return { message: "Upgrade to Enterprise for unlimited access", targetTier: "enterprise" };
  return { message: "Upgrade to Pro to unlock more features", targetTier: "pro" };
}
