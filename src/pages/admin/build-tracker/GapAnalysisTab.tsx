import { useState, useMemo, Fragment, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search, Plus, CheckCircle2, Trash2, Download, X,
  ChevronDown, ChevronRight, ArrowUpDown, ArrowUpNarrowWide, ArrowDownNarrowWide,
} from "lucide-react";
import type { TrackerItem, SortField, SortDir } from "./constants";
import { CATEGORIES, SEVERITIES, STATUSES, severityColor, statusIcon, sortItems, relTime, exportCSV, SEV_RANK } from "./constants";
import { useUpdateItem, useBulkUpdate, useDeleteItems } from "./hooks";

function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (current !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? <ArrowUpNarrowWide className="h-3 w-3" /> : <ArrowDownNarrowWide className="h-3 w-3" />;
}

type Props = {
  items: TrackerItem[];
  jumpToId: string | null;
  onFilteredCountChange: (count: number) => void;
};

export default function GapAnalysisTab({ items, jumpToId, onFilteredCountChange }: Props) {
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
  const bulk = useBulkUpdate();
  const del = useDeleteItems();

  useEffect(() => {
    if (jumpToId) {
      setExpandedId(jumpToId);
      setTimeout(() => expandedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }, [jumpToId]);

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

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, catFilter, sevFilter, statusFilter, impactFilter, pageFilter]);

  useEffect(() => { onFilteredCountChange(sorted.length); }, [sorted.length, onFilteredCountChange]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allFilteredSelected = sorted.length > 0 && sorted.every((i) => selectedIds.has(i.id));
  const toggleAll = () => {
    if (allFilteredSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((i) => i.id)));
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
        <Button variant="outline" size="sm" onClick={() => exportCSV(sorted)}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids: [...selectedIds], fields: { is_on_todo: true } })}><Plus className="h-3.5 w-3.5 mr-1" /> Add to To-Do</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids: [...selectedIds], fields: { status: "resolved" } })}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Resolved</Button>
          <Button size="sm" variant="outline" onClick={() => bulk.mutate({ ids: [...selectedIds], fields: { status: "deferred" } })}>Defer</Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteIds([...selectedIds])}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{sorted.length} items{hasActiveFilters ? ` (filtered from ${items.length})` : ""}</p>

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
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader data-no-glossary="true">
              <TableRow>
                <TableHead className="w-8"><Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} /></TableHead>
                <TableHead className="w-8" />
                <SortableHead field="title">Title</SortableHead>
                <SortableHead field="category" className="w-[100px]">Category</SortableHead>
                <SortableHead field="severity" className="w-[90px]">Severity</SortableHead>
                <SortableHead field="status" className="w-[120px]">Status</SortableHead>
                <SortableHead field="impact_area" className="w-[120px]">Impact</SortableHead>
                <SortableHead field="updated_at" className="w-[100px]">Updated</SortableHead>
                <TableHead className="w-[60px]">To-Do</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => {
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
                      <TableCell className="font-medium" onClick={() => setExpandedId(expanded ? null : item.id)}>
                        {item.title}
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
                        <TableCell colSpan={10} className="bg-muted/30 p-4">
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
                            </div>
                            <div>
                              <p className="font-medium mb-1">Admin Notes</p>
                              <Textarea className="text-sm" rows={3}
                                value={editingNotes[item.id] ?? item.admin_notes ?? ""}
                                onChange={(e) => setEditingNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                                placeholder="Add notes..." />
                              <Button size="sm" className="mt-2" onClick={() => {
                                update.mutate({ id: item.id, admin_notes: editingNotes[item.id] ?? item.admin_notes ?? "" });
                                toast.success("Notes saved");
                              }}>Save Notes</Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
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
            <AlertDialogAction onClick={() => { if (deleteIds) { del.mutate(deleteIds); setSelectedIds((p) => { const n = new Set(p); deleteIds.forEach((id) => n.delete(id)); return n; }); setDeleteIds(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
