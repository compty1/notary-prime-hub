import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/** In-memory cache shared across all hook instances */
let _cache: Record<string, string> = {};
let _cacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // GS-006: Reduced to 2 minutes for faster propagation

export function useSettings(keys?: string[]) {
  const [settings, setSettings] = useState<Record<string, string>>(_cache);
  const [loading, setLoading] = useState(Object.keys(_cache).length === 0);

  useEffect(() => {
    if (Date.now() - _cacheTime < CACHE_TTL && Object.keys(_cache).length > 0) {
      setSettings(_cache);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const query = supabase.from("platform_settings").select("setting_key, setting_value");
      const { data } = await query;
      if (cancelled) return;
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((s: { setting_key: string; setting_value: string }) => { map[s.setting_key] = s.setting_value; });
        _cache = map;
        _cacheTime = Date.now();
        setSettings(map);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  /** Get a single setting with fallback */
  const get = (key: string, fallback = ""): string => settings[key] || fallback;

  /** Check if a feature toggle is enabled (default true) */
  const isEnabled = (key: string, defaultEnabled = true): boolean => {
    const val = settings[key];
    if (val === undefined) return defaultEnabled;
    return val === "true" || val === "1";
  };

  /** Invalidate cache to force refetch on next mount */
  const invalidate = () => {
    _cacheTime = 0;
    _cache = {};
  };

  // If specific keys requested, return filtered
  if (keys) {
    const filtered: Record<string, string> = {};
    keys.forEach(k => { if (settings[k]) filtered[k] = settings[k]; });
    return { settings: filtered, loading, get, isEnabled, invalidate };
  }

  return { settings, loading, get, isEnabled, invalidate };
}
