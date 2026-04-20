/**
 * UI-009+: Responsive data table wrapper with pagination.
 * Handles mobile overflow and pagination for large datasets.
 */
import { useState, useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginatedTableProps<T> {
  data: T[];
  columns: {
    key: string;
    label: string;
    render: (item: T) => ReactNode;
    className?: string;
    hideOnMobile?: boolean;
  }[];
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  className?: string;
}

export function PaginatedTable<T>({
  data,
  columns,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  emptyMessage = "No data available.",
  className,
}: PaginatedTableProps<T>) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(
    () => data.slice(page * pageSize, (page + 1) * pageSize),
    [data, page, pageSize]
  );

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={className}>
      {/* Responsive table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-medium text-muted-foreground ${col.hideOnMobile ? "hidden md:table-cell" : ""} ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.hideOnMobile ? "hidden md:table-cell" : ""} ${col.className || ""}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length}</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() = aria-label="Action"> setPage(0)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() = aria-label="Action"> setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-xs font-medium">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page  aria-label="Action">= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page  aria-label="Action">= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
