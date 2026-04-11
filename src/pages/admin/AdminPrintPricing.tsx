import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, Edit, Trash2, TrendingUp } from "lucide-react";

const TIERS = ["basic", "standard", "premium"];

export default function AdminPrintPricing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ product_type: "", tier: "basic", base_price: "", cost_basis: "", margin_target: "", rush_multiplier: "1.50", is_active: true });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["print-pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("print_pricing_rules").select("*").order("product_type");
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (vals: typeof form) => {
      const payload = {
        product_type: vals.product_type, tier: vals.tier, base_price: Number(vals.base_price),
        cost_basis: vals.cost_basis ? Number(vals.cost_basis) : null, margin_target: vals.margin_target ? Number(vals.margin_target) : null,
        rush_multiplier: Number(vals.rush_multiplier), is_active: vals.is_active,
      };
      if (editId) {
        const { error } = await supabase.from("print_pricing_rules").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("print_pricing_rules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["print-pricing-rules"] }); toast({ title: "Pricing rule saved" }); setShowAdd(false); setEditId(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("print_pricing_rules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["print-pricing-rules"] }); toast({ title: "Rule deleted" }); },
  });

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ product_type: r.product_type, tier: r.tier, base_price: String(r.base_price), cost_basis: r.cost_basis ? String(r.cost_basis) : "", margin_target: r.margin_target ? String(r.margin_target) : "", rush_multiplier: String(r.rush_multiplier), is_active: r.is_active });
    setShowAdd(true);
  };

  const tierColor: Record<string, string> = { basic: "bg-muted text-muted-foreground", standard: "bg-blue-500/20 text-blue-700", premium: "bg-amber-500/20 text-amber-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><DollarSign className="h-6 w-6 text-primary" /><h2 className="text-2xl font-bold text-foreground">Print Pricing Rules</h2></div>
        <Button onClick={() => { setEditId(null); setForm({ product_type: "", tier: "basic", base_price: "", cost_basis: "", margin_target: "", rush_multiplier: "1.50", is_active: true }); setShowAdd(true); }}><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{rules.length}</p><p className="text-xs text-muted-foreground">Total Rules</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{rules.filter((r: any) => r.is_active).length}</p><p className="text-xs text-muted-foreground">Active Rules</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{new Set(rules.map((r: any) => r.product_type)).size}</p><p className="text-xs text-muted-foreground">Product Types</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Tier</TableHead><TableHead>Base Price</TableHead><TableHead>Cost</TableHead><TableHead>Margin</TableHead><TableHead>Rush ×</TableHead><TableHead>Active</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : rules.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No pricing rules yet</TableCell></TableRow>
              ) : rules.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.product_type}</TableCell>
                  <TableCell><Badge className={tierColor[r.tier] || ""}>{r.tier}</Badge></TableCell>
                  <TableCell>${Number(r.base_price).toFixed(2)}</TableCell>
                  <TableCell>{r.cost_basis ? `$${Number(r.cost_basis).toFixed(2)}` : "—"}</TableCell>
                  <TableCell>{r.margin_target ? `${Number(r.margin_target).toFixed(0)}%` : "—"}</TableCell>
                  <TableCell>{Number(r.rush_multiplier).toFixed(2)}×</TableCell>
                  <TableCell>{r.is_active ? <Badge variant="outline" className="text-green-600">Active</Badge> : <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Rule" : "Add Pricing Rule"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Product Type *</Label><Input value={form.product_type} onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))} placeholder="business-cards" /></div>
              <div><Label>Tier</Label><Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Base Price *</Label><Input type="number" step="0.01" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} /></div>
              <div><Label>Cost Basis</Label><Input type="number" step="0.01" value={form.cost_basis} onChange={e => setForm(f => ({ ...f, cost_basis: e.target.value }))} /></div>
              <div><Label>Margin %</Label><Input type="number" step="1" value={form.margin_target} onChange={e => setForm(f => ({ ...f, margin_target: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rush Multiplier</Label><Input type="number" step="0.1" value={form.rush_multiplier} onChange={e => setForm(f => ({ ...f, rush_multiplier: e.target.value }))} /></div>
              <div className="flex items-center gap-2 pt-6"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => upsertMutation.mutate(form)} disabled={!form.product_type || !form.base_price || upsertMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
