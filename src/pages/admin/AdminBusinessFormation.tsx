import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Plus, Search, Loader2, Eye, FileText, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const FORMATION_TYPES = [
  { value: "llc", label: "LLC Formation" },
  { value: "corp", label: "Corporation" },
  { value: "dba", label: "DBA / Trade Name" },
  { value: "ein", label: "EIN Registration" },
  { value: "registered_agent", label: "Registered Agent" },
  { value: "operating_agreement", label: "Operating Agreement" },
  { value: "annual_report", label: "Annual Report Filing" },
  { value: "amendment", label: "Articles Amendment" },
  { value: "dissolution", label: "Business Dissolution" },
  { value: "reinstatement", label: "Reinstatement" },
];

const STATUSES = ["intake", "document_prep", "filing", "pending_state", "approved", "completed", "rejected"] as const;

const statusColors: Record<string, string> = {
  intake: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  document_prep: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  filing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  pending_state: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const WIZARD_STEPS = [
  { title: "Entity Type", description: "Select the type of business entity" },
  { title: "Business Details", description: "Name, address, and key information" },
  { title: "Documents", description: "Required documents checklist" },
  { title: "Filing Info", description: "EIN, registered agent, and state filing" },
  { title: "Review & Submit", description: "Confirm and submit the filing" },
];

const ENTITY_DOCS: Record<string, string[]> = {
  llc: ["Articles of Organization", "Operating Agreement", "EIN Application (SS-4)", "BOI Report (FinCEN)"],
  corp: ["Articles of Incorporation", "Bylaws", "Organizational Minutes", "EIN Application (SS-4)", "BOI Report"],
  dba: ["DBA Registration Form", "Affidavit of Trade Name", "County Filing"],
  ein: ["SS-4 Form", "Responsible Party ID"],
  registered_agent: ["Agent Acceptance Form", "Business Address Verification"],
  operating_agreement: ["Operating Agreement Draft", "Member List"],
  annual_report: ["Ohio SOS Annual Report Form", "Current Officers List"],
  amendment: ["Certificate of Amendment", "Board Resolution"],
  dissolution: ["Certificate of Dissolution", "Final Tax Clearance", "Board Resolution"],
  reinstatement: ["Application for Reinstatement", "Tax Delinquency Clearance"],
};

export default function AdminBusinessFormation() {
  usePageMeta({ title: "Business Formation — Admin", noIndex: true });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["formation-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .in("service_name", FORMATION_TYPES.map(t => t.value) as unknown as string[])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createOrder = useMutation({
    mutationFn: async (order: any) => {
      const { error } = await supabase.from("service_requests").insert({
        service_name: order.service_type,
        notes: order.description,
        priority: order.priority,
        status: "intake",
        client_id: order.client_id || "00000000-0000-0000-0000-000000000000",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formation-orders"] });
      setShowNew(false);
      toast({ title: "Formation order created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = orders.filter((o: any) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.notes?.toLowerCase().includes(search.toLowerCase()) && !o.service_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: orders.length,
    active: orders.filter((o: any) => !["completed", "rejected"].includes(o.status)).length,
    completed: orders.filter((o: any) => o.status === "completed").length,
  };

  return (
    <DashboardEnhancer category="business">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Business Formation
          </h1>
          <p className="text-sm text-muted-foreground">LLC, Corporation, DBA, EIN & registered agent services</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1"><Plus className="h-4 w-4" /> New Filing</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Filings</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold text-primary">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-bold text-green-600">{stats.completed}</p></CardContent></Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search filings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No formation filings found.</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{FORMATION_TYPES.find(t => t.value === o.service_name)?.label || o.service_name}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{o.notes || "—"}</TableCell>
                  <TableCell><Badge className={statusColors[o.status] || ""}>{o.status?.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{o.priority || "normal"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showNew} onOpenChange={o => { setShowNew(o); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Business Formation — Step-by-Step Wizard</DialogTitle></DialogHeader>
          <FormationWizard onSubmit={(data: any) => createOrder.mutate(data)} loading={createOrder.isPending} onCancel={() => setShowNew(false)} />
        </DialogContent>
      </Dialog>
    </div>
    </DashboardEnhancer>
  );
}

function FormationWizard({ onSubmit, loading, onCancel }: { onSubmit: (data: any) => void; loading: boolean; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    service_type: "llc", entity_name: "", state: "OH", address: "",
    organizer_name: "", organizer_email: "", priority: "normal",
    ein_needed: true, registered_agent_needed: true,
    checked_docs: [] as string[], notes: "",
  });

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const docs = ENTITY_DOCS[form.service_type] || [];
  const toggleDoc = (d: string) => {
    setForm(f => ({
      ...f,
      checked_docs: f.checked_docs.includes(d) ? f.checked_docs.filter(x => x !== d) : [...f.checked_docs, d],
    }));
  };

  const progress = ((step + 1) / WIZARD_STEPS.length) * 100;

  const canAdvance = () => {
    if (step === 0) return !!form.service_type;
    if (step === 1) return !!form.entity_name.trim();
    return true;
  };

  const handleSubmit = () => {
    const desc = [
      `Entity: ${form.entity_name}`,
      `Type: ${FORMATION_TYPES.find(t => t.value === form.service_type)?.label}`,
      `State: ${form.state}`,
      form.address && `Address: ${form.address}`,
      form.organizer_name && `Organizer: ${form.organizer_name} (${form.organizer_email})`,
      form.ein_needed && "EIN: Requested",
      form.registered_agent_needed && "Registered Agent: Needed",
      form.notes && `Notes: ${form.notes}`,
      `Docs Ready: ${form.checked_docs.join(", ") || "None yet"}`,
    ].filter(Boolean).join("\n");

    onSubmit({ service_type: form.service_type, description: desc, priority: form.priority });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        {WIZARD_STEPS.map((s, i) => (
          <div key={i} className={`flex-1 text-center text-xs py-1 rounded ${i === step ? "bg-primary text-primary-foreground font-semibold" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {s.title}
          </div>
        ))}
      </div>
      <Progress value={progress} className="h-1.5" />

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select the type of business entity to form or service needed.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FORMATION_TYPES.map(t => (
              <Card
                key={t.value}
                className={`cursor-pointer transition-all ${form.service_type === t.value ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}
                onClick={() => update("service_type", t.value)}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <Building2 className={`h-4 w-4 ${form.service_type === t.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{t.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Enter the key details for this filing.</p>
          <div><Label>Entity / Business Name *</Label><Input value={form.entity_name} onChange={e => update("entity_name", e.target.value)} placeholder="My Company LLC" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>State</Label><Input value={form.state} onChange={e => update("state", e.target.value)} /></div>
            <div><Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => update("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Business Address</Label><Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St, Columbus, OH 43215" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Organizer Name</Label><Input value={form.organizer_name} onChange={e => update("organizer_name", e.target.value)} /></div>
            <div><Label>Organizer Email</Label><Input type="email" value={form.organizer_email} onChange={e => update("organizer_email", e.target.value)} /></div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Check off documents that are ready or have been prepared.</p>
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d} className="flex items-center gap-2 rounded-lg border p-3">
                <Checkbox checked={form.checked_docs.includes(d)} onCheckedChange={() => toggleDoc(d)} />
                <span className="text-sm">{d}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{form.checked_docs.length}/{docs.length} documents ready</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Additional filing options.</p>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.ein_needed} onCheckedChange={v => update("ein_needed", !!v)} />
            <Label>Request EIN from IRS</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.registered_agent_needed} onCheckedChange={v => update("registered_agent_needed", !!v)} />
            <Label>Need registered agent service</Label>
          </div>
          <div><Label>Additional Notes</Label><Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Any special instructions..." rows={3} /></div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Review your filing details before submission.</p>
          <Card><CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{FORMATION_TYPES.find(t => t.value === form.service_type)?.label}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Entity Name</span><span className="font-medium">{form.entity_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">State</span><span className="font-medium">{form.state}</span></div>
            {form.address && <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{form.address}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge variant="outline">{form.priority}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">EIN</span><span>{form.ein_needed ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Registered Agent</span><span>{form.registered_agent_needed ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Docs Ready</span><span>{form.checked_docs.length}/{docs.length}</span></div>
          </CardContent></Card>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < WIZARD_STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />} Submit Filing
          </Button>
        )}
      </div>
    </div>
  );
}
