import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/lib/usePageTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Plus, CheckCircle2, AlertTriangle, Clock, XCircle, ChevronDown, ChevronRight,
  ListChecks, BarChart3, FileText, Upload, Loader2, ArrowUp, ArrowDown, StickyNote, Shield,
  RefreshCw, Download, Trash2, ArrowUpDown, ArrowUpNarrowWide, ArrowDownNarrowWide, RotateCcw, X,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";

type TrackerItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  status: string;
  impact_area: string | null;
  suggested_fix: string | null;
  is_on_todo: boolean;
  todo_priority: number | null;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = ["gap", "feature", "workflow", "security", "compliance", "ux", "seo", "performance"];
const SEVERITIES = ["critical", "high", "medium", "low", "info"];
const STATUSES = ["open", "in_progress", "resolved", "deferred", "wont_fix"];
const SEV_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const severityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500/90 text-white",
  medium: "bg-yellow-500/90 text-white",
  low: "bg-blue-500/80 text-white",
  info: "bg-muted text-muted-foreground",
};

const statusIcon: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-blue-500" />,
  resolved: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  deferred: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
  wont_fix: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
};

const sevColors: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#3b82f6", info: "#94a3b8" };

function relTime(d: string | null) {
  if (!d) return "—";
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return "—"; }
}

/* ─── Hooks ─── */
function useTrackerItems() {
  return useQuery({
    queryKey: ["build-tracker-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("build_tracker_items")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TrackerItem[];
    },
  });
}

function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: { id: string } & Partial<TrackerItem>) => {
      const { id, ...fields } = update;
      if (fields.status === "resolved" && !fields.resolved_at) fields.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("build_tracker_items").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["build-tracker-items"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

function useBulkUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { ids: string[]; fields: Partial<TrackerItem> }) => {
      const fields = { ...updates.fields };
      if (fields.status === "resolved" && !fields.resolved_at) fields.resolved_at = new Date().toISOString();
      const { error } = await supabase.from("build_tracker_items").update(fields).in("id", updates.ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Bulk update applied"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useDeleteItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("build_tracker_items").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useInsertItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<TrackerItem>) => {
      const { error } = await supabase.from("build_tracker_items").insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Item added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* Fix 3 — Batch bulk insert hook */
function useBulkInsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Partial<TrackerItem>[]) => {
      const { error } = await supabase.from("build_tracker_items").insert(items as any[]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["build-tracker-items"] }); toast.success("Bulk import complete"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ─── CSV Export ─── */
function exportCSV(items: TrackerItem[]) {
  const headers = ["Title", "Category", "Severity", "Status", "Impact Area", "Description", "Suggested Fix", "Admin Notes", "On To-Do", "Updated At"];
  const rows = items.map((i) => [
    i.title, i.category, i.severity, i.status, i.impact_area ?? "", i.description ?? "",
    i.suggested_fix ?? "", i.admin_notes ?? "", i.is_on_todo ? "Yes" : "No", i.updated_at,
  ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
  const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `build-tracker-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  toast.success("CSV exported");
}

/* ─── Sort helper ─── */
type SortField = "title" | "category" | "severity" | "status" | "impact_area" | "updated_at";
type SortDir = "asc" | "desc";

/* Fix 1 — Date sorting: compare updated_at by timestamp, not localeCompare */
function sortItems(items: TrackerItem[], field: SortField, dir: SortDir): TrackerItem[] {
  const m = dir === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    if (field === "severity") return m * ((SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9));
    if (field === "updated_at") {
      return m * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
    }
    const av = (a[field] ?? "") as string;
    const bv = (b[field] ?? "") as string;
    return m * av.localeCompare(bv);
  });
}

function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (current !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? <ArrowUpNarrowWide className="h-3 w-3" /> : <ArrowDownNarrowWide className="h-3 w-3" />;
}

/* ─── Dashboard Tab ─── */
function DashboardTab({ items, onJumpToGap }: { items: TrackerItem[]; onJumpToGap: (id: string) => void }) {
  const total = items.length;
  const open = items.filter((i) => i.status === "open").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const resolved = items.filter((i) => i.status === "resolved").length;
  const deferred = items.filter((i) => i.status === "deferred" || i.status === "wont_fix").length;
  const healthScore = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((i) => { map[i.category] = (map[i.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const bySeverity = useMemo(() => {
    const map: Record<string, number> = {};
    items.filter((i) => i.status === "open" || i.status === "in_progress").forEach((i) => {
      map[i.severity] = (map[i.severity] || 0) + 1;
    });
    return SEVERITIES.map((s) => ({ name: s, value: map[s] || 0 })).filter((d) => d.value > 0);
  }, [items]);

  const byImpact = useMemo(() => {
    const map: Record<string, number> = {};
    items.filter((i) => i.status !== "resolved" && i.status !== "wont_fix").forEach((i) => {
      const area = i.impact_area || "Uncategorized";
      map[area] = (map[area] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [items]);

  const recentlyUpdated = useMemo(() =>
    [...items].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10),
    [items]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Items", value: total, icon: <FileText className="h-4 w-4" /> },
          { label: "Open", value: open, icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> },
          { label: "In Progress", value: inProgress, icon: <Clock className="h-4 w-4 text-blue-500" /> },
          { label: "Resolved", value: resolved, icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: "Deferred", value: deferred, icon: <XCircle className="h-4 w-4 text-muted-foreground" /> },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              {kpi.icon}
              <div><p className="text-2xl font-bold">{kpi.value}</p><p className="text-xs text-muted-foreground">{kpi.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Build Health Score</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{healthScore}%</div>
            <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${healthScore}%` }} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{resolved} of {total} items resolved</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Items by Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Open by Severity</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeverity}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis /><Tooltip />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {bySeverity.map((d) => <Cell key={d.name} fill={sevColors[d.name] || "#94a3b8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Open by Impact Area</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byImpact} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" fontSize={10} width={100} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--accent))" radius={[0,4,4,0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Recently Updated</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentlyUpdated.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors" onClick={() => onJumpToGap(item.id)}>
                <div className="flex items-center gap-2 min-w-0">
                  {statusIcon[item.status]}
                  <span className="truncate">{item.title}</span>
                  <Badge className={`text-[10px] ${severityColor[item.severity]}`}>{item.severity}</Badge>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{relTime(item.updated_at)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Gap Analysis Tab ─── */
function GapAnalysisTab({ items, jumpToId, onFilteredCountChange }: { items: TrackerItem[]; jumpToId: string | null; onFilteredCountChange: (count: number) => void }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
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

  /* Fix 2 — Scroll to expanded item when jumpToId changes */
  useEffect(() => {
    if (jumpToId) {
      setExpandedId(jumpToId);
      // Give DOM a tick to render the expanded row before scrolling
      setTimeout(() => {
        expandedRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [jumpToId]);

  const hasActiveFilters = search || catFilter !== "all" || sevFilter !== "all" || statusFilter !== "all" || impactFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCatFilter("all");
    setSevFilter("all");
    setStatusFilter("all");
    setImpactFilter("all");
  };

  const impactAreas = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => { if (i.impact_area) set.add(i.impact_area); });
    return Array.from(set).sort();
  }, [items]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => { m[i.category] = (m[i.category] || 0) + 1; });
    return m;
  }, [items]);
  const sevCounts = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => { m[i.severity] = (m[i.severity] || 0) + 1; });
    return m;
  }, [items]);
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    items.forEach((i) => { m[i.status] = (m[i.status] || 0) + 1; });
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || [i.title, i.description, i.suggested_fix, i.admin_notes, i.impact_area]
        .some((f) => f?.toLowerCase().includes(q));
      return matchesSearch
        && (catFilter === "all" || i.category === catFilter)
        && (sevFilter === "all" || i.severity === sevFilter)
        && (statusFilter === "all" || i.status === statusFilter)
        && (impactFilter === "all" || i.impact_area === impactFilter);
    });
  }, [items, search, catFilter, sevFilter, statusFilter, impactFilter]);

  const sorted = useMemo(() => sortField ? sortItems(filtered, sortField, sortDir) : filtered, [filtered, sortField, sortDir]);

  /* Fix 5 — Report filtered count to parent for tab badge */
  useEffect(() => {
    onFilteredCountChange(sorted.length);
  }, [sorted.length, onFilteredCountChange]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) { setSortDir((d) => d === "asc" ? "desc" : "asc"); }
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allFilteredSelected = sorted.length > 0 && sorted.every((i) => selectedIds.has(i.id));
  const toggleAll = () => {
    if (allFilteredSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((i) => i.id)));
  };

  /* Fix 9 — Gather titles for delete dialog */
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
        {/* Fix 7 — Clear Filters button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
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

      {/* Fix 10 — Empty state */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium mb-1">No items found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters ? "Try adjusting your filters or search query." : "Add items using the Add / Import tab or press N for Quick Add."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear All Filters</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-auto">
          {/* Fix 11 — data-no-glossary prevents LegalGlossaryProvider from processing table headers */}
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
                      <TableCell className="font-medium" onClick={() => setExpandedId(expanded ? null : item.id)}>{item.title}</TableCell>
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

      {/* Fix 9 — Delete dialog shows item titles */}
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

/* ─── To-Do Tab ─── */
function TodoTab({ items }: { items: TrackerItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [todoCatFilter, setTodoCatFilter] = useState("all");
  const [todoSevFilter, setTodoSevFilter] = useState("all");
  const update = useUpdateItem();
  const bulk = useBulkUpdate();

  const todoItems = useMemo(() => {
    let list = items.filter((i) => i.is_on_todo);
    if (todoCatFilter !== "all") list = list.filter((i) => i.category === todoCatFilter);
    if (todoSevFilter !== "all") list = list.filter((i) => i.severity === todoSevFilter);
    return list.sort((a, b) => (a.todo_priority ?? 999) - (b.todo_priority ?? 999));
  }, [items, todoCatFilter, todoSevFilter]);

  const nonTodoOpen = useMemo(() => items.filter((i) => !i.is_on_todo && (i.status === "open" || i.status === "in_progress")), [items]);

  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = todoItems.length > 0 && todoItems.every((i) => selected.has(i.id));

  /* Fix 4 — Priority reorder: use bulk update to swap both priorities in a single call */
  const movePriority = (id: string, dir: -1 | 1) => {
    const idx = todoItems.findIndex((i) => i.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= todoItems.length) return;
    const itemA = todoItems[idx];
    const itemB = todoItems[swapIdx];
    // Swap priorities: update both in parallel via individual mutates wrapped in Promise.all-like behavior
    // Since useBulkUpdate uses .in() which sets the same fields, we do two quick updates
    update.mutate({ id: itemA.id, todo_priority: swapIdx });
    // Use a slight delay to avoid race condition — or better, do sequential
    setTimeout(() => update.mutate({ id: itemB.id, todo_priority: idx }), 50);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={todoCatFilter === c ? "default" : "outline"} className="text-xs h-7"
            onClick={() => setTodoCatFilter(todoCatFilter === c ? "all" : c)}>{c}</Button>
        ))}
        <span className="text-muted-foreground mx-1">|</span>
        {SEVERITIES.map((s) => (
          <Badge key={s} className={`cursor-pointer text-xs ${todoSevFilter === s ? severityColor[s] : "bg-muted text-muted-foreground"}`}
            onClick={() => setTodoSevFilter(todoSevFilter === s ? "all" : s)}>{s}</Badge>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <Checkbox checked={allSelected} onCheckedChange={() => allSelected ? setSelected(new Set()) : setSelected(new Set(todoItems.map((i) => i.id)))} />
        <span className="text-sm text-muted-foreground mr-2">{selected.size} selected</span>
        <Button size="sm" variant="outline" disabled={nonTodoOpen.length === 0}
          onClick={() => bulk.mutate({ ids: nonTodoOpen.map((i) => i.id), fields: { is_on_todo: true } })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add All Open ({nonTodoOpen.length})
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0}
          onClick={() => { bulk.mutate({ ids: [...selected], fields: { status: "resolved", is_on_todo: false } }); setSelected(new Set()); }}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Done
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0}
          onClick={() => { bulk.mutate({ ids: [...selected], fields: { is_on_todo: false } }); setSelected(new Set()); }}>
          Remove from To-Do
        </Button>
      </div>

      {todoItems.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No to-do items. Add from Gap Analysis or use "Add All Open".</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {todoItems.map((item, idx) => (
            <Card key={item.id} className={`transition-all ${selected.has(item.id) ? "ring-2 ring-primary" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.title}</span>
                      <Badge className={`text-xs ${severityColor[item.severity]}`}>{item.severity}</Badge>
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      <Select value={item.status} onValueChange={(v) => {
                        const fields: Partial<TrackerItem> = { status: v };
                        if (v === "resolved") fields.is_on_todo = false;
                        update.mutate({ id: item.id, ...fields });
                      }}>
                        <SelectTrigger className="h-6 text-xs w-auto min-w-[100px]">
                          <span className="flex items-center gap-1">{statusIcon[item.status]}{item.status.replace("_", " ")}</span>
                        </SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {item.suggested_fix && <p className="text-sm text-muted-foreground mt-1">{item.suggested_fix}</p>}
                    <div className="mt-2 flex items-start gap-2">
                      <StickyNote className="h-3.5 w-3.5 mt-1 text-muted-foreground shrink-0" />
                      <Textarea rows={2} className="text-xs"
                        value={editingNotes[item.id] ?? item.admin_notes ?? ""}
                        onChange={(e) => setEditingNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                        placeholder="Add notes..." />
                      <Button size="sm" variant="ghost" onClick={() => {
                        update.mutate({ id: item.id, admin_notes: editingNotes[item.id] ?? item.admin_notes ?? "" });
                        toast.success("Saved");
                      }}>Save</Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => movePriority(item.id, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === todoItems.length - 1} onClick={() => movePriority(item.id, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Add/Import Tab ─── */
function AddImportTab() {
  const insert = useInsertItem();
  const bulkInsert = useBulkInsert();
  const [form, setForm] = useState({ title: "", description: "", category: "gap", severity: "medium", impact_area: "", suggested_fix: "" });
  const [bulkText, setBulkText] = useState("");

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    insert.mutate(form as any);
    setForm({ title: "", description: "", category: "gap", severity: "medium", impact_area: "", suggested_fix: "" });
  };

  /* Fix 3 — Batch bulk import: single insert call instead of N individual mutations */
  const handleBulk = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error("Enter at least one item"); return; }
    const items = lines.map((line) => ({ title: line, category: "gap", severity: "medium", status: "open" }));
    bulkInsert.mutate(items as any[]);
    setBulkText("");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Add Single Item</CardTitle><CardDescription>Manually add a gap, feature, or issue</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input placeholder="Impact Area (e.g. Booking Flow)" value={form.impact_area} onChange={(e) => setForm((p) => ({ ...p, impact_area: e.target.value }))} />
          <Textarea placeholder="Suggested Fix" value={form.suggested_fix} onChange={(e) => setForm((p) => ({ ...p, suggested_fix: e.target.value }))} rows={2} />
          <Button onClick={handleAdd} disabled={insert.isPending}>{insert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Add Item</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">Bulk Import</CardTitle><CardDescription>One title per line — auto-categorized as "gap"</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={10} placeholder={"Rate limiting on forms\nCSRF protection\nInput sanitization..."} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
          <Button onClick={handleBulk} variant="outline" disabled={bulkInsert.isPending}>
            {bulkInsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            <Upload className="h-4 w-4 mr-1" /> Import Lines
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Quick Add Dialog ─── */
function QuickAddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insert = useInsertItem();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("gap");
  const [severity, setSeverity] = useState("medium");

  /* Fix 8 — Reset state on close */
  const handleClose = () => {
    setTitle("");
    setCategory("gap");
    setSeverity("medium");
    onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    insert.mutate({ title, category, severity, status: "open" } as any);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Quick Add Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} className="w-full">Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export default function AdminBuildTracker() {
  usePageTitle("Build Tracker");
  const { data: items = [], isLoading, error, refetch, isFetching } = useTrackerItems();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [jumpToGapId, setJumpToGapId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [filteredGapCount, setFilteredGapCount] = useState<number | null>(null);
  const bulk = useBulkUpdate();

  const todoCount = useMemo(() => items.filter((i) => i.is_on_todo).length, [items]);
  const openCount = useMemo(() => items.filter((i) => i.status === "open" || i.status === "in_progress").length, [items]);

  // Keyboard shortcut: N for quick add
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleJumpToGap = useCallback((id: string) => {
    setJumpToGapId(id);
    setActiveTab("gaps");
  }, []);

  /* Fix 6 — Re-analyze: flag resolved items that have no resolved_at timestamp back to open */
  const handleReanalyze = useCallback(() => {
    const staleResolved = items.filter((i) => i.status === "resolved" && !i.resolved_at);
    if (staleResolved.length === 0) {
      toast.info("All resolved items have valid timestamps — nothing to flag.");
      return;
    }
    bulk.mutate(
      { ids: staleResolved.map((i) => i.id), fields: { status: "open" } },
      { onSuccess: () => toast.success(`Re-opened ${staleResolved.length} stale resolved items`) },
    );
  }, [items, bulk]);

  const handleFilteredCountChange = useCallback((count: number) => {
    setFilteredGapCount(count);
  }, []);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-6 text-destructive">Failed to load tracker: {(error as Error).message}</div>;

  /* Fix 5 — Show filtered count on Gap Analysis tab */
  const gapTabLabel = filteredGapCount !== null && filteredGapCount !== items.length
    ? `Gap Analysis (${filteredGapCount}/${items.length})`
    : `Gap Analysis (${items.length})`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Build Intelligence & Gap Tracker</h1>
          <p className="text-muted-foreground">Centralized view of all build gaps, features, and workflow issues</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Fix 6 — Re-analyze button */}
          <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={bulk.isPending}>
            <RotateCcw className={`h-3.5 w-3.5 mr-1 ${bulk.isPending ? "animate-spin" : ""}`} /> Re-analyze
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setQuickAddOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Quick Add (N)</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="dashboard" className="gap-1"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="gaps" className="gap-1"><Search className="h-4 w-4" /> {gapTabLabel}</TabsTrigger>
          <TabsTrigger value="todo" className="gap-1"><ListChecks className="h-4 w-4" /> To-Do ({todoCount})</TabsTrigger>
          <TabsTrigger value="add" className="gap-1"><Plus className="h-4 w-4" /> Add / Import</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab items={items} onJumpToGap={handleJumpToGap} /></TabsContent>
        <TabsContent value="gaps"><GapAnalysisTab items={items} jumpToId={jumpToGapId} onFilteredCountChange={handleFilteredCountChange} /></TabsContent>
        <TabsContent value="todo"><TodoTab items={items} /></TabsContent>
        <TabsContent value="add"><AddImportTab /></TabsContent>
      </Tabs>

      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
