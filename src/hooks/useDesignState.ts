/**
 * Design State Manager — localStorage persistence + auto-save for design studio tools
 */
import { useState, useEffect, useCallback } from "react";

export interface DesignConfig {
  [key: string]: any;
}

const STORAGE_PREFIX = "notardex-design-";

export function useDesignState<T extends DesignConfig>(
  designerId: string,
  initialState: T
) {
  const storageKey = `${STORAGE_PREFIX}${designerId}`;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...initialState, ...parsed };
      }
    } catch {
      // ignore
    }
    return initialState;
  });

  // Auto-save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // storage full or unavailable
    }
  }, [state, storageKey]);

  const update = useCallback((key: keyof T, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    setState(initialState);
  }, [storageKey, initialState]);

  const getSerializable = useCallback(() => {
    return { ...state };
  }, [state]);

  return { state, setState, update, reset, getSerializable };
}
