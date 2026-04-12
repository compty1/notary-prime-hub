/**
 * SVC-248/515: Autosave drafts for long forms
 * Persists form state to localStorage with debounced saves.
 */
import { useEffect, useRef, useCallback } from "react";

const DRAFT_PREFIX = "notar_draft_";

/** Save form draft to localStorage */
export function saveDraft(formKey: string, data: Record<string, unknown>) {
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${formKey}`, JSON.stringify({
      data,
      savedAt: Date.now(),
    }));
  } catch {
    // quota exceeded — silently fail
  }
}

/** Load form draft from localStorage */
export function loadDraft<T = Record<string, unknown>>(formKey: string): T | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${formKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 24 hours
    if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
      clearDraft(formKey);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

/** Clear a saved draft */
export function clearDraft(formKey: string) {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${formKey}`);
  } catch {}
}

/** React hook for autosaving form data with debounce */
export function useAutosaveDraft(
  formKey: string,
  data: Record<string, unknown>,
  debounceMs = 1000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const save = useCallback(() => {
    saveDraft(formKey, data);
  }, [formKey, data]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [save, debounceMs]);
}
