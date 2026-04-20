import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Wrench, Plus, Search, Edit, Trash2, Loader2, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { format, differenceInDays } from "date-fns";

const EQUIPMENT_TYPES = ["seal", "stamp", "printer", "scanner", "camera", "computer", "journal", "other"];
const CONDITIONS = ["new", "good", "fair", "poor", "retired"];

interface EquipmentForm {
  equipment_name: string; equipment_type: string; serial_number: string;
  purchase_date: string; warranty_expiry: string; vendor: string;
  purchase_price: string; condition: string; maintenance_notes: string;
  last_maintenance_date: string; next_maintenance_date: string; is_active: boolean;
}

const EMPTY: EquipmentForm = {
  equipment_name: "", equipment_type: "other", serial_number: "", purchase_date: "",
  warranty_expiry: "", vendor: "", purchase_price: "", condition: "good",
  maintenance_notes: "", last_maintenance_date: "", next_maintenance_date: "", is_active: true,
};

export default function AdminEquipment() {
  usePageMeta({ title: "Equipment Management | Admin", noIndex: true });
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentForm>(EMPTY);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["admin-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_equipment").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (vals: EquipmentForm) => {
      const payload: any = {
        equipment_name: vals.equipment_name, equipment_type: vals.equipment_type,
        serial_number: vals.serial_number || null, vendor: vals.vendor || null,
        purchase_price: vals.purchase_price ? parseFloat(vals.purchase_price) : null,
        condition: vals.condition, maintenance_notes: vals.maintenance_notes || null,
        is_active: vals.is_active,
        purchase_date: vals.purchase_date || null, warranty_expiry: vals.warranty_expiry || null,
        last_maintenance_date: vals.last_maintenance_date || null,
        next_maintenance_date: vals.next_maintenance_date || null,
      };
      if (editId) { const { error } = await supabase.from("admin_equipment").update(payload).eq("id", editId); if (error) throw error; }
      else { const { error } = await supabase.from("admin_equipment").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-equipment"] }); toast({ title: editId ? "Updated" : "Added" }); setShowDialog(false); setEditId(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("admin_equipment").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-equipment"] }); toast({ title: "Deleted" }); },
  });

  const openEdit = (e: any) => {
    setEditId(e.id);
    setForm({
      equipment_name: e.equipment_name, equipment_type: e.equipment_type,
      serial_number: e.serial_number || "", purchase_date: e.purchase_date || "",
      warranty_expiry: e.warranty_expiry || "", vendor: e.vendor || "",
      purchase_price: e.purchase_price?.toString() || "", condition: e.condition,
      maintenance_notes: e.maintenance_notes || "",
      last_maintenance_date: e.last_maintenance_date || "", next_maintenance_date: e.next_maintenance_date || "",
      is_active: e.is_active,
    });
    setShowDialog(true);
  };

  const filtered = equipment.filter((e: any) =>
    !search || e.equipment_name?.toLowerCase().includes(search.toLowerCase()) || e.serial_number?.toLowerCase().includes(search.toLowerCase())
  );

  const needsMaintenance = equipment.filter((e: any) => {
    if (!e.next_maintenance_date) return false;
    return differenceInDays(new Date(e.next_maintenance_date), new Date()) <= 14;
  });

  const conditionColor: Record<string, string> = {
    new: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    fair: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    poor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    retired: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="h-6 w-6 text-primary" /> Equipment Management</h1>
          <p className="text-sm text-muted-foreground">Track notary seals, stamps, tech equipment & maintenance schedules</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm(EMPTY); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" /> Add Equipment</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><Package className="h-5 w-5 text-primary mb-1" /><p className="text-2xl font-bold">{equipment.length}</p><p className="text-xs text-muted-foreground">Total Items</p></CardContent></Card>
        <Card><CardContent className="pt-4"><CheckCircle className="h-5 w-5 text-green-600 mb-1" /><p className="text-2xl font-bold">{equipment.filter((e: any) => e.is_active).length}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-4"><AlertTriangle className="h-5 w-5 text-amber-500 mb-1" /><p className="text-2xl font-bold">{needsMaintenance.length}</p><p className="text-xs text-muted-foreground">Needs Maintenance</p></CardContent></Card>
        <Card><CardContent className="pt-4"><Wrench className="h-5 w-5 text-muted-foreground mb-1" /><p className="text-2xl font-bold">{equipment.filter((e: any) => e.condition === "retired").length}</p><p className="text-xs text-muted-foreground">Retired</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : filtered.length === 0 ? <div className="text-center py-12 text-muted-foreground">No equipment found</div> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Equipment</TableHead><TableHead>Type</TableHead><TableHead>Serial #</TableHead>
                <TableHead>Condition</TableHead><TableHead>Next Maintenance</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((e: any) => (
                  <TableRow key={e.id} className={!e.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{e.equipment_name}</TableCell>
                    <TableCell><Badge variant="outline">{e.equipment_type}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{e.serial_number || "—"}</TableCell>
                    <TableCell><Badge className={conditionColor[e.condition] || ""}>{e.condition}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {e.next_maintenance_date ? (
                        <span className={differenceInDays(new Date(e.next_maintenance_date), new Date()) <= 14 ? "text-amber-600 font-medium" : ""}>
                          {format(new Date(e.next_maintenance_date), "MMM d, yyyy")}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Equipment</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div><Label>Name *</Label><Input value={form.equipment_name} onChange={e => setForm(f => ({ ...f, equipment_name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={form.equipment_type} onValueChange={v => setForm(f => ({ ...f, equipment_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EQUIPMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Condition</Label><Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Serial Number</Label><Input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} /></div>
              <div><Label>Vendor</Label><Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Purchase Price</Label><Input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} /></div>
              <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Warranty Expiry</Label><Input type="date" value={form.warranty_expiry} onChange={e => setForm(f => ({ ...f, warranty_expiry: e.target.value }))} /></div>
              <div><Label>Last Maintenance</Label><Input type="date" value={form.last_maintenance_date} onChange={e => setForm(f => ({ ...f, last_maintenance_date: e.target.value }))} /></div>
            </div>
            <div><Label>Next Maintenance</Label><Input type="date" value={form.next_maintenance_date} onChange={e => setForm(f => ({ ...f, next_maintenance_date: e.target.value }))} /></div>
            <div><Label>Maintenance Notes</Label><Textarea value={form.maintenance_notes} onChange={e => setForm(f => ({ ...f, maintenance_notes: e.target.value }))} rows={2} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertMutation.mutate(form)} disabled={upsertMutation.isPending || !form.equipment_name}>{upsertMutation.isPending ? "Saving..." : editId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
