import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  UserCheck, Search, ShieldCheck, FileCheck, Clock, CheckCircle2,
  XCircle, MapPin, Star, AlertTriangle,
} from "lucide-react";

interface ContractorApp {
  id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  location: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  appliedAt: string;
  commissionNda: boolean;
  backgroundCheck: boolean;
  insuranceVerified: boolean;
  notaryCommission: boolean;
}

const MOCK_APPS: ContractorApp[] = [
  { id: "1", name: "Maria Garcia", email: "maria@example.com", phone: "(614) 555-3001", specializations: ["RON", "Loan Signing"], location: "Columbus, OH", status: "pending", appliedAt: "2026-04-10", commissionNda: true, backgroundCheck: false, insuranceVerified: false, notaryCommission: true },
  { id: "2", name: "David Lee", email: "dlee@example.com", phone: "(614) 555-3002", specializations: ["General Notary", "Process Serving"], location: "Dublin, OH", status: "approved", appliedAt: "2026-03-28", commissionNda: true, backgroundCheck: true, insuranceVerified: true, notaryCommission: true },
  { id: "3", name: "Angela Foster", email: "afoster@example.com", phone: "(614) 555-3003", specializations: ["Translation", "Apostille"], location: "Westerville, OH", status: "under_review", appliedAt: "2026-04-05", commissionNda: true, backgroundCheck: true, insuranceVerified: false, notaryCommission: false },
];

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: "bg-warning/20 text-warning", icon: Clock },
  under_review: { color: "bg-info/20 text-info", icon: ShieldCheck },
  approved: { color: "bg-success/20 text-success", icon: CheckCircle2 },
  rejected: { color: "bg-destructive/20 text-destructive", icon: XCircle },
};

export default function AdminContractorRegistration() {
  usePageMeta({ title: "Contractor Registration | Admin", noIndex: true });
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [apps, setApps] = useState<ContractorApp[]>(MOCK_APPS);
  const [selected, setSelected] = useState<ContractorApp | null>(null);

  const filtered = apps.filter(a =>
    !search || `${a.name} ${a.email} ${a.specializations.join(" ")}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a));
    toast({ title: "Contractor approved" });
    setSelected(null);
  };

  const handleReject = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a));
    toast({ title: "Application rejected" });
    setSelected(null);
  };

  const credentialCheck = (app: ContractorApp) => {
    const checks = [
      { label: "NDA Signed", ok: app.commissionNda },
      { label: "Background Check", ok: app.backgroundCheck },
      { label: "E&O Insurance", ok: app.insuranceVerified },
      { label: "Notary Commission", ok: app.notaryCommission },
    ];
    return checks;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Contractor Registration & Credentialing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Review applications, verify credentials, and manage contractor onboarding</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["pending", "under_review", "approved", "rejected"] as const).map(s => {
          const count = apps.filter(a => a.status === s).length;
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <Card key={s}>
              <CardContent className="pt-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground capitalize">{s.replace("_", " ")}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search applications..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credentials</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(app => {
                const checks = credentialCheck(app);
                const passedCount = checks.filter(c => c.ok).length;
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {app.specializations.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm"><MapPin className="h-3 w-3 inline mr-1" />{app.location}</TableCell>
                    <TableCell><Badge className={statusConfig[app.status].color}>{app.status.replace("_", " ")}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {passedCount === checks.length
                          ? <CheckCircle2 className="h-4 w-4 text-success" />
                          : <AlertTriangle className="h-4 w-4 text-warning" />}
                        <span className="text-xs">{passedCount}/{checks.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelected(app)}>Review</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Review Application — {selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-xs text-muted-foreground">Email</Label><p>{selected.email}</p></div>
                <div><Label className="text-xs text-muted-foreground">Phone</Label><p>{selected.phone}</p></div>
                <div><Label className="text-xs text-muted-foreground">Location</Label><p>{selected.location}</p></div>
                <div><Label className="text-xs text-muted-foreground">Applied</Label><p>{selected.appliedAt}</p></div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Specializations</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selected.specializations.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Credential Verification</Label>
                <div className="space-y-2 mt-2">
                  {credentialCheck(selected).map(check => (
                    <div key={check.label} className="flex items-center gap-2">
                      {check.ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                      <span className="text-sm">{check.label}</span>
                      <Badge variant={check.ok ? "default" : "destructive"} className="text-[10px] ml-auto">{check.ok ? "Verified" : "Pending"}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="destructive" onClick={() => handleReject(selected.id)}>Reject</Button>
                <Button onClick={() => handleApprove(selected.id)} disabled={credentialCheck(selected).filter(c => c.ok).length < 3}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
