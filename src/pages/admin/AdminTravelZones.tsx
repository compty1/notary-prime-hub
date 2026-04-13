/**
 * Sprint 2: Travel Zone Manager
 * Admin CRUD for travel zones + mileage log overview with IRS deduction tracking.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MapPin, Plus, RefreshCw, Car, DollarSign } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const IRS_MILEAGE_RATE = 0.67; // 2024 rate

export default function AdminTravelZones() {
  usePageMeta({ title: "Travel Zones & Mileage", noIndex: true });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ zone_name: "", min_miles: "0", max_miles: "", fee: "0", description: "" });

  const { data: zones = [], isLoading: zonesLoading, refetch: refetchZones } = useQuery({
    queryKey: ["travel-zones-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("travel_zones").select("*").order("min_miles");
      return data ?? [];
    },
  });

  const { data: mileageLogs = [], isLoading: mileageLoading } = useQuery({
    queryKey: ["mileage-logs-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("mileage_logs").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const createZone = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("travel_zones").insert({
        zone_name: form.zone_name,
        min_miles: parseFloat(form.min_miles),
        max_miles: form.max_miles ? parseFloat(form.max_miles) : null,
        fee: parseFloat(form.fee),
        description: form.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Zone created" });
      queryClient.invalidateQueries({ queryKey: ["travel-zones-admin"] });
      setOpen(false);
      setForm({ zone_name: "", min_miles: "0", max_miles: "", fee: "0", description: "" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const totalMiles = mileageLogs.reduce((sum: number, l: any) => sum + (l.distance_miles || 0), 0);
  const irsDeduction = totalMiles * IRS_MILEAGE_RATE;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Travel Zones & Mileage
          </h1>
          <p className="text-sm text-muted-foreground">Manage travel fee zones and track mileage deductions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchZones()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{zones.length}</p><p className="text-xs text-muted-foreground">Active Zones</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{totalMiles.toFixed(0)}</p><p className="text-xs text-muted-foreground">Total Miles Logged</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-primary">${irsDeduction.toFixed(2)}</p><p className="text-xs text-muted-foreground">IRS Deduction ($0.67/mi)</p></CardContent></Card>
      </div>

      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones">Travel Zones</TabsTrigger>
          <TabsTrigger value="mileage">Mileage Log</TabsTrigger>
        </TabsList>

        <TabsContent value="zones">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Zone Configuration</CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Zone</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Travel Zone</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Zone Name</Label><Input value={form.zone_name} onChange={e => setForm(p => ({ ...p, zone_name: e.target.value }))} placeholder="e.g., Extended" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Min Miles</Label><Input type="number" value={form.min_miles} onChange={e => setForm(p => ({ ...p, min_miles: e.target.value }))} /></div>
                      <div><Label>Max Miles (blank = unlimited)</Label><Input type="number" value={form.max_miles} onChange={e => setForm(p => ({ ...p, max_miles: e.target.value }))} /></div>
                    </div>
                    <div><Label>Fee ($)</Label><Input type="number" value={form.fee} onChange={e => setForm(p => ({ ...p, fee: e.target.value }))} /></div>
                    <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                    <Button className="w-full" onClick={() => createZone.mutate()} disabled={createZone.isPending || !form.zone_name}>
                      {createZone.isPending ? "Creating..." : "Create Zone"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zonesLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : (
                    zones.map((z: any) => (
                      <TableRow key={z.id}>
                        <TableCell className="font-medium">{z.zone_name}</TableCell>
                        <TableCell>{z.min_miles}–{z.max_miles ?? "∞"} mi</TableCell>
                        <TableCell className="font-medium">${Number(z.fee).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{z.description || "—"}</TableCell>
                        <TableCell><Badge variant={z.is_active ? "default" : "secondary"}>{z.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mileage">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Miles</TableHead>
                    <TableHead>IRS Deduction</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mileageLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : mileageLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No mileage logs</TableCell></TableRow>
                  ) : (
                    mileageLogs.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs">{format(new Date(l.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>{l.distance_miles?.toFixed(1)}</TableCell>
                        <TableCell className="text-primary">${((l.distance_miles || 0) * IRS_MILEAGE_RATE).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{l.notes || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
