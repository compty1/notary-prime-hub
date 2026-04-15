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
import { Fingerprint, Plus, Search, Loader2 } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const statusColors: Record<string, string> = { scheduled: "bg-blue-100 text-blue-800", in_progress: "bg-purple-100 text-purple-800", completed: "bg-emerald-100 text-emerald-800", cancelled: "bg-red-100 text-red-800" };

export default function AdminFingerprinting() {
  usePageMeta({ title: "Fingerprinting Sessions", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  interface FingerprintSession { id: string; session_type: string; card_type: string; card_count: number; agency_destination: string | null; reason: string | null; fee: number | null; status: string; created_at: string; client_id: string; notes: string | null; }
  const [sessions, setSessions] = useState<FingerprintSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ session_type: "ink", card_type: "FD-258", card_count: "1", agency_destination: "", reason: "", fee: "25", notes: "" });

  const fetch = async () => { const { data } = await supabase.from("fingerprint_sessions").select("*").order("created_at", { ascending: false }).limit(200); if (data) setSessions(data); setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const filtered = sessions.filter(s => s.agency_destination?.toLowerCase().includes(search.toLowerCase()) || s.reason?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await supabase.from("fingerprint_sessions").insert({ ...form, card_count: parseInt(form.card_count) || 1, fee: parseFloat(form.fee) || 0, client_id: user?.id || "" });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Session created" }); setCreateOpen(false); fetch();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("fingerprint_sessions").update({ status }).eq("id", id);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s)); toast({ title: "Updated" });
  };

  return (
    <DashboardEnhancer category="verification">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Fingerprinting Sessions</h1><p className="text-sm text-muted-foreground">FD-258 ink & live scan session management</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> New Session</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No sessions found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(s => (
          <Card key={s.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Fingerprint className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{s.agency_destination || s.reason || "Session"}</p>
              <p className="text-xs text-muted-foreground">{s.session_type} • {s.card_type} • {s.card_count} card(s) {s.fee ? `• $${s.fee}` : ""}</p>
            </div>
            <Badge className={statusColors[s.status] || ""}>{s.status}</Badge>
            <Select value={s.status} onValueChange={v => updateStatus(s.id, v)}><SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent></Select>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>New Fingerprint Session</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Type</Label><Select value={form.session_type} onValueChange={v => setForm(f => ({ ...f, session_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ink">Ink</SelectItem><SelectItem value="live_scan">Live Scan</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Card Type</Label><Input value={form.card_type} onChange={e => setForm(f => ({ ...f, card_type: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Card Count</Label><Input type="number" min="1" value={form.card_count} onChange={e => setForm(f => ({ ...f, card_count: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} /></div>
          </div>
          <div className="grid gap-2"><Label>Agency Destination</Label><Input value={form.agency_destination} onChange={e => setForm(f => ({ ...f, agency_destination: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Reason</Label><Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
          <div className="grid gap-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
