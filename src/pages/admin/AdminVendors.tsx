import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, Star, Clock, TrendingUp, Edit, Trash2 } from "lucide-react";

const TIERS = ["white_label", "co_branded", "referral", "production"];

export default function AdminVendors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "", contact_name: "", contact_email: "", contact_phone: "", website_url: "", partnership_tier: "production", notes: "", specialties: "" });

  const { data: vendors = [], isLoading } = useQuery({ queryKey: ["vendors"], queryFn: async () => { const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });

  const upsertMutation = useMutation({
    mutationFn: async (vals: typeof form) => {
      const payload = { name: vals.name, location: vals.location, contact_name: vals.contact_name, contact_email: vals.contact_email, contact_phone: vals.contact_phone, website_url: vals.website_url, partnership_tier: vals.partnership_tier, notes: vals.notes, specialties: vals.specialties ? vals.specialties.split(",").map(s => s.trim()) : [] };
      if (editId) { const { error } = await supabase.from("vendors").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("vendors").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vendors"] }); toast({ title: editId ? "Vendor updated" : "Vendor added" }); setShowAdd(false); setEditId(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("vendors").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vendors"] }); toast({ title: "Vendor deleted" }); },
  });

  const openEdit = (v: any) => { setEditId(v.id); setForm({ name: v.name, location: v.location || "", contact_name: v.contact_name || "", contact_email: v.contact_email || "", contact_phone: v.contact_phone || "", website_url: v.website_url || "", partnership_tier: v.partnership_tier, notes: v.notes || "", specialties: (v.specialties || []).join(", ") }); setShowAdd(true); };
  const tierColor: Record<string, string> = { white_label: "bg-primary/20 text-primary", co_branded: "bg-info/20 text-info", referral: "bg-warning/20 text-warning", production: "bg-muted text-muted-foreground" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Building2 className="h-6 w-6 text-primary" /><h2 className="text-2xl font-bold text-foreground">Vendor Management</h2></div><Button onClick={() => { setEditId(null); setForm({ name: "", location: "", contact_name: "", contact_email: "", contact_phone: "", website_url: "", partnership_tier: "production", notes: "", specialties: "" }); setShowAdd(true); }}><Plus className="h-4 w-4 mr-1" />Add Vendor</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{vendors.length}</p><p className="text-xs text-muted-foreground">Total Vendors</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Star className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{vendors.filter((v: any) => Number(v.quality_score) >= 4.5).length}</p><p className="text-xs text-muted-foreground">Top Rated</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-info" /><div><p className="text-2xl font-bold">{vendors.length > 0 ? (vendors.reduce((a: number, v: any) => a + Number(v.avg_turnaround_days || 5), 0) / vendors.length).toFixed(1) : "—"}</p><p className="text-xs text-muted-foreground">Avg Turnaround</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-success" /><div><p className="text-2xl font-bold">${vendors.reduce((a: number, v: any) => a + Number(v.total_revenue || 0), 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div></div></CardContent></Card>
      </div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Tier</TableHead><TableHead>Contact</TableHead><TableHead>Quality</TableHead><TableHead>On-Time</TableHead><TableHead>Orders</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader><TableBody>
        {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> : vendors.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No vendors yet</TableCell></TableRow> : vendors.map((v: any) => (
          <TableRow key={v.id}><TableCell><div><p className="font-medium">{v.name}</p><p className="text-xs text-muted-foreground">{v.location}</p></div></TableCell><TableCell><Badge className={tierColor[v.partnership_tier] || ""}>{v.partnership_tier.replace("_", " ")}</Badge></TableCell><TableCell><p className="text-sm">{v.contact_name}</p><p className="text-xs text-muted-foreground">{v.contact_email}</p></TableCell><TableCell><span className="font-medium">{Number(v.quality_score).toFixed(1)}</span>/5</TableCell><TableCell>{Number(v.on_time_rate).toFixed(0)}%</TableCell><TableCell>{v.total_orders}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(v)} aria-label="Action"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(v.id)} aria-label="Action"><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell></TableRow>
        ))}</TableBody></Table></CardContent></Card>
      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editId ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader><div className="space-y-4">
        <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div><div><Label>Partnership Tier</Label><Select value={form.partnership_tier} onValueChange={v => setForm(f => ({ ...f, partnership_tier: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Contact Name</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div><div><Label>Contact Email</Label><Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Phone</Label><Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div><div><Label>Website</Label><Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} /></div></div>
        <div><Label>Specialties (comma-separated)</Label><Input value={form.specialties} onChange={e => setForm(f => ({ ...f, specialties: e.target.value }))} /></div>
        <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={() => upsertMutation.mutate(form)} disabled={!form.name || upsertMutation.isPending}>{editId ? "Update" : "Add"} Vendor</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
