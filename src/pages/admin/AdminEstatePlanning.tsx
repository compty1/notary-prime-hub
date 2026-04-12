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
import { ScrollText, Plus, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";

const DOC_TYPES = [
  { value: "last_will", label: "Last Will & Testament" },
  { value: "living_will", label: "Living Will" },
  { value: "poa_financial", label: "Financial Power of Attorney" },
  { value: "poa_healthcare", label: "Healthcare Power of Attorney" },
  { value: "trust_revocable", label: "Revocable Living Trust" },
  { value: "trust_irrevocable", label: "Irrevocable Trust" },
  { value: "beneficiary_deed", label: "Beneficiary Deed" },
  { value: "tod_designation", label: "Transfer on Death Designation" },
  { value: "hipaa_release", label: "HIPAA Authorization" },
  { value: "guardianship", label: "Guardianship Nomination" },
];

const STATUSES = ["intake", "questionnaire", "drafting", "review", "signing", "notarized", "filed"] as const;

export default function AdminEstatePlanning() {
  usePageMeta({ title: "Estate Planning — Admin", noIndex: true });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["estate-planning"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .in("service_name", DOC_TYPES.map(d => d.value) as unknown as string[])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createRequest = useMutation({
    mutationFn: async (req: any) => {
      const { error } = await supabase.from("service_requests").insert({
        service_name: req.service_type,
        notes: req.description,
        status: "intake",
        client_id: req.client_id || "00000000-0000-0000-0000-000000000000",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estate-planning"] });
      setShowNew(false);
      toast({ title: "Estate planning request created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = requests.filter((r: any) =>
    !search || r.notes?.toLowerCase().includes(search.toLowerCase()) || r.service_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" /> Estate Planning
          </h1>
          <p className="text-sm text-muted-foreground">Will, trust, POA & advance directive preparation</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1"><Plus className="h-4 w-4" /> New Request</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{requests.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-primary">{requests.filter((r: any) => !["notarized", "filed"].includes(r.status)).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-bold text-green-600">{requests.filter((r: any) => ["notarized", "filed"].includes(r.status)).length}</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search estate planning requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No estate planning requests found.</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{DOC_TYPES.find(d => d.value === r.service_name)?.label || r.service_name}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{r.notes || "—"}</TableCell>
                  <TableCell><Badge>{r.status?.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Estate Planning Request</DialogTitle></DialogHeader>
          <NewEstateForm onSubmit={(d: any) => createRequest.mutate(d)} loading={createRequest.isPending} onCancel={() => setShowNew(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewEstateForm({ onSubmit, loading, onCancel }: any) {
  const [form, setForm] = useState({ service_type: "last_will", description: "" });
  return (
    <div className="space-y-3">
      <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{DOC_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea placeholder="Client details, special instructions..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} disabled={loading || !form.description.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Create
        </Button>
      </DialogFooter>
    </div>
  );
}
