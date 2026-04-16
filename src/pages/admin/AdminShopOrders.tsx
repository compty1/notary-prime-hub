/**
 * Sprint G — Admin Shop Order Fulfillment Dashboard
 * Lists paid shop_orders, allows fulfillment status updates and tracking.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Truck, CheckCircle, Search, RefreshCw, Crown } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

const STATUSES = ["paid", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = typeof STATUSES[number];

export default function AdminShopOrders() {
  usePageMeta({ title: "Shop Order Fulfillment", noIndex: true });
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<Status | "all">("paid");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-shop-orders", statusFilter],
    queryFn: async () => {
      let q = supabase.from("shop_orders" as any).select("*").order("created_at", { ascending: false }).limit(200);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const updateOrder = useMutation({
    mutationFn: async (vars: { id: string; patch: Record<string, any> }) => {
      const { error } = await supabase.from("shop_orders" as any).update(vars.patch).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-shop-orders"] });
      setEditing(null);
      setTracking("");
      setCarrier("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (orders || []).filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.id?.toLowerCase().includes(s) ||
      o.user_id?.toLowerCase().includes(s) ||
      o.tracking_number?.toLowerCase().includes(s)
    );
  });

  const isAuthority = (o: any) =>
    Array.isArray(o.items) && o.items.some((i: any) => i.name?.toLowerCase().includes("authority"));

  const statusBadge = (s: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      paid: "default",
      processing: "secondary",
      shipped: "outline",
      delivered: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[s] || "outline"}>{s.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Shop Order Fulfillment
          </h1>
          <p className="text-sm text-muted-foreground">
            Process paid notary shop orders. Authority tier orders are flagged for priority handling.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <Card className="rounded-[24px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, user, tracking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-[24px]">
        <CardHeader>
          <CardTitle className="text-base">
            Orders ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No orders match filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-2">
                        {isAuthority(o) && <Crown className="h-3 w-3 text-primary" />}
                        {o.id?.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {Array.isArray(o.items)
                        ? o.items.map((i: any) => i.name).filter(Boolean).slice(0, 2).join(", ")
                        : "—"}
                      {Array.isArray(o.items) && o.items.length > 2 && ` +${o.items.length - 2}`}
                    </TableCell>
                    <TableCell className="font-semibold">${Number(o.total_amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{statusBadge(o.status)}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {o.tracking_number || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(o);
                          setTracking(o.tracking_number || "");
                          setCarrier(o.shipping_carrier || "");
                        }}
                      >
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Update Fulfillment
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Carrier</label>
                <Input
                  placeholder="USPS / UPS / FedEx"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tracking Number</label>
                <Input
                  placeholder="Tracking #"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={() =>
                updateOrder.mutate({
                  id: editing.id,
                  patch: {
                    status: editing.status,
                    tracking_number: tracking || null,
                    shipping_carrier: carrier || null,
                  },
                })
              }
              disabled={updateOrder.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
