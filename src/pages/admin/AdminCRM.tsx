import { useState, useEffect, useMemo } from "react";
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
import { format } from "date-fns";
import {
  Plus, Search, Phone, Mail, Calendar, FileText, DollarSign,
  ArrowRight, User, Building2, Target, TrendingUp, Clock,
  MessageSquare, BarChart3, Users, Briefcase
} from "lucide-react";

const PIPELINE_STAGES = [
  { key: "discovery", label: "Discovery", color: "bg-blue-500" },
  { key: "proposal", label: "Proposal", color: "bg-yellow-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { key: "closed-won", label: "Closed Won", color: "bg-green-500" },
  { key: "closed-lost", label: "Closed Lost", color: "bg-red-500" },
];

const LEAD_STAGES = ["new", "contacted", "qualified", "proposal", "converted", "closed-won", "closed-lost"];

const ACTIVITY_TYPES = [
  { key: "note", label: "Note", icon: FileText },
  { key: "call", label: "Call", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
  { key: "meeting", label: "Meeting", icon: Calendar },
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

export default function AdminCRM() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("pipeline");
  const [search, setSearch] = useState("");

  // Fetch leads
  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch deals
  const { data: deals = [] } = useQuery({
    queryKey: ["crm-deals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });

  // Fetch activities
  const { data: activities = [] } = useQuery({
    queryKey: ["crm-activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_activities").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data as Activity[];
    },
  });

  // Fetch profiles (contacts/clients)
  const { data: profiles = [] } = useQuery({
    queryKey: ["crm-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email, phone, city, state, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch appointments for activity context
  const { data: appointments = [] } = useQuery({
    queryKey: ["crm-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("id, client_id, service_type, scheduled_date, status, created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from("deals").insert(deal as any);
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
      const { error } = await supabase.from("crm_activities").insert({ ...activity, created_by: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-activities"] }); toast({ title: "Activity logged" }); },
  });

  // Pipeline stats
  const pipelineStats = useMemo(() => {
    const byStage: Record<string, typeof leads> = {};
    LEAD_STAGES.forEach(s => { byStage[s] = leads.filter(l => l.status === s); });
    return byStage;
  }, [leads]);

  const dealsByStage = useMemo(() => {
    const result: Record<string, Deal[]> = {};
    PIPELINE_STAGES.forEach(s => { result[s.key] = deals.filter(d => d.stage === s.key); });
    return result;
  }, [deals]);

  const totalPipelineValue = deals.filter(d => !["closed-lost"].includes(d.stage)).reduce((sum, d) => sum + (d.value || 0), 0);
  const wonValue = deals.filter(d => d.stage === "closed-won").reduce((sum, d) => sum + (d.value || 0), 0);

  const filteredLeads = leads.filter(l =>
    !search || [l.name, l.email, l.phone, l.business_name].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  // New deal form state
  const [newDeal, setNewDeal] = useState({ title: "", value: "", lead_id: "", stage: "discovery" });
  const [showNewDeal, setShowNewDeal] = useState(false);

  // Activity form state
  const [newActivity, setNewActivity] = useState({ contact_type: "lead", contact_id: "", activity_type: "note", subject: "", body: "" });
  const [showNewActivity, setShowNewActivity] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-sm text-muted-foreground">Manage leads, deals, contacts, and activities</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewDeal} onOpenChange={setShowNewDeal}>
            <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Deal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Deal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={newDeal.title} onChange={e => setNewDeal(p => ({ ...p, title: e.target.value }))} placeholder="Deal title" /></div>
                <div><Label>Value ($)</Label><Input type="number" value={newDeal.value} onChange={e => setNewDeal(p => ({ ...p, value: e.target.value }))} placeholder="0.00" /></div>
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
                <Button className="w-full" onClick={() => {
                  createDeal.mutate({
                    title: newDeal.title || "Untitled Deal",
                    value: parseFloat(newDeal.value) || 0,
                    lead_id: newDeal.lead_id === "none" ? null : newDeal.lead_id || null,
                    stage: newDeal.stage,
                  });
                  setShowNewDeal(false);
                  setNewDeal({ title: "", value: "", lead_id: "", stage: "discovery" });
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Target className="h-4 w-4" /><span className="text-xs">Total Leads</span></div>
            <p className="mt-1 text-2xl font-bold">{leads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /><span className="text-xs">Open Deals</span></div>
            <p className="mt-1 text-2xl font-bold">{deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /><span className="text-xs">Pipeline Value</span></div>
            <p className="mt-1 text-2xl font-bold">${totalPipelineValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /><span className="text-xs">Won Revenue</span></div>
            <p className="mt-1 text-2xl font-bold text-green-600">${wonValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
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
                    <div key={lead.id} className="rounded-md border bg-card p-2 text-xs shadow-sm">
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

        {/* CONTACTS TAB */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search contacts, leads, businesses..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
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
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.slice(0, 50).map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name || "—"}</TableCell>
                    <TableCell>{lead.email || "—"}</TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{lead.lead_type}</Badge></TableCell>
                    <TableCell>
                      <Select value={lead.status} onValueChange={v => updateLeadStatus.mutate({ id: lead.id, status: v })}>
                        <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LEAD_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{lead.source}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(lead.created_at), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No contacts found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* DEALS TAB */}
        <TabsContent value="deals" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {PIPELINE_STAGES.map(stage => (
              <Card key={stage.key} className="min-h-[180px]">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase">
                    <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                    {stage.label}
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      ${(dealsByStage[stage.key] || []).reduce((s, d) => s + (d.value || 0), 0).toLocaleString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[350px] space-y-2 overflow-y-auto p-2">
                  {(dealsByStage[stage.key] || []).map(deal => (
                    <div key={deal.id} className="rounded-md border bg-card p-2 text-xs shadow-sm">
                      <p className="font-medium truncate">{deal.title || "Untitled"}</p>
                      <p className="text-muted-foreground">${(deal.value || 0).toLocaleString()}</p>
                      {deal.expected_close && <p className="text-muted-foreground">Close: {format(new Date(deal.expected_close), "MMM d")}</p>}
                      <Select value={deal.stage} onValueChange={v => updateDealStage.mutate({ id: deal.id, stage: v })}>
                        <SelectTrigger className="mt-1 h-6 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PIPELINE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {(!dealsByStage[stage.key] || dealsByStage[stage.key].length === 0) && (
                    <p className="text-center text-[10px] text-muted-foreground py-4">No deals</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ACTIVITIES TAB */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No activities logged yet. Click "Log Activity" to get started.</p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 50).map(a => {
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
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
                    <Badge variant="secondary">{count as number}</Badge>
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
                      <span className="w-12 text-right text-xs text-muted-foreground">{count} ({pct}%)</span>
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
                  return (
                    <div key={stage.key} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                        <span className="text-sm">{stage.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">${stageValue.toLocaleString()}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({stageDeals.length})</span>
                      </div>
                    </div>
                  );
                })}
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
