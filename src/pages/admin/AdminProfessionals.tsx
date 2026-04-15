import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Search, Users, DollarSign, CheckCircle, XCircle, Settings,
  TrendingUp, Shield, Award, Eye, Pencil, Download, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/csvExport";

interface Professional {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  professional_type: string;
  is_published: boolean;
  is_featured: boolean;
  profit_share_enabled: boolean;
  profit_share_percentage: number | null;
  created_at: string;
  email: string | null;
  phone: string | null;
}

interface Enrollment {
  id: string;
  professional_user_id: string;
  service_id: string;
  custom_price_from: number | null;
  custom_price_to: number | null;
  custom_description: string | null;
  is_active: boolean;
  show_on_site: boolean;
  created_at: string;
  service_name?: string;
  professional_name?: string;
}

interface ProfitShareConfig {
  id: string;
  professional_user_id: string;
  service_id: string | null;
  share_percentage: number;
  min_platform_fee: number;
  is_active: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

interface ProfitTransaction {
  id: string;
  professional_user_id: string;
  gross_amount: number;
  platform_fee: number;
  professional_share: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  professional_name?: string;
}

const PROFESSIONAL_TYPES: Record<string, string> = {
  notary: "Notary Public",
  signing_agent: "Signing Agent",
  doc_preparer: "Document Preparer",
  virtual_assistant: "Virtual Assistant",
  mobile_notary: "Mobile Notary",
  other: "Other Professional",
};

export default function AdminProfessionals() {
  usePageMeta({ title: "Admin — Professionals", noIndex: true });
  const { toast } = useToast();
  const [tab, setTab] = useState("professionals");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Data
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [profitConfigs, setProfitConfigs] = useState<ProfitShareConfig[]>([]);
  const [transactions, setTransactions] = useState<ProfitTransaction[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price_from: number | null }[]>([]);

  // Dialogs
  const [editConfig, setEditConfig] = useState<ProfitShareConfig | null>(null);
  const [configDialog, setConfigDialog] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [proRes, enrollRes, configRes, txnRes, svcRes] = await Promise.all([
      supabase.from("notary_pages").select("id, user_id, slug, display_name, professional_type, is_published, is_featured, profit_share_enabled, profit_share_percentage, created_at, email, phone").order("created_at", { ascending: false }),
      supabase.from("professional_service_enrollments").select("*").order("created_at", { ascending: false }),
      supabase.from("profit_share_config").select("*").order("created_at", { ascending: false }),
      supabase.from("profit_share_transactions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("services").select("id, name, price_from").eq("is_active", true),
    ]);
    setProfessionals((proRes.data ?? []));
    setEnrollments((enrollRes.data ?? []));
    setProfitConfigs((configRes.data ?? []));
    setTransactions((txnRes.data ?? []));
    setServices((svcRes.data ?? []));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getServiceName = (id: string | null) => services.find(s => s.id === id)?.name || "All Services";
  const getProfName = (userId: string) => professionals.find(p => p.user_id === userId)?.display_name || userId.slice(0, 8);

  // Toggle published
  const togglePublished = async (pro: Professional) => {
    await supabase.from("notary_pages").update({ is_published: !pro.is_published } ).eq("id", pro.id);
    setProfessionals(prev => prev.map(p => p.id === pro.id ? { ...p, is_published: !p.is_published } : p));
    toast({ title: `Page ${!pro.is_published ? "published" : "unpublished"}` });
  };

  // Toggle featured
  const toggleFeatured = async (pro: Professional) => {
    await supabase.from("notary_pages").update({ is_featured: !pro.is_featured } ).eq("id", pro.id);
    setProfessionals(prev => prev.map(p => p.id === pro.id ? { ...p, is_featured: !p.is_featured } : p));
    toast({ title: `Featured status updated` });
  };

  // Toggle profit share
  const toggleProfitShare = async (pro: Professional) => {
    await supabase.from("notary_pages").update({ profit_share_enabled: !pro.profit_share_enabled } ).eq("id", pro.id);
    setProfessionals(prev => prev.map(p => p.id === pro.id ? { ...p, profit_share_enabled: !p.profit_share_enabled } : p));
    toast({ title: `Profit share ${!pro.profit_share_enabled ? "enabled" : "disabled"}` });
  };

  // Approve/reject enrollment
  const toggleEnrollment = async (enrollment: Enrollment) => {
    await supabase.from("professional_service_enrollments").update({ is_active: !enrollment.is_active } ).eq("id", enrollment.id);
    setEnrollments(prev => prev.map(e => e.id === enrollment.id ? { ...e, is_active: !e.is_active } : e));
    toast({ title: `Enrollment ${!enrollment.is_active ? "approved" : "deactivated"}` });
  };

  // Save profit config
  const saveConfig = async () => {
    if (!editConfig) return;
    const payload = {
      share_percentage: editConfig.share_percentage,
      min_platform_fee: editConfig.min_platform_fee,
      is_active: editConfig.is_active,
    };
    if (editConfig.id) {
      await supabase.from("profit_share_config").update(payload ).eq("id", editConfig.id);
    } else {
      await supabase.from("profit_share_config").insert({
        ...payload,
        professional_user_id: editConfig.professional_user_id,
        service_id: editConfig.service_id,
      });
    }
    setConfigDialog(false);
    fetchAll();
    toast({ title: "Profit share config saved" });
  };

  // Mark transaction as paid
  const markPaid = async (txn: ProfitTransaction) => {
    await supabase.from("profit_share_transactions").update({ status: "paid", paid_at: new Date().toISOString() } ).eq("id", txn.id);
    setTransactions(prev => prev.map(t => t.id === txn.id ? { ...t, status: "paid", paid_at: new Date().toISOString() } : t));
    toast({ title: "Marked as paid" });
  };

  // Export transactions
  const exportTransactions = () => {
    const cols = [
      { key: "Professional" as const, label: "Professional" },
      { key: "Gross" as const, label: "Gross" },
      { key: "PlatformFee" as const, label: "Platform Fee" },
      { key: "ProShare" as const, label: "Professional Share" },
      { key: "Status" as const, label: "Status" },
      { key: "Date" as const, label: "Date" },
      { key: "PaidAt" as const, label: "Paid At" },
    ];
    const rows = transactions.map(t => ({
      Professional: getProfName(t.professional_user_id),
      Gross: t.gross_amount,
      PlatformFee: t.platform_fee,
      ProShare: t.professional_share,
      Status: t.status,
      Date: t.created_at,
      PaidAt: t.paid_at || "",
    }));
    exportToCSV(rows, cols, "profit-share-transactions");
    toast({ title: "Exported" });
  };

  const filteredPros = professionals.filter(p =>
    p.display_name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalPending = transactions.filter(t => t.status === "pending").reduce((s, t) => s + t.professional_share, 0);
  const totalPaid = transactions.filter(t => t.status === "paid").reduce((s, t) => s + t.professional_share, 0);
  const totalPlatformFees = transactions.reduce((s, t) => s + t.platform_fee, 0);
  const pendingEnrollments = enrollments.filter(e => !e.is_active).length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Professional Management</h1>
          <p className="text-sm text-muted-foreground">Manage professionals, enrollments, profit sharing, and payouts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6 text-center">
          <Users className="mx-auto h-5 w-5 text-primary mb-1" />
          <p className="text-2xl font-bold">{professionals.length}</p>
          <p className="text-xs text-muted-foreground">Professionals</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <AlertTriangle className="mx-auto h-5 w-5 text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{pendingEnrollments}</p>
          <p className="text-xs text-muted-foreground">Pending Enrollments</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <DollarSign className="mx-auto h-5 w-5 text-success mb-1" />
          <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Paid Out</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <TrendingUp className="mx-auto h-5 w-5 text-info mb-1" />
          <p className="text-2xl font-bold">${totalPlatformFees.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Platform Revenue</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="professionals">Professionals</TabsTrigger>
          <TabsTrigger value="enrollments">
            Enrollments {pendingEnrollments > 0 && <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{pendingEnrollments}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="profit-config">Profit Share Config</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* PROFESSIONALS TAB */}
        <TabsContent value="professionals" className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search professionals..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Profit Share</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPros.map(pro => (
                  <TableRow key={pro.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pro.display_name}</p>
                        <p className="text-xs text-muted-foreground">/n/{pro.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{PROFESSIONAL_TYPES[pro.professional_type] || pro.professional_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={pro.is_published} onCheckedChange={() => togglePublished(pro)} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={pro.is_featured} onCheckedChange={() => toggleFeatured(pro)} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={pro.profit_share_enabled} onCheckedChange={() => toggleProfitShare(pro)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/n/${pro.slug}`, "_blank")}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditConfig({
                            id: "",
                            professional_user_id: pro.user_id,
                            service_id: null,
                            share_percentage: pro.profit_share_percentage || 70,
                            min_platform_fee: 5,
                            is_active: true,
                            approved_by: null,
                            approved_at: null,
                            created_at: "",
                          });
                          setConfigDialog(true);
                        }}><Settings className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPros.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No professionals found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ENROLLMENTS TAB */}
        <TabsContent value="enrollments" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professional</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Custom Price</TableHead>
                  <TableHead>Show on Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map(enr => (
                  <TableRow key={enr.id}>
                    <TableCell className="font-medium">{getProfName(enr.professional_user_id)}</TableCell>
                    <TableCell>{getServiceName(enr.service_id)}</TableCell>
                    <TableCell>
                      {enr.custom_price_from != null ? `$${enr.custom_price_from}${enr.custom_price_to ? ` - $${enr.custom_price_to}` : ""}` : "Platform default"}
                    </TableCell>
                    <TableCell>{enr.show_on_site ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>
                      <Badge variant={enr.is_active ? "default" : "secondary"}>{enr.is_active ? "Active" : "Pending"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant={enr.is_active ? "outline" : "default"} size="sm" onClick={() => toggleEnrollment(enr)}>
                        {enr.is_active ? "Deactivate" : "Approve"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {enrollments.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No enrollments yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* PROFIT CONFIG TAB */}
        <TabsContent value="profit-config" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Configure profit share percentages per professional and service. Default: 70% professional / 30% platform.</p>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professional</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Share %</TableHead>
                  <TableHead>Min Platform Fee</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitConfigs.map(cfg => (
                  <TableRow key={cfg.id}>
                    <TableCell className="font-medium">{getProfName(cfg.professional_user_id)}</TableCell>
                    <TableCell>{getServiceName(cfg.service_id)}</TableCell>
                    <TableCell><Badge>{cfg.share_percentage}%</Badge></TableCell>
                    <TableCell>${cfg.min_platform_fee.toFixed(2)}</TableCell>
                    <TableCell>{cfg.is_active ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { setEditConfig(cfg); setConfigDialog(true); }}><Pencil className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {profitConfigs.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No custom configs — defaults apply (70/30 split)</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* PAYOUTS TAB */}
        <TabsContent value="payouts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Card className="px-4 py-2"><p className="text-xs text-muted-foreground">Pending</p><p className="text-lg font-bold text-amber-600">${totalPending.toFixed(2)}</p></Card>
              <Card className="px-4 py-2"><p className="text-xs text-muted-foreground">Paid</p><p className="text-lg font-bold text-success">${totalPaid.toFixed(2)}</p></Card>
            </div>
            <Button variant="outline" size="sm" onClick={exportTransactions} className="gap-1"><Download className="h-3 w-3" /> Export CSV</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Professional</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Platform Fee</TableHead>
                  <TableHead>Pro Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(txn => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-sm">{format(new Date(txn.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium">{getProfName(txn.professional_user_id)}</TableCell>
                    <TableCell>${txn.gross_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">${txn.platform_fee.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-success">${txn.professional_share.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={txn.status === "paid" ? "default" : txn.status === "disputed" ? "destructive" : "secondary"}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {txn.status === "pending" && (
                        <Button size="sm" onClick={() => markPaid(txn)}>Mark Paid</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No transactions yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Profit Config Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editConfig?.id ? "Edit" : "Create"} Profit Share Config</DialogTitle>
          </DialogHeader>
          {editConfig && (
            <div className="space-y-4">
              <div>
                <Label>Professional</Label>
                <p className="text-sm font-medium">{getProfName(editConfig.professional_user_id)}</p>
              </div>
              <div>
                <Label>Service</Label>
                <Select value={editConfig.service_id || "all"} onValueChange={v => setEditConfig({ ...editConfig, service_id: v === "all" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services (Default)</SelectItem>
                    {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Professional Share (%)</Label>
                <Input type="number" min={0} max={95} value={editConfig.share_percentage} onChange={e => setEditConfig({ ...editConfig, share_percentage: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">Platform keeps {100 - editConfig.share_percentage}%</p>
              </div>
              <div>
                <Label>Minimum Platform Fee ($)</Label>
                <Input type="number" min={0} step={0.01} value={editConfig.min_platform_fee} onChange={e => setEditConfig({ ...editConfig, min_platform_fee: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">Platform always keeps at least this amount per transaction</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editConfig.is_active} onCheckedChange={v => setEditConfig({ ...editConfig, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(false)}>Cancel</Button>
            <Button onClick={saveConfig}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
