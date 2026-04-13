/**
 * Sprint 2: Oath/Affirmation Administration
 * ORC §147.03 compliant oath/affirmation tracking with statutory language templates.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Plus, RefreshCw } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STATUTORY_TEMPLATES = {
  oath: "Do you solemnly swear that the statements you are about to make are the truth, the whole truth, and nothing but the truth, so help you God?",
  affirmation: "Do you solemnly affirm, under penalty of perjury, that the statements you are about to make are the truth, the whole truth, and nothing but the truth?",
};

export default function AdminOathAdministration() {
  usePageMeta({ title: "Oath/Affirmation Administration", noIndex: true });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    oath_type: "oath" as "oath" | "affirmation",
    document_description: "",
    notes: "",
  });

  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ["oath-records"],
    queryFn: async () => {
      const { data } = await supabase
        .from("oath_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("oath_records").insert({
        client_id: form.client_id || user?.id,
        oath_type: form.oath_type,
        statutory_text: STATUTORY_TEMPLATES[form.oath_type],
        administered_by: user?.id,
        administered_at: new Date().toISOString(),
        document_description: form.document_description,
        notes: form.notes || null,
        status: "administered",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Oath/Affirmation recorded" });
      queryClient.invalidateQueries({ queryKey: ["oath-records"] });
      setOpen(false);
      setForm({ client_id: "", oath_type: "oath", document_description: "", notes: "" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Oath & Affirmation Administration
          </h1>
          <p className="text-sm text-muted-foreground">ORC §147.03 — Administer and record oaths/affirmations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Record</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Administer Oath/Affirmation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={form.oath_type} onValueChange={(v: "oath" | "affirmation") => setForm(p => ({ ...p, oath_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oath">Oath (religious)</SelectItem>
                      <SelectItem value="affirmation">Affirmation (secular)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium mb-1">Statutory Language:</p>
                  <p className="text-sm italic">{STATUTORY_TEMPLATES[form.oath_type]}</p>
                </div>

                <div>
                  <Label>Document Description</Label>
                  <Input
                    value={form.document_description}
                    onChange={e => setForm(p => ({ ...p, document_description: e.target.value }))}
                    placeholder="e.g., Affidavit of Residency"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    rows={2}
                  />
                </div>

                <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.document_description}>
                  {createMutation.isPending ? "Recording..." : "Record Administration"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Administered</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>
              ) : (
                records.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant={r.oath_type === "oath" ? "default" : "secondary"}>
                        {r.oath_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.document_description || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.administered_at ? format(new Date(r.administered_at), "MMM d, yyyy h:mm a") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
