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
import { Crosshair, Plus, Search, Loader2, MapPin, Phone, Mail } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", searching: "bg-blue-100 text-blue-800", found: "bg-emerald-100 text-emerald-800", not_found: "bg-red-100 text-red-800" };

export default function AdminSkipTracing() {
  usePageMeta({ title: "Skip Tracing", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject_name: "", subject_last_known_address: "", purpose: "", fee: "50", notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("skip_trace_requests").select("*").order("created_at", { ascending: false }).limit(200); if (data) setRequests(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = requests.filter(r => r.subject_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.subject_name.trim()) { toast({ title: "Subject name required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("skip_trace_requests").insert({ subject_name: form.subject_name, subject_last_known_address: form.subject_last_known_address, purpose: form.purpose, fee: parseFloat(form.fee) || 0, client_id: user?.id || "" } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Request created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("skip_trace_requests").update({ status } as any).eq("id", id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r)); toast({ title: "Updated" });
  };

  return (
    <DashboardEnhancer category="skip-tracing">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Skip Tracing</h1><p className="text-sm text-muted-foreground">Locate individuals for legal service of process</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Request</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No requests found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(r => (
          <Card key={r.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Crosshair className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{r.subject_name}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                {r.subject_last_known_address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.subject_last_known_address}</span>}
                {r.result_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.result_phone}</span>}
                {r.result_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.result_email}</span>}
                {r.fee && <span>${r.fee}</span>}
              </div>
            </div>
            <Badge className={statusColors[r.status] || ""}>{r.status?.replace(/_/g, " ")}</Badge>
            <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="pending">Pending</SelectItem><SelectItem value="searching">Searching</SelectItem><SelectItem value="found">Found</SelectItem><SelectItem value="not_found">Not Found</SelectItem>
            </SelectContent></Select>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Skip Trace Request</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Subject Name *</Label><Input value={form.subject_name} onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Last Known Address</Label><Input value={form.subject_last_known_address} onChange={e => setForm(f => ({ ...f, subject_last_known_address: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Purpose</Label><Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
