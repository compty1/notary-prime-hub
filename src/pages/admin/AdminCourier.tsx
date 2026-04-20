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
import { Truck, Plus, Search, Loader2, MapPin, Navigation } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", picked_up: "bg-info/10 text-info", in_transit: "bg-purple-100 text-purple-800", delivered: "bg-success/10 text-success", failed: "bg-destructive/10 text-destructive" };

interface CourierJob {
  id: string; client_id: string; pickup_address: string; dropoff_address: string;
  package_description: string | null; requires_signature: boolean; fee: number | null;
  status: string; notes: string | null; distance_miles: number | null;
  created_at: string; updated_at: string;
}

export default function AdminCourier() {
  usePageMeta({ title: "Courier Jobs", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ pickup_address: "", dropoff_address: "", package_description: "", requires_signature: true, fee: "35", notes: "" });

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
    await supabase.from("courier_jobs").update(update).eq("id", id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...update } : j)); toast({ title: "Updated" });
  };

  return (
    <DashboardEnhancer category="default">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Courier Jobs</h1><p className="text-sm text-muted-foreground">Document delivery with chain of custody tracking</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Job</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No jobs found</CardContent></Card> : (
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
