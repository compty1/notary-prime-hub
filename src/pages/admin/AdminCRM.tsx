import { useState, useEffect, useMemo, useCallback } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { format, differenceInDays, addDays } from "date-fns";
import { Link } from "react-router-dom";
import {
  Plus, Search, Phone, Mail, Calendar, FileText, DollarSign,
  ArrowRight, User, Building2, Target, TrendingUp, Clock,
  MessageSquare, BarChart3, Users, Briefcase, AlertTriangle,
  Download, ArrowUpDown, ExternalLink, RefreshCw
} from "lucide-react";

// CRM-004: Unified pipeline stages (matching Lead Portal's 7 stages)
const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "bg-muted" },
  { key: "contacted", label: "Contacted", color: "bg-info/20" },
  { key: "qualified", label: "Qualified", color: "bg-primary/40" },
  { key: "proposal", label: "Proposal", color: "bg-warning/20" },
  { key: "negotiation", label: "Negotiation", color: "bg-warning/20" },
  { key: "closed-won", label: "Closed Won", color: "bg-success/20" },
  { key: "closed-lost", label: "Closed Lost", color: "bg-destructive/20" },
];

const LEAD_STAGES = ["new", "contacted", "qualified", "proposal", "converted", "closed-won", "closed-lost"];

const ACTIVITY_TYPES = [
  { key: "note", label: "Note", icon: FileText },
  { key: "call", label: "Call", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
  { key: "meeting", label: "Meeting", icon: Calendar },
  { key: "task", label: "Task", icon: Target },
  { key: "status_change", label: "Status Change", icon: ArrowUpDown },
];

type Deal = {
  id: string;
  contact_id: string | null;
  lead_id: string | null;
  title: string;
  value: number | null;
  stage: string;
  expected_close: string | null;
  assigned_to: string | null;
  notes: string | null;
  probability?: number;
  created_at: string;
  updated_at: string;
};

type Activity = {
  id: string;
  contact_type: string;
  contact_id: string;
  activity_type: string;
  subject: string | null;
  body: string | null;
  created_by: string | null;
  created_at: string;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  status: string;
  source: string;
  service_needed: string | null;
  intent_score: string | null;
  lead_type: string;
  city: string | null;
  state: string | null;
  created_at: string;
};

// CRM-005: Deal probability by stage
const STAGE_PROBABILITY: Record<string, number> = {
  new: 10, contacted: 20, qualified: 40, proposal: 60,
  negotiation: 75, "closed-won": 100, "closed-lost": 0,
};

export default function AdminCRM() {
  usePageMeta({ title: "CRM", noIndex: true });
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("pipeline");
  const [search, setSearch] = useState("");
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 50;

  // Fetch leads
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["crm-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  // Fetch deals
  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["crm-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Deal[];
    },
  });

  // CRM-001: Fetch activities with pagination
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["crm-activities", activityPage],
    queryFn: async () => {
      const from = activityPage * ACTIVITY_PAGE_SIZE;
      const to = from + ACTIVITY_PAGE_SIZE - 1;
      const { data, error } = await supabase.from("crm_activities").select("*").order("created_at", { ascending: false }).range(from, to);
      if (error) throw error;
      return (data ?? []) as Activity[];
    },
  });

  // CRM-003: Fetch profiles for unified contacts view
  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ["crm-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email, phone, city, state, created_at").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  // Fetch appointments for context
  const { data: appointments = [] } = useQuery({
    queryKey: ["crm-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("id, client_id, service_type, scheduled_date, status, created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Mutations
  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-leads"] }); toast({ title: "Lead updated" }); },
  });

  const createDeal = useMutation({
    mutationFn: async (deal: Partial<Deal>) => {
      const { error } = await supabase.from("deals").insert({
        title: deal.title ?? "Untitled",
        stage: deal.stage ?? "new",
        contact_id: deal.contact_id ?? null,
        lead_id: deal.lead_id ?? null,
        value: deal.value ?? null,
        expected_close: deal.expected_close ?? null,
        assigned_to: deal.assigned_to ?? null,
        notes: deal.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-deals"] }); toast({ title: "Deal created" }); },
  });

  const updateDealStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from("deals").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-deals"] }),
  });

  const addActivity = useMutation({
    mutationFn: async (activity: Partial<Activity>) => {
      const { error } = await supabase.from("crm_activities").insert({
        contact_id: activity.contact_id ?? "",
        contact_type: activity.contact_type ?? "client",
        activity_type: activity.activity_type ?? "note",
        subject: activity.subject ?? null,
        body: activity.body ?? null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-activities"] }); toast({ title: "Activity logged" }); },
  });

  // Pipeline stats
  const pipelineStats = useMemo(() => {
    const byStage: Record<string, Lead[]> = {};
    LEAD_STAGES.forEach(s => { byStage[s] = leads.filter(l => l.status === s); });
    return byStage;
  }, [leads]);

  const dealsByStage = useMemo(() => {
    const result: Record<string, Deal[]> = {};
    PIPELINE_STAGES.forEach(s => { result[s.key] = deals.filter(d => d.stage === s.key); });
    return result;
  }, [deals]);

  // CRM-005: Weighted pipeline value (value × probability)
  const totalPipelineValue = deals.filter(d => !["closed-lost", "closed-won"].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedPipelineValue = deals.filter(d => !["closed-lost", "closed-won"].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0) * ((STAGE_PROBABILITY[d.stage] ?? 50) / 100), 0);
  const wonValue = deals.filter(d => d.stage === "closed-won").reduce((sum, d) => sum + (d.value || 0), 0);
  const lostValue = deals.filter(d => d.stage === "closed-lost").reduce((sum, d) => sum + (d.value || 0), 0);
  const winRate = deals.filter(d => ["closed-won", "closed-lost"].includes(d.stage)).length > 0
    ? Math.round((deals.filter(d => d.stage === "closed-won").length / deals.filter(d => ["closed-won", "closed-lost"].includes(d.stage)).length) * 100)
    : 0;

  // CRM-003: Unified contacts search across leads and profiles
  const unifiedContacts = useMemo(() => {
    const contactMap = new Map<string, { id: string; name: string; email: string; phone: string; type: string; status: string; source: string; city: string; state: string; created: string }>();

    leads.forEach(l => {
      contactMap.set(`lead-${l.id}`, {
        id: l.id, name: l.name || l.business_name || "Unnamed",
        email: l.email || "", phone: l.phone || "",
        type: l.lead_type === "business" ? "Business Lead" : "Lead",
        status: l.status, source: l.source,
        city: l.city || "", state: l.state || "",
        created: l.created_at,
      });
    });

    profiles.forEach(p => {
      // Avoid duplicating leads that became clients
      const existingLead = leads.find(l => l.email && l.email === p.email);
      if (!existingLead) {
        contactMap.set(`profile-${p.user_id}`, {
          id: p.user_id, name: p.full_name || "Unnamed",
          email: p.email || "", phone: p.phone || "",
          type: "Client", status: "active", source: "registration",
          city: p.city || "", state: p.state || "",
          created: p.created_at,
        });
      }
    });

    return Array.from(contactMap.values());
  }, [leads, profiles]);

  const filteredContacts = unifiedContacts.filter(c =>
    !search || [c.name, c.email, c.phone, c.city].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  // CRM-006: Deal aging alerts
  const agingDeals = useMemo(() => {
    return deals.filter(d => {
      if (["closed-won", "closed-lost"].includes(d.stage)) return false;
      const daysOld = differenceInDays(new Date(), new Date(d.created_at));
      return daysOld > 30;
    });
  }, [deals]);

  // CRM-012: Export
  const exportCRM = useCallback(() => {
    const headers = ["Name", "Email", "Phone", "Type", "Status", "Source", "City", "State", "Created"];
    const rows = filteredContacts.map(c => [c.name, c.email, c.phone, c.type, c.status, c.source, c.city, c.state, c.created].map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(a.href);
  }, [filteredContacts]);

  // New deal form state
  const [newDeal, setNewDeal] = useState({ title: "", value: "", lead_id: "", stage: "qualified", expected_close: "" });
  const [showNewDeal, setShowNewDeal] = useState(false);

  // Activity form state
  const [newActivity, setNewActivity] = useState({ contact_type: "lead", contact_id: "", activity_type: "note", subject: "", body: "" });
  const [showNewActivity, setShowNewActivity] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-sm text-muted-foreground">Unified lead, deal, and contact management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/leads">
            <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-4 w-4" /> Lead Portal</Button>
          </Link>
          <Dialog open={showNewDeal} onOpenChange={setShowNewDeal}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Deal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={newDeal.title} onChange={e => setNewDeal(p => ({ ...p, title: e.target.value }))} placeholder="Deal title" /></div>
                <div><Label>Value ($)</Label><Input type="number" min="0" step="0.01" value={newDeal.value} onChange={e => setNewDeal(p => ({ ...p, value: e.target.value }))} placeholder="0.00" /></div>
                <div>
                  <Label>Link to Lead</Label>
                  <Select value={newDeal.lead_id} onValueChange={v => setNewDeal(p => ({ ...p, lead_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select lead (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No lead</SelectItem>
                      {leads.slice(0, 50).map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name || l.email || l.phone || "Unnamed"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stage</Label>
                  <Select value={newDeal.stage} onValueChange={v => setNewDeal(p => ({ ...p, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Expected Close</Label><Input type="date" value={newDeal.expected_close} onChange={e => setNewDeal(p => ({ ...p, expected_close: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => {
                  createDeal.mutate({
                    title: newDeal.title || "Untitled Deal",
                    value: Math.max(0, parseFloat(newDeal.value) || 0),
                    lead_id: newDeal.lead_id === "none" ? null : newDeal.lead_id || null,
                    stage: newDeal.stage,
                    expected_close: newDeal.expected_close || null,
                  });
                  setShowNewDeal(false);
                  setNewDeal({ title: "", value: "", lead_id: "", stage: "qualified", expected_close: "" });
                }}>Create Deal</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showNewActivity} onOpenChange={setShowNewActivity}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><MessageSquare className="mr-1 h-4 w-4" /> Log Activity</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Type</Label>
                  <Select value={newActivity.activity_type} onValueChange={v => setNewActivity(p => ({ ...p, activity_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact</Label>
                  <Select value={newActivity.contact_id} onValueChange={v => setNewActivity(p => ({ ...p, contact_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                    <SelectContent>
                      {leads.slice(0, 30).map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name || l.email || "Unnamed Lead"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Subject</Label><Input value={newActivity.subject} onChange={e => setNewActivity(p => ({ ...p, subject: e.target.value }))} /></div>
                <div><Label>Notes</Label><Textarea value={newActivity.body} onChange={e => setNewActivity(p => ({ ...p, body: e.target.value }))} rows={3} /></div>
                <Button className="w-full" onClick={() => {
                  if (!newActivity.contact_id) { toast({ title: "Select a contact", variant: "destructive" }); return; }
                  addActivity.mutate({
                    contact_type: "lead",
                    contact_id: newActivity.contact_id,
                    activity_type: newActivity.activity_type,
                    subject: newActivity.subject || null,
                    body: newActivity.body || null,
                  });
                  setShowNewActivity(false);
                  setNewActivity({ contact_type: "lead", contact_id: "", activity_type: "note", subject: "", body: "" });
                }}>Log Activity</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CRM-006: Aging deal alerts */}
      {agingDeals.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-3 p-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{agingDeals.length} deal{agingDeals.length > 1 ? "s" : ""} aging ({">"}30 days without close)</p>
              <p className="text-xs text-muted-foreground">{agingDeals.map(d => d.title).join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced KPI Cards — CRM-005, CRM-007, CRM-008 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4" /><span className="text-xs">Leads</span></div>
          <p className="mt-1 text-2xl font-bold">{leads.length}</p>
          <p className="text-[10px] text-muted-foreground">{leads.filter(l => l.status === "new").length} new</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span className="text-xs">Contacts</span></div>
          <p className="mt-1 text-2xl font-bold">{unifiedContacts.length}</p>
          <p className="text-[10px] text-muted-foreground">{profiles.length} clients + {leads.length} leads</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /><span className="text-xs">Open Deals</span></div>
          <p className="mt-1 text-2xl font-bold">{deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /><span className="text-xs">Pipeline</span></div>
          <p className="mt-1 text-2xl font-bold">${totalPipelineValue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">~${Math.round(weightedPipelineValue).toLocaleString()} weighted</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /><span className="text-xs">Won</span></div>
          <p className="mt-1 text-2xl font-bold text-success">${wonValue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{winRate}% win rate</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-4 w-4" /><span className="text-xs">Activities</span></div>
          <p className="mt-1 text-2xl font-bold">{activities.length}</p>
          <p className="text-[10px] text-muted-foreground">this period</p>
        </CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* PIPELINE TAB — Lead Kanban */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {LEAD_STAGES.map(stage => (
              <Card key={stage} className="min-h-[200px]">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                    {stage.replace("-", " ")}
                    <Badge variant="secondary" className="text-[10px]">{pipelineStats[stage]?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] space-y-2 overflow-y-auto p-2">
                  {(pipelineStats[stage] || []).slice(0, 20).map(lead => (
                    <div key={lead.id} className="rounded-md border bg-card p-2 text-xs shadow-sm hover:shadow transition-shadow">
                      <p className="font-medium truncate">{lead.name || lead.email || "Unnamed"}</p>
                      {lead.service_needed && <p className="text-muted-foreground truncate">{lead.service_needed}</p>}
                      <div className="mt-1 flex gap-1">
                        {stage !== "closed-won" && stage !== "closed-lost" && (
                          <Select value={lead.status} onValueChange={v => updateLeadStatus.mutate({ id: lead.id, status: v })}>
                            <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {LEAD_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CRM-003: UNIFIED CONTACTS TAB */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search all contacts (leads + clients)..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button size="sm" variant="outline" onClick={exportCRM}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.slice(0, 100).map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell className="text-xs">{contact.email || "—"}</TableCell>
                    <TableCell className="text-xs">{contact.phone || "—"}</TableCell>
                    <TableCell><Badge variant={contact.type === "Client" ? "default" : "outline"} className="text-[10px]">{contact.type}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{contact.status}</Badge></TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{contact.source}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{[contact.city, contact.state].filter(Boolean).join(", ") || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(contact.created), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
                {filteredContacts.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No contacts found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            {filteredContacts.length > 100 && (
              <div className="p-3 text-center text-xs text-muted-foreground border-t">Showing 100 of {filteredContacts.length} contacts. Use search to narrow results.</div>
            )}
          </Card>
        </TabsContent>

        {/* CRM-015: DEALS TAB with pipeline value visualization */}
        <TabsContent value="deals" className="space-y-4">
          {/* CRM-015: Pipeline value bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Pipeline Value Distribution</span>
                <span className="text-xs text-muted-foreground ml-auto">${totalPipelineValue.toLocaleString()} total</span>
              </div>
              <div className="flex h-6 rounded-full overflow-hidden bg-muted">
                {PIPELINE_STAGES.filter(s => !["closed-lost"].includes(s.key)).map(stage => {
                  const stageValue = (dealsByStage[stage.key] || []).reduce((s, d) => s + (d.value || 0), 0);
                  const pct = totalPipelineValue > 0 ? (stageValue / totalPipelineValue) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div key={stage.key} className={`${stage.color} flex items-center justify-center text-[9px] font-medium transition-all`} style={{ width: `${pct}%` }} title={`${stage.label}: $${stageValue.toLocaleString()}`}>
                      {pct > 10 ? `${stage.label}` : ""}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {PIPELINE_STAGES.map(stage => (
              <Card key={stage.key} className="min-h-[180px]">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase">
                    <span className={`h-2 w-2 rounded-full ${stage.color} border`} />
                    {stage.label}
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      ${(dealsByStage[stage.key] || []).reduce((s, d) => s + (d.value || 0), 0).toLocaleString()}
                    </Badge>
                  </CardTitle>
                  <p className="text-[10px] text-muted-foreground">{STAGE_PROBABILITY[stage.key]}% probability</p>
                </CardHeader>
                <CardContent className="max-h-[350px] space-y-2 overflow-y-auto p-2">
                  {(dealsByStage[stage.key] || []).map(deal => {
                    const daysInStage = differenceInDays(new Date(), new Date(deal.updated_at || deal.created_at));
                    return (
                      <div key={deal.id} className="rounded-md border bg-card p-2 text-xs shadow-sm">
                        <p className="font-medium truncate">{deal.title || "Untitled"}</p>
                        <p className="text-muted-foreground">${(deal.value || 0).toLocaleString()}</p>
                        {deal.expected_close && <p className="text-muted-foreground">Close: {format(new Date(deal.expected_close), "MMM d")}</p>}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-[10px] ${daysInStage > 30 ? "text-destructive" : "text-muted-foreground"}`}>{daysInStage}d</span>
                        </div>
                        <Select value={deal.stage} onValueChange={v => updateDealStage.mutate({ id: deal.id, stage: v })}>
                          <SelectTrigger className="mt-1 h-6 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                  {(!dealsByStage[stage.key] || dealsByStage[stage.key].length === 0) && (
                    <p className="text-center text-[10px] text-muted-foreground py-4">No deals</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ACTIVITIES TAB — CRM-001: Paginated */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center justify-between">
              Recent Activity
              <Button size="sm" variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["crm-activities"] })}><RefreshCw className="h-4 w-4" /></Button>
            </CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No activities logged yet. Click "Log Activity" to get started.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map(a => {
                    const Icon = ACTIVITY_TYPES.find(t => t.key === a.activity_type)?.icon || FileText;
                    const linkedLead = leads.find(l => l.id === a.contact_id);
                    return (
                      <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="mt-0.5 rounded-full bg-muted p-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{a.subject || a.activity_type}</span>
                            <Badge variant="outline" className="text-[10px]">{a.activity_type}</Badge>
                          </div>
                          {linkedLead && <p className="text-xs text-muted-foreground">Re: {linkedLead.name || linkedLead.email}</p>}
                          {a.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.body}</p>}
                        </div>
                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">{format(new Date(a.created_at), "MMM d, h:mm a")}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* CRM-001: Pagination controls */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t">
                <Button size="sm" variant="outline" disabled={activityPage === 0} onClick={() => setActivityPage(p => p - 1)}>Previous</Button>
                <span className="text-xs text-muted-foreground">Page {activityPage + 1}</span>
                <Button size="sm" variant="outline" disabled={activities.length < ACTIVITY_PAGE_SIZE} onClick={() => setActivityPage(p => p + 1)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM-011: REPORTS TAB — Enhanced analytics */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Lead Sources</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(leads.reduce((acc: Record<string, number>, l) => {
                  acc[l.source] = (acc[l.source] || 0) + 1;
                  return acc;
                }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm capitalize">{source.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, (count / leads.length) * 100)}%` }} />
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                {LEAD_STAGES.map(stage => {
                  const count = pipelineStats[stage]?.length || 0;
                  const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                  return (
                    <div key={stage} className="flex items-center gap-3 py-1.5">
                      <span className="w-24 text-xs capitalize">{stage.replace("-", " ")}</span>
                      <div className="flex-1 rounded-full bg-muted h-2">
                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Deal Pipeline Summary</CardTitle></CardHeader>
              <CardContent>
                {PIPELINE_STAGES.map(stage => {
                  const stageDeals = dealsByStage[stage.key] || [];
                  const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
                  const weightedValue = stageValue * ((STAGE_PROBABILITY[stage.key] ?? 50) / 100);
                  return (
                    <div key={stage.key} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${stage.color} border`} />
                        <span className="text-sm">{stage.label}</span>
                        <span className="text-[10px] text-muted-foreground">({STAGE_PROBABILITY[stage.key]}%)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">${stageValue.toLocaleString()}</span>
                        <span className="ml-2 text-xs text-muted-foreground">(~${Math.round(weightedValue).toLocaleString()} wtd)</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 mt-2 border-t font-medium">
                  <span className="text-sm">Win Rate</span>
                  <span className="text-sm">{winRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Recent Appointments</CardTitle></CardHeader>
              <CardContent>
                {appointments.slice(0, 8).map(apt => (
                  <div key={apt.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm truncate">{apt.service_type}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={apt.status === "completed" ? "default" : "secondary"} className="text-[10px]">{apt.status}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(apt.scheduled_date), "MMM d")}</span>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No appointments</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
