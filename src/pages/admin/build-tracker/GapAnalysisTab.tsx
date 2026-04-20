import { useState, useMemo, Fragment, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search, CheckCircle2, Trash2, Download, X,
  ChevronDown, ChevronRight, ArrowUpDown, ArrowUpNarrowWide, ArrowDownNarrowWide,
  Sparkles, Loader2, Copy, ListChecks,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { TrackerItem, SortField, SortDir } from "./constants";
import { CATEGORIES, SEVERITIES, STATUSES, severityColor, statusIcon, sortItems, relTime, exportCSV, SEV_RANK } from "./constants";
import { useUpdateItem, useBulkUpdate, useDeleteItems } from "./hooks";
import BulkActionBar from "./BulkActionBar";
import VerifyFixesButton from "./VerifyFixesButton";
import { useSSEStream, safeClipboardWrite } from "./useSSEStream";

function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (current !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? <ArrowUpNarrowWide className="h-3 w-3" /> : <ArrowDownNarrowWide className="h-3 w-3" />;
}

type Props = {
  items: TrackerItem[];
  jumpToId: string | null;
  onFilteredCountChange: (count: number) => void;
  onJumpConsumed?: () => void;
};

export default function GapAnalysisTab({ items, jumpToId, onFilteredCountChange, onJumpConsumed }: Props) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const expandedRowRef = useRef<HTMLTableRowElement>(null);
  const update = useUpdateItem();
  const del = useDeleteItems();

  useEffect(() => {
    if (jumpToId) {
      setExpandedId(jumpToId);
      setTimeout(() => {
        expandedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        onJumpConsumed?.();
      }, 100);
    }
  }, [jumpToId, onJumpConsumed]);

  const hasActiveFilters = search || catFilter !== "all" || sevFilter !== "all" || statusFilter !== "all" || impactFilter !== "all" || pageFilter !== "all";

  const clearFilters = () => {
    setSearch(""); setCatFilter("all"); setSevFilter("all");
    setStatusFilter("all"); setImpactFilter("all"); setPageFilter("all");
  };

  const impactAreas = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => { if (i.impact_area) set.add(i.impact_area); });
    return Array.from(set).sort();
  }, [items]);

  const pageRoutes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => { if (i.page_route) set.add(i.page_route); });
    return Array.from(set).sort();
  }, [items]);

  const catCounts = useMemo(() => { const m: Record<string, number> = {}; items.forEach((i) => { m[i.category] = (m[i.category] || 0) + 1; }); return m; }, [items]);
  const sevCounts = useMemo(() => { const m: Record<string, number> = {}; items.forEach((i) => { m[i.severity] = (m[i.severity] || 0) + 1; }); return m; }, [items]);
  const statusCounts = useMemo(() => { const m: Record<string, number> = {}; items.forEach((i) => { m[i.status] = (m[i.status] || 0) + 1; }); return m; }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || [i.title, i.description, i.suggested_fix, i.admin_notes, i.impact_area].some((f) => f?.toLowerCase().includes(q));
      return matchesSearch
        && (catFilter === "all" || i.category === catFilter)
        && (sevFilter === "all" || i.severity === sevFilter)
        && (statusFilter === "all" || i.status === statusFilter)
        && (impactFilter === "all" || i.impact_area === impactFilter)
        && (pageFilter === "all" || i.page_route === pageFilter);
    });
  }, [items, search, catFilter, sevFilter, statusFilter, impactFilter, pageFilter]);

  const sorted = useMemo(() => sortField ? sortItems(filtered, sortField, sortDir) : filtered, [filtered, sortField, sortDir]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  // Reset page when filters change, but preserve on data updates
  useEffect(() => { setPage(1); }, [search, catFilter, sevFilter, statusFilter, impactFilter, pageFilter]);

  // Clamp page if items shrink (e.g. after bulk delete)
  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [totalPages, page]);

  useEffect(() => { onFilteredCountChange(sorted.length); }, [sorted.length, onFilteredCountChange]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  
  // Select visible page only vs all
  const allPageSelected = paginated.length > 0 && paginated.every((i) => selectedIds.has(i.id));
  const toggleAll = () => {
    if (allPageSelected) {
      setSelectedIds(prev => {
        const n = new Set(prev);
        paginated.forEach(i => n.delete(i.id));
        return n;
      });
    } else {
      setSelectedIds(prev => {
        const n = new Set(prev);
        paginated.forEach(i => n.add(i.id));
        return n;
      });
    }
  };

  const deleteItemTitles = useMemo(() => {
    if (!deleteIds) return [];
    return deleteIds.slice(0, 3).map((id) => items.find((i) => i.id === id)?.title ?? id);
  }, [deleteIds, items]);

  const SortableHead = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead className={`cursor-pointer select-none ${className ?? ""}`} onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">{children}<SortIcon field={field} current={sortField} dir={sortDir} /></span>
    </TableHead>
  );

  return (
    <TooltipProvider>
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search gaps..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c} ({catCounts[c] || 0})</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Severities</SelectItem>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s} ({sevCounts[s] || 0})</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")} ({statusCounts[s] || 0})</SelectItem>)}</SelectContent>
        </Select>
        <Select value={impactFilter} onValueChange={setImpactFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Impact Area" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Areas</SelectItem>{impactAreas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
        </Select>
        {pageRoutes.length > 0 && (
          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Page" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Pages</SelectItem>{pageRoutes.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground"><X className="h-3.5 w-3.5 mr-1" /> Clear</Button>
        )}
        <VerifyFixesButton items={sorted} />
        <Button variant="outline" size="sm" onClick={() => exportCSV(sorted)}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sorted.length} items{hasActiveFilters ? ` (filtered from ${items.length})` : ""}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Per page:</span>
          <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">No items found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters ? "Try adjusting your filters or search query." : "Add items using the Add / Import tab or press N for Quick Add."}
            </p>
            {hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Clear All Filters</Button>}
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader data-no-glossary="true">
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-8" />
                <SortableHead field="title">Title</SortableHead>
                <SortableHead field="category" className="w-[100px]">Category</SortableHead>
                <SortableHead field="severity" className="w-[90px]">Severity</SortableHead>
                <SortableHead field="status" className="w-[120px]">Status</SortableHead>
                <SortableHead field="impact_area" className="w-[120px]">Impact</SortableHead>
                <SortableHead field="created_at" className="w-[90px]">Created</SortableHead>
                <SortableHead field="updated_at" className="w-[90px]">Updated</SortableHead>
                <TableHead className="w-[60px]">To-Do</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((item) => {
                const expanded = expandedId === item.id;
                return (
                  <Fragment key={item.id}>
                    <TableRow className={`cursor-pointer ${selectedIds.has(item.id) ? "bg-primary/5" : ""}`}
                      ref={expanded ? expandedRowRef : undefined}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                      </TableCell>
                      <TableCell onClick={() => setExpandedId(expanded ? null : item.id)}>
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px]" onClick={() => setExpandedId(expanded ? null : item.id)}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate">{item.title}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[400px]">
                            <p>{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                        {item.page_route && <span className="ml-2 text-[10px] text-muted-foreground">{item.page_route}</span>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                      <TableCell><Badge className={`text-xs ${severityColor[item.severity]}`}>{item.severity}</Badge></TableCell>
                      <TableCell>
                        <Select value={item.status} onValueChange={(v) => update.mutate({ id: item.id, status: v })}>
                          <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                            <span className="flex items-center gap-1">{statusIcon[item.status]}{item.status.replace("_", " ")}</span>
                          </SelectTrigger>
                          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.impact_area}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relTime(item.created_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relTime(item.updated_at)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={item.is_on_todo} onCheckedChange={(v) => update.mutate({ id: item.id, is_on_todo: !!v })} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteIds([item.id])}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={11} className="bg-muted/30 p-4">
                          <ExpandedGapRow item={item} editingNotes={editingNotes} setEditingNotes={setEditingNotes} update={update} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 pb-12">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
              {selectedIds.size > 0 && ` · ${selectedIds.size} selected`}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) p = i + 1;
                else if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
                return (
                  <Button key={p} size="sm" variant={page === p ? "default" : "outline"} className="w-8 h-8 p-0" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                );
              })}
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
        </>
      )}
      <AlertDialog open={!!deleteIds} onOpenChange={(o) => !o && setDeleteIds(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteIds?.length} item(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItemTitles.length > 0 && (
                <span className="block mb-2">
                  {deleteItemTitles.map((t, i) => <span key={i} className="block truncate">• {t}</span>)}
                  {(deleteIds?.length ?? 0) > 3 && <span className="block text-xs">…and {(deleteIds?.length ?? 0) - 3} more</span>}
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={del.isPending} onClick={() => { if (deleteIds) { del.mutate(deleteIds); setSelectedIds((p) => { const n = new Set(p); deleteIds.forEach((id) => n.delete(id)); return n; }); setDeleteIds(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkActionBar selectedIds={selectedIds} items={items} onClear={() => setSelectedIds(new Set())} />
    </div>
    </TooltipProvider>
  );
}

/* ─── Expanded Gap Row with AI Enhance ─── */
function ExpandedGapRow({
  item, editingNotes, setEditingNotes, update,
}: {
  item: TrackerItem;
  editingNotes: Record<string, string>;
  setEditingNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  update: ReturnType<typeof useUpdateItem>;
}) {
  const { stream, isStreaming, content } = useSSEStream();

  const enhance = async () => {
    try {
      await stream(
        [{
          role: "user",
          content: `Generate a detailed implementation spec for this gap item:\n\nTitle: ${item.title}\nCategory: ${item.category}\nSeverity: ${item.severity}\nDescription: ${item.description || "N/A"}\nSuggested Fix: ${item.suggested_fix || "N/A"}\n\nProvide: 1) Specific implementation steps 2) Files to modify 3) Testing approach 4) Complexity estimate`,
        }],
        "Implementation spec mode for a single gap item."
      );
    } catch { /* handled */ }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium mb-1">Description</p>
          <p className="text-muted-foreground">{item.description || "—"}</p>
          <p className="font-medium mt-3 mb-1">Suggested Fix</p>
          <p className="text-muted-foreground">{item.suggested_fix || "—"}</p>
          {item.page_route && (
            <>
              <p className="font-medium mt-3 mb-1">Page Route</p>
              <p className="text-muted-foreground">{item.page_route}</p>
            </>
          )}
          <p className="font-medium mt-3 mb-1">Created</p>
          <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
        </div>
        <div>
          <p className="font-medium mb-1">Admin Notes</p>
          <Textarea className="text-sm" rows={3}
            value={editingNotes[item.id] ?? item.admin_notes ?? ""}
            onChange={(e) => setEditingNotes((p) => ({ ...p, [item.id]: e.target.value }))}
            placeholder="Add notes..." />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => {
              update.mutate({ id: item.id, admin_notes: editingNotes[item.id] ?? item.admin_notes ?? "" });
              toast.success("Notes saved");
            }}>Save Notes</Button>
            <Button size="sm" variant="outline" onClick={enhance} disabled={isStreaming}>
              {isStreaming ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Enhance
            </Button>
          </div>
        </div>
      </div>

      {(content || isStreaming) && (
        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" /> AI Implementation Spec
            </Badge>
            {content && (
              <Button size="sm" variant="ghost" onClick={async () => { const ok = await safeClipboardWrite(content); if (ok) toast.success("Copied"); else toast.error("Copy failed"); }}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            )}
          </div>
          {isStreaming && !content && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating spec...
            </div>
          )}
          {content && (
            <div className="prose prose-sm dark:prose-invert max-w-none max-h-[300px] overflow-y-auto">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
