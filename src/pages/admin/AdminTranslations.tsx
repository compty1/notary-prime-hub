import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Languages, Plus, Search, Loader2, FileText, Award } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", assigned: "bg-blue-100 text-blue-800", translating: "bg-purple-100 text-purple-800", review: "bg-cyan-100 text-cyan-800", completed: "bg-emerald-100 text-emerald-800" };

export default function AdminTranslations() {
  usePageMeta({ title: "Translation Requests", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ document_name: "", source_language: "en", target_language: "es", certified: false, page_count: "1", fee: "50", translator_name: "", notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("translation_requests").select("*").order("created_at", { ascending: false }).limit(200); if (data) setRequests(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = requests.filter(r => r.document_name?.toLowerCase().includes(search.toLowerCase()) || r.translator_name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.document_name.trim()) { toast({ title: "Document name required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("translation_requests").insert({ document_name: form.document_name, source_language: form.source_language, target_language: form.target_language, certified: form.certified, page_count: parseInt(form.page_count) || 1, fee: parseFloat(form.fee) || 0, translator_name: form.translator_name, notes: form.notes, client_id: user?.id || "" } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Request created" }); setCreateOpen(false); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("translation_requests").update({ status } as any).eq("id", id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r)); toast({ title: "Updated" });
  };

  return (
    <DashboardEnhancer category="translation">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Translation Requests</h1><p className="text-sm text-muted-foreground">Document translation with certified affidavit support</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Request</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No requests found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(r => (
          <Card key={r.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Languages className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{r.document_name}</p>
              <p className="text-xs text-muted-foreground">{r.source_language} → {r.target_language} • {r.page_count} pages {r.translator_name ? `• ${r.translator_name}` : ""} {r.fee ? `• $${r.fee}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              {r.certified && <Badge variant="outline" className="text-[10px] gap-1"><Award className="h-3 w-3" />Certified</Badge>}
              <Badge className={statusColors[r.status] || ""}>{r.status}</Badge>
              <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="pending">Pending</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="translating">Translating</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="completed">Completed</SelectItem>
              </SelectContent></Select>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Translation Request</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Document Name *</Label><Input value={form.document_name} onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Source Language</Label><Input value={form.source_language} onChange={e => setForm(f => ({ ...f, source_language: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Target Language</Label><Input value={form.target_language} onChange={e => setForm(f => ({ ...f, target_language: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Pages</Label><Input type="number" min="1" value={form.page_count} onChange={e => setForm(f => ({ ...f, page_count: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Translator Name</Label><Input value={form.translator_name} onChange={e => setForm(f => ({ ...f, translator_name: e.target.value }))} /></div>
          <div className="flex items-center gap-3"><Switch checked={form.certified} onCheckedChange={v => setForm(f => ({ ...f, certified: v }))} /><Label>Certified Translation (with affidavit)</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
