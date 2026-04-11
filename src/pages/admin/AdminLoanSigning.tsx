import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileSignature, Plus, Search, Package, Truck, Building2, Loader2, Clock, DollarSign } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";

const packageStatuses = ["pending", "scheduled", "signing", "scanback_pending", "scanback_shipped", "completed", "cancelled"];
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  signing: "bg-purple-100 text-purple-800",
  scanback_pending: "bg-orange-100 text-orange-800",
  scanback_shipped: "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminLoanSigning() {
  usePageMeta({ title: "Loan Signing Packages", noIndex: true });
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [scanbacks, setScanbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title_company: "", lender_name: "", package_type: "purchase", document_count: "1", fee: "150", notes: "" });

  const fetchData = async () => {
    const [{ data: pkgs }, { data: sbs }] = await Promise.all([
      supabase.from("loan_signing_packages").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("scanback_tracking").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (pkgs) setPackages(pkgs);
    if (sbs) setScanbacks(sbs);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await supabase.from("loan_signing_packages").insert({
      title_company: form.title_company,
      lender_name: form.lender_name,
      package_type: form.package_type,
      document_count: parseInt(form.document_count) || 1,
      fee: parseFloat(form.fee) || 0,
      notes: form.notes,
      client_id: "00000000-0000-0000-0000-000000000000",
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Package created" });
    setCreateOpen(false);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("loan_signing_packages").update({ status } as any).eq("id", id);
    setPackages(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast({ title: "Status updated" });
  };

  const filtered = packages.filter(p =>
    p.title_company?.toLowerCase().includes(search.toLowerCase()) ||
    p.lender_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getScanbacksForPackage = (pkgId: string) => scanbacks.filter(s => s.package_id === pkgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Loan Signing Packages</h1>
          <p className="text-sm text-muted-foreground">Manage loan signing packages, scanbacks, and title company relations</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> New Package
        </Button>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages" className="gap-1"><Package className="h-3.5 w-3.5" /> Packages ({packages.length})</TabsTrigger>
          <TabsTrigger value="scanbacks" className="gap-1"><Truck className="h-3.5 w-3.5" /> Scanbacks ({scanbacks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4 mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search packages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No loan signing packages yet</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {filtered.map(pkg => (
                <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileSignature className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{pkg.title_company || "Untitled Package"}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            {pkg.lender_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{pkg.lender_name}</span>}
                            <span>{pkg.document_count} docs</span>
                            {pkg.fee && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${pkg.fee}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[pkg.status] || ""}>{pkg.status?.replace(/_/g, " ")}</Badge>
                        <Select value={pkg.status} onValueChange={v => updateStatus(pkg.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {packageStatuses.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {pkg.scanback_required && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Scanbacks ({getScanbacksForPackage(pkg.id).length})</p>
                        {getScanbacksForPackage(pkg.id).map(sb => (
                          <div key={sb.id} className="flex items-center justify-between text-xs py-1">
                            <span>{sb.document_name}</span>
                            <Badge variant="outline" className="text-[10px]">{sb.scan_status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scanbacks" className="space-y-4 mt-4">
          {scanbacks.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No scanbacks tracked yet</CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {scanbacks.map(sb => (
                <Card key={sb.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-sm">{sb.document_name}</p>
                      <p className="text-xs text-muted-foreground">{sb.page_count ? `${sb.page_count} pages` : ""} {sb.tracking_number ? `• ${sb.shipping_carrier} ${sb.tracking_number}` : ""}</p>
                    </div>
                    <Badge variant="outline">{sb.scan_status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Loan Signing Package</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title Company</Label>
              <Input value={form.title_company} onChange={e => setForm(f => ({ ...f, title_company: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Lender</Label>
              <Input value={form.lender_name} onChange={e => setForm(f => ({ ...f, lender_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Package Type</Label>
                <Select value={form.package_type} onValueChange={v => setForm(f => ({ ...f, package_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="refinance">Refinance</SelectItem>
                    <SelectItem value="heloc">HELOC</SelectItem>
                    <SelectItem value="reverse_mortgage">Reverse Mortgage</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Document Count</Label>
                <Input type="number" min="1" value={form.document_count} onChange={e => setForm(f => ({ ...f, document_count: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Fee ($)</Label>
              <Input type="number" min="0" step="0.01" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
