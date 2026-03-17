import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Plus, Search, Loader2, Calendar, Building2, User, Star, ArrowRight, Download, Upload, ExternalLink, Pencil, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const intentColors: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-blue-100 text-blue-800",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  qualified: "bg-purple-100 text-purple-800",
  converted: "bg-emerald-100 text-emerald-800",
  closed: "bg-muted text-muted-foreground",
};

const pipelineStatuses = ["new", "contacted", "qualified", "converted", "closed"];
const leadTypes = ["all", "individual", "business"];

const emptyLead = {
  name: "", phone: "", email: "", business_name: "", address: "", city: "", state: "OH", zip: "",
  lead_type: "individual", service_needed: "", intent_score: "medium", source: "manual", source_url: "", notes: "",
};

export default function AdminLeadPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIntent, setFilterIntent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [form, setForm] = useState(emptyLead);
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const filtered = leads.filter((l) => {
    if (filterIntent !== "all" && l.intent_score !== filterIntent) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (l.name || "").toLowerCase().includes(term) ||
        (l.business_name || "").toLowerCase().includes(term) ||
        (l.email || "").toLowerCase().includes(term) ||
        (l.phone || "").includes(term) ||
        (l.city || "").toLowerCase().includes(term);
    }
    return true;
  });

  const openCreate = () => { setEditingLead(null); setForm(emptyLead); setShowCreate(true); };
  const openEdit = (lead: any) => {
    setEditingLead(lead);
    setForm({
      name: lead.name || "", phone: lead.phone || "", email: lead.email || "",
      business_name: lead.business_name || "", address: lead.address || "",
      city: lead.city || "", state: lead.state || "OH", zip: lead.zip || "",
      lead_type: lead.lead_type || "individual", service_needed: lead.service_needed || "",
      intent_score: lead.intent_score || "medium", source: lead.source || "manual",
      source_url: lead.source_url || "", notes: lead.notes || "",
    });
    setShowCreate(true);
  };

  const saveLead = async () => {
    if (!form.name && !form.business_name) {
      toast({ title: "Name or business required", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editingLead) {
      const { error } = await supabase.from("leads").update(form as any).eq("id", editingLead.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Lead updated" });
    } else {
      const { error } = await supabase.from("leads").insert(form as any);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Lead added" });
    }
    setSaving(false);
    setShowCreate(false);
    fetchLeads();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({
      status,
      ...(status === "contacted" ? { contacted_at: new Date().toISOString() } : {}),
    } as any).eq("id", id);
    toast({ title: `Lead → ${status}` });
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    toast({ title: "Lead deleted" });
    fetchLeads();
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Business", "City", "State", "Service", "Intent", "Status", "Source"];
    const rows = filtered.map((l) => [l.name, l.phone, l.email, l.business_name, l.city, l.state, l.service_needed, l.intent_score, l.status, l.source]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v: string) => `"${(v || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").slice(1);
    let imported = 0;
    for (const line of lines) {
      const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      if (cols.length < 2 || (!cols[0] && !cols[3])) continue;
      await supabase.from("leads").insert({
        name: cols[0] || null, phone: cols[1] || null, email: cols[2] || null,
        business_name: cols[3] || null, city: cols[4] || null, state: cols[5] || "OH",
        service_needed: cols[6] || null, intent_score: cols[7] || "medium",
        status: "new", source: "csv_import",
      } as any);
      imported++;
    }
    toast({ title: `Imported ${imported} leads` });
    fetchLeads();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    converted: leads.filter((l) => l.status === "converted").length,
    highIntent: leads.filter((l) => l.intent_score === "high").length,
  };

  const discoverLeads = async () => {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-leads", {
        body: { action: "discover" },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Discovery issue", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "AI Discovery Complete", description: `Found ${data.found} leads, inserted ${data.inserted} new ones.` });
        fetchLeads();
      }
    } catch (e: any) {
      toast({ title: "Discovery error", description: e.message, variant: "destructive" });
    }
    setDiscovering(false);
  };

  const enrichLeads = async () => {
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-leads", {
        body: { action: "enrich" },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Enrichment issue", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Enrichment Complete", description: `Enriched ${data.enriched} leads with outreach tips.` });
        fetchLeads();
      }
    } catch (e: any) {
      toast({ title: "Enrichment error", description: e.message, variant: "destructive" });
    }
    setEnriching(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Lead Portal</h1>
          <p className="text-sm text-muted-foreground">Ohio notarization leads — discover, manage, convert</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={discoverLeads} disabled={discovering}>
            {discovering ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
            AI Discover
          </Button>
          <Button variant="outline" size="sm" onClick={enrichLeads} disabled={enriching}>
            {enriching ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
            Enrich Leads
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="mr-1 h-3 w-3" /> Import CSV</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-3 w-3" /> Export</Button>
          <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-gold-dark"><Plus className="mr-1 h-4 w-4" /> Add Lead</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          { label: "Total", value: stats.total },
          { label: "New", value: stats.new },
          { label: "Contacted", value: stats.contacted },
          { label: "Qualified", value: stats.qualified },
          { label: "Converted", value: stats.converted },
          { label: "High Intent", value: stats.highIntent },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search leads..." className="pl-9" />
        </div>
        <Select value={filterIntent} onValueChange={setFilterIntent}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Intent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {pipelineStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-8 text-center text-muted-foreground">No leads found. Add your first lead or import a CSV.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((lead) => (
                <Card key={lead.id} className="border-border/50">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => openEdit(lead)}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                        {lead.lead_type === "business" ? <Building2 className="h-5 w-5 text-accent" /> : <User className="h-5 w-5 text-accent" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.name || lead.business_name || "Unknown"}</p>
                        {lead.business_name && lead.name && <p className="text-xs text-muted-foreground">{lead.business_name}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {lead.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.city}, {lead.state}</span>}
                          {lead.service_needed && <span>{lead.service_needed}</span>}
                          {lead.source && lead.source !== "manual" && <Badge variant="outline" className="text-[10px]">{lead.source}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`}>
                          <Button size="sm" variant="outline" className="text-xs"><Phone className="mr-1 h-3 w-3" />{lead.phone}</Button>
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`}>
                          <Button size="sm" variant="ghost" className="text-xs"><Mail className="h-3 w-3" /></Button>
                        </a>
                      )}
                      <Link to={`/admin/appointments?newLead=${lead.name || lead.business_name}`}>
                        <Button size="sm" variant="outline" className="text-xs"><Calendar className="mr-1 h-3 w-3" /> Schedule</Button>
                      </Link>
                      <Badge className={intentColors[lead.intent_score]}>{lead.intent_score}</Badge>
                      <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {pipelineStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteLead(lead.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-5 gap-3">
            {pipelineStatuses.map((status) => {
              const pipeLeads = leads.filter((l) => l.status === status);
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold capitalize">{status}</h3>
                    <Badge variant="outline" className="text-xs">{pipeLeads.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {pipeLeads.map((lead) => (
                      <Card key={lead.id} className="border-border/50 cursor-pointer hover:shadow-sm" onClick={() => openEdit(lead)}>
                        <CardContent className="p-3">
                          <p className="text-xs font-medium truncate">{lead.name || lead.business_name}</p>
                          {lead.phone && <p className="text-[10px] text-muted-foreground mt-1">{lead.phone}</p>}
                          <Badge className={`${intentColors[lead.intent_score]} text-[10px] mt-1`}>{lead.intent_score}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" /></div>
              <div><Label>Business Name</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(614) 555-1234" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} /></div>
              <div><Label>Zip</Label><Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.lead_type} onValueChange={(v) => setForm({ ...form, lead_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intent</Label>
                <Select value={form.intent_score} onValueChange={(v) => setForm({ ...form, intent_score: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Service Needed</Label><Input value={form.service_needed} onChange={(e) => setForm({ ...form, service_needed: e.target.value })} placeholder="Notarization" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="manual, referral, google..." /></div>
              <div><Label>Source URL</Label><Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={saveLead} disabled={saving} className="bg-accent text-accent-foreground hover:bg-gold-dark">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              {editingLead ? "Update" : "Add Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
