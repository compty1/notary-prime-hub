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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Plus, Search, Loader2, Clock, DollarSign } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", in_progress: "bg-info/10 text-info", review: "bg-purple-100 text-purple-800", completed: "bg-success/10 text-success", cancelled: "bg-destructive/10 text-destructive" };
const taskTypes = ["general", "data_entry", "research", "scheduling", "correspondence", "filing", "bookkeeping"];

export default function AdminVATasks() {
  usePageMeta({ title: "Virtual Assistant Tasks", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", task_type: "general", description: "", hours_estimated: "1", hourly_rate: "35", priority: "normal", notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("virtual_assistant_tasks").select("*").order("created_at", { ascending: false }).limit(200); if (data) setTasks(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = tasks.filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("virtual_assistant_tasks").insert({ title: form.title, task_type: form.task_type, description: form.description, hours_estimated: parseFloat(form.hours_estimated) || 1, hourly_rate: parseFloat(form.hourly_rate) || 35, priority: form.priority, notes: form.notes, client_id: user?.id || "" });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Task created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("virtual_assistant_tasks").update({ status } ).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t)); toast({ title: "Updated" });
  };

  const totalHours = tasks.filter(t => t.status === "completed").reduce((acc, t) => acc + (t.hours_actual || t.hours_estimated || 0), 0);
  const totalRevenue = tasks.filter(t => t.status === "completed").reduce((acc, t) => acc + ((t.hours_actual || t.hours_estimated || 0) * (t.hourly_rate || 35)), 0);

  return (
    <DashboardEnhancer category="va-tasks">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Virtual Assistant Tasks</h1><p className="text-sm text-muted-foreground">Task management, time tracking & billing</p></div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{totalHours.toFixed(1)}h completed</Badge>
          <Badge variant="outline" className="gap-1"><DollarSign className="h-3 w-3" />${totalRevenue.toFixed(0)}</Badge>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Task</Button>
        </div>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No tasks found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(t => (
          <Card key={t.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.task_type?.replace(/_/g, " ")} • {t.hours_estimated}h est • ${t.hourly_rate}/hr {t.priority === "urgent" ? "• 🔴 URGENT" : ""}</p>
            </div>
            <Badge className={statusColors[t.status] || ""}>{t.status?.replace(/_/g, " ")}</Badge>
            <Select value={t.status} onValueChange={v => updateStatus(t.id, v)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="pending">Pending</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent></Select>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New VA Task</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Type</Label><Select value={form.task_type} onValueChange={v => setForm(f => ({ ...f, task_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{taskTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Priority</Label><Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Hours Estimated</Label><Input type="number" step="0.5" value={form.hours_estimated} onChange={e => setForm(f => ({ ...f, hours_estimated: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
