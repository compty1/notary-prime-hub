/**
 * Sprint K — Reusable paged query hook with cursor + page size state.
 * Wraps useQuery for any Supabase-style table with .range() support.
 */
import { useState, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

export interface PagedQueryOptions<T> {
  queryKey: readonly unknown[];
  pageSize?: number;
  /** Receives (from, to) inclusive indexes, must return { rows, count } */
  fetcher: (from: number, to: number) => Promise<{ rows: T[]; count: number }>;
  enabled?: boolean;
}

export function usePagedQuery<T>({ queryKey, pageSize = 25, fetcher, enabled = true }: PagedQueryOptions<T>) {
  const [page, setPage] = useState(0);
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const query = useQuery({
    queryKey: [...queryKey, page, pageSize],
    queryFn: () => fetcher(from, to),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const totalPages = useMemo(
    () => (query.data?.count ? Math.max(1, Math.ceil(query.data.count / pageSize)) : 1),
    [query.data?.count, pageSize]
  );

  return {
    rows: query.data?.rows || [],
    count: query.data?.count || 0,
    page,
    pageSize,
    totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage((p) => Math.max(p - 1, 0)),
    canPrev: page > 0,
    canNext: page < totalPages - 1,
  };
}
