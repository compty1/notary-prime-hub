import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Plus, Search, Loader2, Building2, FileText, Calendar } from "lucide-react";
import { CardListSkeleton } from "@/components/AdminLoadingSkeleton";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  section_2_complete: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminI9Verifications() {
  usePageMeta({ title: "I-9 Verifications", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee_name: "", employer_name: "", employer_address: "",
    section_completed: "section_2", notary_notes: "",
  });

  useEffect(() => {
    supabase.from("i9_verifications").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => { if (data) setVerifications(data); setLoading(false); });
  }, []);

  const filtered = verifications.filter(v =>
    v.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.employer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.employee_name.trim()) { toast({ title: "Employee name required", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("i9_verifications").insert({
      employee_name: form.employee_name,
      employer_name: form.employer_name,
      employer_address: form.employer_address,
      section_completed: form.section_completed,
      notary_notes: form.notary_notes,
      client_id: user?.id || "",
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "I-9 verification created" });
    setCreateOpen(false);
    setForm({ employee_name: "", employer_name: "", employer_address: "", section_completed: "section_2", notary_notes: "" });
    const { data } = await supabase.from("i9_verifications").select("*").order("created_at", { ascending: false }).limit(200);
    if (data) setVerifications(data);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("i9_verifications").update({ status } as any).eq("id", id);
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    toast({ title: "Status updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">I-9 Verifications</h1>
          <p className="text-sm text-muted-foreground">Employment eligibility verification — Section 2 completion</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> New I-9
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search verifications..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <CardListSkeleton count={4} /> : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No I-9 verifications found</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(v => (
            <Card key={v.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{v.employee_name}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    {v.employer_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{v.employer_name}</span>}
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{v.section_completed?.replace(/_/g, " ")}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(v.verification_date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[v.status] || ""}>{v.status?.replace(/_/g, " ")}</Badge>
                  <Select value={v.status} onValueChange={val => updateStatus(v.id, val)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="section_2_complete">Section 2 Done</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New I-9 Verification</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Employee Name *</Label>
              <Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Employer Name</Label>
              <Input value={form.employer_name} onChange={e => setForm(f => ({ ...f, employer_name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Employer Address</Label>
              <Input value={form.employer_address} onChange={e => setForm(f => ({ ...f, employer_address: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Section Completed</Label>
              <Select value={form.section_completed} onValueChange={v => setForm(f => ({ ...f, section_completed: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="section_2">Section 2</SelectItem>
                  <SelectItem value="section_3">Section 3 (Reverification)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={form.notary_notes} onChange={e => setForm(f => ({ ...f, notary_notes: e.target.value }))} rows={2} />
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
