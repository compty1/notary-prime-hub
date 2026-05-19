import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Search, Loader2, MapPin, Navigation, List, LayoutGrid } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";

const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", picked_up: "bg-info/10 text-info", in_transit: "bg-purple-100 text-purple-800", delivered: "bg-success/10 text-success", failed: "bg-destructive/10 text-destructive" };
const STATUS_ORDER = ["pending", "picked_up", "in_transit", "delivered", "failed"];
const STATUS_LABELS: Record<string, string> = { pending: "Pending", picked_up: "Picked Up", in_transit: "In Transit", delivered: "Delivered", failed: "Failed" };

interface CourierJob {
  id: string; client_id: string; pickup_address: string; dropoff_address: string;
  package_description: string | null; requires_signature: boolean; fee: number | null;
  status: string; notes: string | null; distance_miles: number | null;
  created_at: string; updated_at: string;
}

function DraggableJobCard({ job }: { job: CourierJob }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      className={`touch-none rounded-xl border bg-card p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Truck className="h-4 w-4 text-primary" />
        <p className="font-semibold text-sm truncate">{job.package_description || "Document Delivery"}</p>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{job.pickup_address}</span></div>
        <div className="flex items-center gap-1 truncate"><Navigation className="h-3 w-3 shrink-0" /><span className="truncate">{job.dropoff_address}</span></div>
        <div className="flex items-center justify-between pt-1">
          {job.fee ? <span className="font-medium text-foreground">${job.fee}</span> : <span />}
          {job.requires_signature && <Badge variant="outline" className="text-[10px]">Sig</Badge>}
        </div>
      </div>
    </div>
  );
}

function CourierColumn({ status, jobs }: { status: string; jobs: CourierJob[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `ccol-${status}` });
  return (
    <div className="flex flex-col min-w-[260px] w-[260px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <Badge className={statusColors[status] || ""}>{STATUS_LABELS[status]}</Badge>
        <span className="text-xs text-muted-foreground">{jobs.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] rounded-2xl border-2 border-dashed p-2 space-y-2 transition-colors ${isOver ? "bg-primary/5 border-primary/40" : "border-border/50"}`}
      >
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">Drop here</div>
        ) : jobs.map(j => <DraggableJobCard key={j.id} job={j} />)}
      </div>
    </div>
  );
}

export default function AdminCourier() {
  usePageMeta({ title: "Courier Jobs", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ pickup_address: "", dropoff_address: "", package_description: "", requires_signature: true, fee: "35", notes: "" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const fetchData = async () => { const { data } = await supabase.from("courier_jobs").select("*").order("created_at", { ascending: false }).limit(200); if (data) setJobs(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = jobs.filter(j => j.pickup_address?.toLowerCase().includes(search.toLowerCase()) || j.dropoff_address?.toLowerCase().includes(search.toLowerCase()) || j.package_description?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.pickup_address.trim() || !form.dropoff_address.trim()) { toast({ title: "Pickup and dropoff addresses required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("courier_jobs").insert({ pickup_address: form.pickup_address, dropoff_address: form.dropoff_address, package_description: form.package_description, requires_signature: form.requires_signature, fee: parseFloat(form.fee) || 0, notes: form.notes, client_id: user?.id || "" });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Job created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === "delivered") update.delivery_confirmed_at = new Date().toISOString();
    const prev = jobs;
    setJobs(p => p.map(j => j.id === id ? { ...j, ...update } : j));
    const { error } = await supabase.from("courier_jobs").update(update).eq("id", id);
    if (error) { setJobs(prev); toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated" });
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("ccol-")) return;
    const newStatus = overId.replace("ccol-", "");
    const job = jobs.find(j => j.id === active.id);
    if (!job || job.status === newStatus) return;
    updateStatus(String(active.id), newStatus);
  };

  const activeJob = activeId ? jobs.find(j => j.id === activeId) : null;

  return (
    <DashboardEnhancer category="default">
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div><h1 className="text-2xl font-black tracking-tight">Courier Jobs</h1><p className="text-sm text-muted-foreground">Document delivery with chain of custody tracking</p></div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border bg-card p-0.5">
            <Button size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="h-8 gap-1.5 rounded-lg" onClick={() => setViewMode("list")}><List className="h-3.5 w-3.5" /> List</Button>
            <Button size="sm" variant={viewMode === "kanban" ? "default" : "ghost"} className="h-8 gap-1.5 rounded-lg" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-3.5 w-3.5" /> Kanban</Button>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Job</Button>
        </div>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No jobs found</CardContent></Card> : viewMode === "kanban" ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_ORDER.map(s => (
              <CourierColumn key={s} status={s} jobs={filtered.filter(j => j.status === s)} />
            ))}
          </div>
          <DragOverlay>{activeJob ? <DraggableJobCard job={activeJob} /> : null}</DragOverlay>
        </DndContext>
      ) : (
        <div className="grid gap-4">{filtered.map(j => (
          <Card key={j.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Truck className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{j.package_description || "Document Delivery"}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.pickup_address}</span>
                <span>→</span>
                <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{j.dropoff_address}</span>
                {j.fee && <span>${j.fee}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {j.requires_signature && <Badge variant="outline" className="text-[10px]">Sig Required</Badge>}
              <Badge className={statusColors[j.status] || ""}>{j.status?.replace(/_/g, " ")}</Badge>
              <Select value={j.status} onValueChange={v => updateStatus(j.id, v)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="pending">Pending</SelectItem><SelectItem value="picked_up">Picked Up</SelectItem><SelectItem value="in_transit">In Transit</SelectItem><SelectItem value="delivered">Delivered</SelectItem><SelectItem value="failed">Failed</SelectItem>
              </SelectContent></Select>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Courier Job</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Pickup Address *</Label><Input value={form.pickup_address} onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Dropoff Address *</Label><Input value={form.dropoff_address} onChange={e => setForm(f => ({ ...f, dropoff_address: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Package Description</Label><Textarea value={form.package_description} onChange={e => setForm(f => ({ ...f, package_description: e.target.value }))} rows={2} /></div>
          <div className="grid gap-2"><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
