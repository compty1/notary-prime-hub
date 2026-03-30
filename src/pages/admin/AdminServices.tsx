import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";

const categories = [
  { value: "notarization", label: "Core Notarization" },
  { value: "verification", label: "Identity & Verification" },
  { value: "document_services", label: "Document Services" },
  { value: "authentication", label: "Authentication & International" },
  { value: "business", label: "Business & Volume" },
  { value: "recurring", label: "Recurring & Value-Add" },
  { value: "consulting", label: "Consulting & Training" },
];

const pricingModels = [
  { value: "per_seal", label: "Per Seal" },
  { value: "per_document", label: "Per Document" },
  { value: "per_hour", label: "Per Hour" },
  { value: "flat", label: "Flat Rate" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom Quote" },
];

type Service = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  short_description: string | null;
  price_from: number | null;
  price_to: number | null;
  pricing_model: string;
  is_active: boolean;
  display_order: number;
  icon: string | null;
};

const emptyForm = {
  name: "", category: "notarization", description: "", short_description: "",
  price_from: 0, price_to: 0, pricing_model: "flat", is_active: true, display_order: 0, icon: "FileText",
};

export default function AdminServices() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*").order("display_order");
    if (data) setServices(data as Service[]);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const filtered = activeTab === "all" ? services : services.filter(s => s.category === activeTab);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, display_order: services.length });
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      name: s.name, category: s.category, description: s.description || "",
      short_description: s.short_description || "", price_from: s.price_from || 0,
      price_to: s.price_to || 0, pricing_model: s.pricing_model, is_active: s.is_active,
      display_order: s.display_order, icon: s.icon || "FileText",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.from("services").update({
        name: form.name, category: form.category, description: form.description || null,
        short_description: form.short_description || null, price_from: form.price_from,
        price_to: form.price_to, pricing_model: form.pricing_model, is_active: form.is_active,
        display_order: form.display_order, icon: form.icon || null,
      }).eq("id", editingId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Service updated" });
    } else {
      const { error } = await supabase.from("services").insert({
        name: form.name, category: form.category, description: form.description || null,
        short_description: form.short_description || null, price_from: form.price_from,
        price_to: form.price_to, pricing_model: form.pricing_model, is_active: form.is_active,
        display_order: form.display_order, icon: form.icon || null,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Service added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchServices();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(x => x.id !== id));
    toast({ title: "Service deleted" });
  };

  const formatPrice = (s: Service) => {
    if (s.pricing_model === "custom") return "Custom Quote";
    const from = Number(s.price_from || 0);
    const to = Number(s.price_to || 0);
    if (from === 0 && to === 0) return "Contact";
    const suffix = s.pricing_model === "monthly" ? "/mo" : s.pricing_model === "per_seal" ? "/seal" : s.pricing_model === "per_document" ? "/doc" : "";
    return to > from ? `$${from}–$${to}${suffix}` : `$${from}${suffix}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-foreground">Services Catalog</h1>
          <p className="text-sm text-muted-foreground">Manage all services, pricing, and availability</p>
        </div>
        <Button onClick={openAdd} className="">
          <Plus className="mr-1 h-4 w-4" /> Add Service
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All ({services.length})</TabsTrigger>
          {categories.map(c => {
            const count = services.filter(s => s.category === c.value).length;
            return <TabsTrigger key={c.value} value={c.value}>{c.label} ({count})</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id} className={!s.is_active ? "opacity-50" : ""}>
                    <TableCell className="text-xs text-muted-foreground">{s.display_order}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.short_description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categories.find(c => c.value === s.category)?.label || s.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatPrice(s)}</TableCell>
                    <TableCell>
                      <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteService(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans">{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Service Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Short Description</Label><Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} placeholder="One-liner for cards" /></div>
            <div><Label>Full Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pricing Model</Label>
                <Select value={form.pricing_model} onValueChange={v => setForm({ ...form, pricing_model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{pricingModels.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price From ($)</Label><Input type="number" step="0.01" value={form.price_from} onChange={e => setForm({ ...form, price_from: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Price To ($)</Label><Input type="number" step="0.01" value={form.price_to} onChange={e => setForm({ ...form, price_to: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Display Order</Label><Input type="number" value={form.display_order} onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Icon Name</Label><Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="e.g. Monitor, MapPin" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Active (visible to clients)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name} className="">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
