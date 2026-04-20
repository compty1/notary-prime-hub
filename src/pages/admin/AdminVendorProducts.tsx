import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Package, Plus, Search, Sparkles, Loader2, DollarSign, TrendingUp, Box, RefreshCw,
  Edit, Trash2, Zap, BarChart3
} from "lucide-react";
import { format } from "date-fns";

const PRODUCT_TYPES = ["physical", "digital", "service", "bundle", "subscription"];

interface ProductForm {
  vendor_id: string;
  product_name: string;
  product_type: string;
  sku: string;
  description: string;
  base_cost: string;
  retail_price: string;
  turnaround_days: string;
  min_order_qty: string;
  tags: string;
  is_active: boolean;
}

const EMPTY_FORM: ProductForm = {
  vendor_id: "", product_name: "", product_type: "physical", sku: "",
  description: "", base_cost: "", retail_price: "", turnaround_days: "3",
  min_order_qty: "1", tags: "", is_active: true,
};

export default function AdminVendorProducts() {
  usePageMeta({ title: "Vendor Products | Admin", noIndex: true });
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["vendor-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (vals: ProductForm) => {
      const baseCost = parseFloat(vals.base_cost) || 0;
      const retailPrice = parseFloat(vals.retail_price) || 0;
      const margin = retailPrice > 0 ? ((retailPrice - baseCost) / retailPrice) * 100 : 0;
      const payload = {
        vendor_id: vals.vendor_id,
        product_name: vals.product_name,
        product_type: vals.product_type,
        sku: vals.sku || null,
        description: vals.description || null,
        base_cost: baseCost,
        retail_price: retailPrice,
        margin_percent: Math.round(margin * 100) / 100,
        turnaround_days: parseInt(vals.turnaround_days) || 3,
        min_order_qty: parseInt(vals.min_order_qty) || 1,
        tags: vals.tags ? vals.tags.split(",").map(t => t.trim()) : [],
        is_active: vals.is_active,
      };
      if (editId) {
        const { error } = await supabase.from("vendor_products").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vendor_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: editId ? "Product updated" : "Product added" });
      setShowDialog(false);
      setEditId(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: "Product deleted" });
    },
  });

  const enrichProduct = async (productId: string) => {
    setEnrichingId(productId);
    try {
      const product = products.find((p: any) => p.id === productId);
      if (!product) return;
      const vendor = vendors.find((v: any) => v.id === product.vendor_id);
      const { data, error } = await supabase.functions.invoke("vendor-product-enrich", {
        body: {
          product_id: productId,
          product_name: product.product_name,
          product_type: product.product_type,
          vendor_name: vendor?.name || "Unknown",
          description: product.description || "",
        },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: "Product enriched", description: "AI has enhanced product details" });
    } catch (e: any) {
      toast({ title: "Enrichment failed", description: e.message, variant: "destructive" });
    } finally {
      setEnrichingId(null);
    }
  };

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      vendor_id: p.vendor_id, product_name: p.product_name, product_type: p.product_type,
      sku: p.sku || "", description: p.description || "",
      base_cost: p.base_cost?.toString() || "", retail_price: p.retail_price?.toString() || "",
      turnaround_days: p.turnaround_days?.toString() || "3",
      min_order_qty: p.min_order_qty?.toString() || "1",
      tags: (p.tags || []).join(", "), is_active: p.is_active,
    });
    setShowDialog(true);
  };

  const openNew = () => { setEditId(null); setForm(EMPTY_FORM); setShowDialog(true); };

  const filtered = products.filter((p: any) =>
    (typeFilter === "all" || p.product_type === typeFilter) &&
    (!search || p.product_name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const getVendorName = (vid: string) => vendors.find((v: any) => v.id === vid)?.name || "—";

  const totalRetail = products.reduce((s: number, p: any) => s + (p.retail_price || 0), 0);
  const avgMargin = products.length
    ? products.reduce((s: number, p: any) => s + (p.margin_percent || 0), 0) / products.length
    : 0;
  const enrichedCount = products.filter((p: any) => p.enriched_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Vendor Product Catalog
          </h1>
          <p className="text-sm text-muted-foreground">Manage vendor products with AI-powered enrichment</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><Box className="h-5 w-5 text-primary mb-1" /><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">Total Products</p></CardContent></Card>
        <Card><CardContent className="pt-4"><DollarSign className="h-5 w-5 text-green-600 mb-1" /><p className="text-2xl font-bold">${totalRetail.toFixed(0)}</p><p className="text-xs text-muted-foreground">Total Retail Value</p></CardContent></Card>
        <Card><CardContent className="pt-4"><TrendingUp className="h-5 w-5 text-blue-600 mb-1" /><p className="text-2xl font-bold">{avgMargin.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Avg Margin</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Sparkles className="h-5 w-5 text-amber-500 mb-1" /><p className="text-2xl font-bold">{enrichedCount}</p><p className="text-xs text-muted-foreground">AI Enriched</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products or SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No products found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cost / Retail</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Enriched</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{p.product_name}</p>
                        {p.sku && <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{getVendorName(p.vendor_id)}</TableCell>
                    <TableCell><Badge variant="outline">{p.product_type}</Badge></TableCell>
                    <TableCell className="text-sm">
                      ${(p.base_cost || 0).toFixed(2)} / ${(p.retail_price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        (p.margin_percent || 0) >= 40 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                        (p.margin_percent || 0) >= 20 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }>
                        {(p.margin_percent || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.enriched_at ? (
                        <Badge className="bg-primary/10 text-primary"><Sparkles className="h-3 w-3 mr-1" />Yes</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => enrichProduct(p.id)}
                          disabled={enrichingId === p.id}
                          title="AI Enrich"
                        >
                          {enrichingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-amber-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> openEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> deleteMutation.mutate(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Enrichment Preview Panel */}
      {products.some((p: any) => p.enriched_at) && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Recently Enriched</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {products.filter((p: any) => p.enriched_at).slice(0, 4).map((p: any) => (
                <div key={p.id} className="rounded-lg border p-4 space-y-2">
                  <p className="font-medium">{p.product_name}</p>
                  {p.enrichment_data?.enhanced_description && (
                    <p className="text-sm text-muted-foreground">{p.enrichment_data.enhanced_description}</p>
                  )}
                  {p.enrichment_data?.keywords && (
                    <div className="flex flex-wrap gap-1">
                      {(p.enrichment_data.keywords as string[]).slice(0, 5).map((kw: string) => (
                        <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Enriched {format(new Date(p.enriched_at), "MMM d, yyyy")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label>Vendor *</Label>
              <Select value={form.vendor_id} onValueChange={v => setForm(f => ({ ...f, vendor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Name *</Label>
              <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.product_type} onValueChange={v => setForm(f => ({ ...f, product_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRODUCT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. NTR-SEAL-001" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Base Cost ($)</Label><Input type="number" step="0.01" value={form.base_cost} onChange={e => setForm(f => ({ ...f, base_cost: e.target.value }))} /></div>
              <div><Label>Retail Price ($)</Label><Input type="number" step="0.01" value={form.retail_price} onChange={e => setForm(f => ({ ...f, retail_price: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Turnaround (days)</Label><Input type="number" value={form.turnaround_days} onChange={e => setForm(f => ({ ...f, turnaround_days: e.target.value }))} /></div>
              <div><Label>Min Order Qty</Label><Input type="number" value={form.min_order_qty} onChange={e => setForm(f => ({ ...f, min_order_qty: e.target.value }))} /></div>
            </div>
            <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="notary, seal, stamp" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={() => upsertMutation.mutate(form)}
              disabled={upsertMutation.isPending || !form.vendor_id || !form.product_name}
            >
              {upsertMutation.isPending ? "Saving..." : editId ? "Update" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
