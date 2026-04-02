/**
 * Gap 47: AI Tools favorites using localStorage
 * Gap 48: Recent tool usage history
 */
import { useState, useCallback } from "react";
import { safeGetJson, safeSetJson } from "@/lib/safeStorage";

const FAVORITES_KEY = "ai_tools_favorites";
const HISTORY_KEY = "ai_tools_history";
const MAX_HISTORY = 20;

export function useFavoriteTools() {
  const [favorites, setFavorites] = useState<string[]>(() =>
    safeGetJson<string[]>(FAVORITES_KEY, [])
  );

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      safeSetJson(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (toolId: string) => favorites.includes(toolId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}

export function useToolHistory() {
  const [history, setHistory] = useState<string[]>(() =>
    safeGetJson<string[]>(HISTORY_KEY, [])
  );

  const recordUsage = useCallback((toolId: string) => {
    setHistory((prev) => {
      const next = [toolId, ...prev.filter((id) => id !== toolId)].slice(0, MAX_HISTORY);
      safeSetJson(HISTORY_KEY, next);
      return next;
    });
  }, []);

  return { history, recordUsage };
}
