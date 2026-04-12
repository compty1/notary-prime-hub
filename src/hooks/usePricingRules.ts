/**
 * AP-002: Hook to fetch pricing from platform_settings / pricing_rules
 * and wire it to components like FeeCalculator and PricingMenu.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cachedFetch, CACHE_KEYS } from "@/lib/cacheManager";
export interface PricingRule {
  id: string;
  service_id: string;
  service_name: string;
  base_price: number;
  per_signer_fee: number;
  travel_fee: number;
  rush_fee: number;
  after_hours_fee: number;
  is_active: boolean;
}

const CACHE_KEY = "pricing_rules";

export function usePricingRules() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Try cache first
      const cached = cacheManager.get<PricingRule[]>(CACHE_KEY);
      if (cached) {
        setRules(cached);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("is_active", true)
        .order("service_name");

      if (data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          service_id: r.service_id ?? "",
          service_name: r.service_name ?? "",
          base_price: r.base_price ?? 0,
          per_signer_fee: r.per_signer_fee ?? 0,
          travel_fee: r.travel_fee ?? 0,
          rush_fee: r.rush_fee ?? 0,
          after_hours_fee: r.after_hours_fee ?? 0,
          is_active: r.is_active ?? true,
        }));
        setRules(mapped);
        cacheManager.set(CACHE_KEY, mapped, 120_000); // 2 min cache
      }
      setLoading(false);
    };
    load();
  }, []);

  const getPriceForService = (serviceName: string): PricingRule | undefined => {
    return rules.find(r => r.service_name.toLowerCase() === serviceName.toLowerCase());
  };

  return { rules, loading, getPriceForService };
}
