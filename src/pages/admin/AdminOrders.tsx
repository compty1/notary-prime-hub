import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, List, LayoutGrid, Package, Clock, CheckCircle, Truck, Eye as EyeIcon, XCircle, Loader2 } from "lucide-react";

const ORDER_STATUSES = ["pending", "assigned", "in_progress", "under_review", "delivered", "completed", "cancelled"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  assigned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  under_review: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  delivered: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};
const PRIORITY_COLORS: Record<string, string> = {
  standard: "bg-muted text-muted-foreground",
  priority: "bg-blue-100 text-blue-800",
  rush: "bg-amber-100 text-amber-800",
  emergency: "bg-destructive/10 text-destructive",
};

interface Order {
  id: string; order_number: string; client_id: string; status: string;
  priority: string; service_category: string | null; subtotal: number;
  discount: number; tax: number; total: number; due_date: string | null;
  notes: string | null; created_at: string;
}

export default function AdminOrders() {
  usePageMeta({ title: "Order Management", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newOrder, setNewOrder] = useState({ service_category: "", priority: "standard", notes: "", client_id: "" });
  const [creating, setCreating] = useState(false);

  const fetchOrders = useCallback(async () => {
    const [ordersRes, profilesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email").limit(2000),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data as any);
    if (profilesRes.data) {
      const map: Record<string, string> = {};
      profilesRes.data.forEach((p: any) => { map[p.user_id] = p.full_name || p.email || p.user_id.slice(0, 8); });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const clientName = profiles[o.client_id]?.toLowerCase() || "";
      return o.order_number.toLowerCase().includes(term) || clientName.includes(term) || o.service_category?.toLowerCase().includes(term);
    }
    return true;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus as any }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    toast({ title: `Order updated to ${newStatus.replace(/_/g, " ")}` });
  };

  const handleCreate = async () => {
    if (!newOrder.client_id) { toast({ title: "Client ID required", variant: "destructive" }); return; }
    setCreating(true);
    const { data, error } = await supabase.from("orders").insert({
      client_id: newOrder.client_id,
      priority: newOrder.priority,
      service_category: newOrder.service_category || null,
      notes: newOrder.notes || null,
    } as any).select().single();
    if (error) { toast({ title: "Error creating order", description: error.message, variant: "destructive" }); }
    else { setOrders(prev => [data as any, ...prev]); setShowCreate(false); toast({ title: "Order created" }); }
    setCreating(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          <Button variant={viewMode === "kanban" ? "default" : "outline"} size="sm" onClick={() => setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1 h-3 w-3" /> New Order</Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {viewMode === "list" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No orders found</TableCell></TableRow>
                ) : filteredOrders.map(o => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelectedOrder(o)}>
                    <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                    <TableCell>{profiles[o.client_id] || o.client_id.slice(0, 8)}</TableCell>
                    <TableCell>{o.service_category || "—"}</TableCell>
                    <TableCell><Badge className={`text-xs ${STATUS_COLORS[o.status] || ""}`}>{o.status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell><Badge className={`text-xs ${PRIORITY_COLORS[o.priority] || ""}`}>{o.priority}</Badge></TableCell>
                    <TableCell className="text-right font-medium">${o.total.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{o.due_date || "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="icon"><EyeIcon className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 overflow-x-auto">
          {ORDER_STATUSES.map(status => (
            <div key={status} className="min-w-[160px]">
              <div className="mb-2 flex items-center gap-1">
                <Badge className={`text-xs ${STATUS_COLORS[status]}`}>{status.replace(/_/g, " ")}</Badge>
                <span className="text-xs text-muted-foreground">({filteredOrders.filter(o => o.status === status).length})</span>
              </div>
              <div className="space-y-2">
                {filteredOrders.filter(o => o.status === status).map(o => (
                  <Card key={o.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(o)}>
                    <CardContent className="p-3 space-y-1">
                      <p className="font-mono text-xs">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{profiles[o.client_id] || "Unknown"}</p>
                      <div className="flex justify-between items-center">
                        <Badge className={`text-[10px] ${PRIORITY_COLORS[o.priority]}`}>{o.priority}</Badge>
                        <span className="text-xs font-medium">${o.total.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-mono">{selectedOrder?.order_number}</SheetTitle>
            <SheetDescription>Order details and status management</SheetDescription>
          </SheetHeader>
          {selectedOrder && (
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label>Client</Label>
                <p className="text-sm font-medium">{profiles[selectedOrder.client_id] || selectedOrder.client_id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Status</Label>
                  <Select value={selectedOrder.status} onValueChange={v => handleStatusChange(selectedOrder.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Priority</Label><Badge className={`${PRIORITY_COLORS[selectedOrder.priority]}`}>{selectedOrder.priority}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Subtotal</span><p className="font-medium">${selectedOrder.subtotal.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground">Discount</span><p className="font-medium">-${selectedOrder.discount.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground">Tax</span><p className="font-medium">${selectedOrder.tax.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground font-bold">Total</span><p className="font-bold text-lg">${selectedOrder.total.toFixed(2)}</p></div>
              </div>
              {selectedOrder.notes && <div><Label>Notes</Label><p className="text-sm text-muted-foreground">{selectedOrder.notes}</p></div>}
              <div className="text-xs text-muted-foreground">Created: {new Date(selectedOrder.created_at).toLocaleString()}</div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Order Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Enter details for the new order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Client ID</Label><Input value={newOrder.client_id} onChange={e => setNewOrder(p => ({ ...p, client_id: e.target.value }))} placeholder="Client UUID" /></div>
            <div><Label>Service Category</Label><Input value={newOrder.service_category} onChange={e => setNewOrder(p => ({ ...p, service_category: e.target.value }))} placeholder="e.g. Notarization" /></div>
            <div><Label>Priority</Label>
              <Select value={newOrder.priority} onValueChange={v => setNewOrder(p => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="rush">Rush</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={newOrder.notes} onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
