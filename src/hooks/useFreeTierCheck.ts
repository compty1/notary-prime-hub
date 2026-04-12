import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_TIER_LIMIT = 5; // generations per month

export function useFreeTierCheck(featureKey: string) {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const check = async () => {
      // Check for active subscription
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (sub && sub.length > 0) {
        setHasSubscription(true);
        setLoading(false);
        return;
      }

      // Count usage this month from audit_log
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("audit_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", `free_tier_usage_${featureKey}`)
        .gte("created_at", monthStart.toISOString());

      setUsageCount(count || 0);
      setLoading(false);
    };

    check();
  }, [user, featureKey]);

  const canUse = hasSubscription || usageCount < FREE_TIER_LIMIT;
  const remaining = hasSubscription ? Infinity : Math.max(0, FREE_TIER_LIMIT - usageCount);

  const recordUsage = async () => {
    if (!user) return;
    // Log usage to audit_log
    await supabase.from("audit_log").insert({
      action: `free_tier_usage_${featureKey}`,
      user_id: user.id,
      details: { feature: featureKey, timestamp: new Date().toISOString() },
    } as any);
    setUsageCount(prev => prev + 1);
  };

  return { canUse, remaining, usageCount, limit: FREE_TIER_LIMIT, loading, hasSubscription, recordUsage };
}
