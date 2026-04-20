/**
 * Supabase query helpers — enforces explicit pagination so we never silently
 * cap at the default 1000-row limit. Use `paged()` when you intentionally
 * want a bounded select; use `range()` for windowed queries.
 *
 * Audit refs: BUG-0301..0420 (Supabase query hygiene)
 */
export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 1000;

/** Clamp a requested page size into the safe range. */
export function clampPageSize(n?: number): number {
  if (!n || n <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, Math.floor(n)), MAX_PAGE_SIZE);
}

/** Build a `[from, to]` tuple for `.range(from, to)` from page + size. */
export function pageRange(page: number, pageSize = DEFAULT_PAGE_SIZE): [number, number] {
  const size = clampPageSize(pageSize);
  const safePage = Math.max(0, Math.floor(page));
  const from = safePage * size;
  return [from, from + size - 1];
}
