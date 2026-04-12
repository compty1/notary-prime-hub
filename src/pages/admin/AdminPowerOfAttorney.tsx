import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, Plus, Shield, Scale, Clock, CheckCircle2 } from "lucide-react";

const POA_TYPES = [
  "General Power of Attorney",
  "Limited Power of Attorney",
  "Durable Power of Attorney",
  "Healthcare Power of Attorney",
  "Financial Power of Attorney",
  "Springing Power of Attorney",
];

interface PoaRequest {
  id: string;
  clientName: string;
  poaType: string;
  principalName: string;
  agentName: string;
  status: "draft" | "review" | "notarized" | "delivered";
  createdAt: string;
}

const MOCK_REQUESTS: PoaRequest[] = [
  { id: "1", clientName: "James Wilson", poaType: "Durable Power of Attorney", principalName: "James Wilson", agentName: "Sarah Wilson", status: "notarized", createdAt: "2026-04-08" },
  { id: "2", clientName: "Linda Chen", poaType: "Healthcare Power of Attorney", principalName: "Linda Chen", agentName: "Michael Chen", status: "review", createdAt: "2026-04-11" },
];

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-yellow-500/20 text-yellow-700",
  notarized: "bg-green-500/20 text-green-700",
  delivered: "bg-blue-500/20 text-blue-700",
};

export default function AdminPowerOfAttorney() {
  usePageMeta({ title: "Power of Attorney | Admin", noIndex: true });
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [requests] = useState<PoaRequest[]>(MOCK_REQUESTS);

  const filtered = requests.filter(r =>
    !search || `${r.clientName} ${r.poaType} ${r.principalName} ${r.agentName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" /> Power of Attorney
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage POA document preparation, review, and notarization</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-2" /> New POA</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{requests.length}</div><p className="text-xs text-muted-foreground">Total Requests</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === "notarized").length}</div><p className="text-xs text-muted-foreground">Notarized</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === "review").length}</div><p className="text-xs text-muted-foreground">In Review</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-muted-foreground">{requests.filter(r => r.status === "draft").length}</div><p className="text-xs text-muted-foreground">Drafts</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search POA requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>POA Type</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.clientName}</TableCell>
                  <TableCell className="text-sm">{r.poaType}</TableCell>
                  <TableCell>{r.principalName}</TableCell>
                  <TableCell>{r.agentName}</TableCell>
                  <TableCell><Badge className={statusColors[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-sm">{r.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Power of Attorney</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Client Name</Label><Input placeholder="Full legal name" /></div>
            <div>
              <Label>POA Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{POA_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Principal Name</Label><Input placeholder="Person granting power" /></div>
            <div><Label>Agent Name</Label><Input placeholder="Person receiving power" /></div>
            <div><Label>Powers Granted</Label><Textarea placeholder="Describe the specific powers being granted..." /></div>
            <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3 flex items-start gap-2">
              <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-700">Ohio Revised Code §1337.12: This document will require notarization. The principal must sign in the presence of a notary public.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "POA request created" }); setShowNew(false); }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
