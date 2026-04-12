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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Search, Loader2, Eye, FileText, CheckCircle } from "lucide-react";
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
        .in("service_type", FORMATION_TYPES.map(t => t.value))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createOrder = useMutation({
    mutationFn: async (order: any) => {
      const { error } = await supabase.from("service_requests").insert({
        ...order,
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
    if (search && !o.description?.toLowerCase().includes(search.toLowerCase()) && !o.service_type?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: orders.length,
    active: orders.filter((o: any) => !["completed", "rejected"].includes(o.status)).length,
    completed: orders.filter((o: any) => o.status === "completed").length,
  };

  return (
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
                  <TableCell className="font-medium">{FORMATION_TYPES.find(t => t.value === o.service_type)?.label || o.service_type}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{o.description || "—"}</TableCell>
                  <TableCell><Badge className={statusColors[o.status] || ""}>{o.status?.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{o.priority || "normal"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Business Formation Filing</DialogTitle></DialogHeader>
          <NewFormationForm onSubmit={(data: any) => createOrder.mutate(data)} loading={createOrder.isPending} onCancel={() => setShowNew(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewFormationForm({ onSubmit, loading, onCancel }: any) {
  const [form, setForm] = useState({ service_type: "llc", description: "", priority: "normal" });
  return (
    <div className="space-y-3">
      <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{FORMATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea placeholder="Entity name, state, special instructions..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading || !form.description.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Create
        </Button>
      </DialogFooter>
    </div>
  );
}
