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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Plus, Search, Loader2, Fingerprint } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", submitted: "bg-blue-100 text-blue-800", processing: "bg-purple-100 text-purple-800", completed: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800" };

export default function AdminBackgroundChecks() {
  usePageMeta({ title: "Background Checks", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject_name: "", check_type: "bci", agency: "", purpose: "", fingerprints_required: false, fee: "40", notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("background_checks").select("*").order("created_at", { ascending: false }).limit(200); if (data) setChecks(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = checks.filter(c => c.subject_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.subject_name.trim()) { toast({ title: "Subject name required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("background_checks").insert({ subject_name: form.subject_name, check_type: form.check_type, agency: form.agency, purpose: form.purpose, fingerprints_required: form.fingerprints_required, fee: parseFloat(form.fee) || 0, notes: form.notes, client_id: user?.id || "" });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Check created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("background_checks").update({ status }).eq("id", id);
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status } : c)); toast({ title: "Updated" });
  };

  return (
    <DashboardEnhancer category="background-check">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Background Checks</h1><p className="text-sm text-muted-foreground">BCI/FBI background check processing</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Check</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No checks found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{c.subject_name}</p>
              <p className="text-xs text-muted-foreground">{c.check_type?.toUpperCase()} {c.agency ? `• ${c.agency}` : ""} {c.purpose ? `• ${c.purpose}` : ""} {c.fee ? `• $${c.fee}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              {c.fingerprints_required && <Badge variant="outline" className="text-[10px] gap-1"><Fingerprint className="h-3 w-3" />FP</Badge>}
              <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
              <Select value={c.status} onValueChange={v => updateStatus(c.id, v)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="pending">Pending</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent></Select>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Background Check</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Subject Name *</Label><Input value={form.subject_name} onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Check Type</Label><Select value={form.check_type} onValueChange={v => setForm(f => ({ ...f, check_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bci">BCI (State)</SelectItem><SelectItem value="fbi">FBI (Federal)</SelectItem><SelectItem value="both">BCI + FBI</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Agency</Label><Input value={form.agency} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Purpose</Label><Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.fingerprints_required} onCheckedChange={v => setForm(f => ({ ...f, fingerprints_required: v }))} /><Label>Fingerprints Required</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
