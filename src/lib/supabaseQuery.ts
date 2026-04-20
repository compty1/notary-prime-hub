/**
 * Supabase query helpers — enforces explicit pagination so we never silently
 * cap at the default 1000-row limit. Use `paged()` when you intentionally
 * want a bounded select; use `range()` for windowed queries.
 *
 * Audit refs: BUG-0301..0420 (Supabase query hygiene)
 */
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 1000;
export const HARD_CAP = 1000;

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

/**
 * Apply a hard limit to any postgrest query as a safety net. Use when you
 * deliberately want all rows but want to cap to the platform max (1000).
 */
export function withSafetyLimit<T extends { limit: (n: number) => unknown }>(
  query: T,
  cap = HARD_CAP
): T {
  return query.limit(cap) as unknown as T;
}

/** Convenience: returns count + window for offset pagination UIs. */
export async function paged<Row>(
  builder: PostgrestFilterBuilder<any, any, Row, Row[], string, any, any>,
  page: number,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ rows: Row[]; total: number; page: number; pageSize: number }> {
  const [from, to] = pageRange(page, pageSize);
  const { data, error, count } = await builder.range(from, to);
  if (error) throw error;
  return {
    rows: (data ?? []) as Row[],
    total: count ?? (data?.length ?? 0),
    page,
    pageSize: clampPageSize(pageSize),
  };
}
