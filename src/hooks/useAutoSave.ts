import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for auto-saving form data (Items 3100-3120)
 * Debounced persistence to localStorage with configurable interval.
 */
export function useAutoSave<T>(
  key: string,
  data: T,
  options?: {
    debounceMs?: number;
    enabled?: boolean;
    onSave?: (data: T) => void;
  }
) {
  const debounceMs = options?.debounceMs ?? 2000;
  const enabled = options?.enabled ?? true;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const save = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(dataRef.current));
      options?.onSave?.(dataRef.current);
    } catch (e) {
      console.warn(`Auto-save failed for ${key}:`, e);
    }
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, debounceMs, enabled, save]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (enabled) save();
    };
  }, [enabled, save]);

  /** Load saved data */
  const load = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [key]);

  /** Clear saved data */
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`Failed to clear auto-save for ${key}`);
    }
  }, [key]);

  return { load, clear, saveNow: save };
}
