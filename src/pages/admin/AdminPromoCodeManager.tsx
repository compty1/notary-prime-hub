import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Tag, Loader2, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function AdminPromoCodeManager() {
  usePageMeta({ title: "Promo Code Manager", description: "Manage promotional discount codes" });
  const { toast } = useToast();
  const [codes, setCodes] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState({ code: "", discount_percent: 10, max_uses: 100, is_active: true });

  const load = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.code.trim()) return;
    const payload = { code: form.code.toUpperCase().trim(), discount_percent: form.discount_percent, max_uses: form.max_uses, is_active: form.is_active };

    if (editing) {
      await supabase.from("promo_codes").update(payload ).eq("id", editing.id);
      toast({ title: "Promo code updated" });
    } else {
      await supabase.from("promo_codes").insert(payload);
      toast({ title: "Promo code created" });
    }
    setDialogOpen(false);
    setEditing(null);
    setForm({ code: "", discount_percent: 10, max_uses: 100, is_active: true });
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("promo_codes").delete().eq("id", id);
    toast({ title: "Promo code deleted" });
    load();
  };

  const openEdit = (code: any) => {
    setEditing(code);
    setForm({ code: code.code, discount_percent: code.discount_percent || 10, max_uses: code.max_uses || 100, is_active: code.is_active ?? true });
    setDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">Create and manage promotional discount codes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setForm({ code: "", discount_percent: 10, max_uses: 100, is_active: true }); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> New Code</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} Promo Code</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Code</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="SUMMER25" /></div>
              <div><Label>Discount %</Label><Input type="number" min={1} max={100} value={form.discount_percent} onChange={e => setForm(p => ({ ...p, discount_percent: +e.target.value }))} /></div>
              <div><Label>Max Uses</Label><Input type="number" min={1} value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: +e.target.value }))} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><Label>Active</Label></div>
              <Button onClick={handleSave} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Uses</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {codes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground"><Tag className="mx-auto mb-2 h-8 w-8 opacity-30" /><p>No promo codes yet</p></TableCell></TableRow>
              ) : codes.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>{c.discount_percent || 0}%</TableCell>
                  <TableCell>{c.times_used || 0}/{c.max_uses || "∞"}</TableCell>
                  <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Action"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} aria-label="Action"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
