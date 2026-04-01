import { useState, useMemo, useCallback } from "react";
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
import { toast } from "sonner";
import {
  Search, Plus, CheckCircle2, AlertTriangle, Clock, XCircle, ChevronDown, ChevronRight,
  ListChecks, BarChart3, FileText, Upload, Loader2, ArrowUp, ArrowDown, StickyNote, Shield
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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
      if (fields.status === "resolved" && !fields.resolved_at) {
        fields.resolved_at = new Date().toISOString();
      }
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
      if (fields.status === "resolved" && !fields.resolved_at) {
        fields.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase.from("build_tracker_items").update(fields).in("id", updates.ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["build-tracker-items"] });
      toast.success("Bulk update applied");
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["build-tracker-items"] });
      toast.success("Item added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ─── Dashboard Tab ─── */
function DashboardTab({ items }: { items: TrackerItem[] }) {
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

  const sevColors: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#3b82f6", info: "#94a3b8" };

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
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Build Health Score
          </CardTitle>
        </CardHeader>
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Items by Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Open Items by Severity</CardTitle></CardHeader>
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
      </div>
    </div>
  );
}

/* ─── Gap Analysis Tab ─── */
function GapAnalysisTab({ items }: { items: TrackerItem[] }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const update = useUpdateItem();

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || [i.title, i.description, i.suggested_fix, i.admin_notes, i.impact_area]
        .some((f) => f?.toLowerCase().includes(q));
      return matchesSearch
        && (catFilter === "all" || i.category === catFilter)
        && (sevFilter === "all" || i.severity === sevFilter)
        && (statusFilter === "all" || i.status === statusFilter);
    });
  }, [items, search, catFilter, sevFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search gaps..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sevFilter} onValueChange={setSevFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Severities</SelectItem>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} items</p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="w-[90px]">Severity</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Impact</TableHead>
              <TableHead className="w-[60px]">To-Do</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <><TableRow key={item.id} className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : item.id)}>
                  <TableCell>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs ${severityColor[item.severity]}`}>{item.severity}</Badge></TableCell>
                  <TableCell>
                    <Select value={item.status} onValueChange={(v) => { update.mutate({ id: item.id, status: v }); }} >
                      <SelectTrigger className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-1">{statusIcon[item.status]}{item.status.replace("_", " ")}</span>
                      </SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.impact_area}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={item.is_on_todo} onCheckedChange={(v) => update.mutate({ id: item.id, is_on_todo: !!v })} />
                  </TableCell>
                </TableRow>
                {expanded && (
                  <TableRow key={`${item.id}-exp`}>
                    <TableCell colSpan={7} className="bg-muted/30 p-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium mb-1">Description</p>
                          <p className="text-muted-foreground">{item.description || "—"}</p>
                          <p className="font-medium mt-3 mb-1">Suggested Fix</p>
                          <p className="text-muted-foreground">{item.suggested_fix || "—"}</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Admin Notes</p>
                          <Textarea
                            className="text-sm"
                            rows={3}
                            value={editingNotes[item.id] ?? item.admin_notes ?? ""}
                            onChange={(e) => setEditingNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                            placeholder="Add notes..."
                          />
                          <Button size="sm" className="mt-2" onClick={() => {
                            update.mutate({ id: item.id, admin_notes: editingNotes[item.id] ?? item.admin_notes ?? "" });
                            toast.success("Notes saved");
                          }}>Save Notes</Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}</>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ─── To-Do Tab ─── */
function TodoTab({ items }: { items: TrackerItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const update = useUpdateItem();
  const bulk = useBulkUpdate();

  const todoItems = useMemo(() =>
    items.filter((i) => i.is_on_todo).sort((a, b) => (a.todo_priority ?? 999) - (b.todo_priority ?? 999)),
    [items]
  );

  const nonTodoOpen = useMemo(() => items.filter((i) => !i.is_on_todo && (i.status === "open" || i.status === "in_progress")), [items]);

  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(todoItems.map((i) => i.id)));
  const deselectAll = () => setSelected(new Set());
  const allSelected = todoItems.length > 0 && selected.size === todoItems.length;

  const movePriority = (id: string, dir: -1 | 1) => {
    const idx = todoItems.findIndex((i) => i.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= todoItems.length) return;
    update.mutate({ id: todoItems[idx].id, todo_priority: swapIdx });
    update.mutate({ id: todoItems[swapIdx].id, todo_priority: idx });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3">
        <Checkbox checked={allSelected} onCheckedChange={() => allSelected ? deselectAll() : selectAll()} />
        <span className="text-sm text-muted-foreground mr-2">{selected.size} selected</span>
        <Button size="sm" variant="outline" disabled={nonTodoOpen.length === 0}
          onClick={() => bulk.mutate({ ids: nonTodoOpen.map((i) => i.id), fields: { is_on_todo: true } })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add All Open ({nonTodoOpen.length})
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0}
          onClick={() => bulk.mutate({ ids: [...selected], fields: { status: "resolved", is_on_todo: false } })}>
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Done
        </Button>
        <Button size="sm" variant="outline" disabled={selected.size === 0}
          onClick={() => { bulk.mutate({ ids: [...selected], fields: { is_on_todo: false } }); setSelected(new Set()); }}>
          Remove from To-Do
        </Button>
      </div>

      {todoItems.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No to-do items yet. Add items from Gap Analysis or use "Add All Open".</CardContent></Card>
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
                      <span className="flex items-center gap-1 text-xs">{statusIcon[item.status]}{item.status.replace("_", " ")}</span>
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
  const [form, setForm] = useState({ title: "", description: "", category: "gap", severity: "medium", impact_area: "", suggested_fix: "" });
  const [bulkText, setBulkText] = useState("");

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    insert.mutate(form as any);
    setForm({ title: "", description: "", category: "gap", severity: "medium", impact_area: "", suggested_fix: "" });
  };

  const handleBulk = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error("Enter at least one item"); return; }
    lines.forEach((line) => insert.mutate({ title: line, category: "gap", severity: "medium", status: "open" } as any));
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
          <Button onClick={handleBulk} variant="outline" disabled={insert.isPending}><Upload className="h-4 w-4 mr-1" /> Import Lines</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminBuildTracker() {
  usePageTitle("Build Tracker");
  const { data: items = [], isLoading, error } = useTrackerItems();

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-6 text-destructive">Failed to load tracker: {(error as Error).message}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Build Intelligence & Gap Tracker</h1>
        <p className="text-muted-foreground">Centralized view of all build gaps, features, and workflow issues</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="dashboard" className="gap-1"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="gaps" className="gap-1"><Search className="h-4 w-4" /> Gap Analysis</TabsTrigger>
          <TabsTrigger value="todo" className="gap-1"><ListChecks className="h-4 w-4" /> To-Do List</TabsTrigger>
          <TabsTrigger value="add" className="gap-1"><Plus className="h-4 w-4" /> Add / Import</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab items={items} /></TabsContent>
        <TabsContent value="gaps"><GapAnalysisTab items={items} /></TabsContent>
        <TabsContent value="todo"><TodoTab items={items} /></TabsContent>
        <TabsContent value="add"><AddImportTab /></TabsContent>
      </Tabs>
    </div>
  );
}
