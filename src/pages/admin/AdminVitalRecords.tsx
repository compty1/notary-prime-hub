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
import { ScrollText, Plus, Search, Loader2 } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const statusColors: Record<string, string> = { intake: "bg-yellow-100 text-yellow-800", submitted: "bg-blue-100 text-blue-800", processing: "bg-purple-100 text-purple-800", received: "bg-emerald-100 text-emerald-800", delivered: "bg-gray-100 text-gray-800" };
const recordTypes = ["birth_certificate", "death_certificate", "marriage_certificate", "divorce_decree", "adoption_record"];

export default function AdminVitalRecords() {
  usePageMeta({ title: "Vital Records", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ person_name: "", record_type: "birth_certificate", county: "", state: "OH", agency: "", copies_requested: "1", agency_fee: "21.50", service_fee: "35", notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("vital_records_requests").select("*").order("created_at", { ascending: false }).limit(200); if (data) setRequests(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = requests.filter(r => r.person_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.person_name.trim()) { toast({ title: "Person name required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("vital_records_requests").insert({ person_name: form.person_name, record_type: form.record_type, county: form.county, state: form.state, agency: form.agency, copies_requested: parseInt(form.copies_requested) || 1, agency_fee: parseFloat(form.agency_fee) || 0, service_fee: parseFloat(form.service_fee) || 0, client_id: user?.id || "" } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Request created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("vital_records_requests").update({ status } as any).eq("id", id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r)); toast({ title: "Updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Vital Records</h1><p className="text-sm text-muted-foreground">Birth, death, marriage & divorce record requests</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Request</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No requests found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(r => (
          <Card key={r.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><ScrollText className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{r.person_name}</p>
              <p className="text-xs text-muted-foreground">{r.record_type?.replace(/_/g, " ")} • {r.county ? `${r.county} County, ` : ""}{r.state} • {r.copies_requested} copies</p>
            </div>
            <Badge className={statusColors[r.status] || ""}>{r.status}</Badge>
            <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="intake">Intake</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="received">Received</SelectItem><SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent></Select>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Vital Records Request</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Person Name *</Label><Input value={form.person_name} onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Record Type</Label><Select value={form.record_type} onValueChange={v => setForm(f => ({ ...f, record_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{recordTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Copies</Label><Input type="number" min="1" value={form.copies_requested} onChange={e => setForm(f => ({ ...f, copies_requested: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>County</Label><Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>State</Label><Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Agency Fee ($)</Label><Input type="number" value={form.agency_fee} onChange={e => setForm(f => ({ ...f, agency_fee: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Service Fee ($)</Label><Input type="number" value={form.service_fee} onChange={e => setForm(f => ({ ...f, service_fee: e.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
