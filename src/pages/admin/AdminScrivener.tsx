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
import { PenLine, Plus, Search, Loader2, AlertTriangle } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", typing: "bg-blue-100 text-blue-800", review: "bg-purple-100 text-purple-800", completed: "bg-emerald-100 text-emerald-800" };

export default function AdminScrivener() {
  usePageMeta({ title: "Scrivener / Form Typing", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ form_type: "court_form", form_name: "", court_jurisdiction: "", page_count: "1", fee: "25", upl_acknowledgment: false, notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("scrivener_jobs").select("*").order("created_at", { ascending: false }).limit(200); if (data) setJobs(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = jobs.filter(j => j.form_name?.toLowerCase().includes(search.toLowerCase()) || j.form_type?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.upl_acknowledgment) { toast({ title: "UPL acknowledgment required", description: "You must acknowledge this is typing only, not legal advice.", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("scrivener_jobs").insert({ form_type: form.form_type, form_name: form.form_name, court_jurisdiction: form.court_jurisdiction, page_count: parseInt(form.page_count) || 1, fee: parseFloat(form.fee) || 0, upl_acknowledgment: form.upl_acknowledgment, notes: form.notes, client_id: user?.id || "" });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Job created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("scrivener_jobs").update({ status } ).eq("id", id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j)); toast({ title: "Updated" });
  };

  return (
    <DashboardEnhancer category="scrivener">
      <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="flex items-center gap-3 py-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-200"><strong>UPL Compliance:</strong> This service provides document typing ONLY. No legal advice, form selection guidance, or content recommendations are permitted.</p>
      </CardContent></Card>
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Scrivener / Form Typing</h1><p className="text-sm text-muted-foreground">UPL-compliant document typing and form completion</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Job</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No jobs found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(j => (
          <Card key={j.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><PenLine className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{j.form_name || j.form_type?.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground">{j.court_jurisdiction ? `${j.court_jurisdiction} • ` : ""}{j.page_count} pages • ${j.fee}</p>
            </div>
            {j.upl_acknowledgment && <Badge variant="outline" className="text-[10px]">UPL ✓</Badge>}
            <Badge className={statusColors[j.status] || ""}>{j.status}</Badge>
            <Select value={j.status} onValueChange={v => updateStatus(j.id, v)}><SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="pending">Pending</SelectItem><SelectItem value="typing">Typing</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="completed">Completed</SelectItem>
            </SelectContent></Select>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Scrivener Job</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Form Type</Label><Select value={form.form_type} onValueChange={v => setForm(f => ({ ...f, form_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="court_form">Court Form</SelectItem><SelectItem value="government_form">Government Form</SelectItem><SelectItem value="application">Application</SelectItem><SelectItem value="petition">Petition</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Court/Jurisdiction</Label><Input value={form.court_jurisdiction} onChange={e => setForm(f => ({ ...f, court_jurisdiction: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Form Name</Label><Input value={form.form_name} onChange={e => setForm(f => ({ ...f, form_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Pages</Label><Input type="number" min="1" value={form.page_count} onChange={e => setForm(f => ({ ...f, page_count: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <Switch checked={form.upl_acknowledgment} onCheckedChange={v => setForm(f => ({ ...f, upl_acknowledgment: v }))} />
            <Label className="text-sm">I confirm this is typing-only — no legal advice provided</Label>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving || !form.upl_acknowledgment}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
