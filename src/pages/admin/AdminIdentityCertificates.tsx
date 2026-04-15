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
import { Award, Plus, Search, Loader2, ShieldCheck } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const statusColors: Record<string, string> = { active: "bg-emerald-100 text-emerald-800", expired: "bg-yellow-100 text-yellow-800", revoked: "bg-red-100 text-red-800", pending: "bg-blue-100 text-blue-800" };

export default function AdminIdentityCertificates() {
  usePageMeta({ title: "Identity Certificates", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [certs, setCerts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ issued_to_name: "", certificate_type: "identity", verification_method: "in_person", id_document_type: "", notes: "" });

  const fetchData = async () => { const { data } = await supabase.from("identity_certificates").select("*").order("created_at", { ascending: false }).limit(200); if (data) setCerts(data); setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const filtered = certs.filter(c => c.issued_to_name?.toLowerCase().includes(search.toLowerCase()) || c.certificate_number?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!form.issued_to_name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("identity_certificates").insert({ issued_to_name: form.issued_to_name, certificate_type: form.certificate_type, verification_method: form.verification_method, id_document_type: form.id_document_type, notes: form.notes, client_id: user?.id || "", created_by: user?.id || "" });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Certificate created" }); setCreateOpen(false); fetchData();
  };

  return (
    <DashboardEnhancer category="identity-certificates">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black tracking-tight">Identity Certificates</h1><p className="text-sm text-muted-foreground">Certificate generation, registry & verification</p></div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Issue Certificate</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">No certificates found</CardContent></Card> : (
        <div className="grid gap-4">{filtered.map(c => (
          <Card key={c.id} className="hover:shadow-md transition-shadow"><CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Award className="h-5 w-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{c.issued_to_name}</p>
              <p className="text-xs text-muted-foreground">{c.certificate_number} • {c.certificate_type} • {c.verification_method?.replace(/_/g, " ")}</p>
            </div>
            <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
          </CardContent></Card>
        ))}</div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>Issue Identity Certificate</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Issued To *</Label><Input value={form.issued_to_name} onChange={e => setForm(f => ({ ...f, issued_to_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Type</Label><Select value={form.certificate_type} onValueChange={v => setForm(f => ({ ...f, certificate_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="identity">Identity</SelectItem><SelectItem value="good_standing">Good Standing</SelectItem><SelectItem value="existence">Certificate of Existence</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Verification</Label><Select value={form.verification_method} onValueChange={v => setForm(f => ({ ...f, verification_method: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in_person">In Person</SelectItem><SelectItem value="remote">Remote (RON)</SelectItem><SelectItem value="kba">KBA</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid gap-2"><Label>ID Document Type</Label><Input value={form.id_document_type} onChange={e => setForm(f => ({ ...f, id_document_type: e.target.value }))} placeholder="e.g. Driver's License, Passport" /></div>
          <div className="grid gap-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Issue</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
    </DashboardEnhancer>
  );
}
