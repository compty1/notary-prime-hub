/**
 * Sprint 2: Certified Copy Services Admin
 * Track and manage certified copy requests with ORC §147.08 fee cap ($5/copy).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DashboardEnhancer } from "@/components/services/DashboardEnhancer";

const FEE_PER_COPY = 5.00; // ORC §147.08

export default function AdminCertifiedCopies() {
  usePageMeta({ title: "Certified Copies", noIndex: true });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copyCount, setCopyCount] = useState(1);

  const { data: copies = [], isLoading, refetch } = useQuery({
    queryKey: ["certified-copies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("certified_copies")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { copy_count: number; notes?: string }) => {
      const { error } = await supabase.from("certified_copies").insert({
        client_id: user?.id,
        copy_count: data.copy_count,
        fee_per_copy: FEE_PER_COPY,
        total_fee: data.copy_count * FEE_PER_COPY,
        certification_text: "I hereby certify that this is a true and accurate copy of the original document presented to me.",
        status: "pending",
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Certified copy request created" });
      queryClient.invalidateQueries({ queryKey: ["certified-copies"] });
      setOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("certified_copies").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else refetch();
  };

  const totalRevenue = copies.reduce((sum: number, c: any) => sum + (c.total_fee || 0), 0);
  const totalCopies = copies.reduce((sum: number, c: any) => sum + (c.copy_count || 0), 0);

  return (
    <DashboardEnhancer category="certified-copies">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Copy className="h-6 w-6 text-primary" /> Certified Copies
          </h1>
          <p className="text-sm text-muted-foreground">ORC §147.08 — $5.00 per certified copy cap</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Request</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Certified Copy Request</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Number of Copies</Label>
                  <Input type="number" min={1} max={50} value={copyCount} onChange={e => setCopyCount(+e.target.value || 1)} />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                  <span className="text-sm">Total Fee</span>
                  <span className="text-lg font-bold">${(copyCount * FEE_PER_COPY).toFixed(2)}</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Ohio ORC §147.08 caps certified copy fees at $5.00 per copy.</span>
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate({ copy_count: copyCount })} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{copies.length}</p><p className="text-xs text-muted-foreground">Total Requests</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{totalCopies}</p><p className="text-xs text-muted-foreground">Total Copies</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p><p className="text-xs text-muted-foreground">Revenue</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : copies.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No certified copy requests</TableCell></TableRow>
              ) : (
                copies.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id.slice(0, 8)}</TableCell>
                    <TableCell>{c.copy_count}</TableCell>
                    <TableCell>${(c.total_fee || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Select value={c.status} onValueChange={v => updateStatus(c.id, v)}>
                        <SelectTrigger className="w-[120px] h-8">
                          <Badge variant={c.status === "completed" ? "default" : "secondary"}>{c.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </DashboardEnhancer>
  );
}
