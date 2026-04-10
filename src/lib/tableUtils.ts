/**
 * Table/list sorting and filtering utilities (Items 3300-3350)
 * Reusable sort/filter/paginate logic for admin tables.
 */

export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

/** Sort an array by a key */
export function sortBy<T>(
  items: T[],
  key: keyof T,
  direction: SortDirection = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === null || aVal === undefined) return direction === "asc" ? 1 : -1;
    if (bVal === null || bVal === undefined) return direction === "asc" ? -1 : 1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    if (aVal instanceof Date && bVal instanceof Date) {
      return direction === "asc"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }

    return 0;
  });
}

/** Paginate an array */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Get pagination metadata */
export function getPaginationMeta(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    startIndex: (page - 1) * pageSize + 1,
    endIndex: Math.min(page * pageSize, total),
  };
}

/** Filter items by a search term across multiple fields */
export function filterBySearch<T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  const lower = searchTerm.toLowerCase();

  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (value == null) return false;
      return String(value).toLowerCase().includes(lower);
    })
  );
}

/** Filter items by a specific field value */
export function filterByField<T>(
  items: T[],
  field: keyof T,
  value: unknown
): T[] {
  if (value === "" || value === null || value === undefined || value === "all") return items;
  return items.filter(item => item[field] === value);
}

/** Compose multiple filters */
export function applyFilters<T>(
  items: T[],
  ...filters: ((items: T[]) => T[])[]
): T[] {
  return filters.reduce((result, filter) => filter(result), items);
}
