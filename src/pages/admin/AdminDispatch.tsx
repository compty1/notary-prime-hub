import { useMemo, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, AlertTriangle, CheckCircle, Truck, Timer, List, LayoutGrid } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor,
  useSensor, useSensors, useDraggable, useDroppable,
} from "@dnd-kit/core";

const STATUS_ORDER = ["pending", "dispatched", "en_route", "arrived", "completed", "cancelled"] as const;
type DispatchStatus = typeof STATUS_ORDER[number];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  dispatched: "bg-info/10 text-info border-info/30",
  en_route: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300/40",
  arrived: "bg-success/10 text-success border-success/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-foreground", normal: "text-foreground", high: "text-warning", urgent: "text-destructive font-bold",
};

type DispatchRow = {
  id: string; dispatch_status: string; priority: string;
  eta_minutes: number | null; dispatched_at: string | null; created_at: string;
};

function DraggableDispatchCard({ d }: { d: DispatchRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: d.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="touch-none"
      role="button"
      tabIndex={0}
      aria-label={`Dispatch ${d.id.slice(0, 8)}`}
    >
      <div className="cursor-grab active:cursor-grabbing rounded-md border-2 bg-card p-2 text-xs shadow-sm hover:shadow transition-shadow">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono font-semibold truncate">#{d.id.slice(0, 8)}</p>
          <span className={`text-[10px] uppercase ${PRIORITY_COLORS[d.priority] || ""}`}>{d.priority}</span>
        </div>
        {d.eta_minutes != null && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" /> ETA {d.eta_minutes}m
          </p>
        )}
      </div>
    </div>
  );
}

function DispatchColumn({
  status, items,
}: { status: DispatchStatus; items: DispatchRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `dcol-${status}` });
  return (
    <div
      ref={setNodeRef}
      aria-label={`${status} column`}
      className={`min-w-[200px] rounded-lg p-2 border-2 transition-colors ${
        isOver ? "bg-primary/5 border-primary/40 border-dashed" : "border-transparent"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge className={`text-xs border ${STATUS_COLORS[status]}`}>{status.replace(/_/g, " ")}</Badge>
        <span className="text-[11px] text-muted-foreground">{items.length}</span>
      </div>
      <div className="space-y-2 min-h-[120px]">
        {items.length === 0 ? (
          <div className="text-center text-[11px] text-muted-foreground/70 py-6 border-2 border-dashed border-border/50 rounded-md">
            Drop here
          </div>
        ) : items.map(d => <DraggableDispatchCard key={d.id} d={d} />)}
      </div>
    </div>
  );
}

export default function AdminDispatch() {
  usePageMeta({ title: "Dispatch & Routing" });
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: dispatches = [] } = useQuery<DispatchRow[]>({
    queryKey: ["dispatch_assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("dispatch_assignments").select("*").order("created_at", { ascending: false });
      return (data || []) as DispatchRow[];
    },
  });

  const { data: slaTimers = [] } = useQuery({
    queryKey: ["sla_timers"],
    queryFn: async () => {
      const { data } = await supabase.from("sla_timers").select("*").order("deadline_at", { ascending: true }).limit(50);
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { dispatch_status: status };
      if (status === "dispatched") updates.dispatched_at = new Date().toISOString();
      const { error } = await supabase.from("dispatch_assignments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["dispatch_assignments"] });
      const prev = qc.getQueryData<DispatchRow[]>(["dispatch_assignments"]);
      qc.setQueryData<DispatchRow[]>(["dispatch_assignments"], old =>
        (old || []).map(d => d.id === id ? { ...d, dispatch_status: status } : d)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["dispatch_assignments"], ctx.prev);
      toast.error("Status update failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dispatch_assignments"] }); toast.success("Status updated"); },
  });

  const filtered = statusFilter === "all" ? dispatches : dispatches.filter(d => d.dispatch_status === statusFilter);
  const activeCount = dispatches.filter(d => ["dispatched", "en_route", "arrived"].includes(d.dispatch_status)).length;
  const urgentCount = dispatches.filter(d => d.priority === "urgent" && d.dispatch_status !== "completed").length;
  const breachedSLAs = slaTimers.filter(s => s.breached).length;

  const byStatus = useMemo(() => {
    const m: Record<string, DispatchRow[]> = {};
    STATUS_ORDER.forEach(s => { m[s] = dispatches.filter(d => d.dispatch_status === s); });
    return m;
  }, [dispatches]);

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    if (!e.over) return;
    const id = String(e.active.id);
    const overId = String(e.over.id);
    if (!overId.startsWith("dcol-")) return;
    const status = overId.slice(5);
    const current = dispatches.find(d => d.id === id);
    if (!current || current.dispatch_status === status) return;
    updateStatus.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dispatch & Routing Engine</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Dispatches</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-1"><Truck className="h-5 w-5 text-info" />{activeCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-warning">{dispatches.filter(d => d.dispatch_status === "pending").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Urgent</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive flex items-center gap-1"><AlertTriangle className="h-5 w-5" />{urgentCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">SLA Breaches</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{breachedSLAs}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="dispatches">
        <TabsList>
          <TabsTrigger value="dispatches"><Truck className="h-3.5 w-3.5 mr-1" />Dispatches</TabsTrigger>
          <TabsTrigger value="sla"><Timer className="h-3.5 w-3.5 mr-1" />SLA Timers</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatches" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5">
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5 mr-1" /> List
              </Button>
              <Button
                size="sm"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                onClick={() => setViewMode("kanban")}
                aria-label="Kanban view"
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Kanban
              </Button>
            </div>
          </div>

          {viewMode === "list" ? (
            filtered.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No dispatch assignments found.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filtered.map(d => (
                  <Card key={d.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Dispatch #{d.id.slice(0, 8)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className={PRIORITY_COLORS[d.priority] || ""}>{d.priority.toUpperCase()}</span>
                            {d.eta_minutes && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />ETA: {d.eta_minutes}m</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[d.dispatch_status] || ""}>{d.dispatch_status.replace(/_/g, " ")}</Badge>
                        {d.dispatch_status !== "completed" && d.dispatch_status !== "cancelled" && (
                          <Select value={d.dispatch_status} onValueChange={v => updateStatus.mutate({ id: d.id, status: v })}>
                            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUS_ORDER.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                          </Select>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Drag a dispatch card between columns to update its status.</p>
              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                  {STATUS_ORDER.map(s => (
                    <DispatchColumn key={s} status={s} items={byStatus[s] || []} />
                  ))}
                </div>
                <DragOverlay>
                  {activeDragId ? (() => {
                    const d = dispatches.find(x => x.id === activeDragId);
                    return d ? (
                      <div className="rounded-md border-2 bg-card p-2 text-xs shadow-lg max-w-[200px]">
                        <p className="font-mono font-semibold">#{d.id.slice(0, 8)}</p>
                        <span className={`text-[10px] uppercase ${PRIORITY_COLORS[d.priority] || ""}`}>{d.priority}</span>
                      </div>
                    ) : null;
                  })() : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          {slaTimers.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No SLA timers configured.</CardContent></Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr><th className="text-left p-3">Type</th><th className="text-left p-3">Entity</th><th className="text-left p-3">Deadline</th><th className="text-center p-3">Status</th></tr></thead>
                <tbody>{slaTimers.map(s => (
                  <tr key={s.id} className="border-t hover:bg-muted/20">
                    <td className="p-3 font-medium">{s.sla_type}</td>
                    <td className="p-3 text-muted-foreground">{s.entity_type} #{s.entity_id.slice(0, 8)}</td>
                    <td className="p-3">{new Date(s.deadline_at).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      {s.breached ? <Badge variant="destructive">Breached</Badge> : s.met_at ? <Badge className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" />Met</Badge> : <Badge variant="outline">Active</Badge>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
