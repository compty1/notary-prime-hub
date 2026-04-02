/**
 * Safe localStorage/sessionStorage wrappers that handle private browsing,
 * disabled storage, and quota errors gracefully.
 * Items 485, 486 from the audit plan.
 */

export function safeGetItem(key: string, storage: Storage = localStorage): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string, storage: Storage = localStorage): void {
  try {
    storage.removeItem(key);
  } catch {}
}

export function safeGetJson<T = unknown>(key: string, fallback: T, storage: Storage = localStorage): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSetJson(key: string, value: unknown, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
