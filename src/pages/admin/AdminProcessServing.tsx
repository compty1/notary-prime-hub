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
import { Scale, Plus, Search, Loader2, MapPin, Calendar, Gavel } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", assigned: "bg-blue-100 text-blue-800", attempted: "bg-orange-100 text-orange-800", served: "bg-emerald-100 text-emerald-800", failed: "bg-red-100 text-red-800", affidavit_filed: "bg-purple-100 text-purple-800" };

export default function AdminProcessServing() {
  usePageMeta({ title: "Process Serving", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ respondent_name: "", respondent_address: "", case_number: "", court_name: "", serve_type: "personal", document_description: "", fee: "75", notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("process_serving_cases").select("*").order("created_at", { ascending: false }).limit(200); if (data) setCases(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = cases.filter(c => c.respondent_name?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.respondent_name.trim()) { toast({ title: "Respondent name required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("process_serving_cases").insert({ ...form, fee: parseFloat(form.fee) || 0, client_id: user?.id || "" } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Case created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("process_serving_cases").update({ status } as any).eq("id", id);
    setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c)); toast({ title: "Updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Process Serving</h1><p className="text-sm text-muted-foreground">Case management, attempt tracking & affidavit generation</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Case</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search cases..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No cases found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Scale className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{c.respondent_name}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                {c.case_number && <span className="flex items-center gap-1"><Gavel className="h-3 w-3" />{c.case_number}</span>}
                {c.court_name && <span>{c.court_name}</span>}
                <span>{c.attempts}/{c.max_attempts} attempts</span>
                {c.fee && <span>${c.fee}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.affidavit_filed && <Badge variant="outline" className="text-[10px]">Affidavit ✓</Badge>}
              <Badge className={statusColors[c.status] || ""}>{c.status?.replace(/_/g, " ")}</Badge>
              <Select value={c.status} onValueChange={v => updateStatus(c.id, v)}><SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="pending">Pending</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="attempted">Attempted</SelectItem><SelectItem value="served">Served</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="affidavit_filed">Affidavit Filed</SelectItem>
              </SelectContent></Select>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Process Serving Case</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Respondent Name *</Label><Input value={form.respondent_name} onChange={e => setForm(f => ({ ...f, respondent_name: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Respondent Address</Label><Input value={form.respondent_address} onChange={e => setForm(f => ({ ...f, respondent_address: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Case Number</Label><Input value={form.case_number} onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Court</Label><Input value={form.court_name} onChange={e => setForm(f => ({ ...f, court_name: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Serve Type</Label><Select value={form.serve_type} onValueChange={v => setForm(f => ({ ...f, serve_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="personal">Personal</SelectItem><SelectItem value="substituted">Substituted</SelectItem><SelectItem value="posting">Posting</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Document Description</Label><Textarea value={form.document_description} onChange={e => setForm(f => ({ ...f, document_description: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
