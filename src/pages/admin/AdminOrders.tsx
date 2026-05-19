import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, List, LayoutGrid, Eye as EyeIcon, Loader2, Inbox, PackageOpen,
} from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
} from "@dnd-kit/core";

const ORDER_STATUSES = [
  "pending", "assigned", "in_progress", "under_review", "delivered", "completed", "cancelled",
] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  assigned: "bg-info/10 text-info border-info/30",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300/40",
  under_review: "bg-warning/10 text-warning border-warning/30",
  delivered: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-300/40",
  completed: "bg-primary/10 text-primary border-primary/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};
const PRIORITY_COLORS: Record<string, string> = {
  standard: "bg-muted text-muted-foreground",
  priority: "bg-info/10 text-info",
  rush: "bg-warning/10 text-warning",
  emergency: "bg-destructive/10 text-destructive",
};

interface Order {
  id: string; order_number: string; client_id: string; status: string;
  priority: string; service_category: string | null; subtotal: number;
  discount: number; tax: number; total: number; due_date: string | null;
  notes: string | null; created_at: string;
}

/* ---------- Draggable card (Kanban) ---------- */
function DraggableOrderCard({
  order, clientName, onOpen,
}: { order: Order; clientName: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="touch-none"
    >
      <Card
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
        onClick={onOpen}
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-2"
      >
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-xs font-semibold truncate">{order.order_number}</p>
            <Badge className={`text-[10px] shrink-0 ${PRIORITY_COLORS[order.priority] || ""}`}>{order.priority}</Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{clientName}</p>
          {order.service_category && (
            <p className="text-[11px] text-muted-foreground/80 truncate">{order.service_category}</p>
          )}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-bold">${order.total.toFixed(2)}</span>
            {order.due_date && (
              <span className="text-[10px] text-muted-foreground">due {order.due_date}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({
  status, orders, profiles, onOpen,
}: { status: OrderStatus; orders: Order[]; profiles: Record<string, string>; onOpen: (o: Order) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  const sum = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[180px] rounded-lg p-2 border-2 transition-colors ${
        isOver ? "bg-primary/5 border-primary/40" : "border-transparent"
      }`}
      aria-label={`${status} column`}
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <Badge className={`text-xs border ${STATUS_COLORS[status]}`}>{status.replace(/_/g, " ")}</Badge>
        <span className="text-[11px] text-muted-foreground">{orders.length} · ${sum.toFixed(0)}</span>
      </div>
      <div className="space-y-2 min-h-[80px]">
        {orders.length === 0 ? (
          <div className="text-center text-[11px] text-muted-foreground/70 py-6 border-2 border-dashed border-border/50 rounded-md">
            Drop here
          </div>
        ) : orders.map((o) => (
          <DraggableOrderCard
            key={o.id}
            order={o}
            clientName={profiles[o.client_id] || o.client_id.slice(0, 8)}
            onOpen={() => onOpen(o)}
          />
        ))}
      </div>
    </div>
  );
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const [ordersRes, profilesRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email").limit(999),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data ?? []);
    if (profilesRes.data) {
      const map: Record<string, string> = {};
      profilesRes.data.forEach((p: any) => {
        map[p.user_id] = p.full_name || p.email || p.user_id.slice(0, 8);
      });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = useMemo(() => orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const clientName = profiles[o.client_id]?.toLowerCase() || "";
      return (
        o.order_number.toLowerCase().includes(term) ||
        clientName.includes(term) ||
        o.service_category?.toLowerCase().includes(term)
      );
    }
    return true;
  }), [orders, statusFilter, search, profiles]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const prev = orders.find((o) => o.id === orderId);
    if (prev?.status === newStatus) return;
    // Optimistic
    setOrders((p) => p.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((p) => (p ? { ...p, status: newStatus } : null));
    }
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", orderId);
    if (error) {
      // rollback
      setOrders((p) => p.map((o) => (o.id === orderId && prev ? { ...o, status: prev.status } : o)));
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Moved to ${newStatus.replace(/_/g, " ")}` });
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setOrders((p) => p.map((o) => (selectedIds.has(o.id) ? { ...o, status: bulkStatus } : o)));
    const { error } = await supabase
      .from("orders")
      .update({ status: bulkStatus as any })
      .in("id", ids);
    if (error) {
      toast({ title: "Bulk update failed", description: error.message, variant: "destructive" });
      fetchOrders();
      return;
    }
    toast({ title: `Updated ${ids.length} order${ids.length === 1 ? "" : "s"}` });
    setSelectedIds(new Set());
    setBulkStatus("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
  };

  const handleCreate = async () => {
    if (!newOrder.client_id) { toast({ title: "Client ID required", variant: "destructive" }); return; }
    setCreating(true);
    const { data, error } = await supabase.from("orders").insert([{
      client_id: newOrder.client_id,
      priority: (newOrder.priority || "standard") as any,
      service_category: newOrder.service_category || null,
      notes: newOrder.notes || null,
    }]).select().single();
    if (error) {
      toast({ title: "Error creating order", description: error.message, variant: "destructive" });
    } else {
      setOrders((prev) => [data as Order, ...prev]);
      setShowCreate(false);
      setNewOrder({ service_category: "", priority: "standard", notes: "", client_id: "" });
      toast({ title: "Order created" });
    }
    setCreating(false);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId || !overId.startsWith("col-")) return;
    const status = overId.slice("col-".length);
    if (!ORDER_STATUSES.includes(status as OrderStatus)) return;
    handleStatusChange(String(e.active.id), status);
  };

  const dragging = activeDragId ? orders.find((o) => o.id === activeDragId) : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${orders.length} total · ${filteredOrders.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm" onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"} aria-label="List view"
          ><List className="h-4 w-4" /></Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm" onClick={() => setViewMode("kanban")}
            aria-pressed={viewMode === "kanban"} aria-label="Kanban view"
          ><LayoutGrid className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-3 w-3" /> New Order
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9" placeholder="Search orders…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk toolbar (list view) */}
      {viewMode === "list" && selectedIds.size > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="mb-3 flex items-center gap-3 rounded-md border-2 border-primary/30 bg-primary/5 p-2"
        >
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-[180px] h-8"><SelectValue placeholder="Change status to…" /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkStatus} disabled={!bulkStatus}>Apply</Button>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedIds(new Set()); setBulkStatus(""); }}>Clear</Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        viewMode === "list" ? (
          <Card><CardContent className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
            {ORDER_STATUSES.map((s) => (
              <div key={s} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        )
      ) : viewMode === "list" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all rows"
                      checked={filteredOrders.length > 0 && selectedIds.size === filteredOrders.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
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
                  <TableRow><TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Inbox className="h-10 w-10 opacity-50" />
                      <div>
                        <p className="font-medium text-foreground">No orders found</p>
                        <p className="text-xs">Try clearing filters or create your first order.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
                        <Plus className="mr-1 h-3 w-3" /> New Order
                      </Button>
                    </div>
                  </TableCell></TableRow>
                ) : filteredOrders.map((o) => (
                  <TableRow
                    key={o.id}
                    data-state={selectedIds.has(o.id) ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={`Select order ${o.order_number}`}
                        checked={selectedIds.has(o.id)}
                        onCheckedChange={() => toggleSelect(o.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs" onClick={() => setSelectedOrder(o)}>{o.order_number}</TableCell>
                    <TableCell onClick={() => setSelectedOrder(o)}>{profiles[o.client_id] || o.client_id.slice(0, 8)}</TableCell>
                    <TableCell onClick={() => setSelectedOrder(o)}>{o.service_category || "—"}</TableCell>
                    <TableCell onClick={() => setSelectedOrder(o)}>
                      <Badge className={`text-xs ${STATUS_COLORS[o.status] || ""}`}>{o.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell onClick={() => setSelectedOrder(o)}>
                      <Badge className={`text-xs ${PRIORITY_COLORS[o.priority] || ""}`}>{o.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium" onClick={() => setSelectedOrder(o)}>${o.total.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" onClick={() => setSelectedOrder(o)}>{o.due_date || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label={`Open order ${o.order_number}`} onClick={() => setSelectedOrder(o)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="mt-3 font-medium">No orders match your filters</p>
          <p className="text-sm text-muted-foreground">Adjust the search or status filter to see results.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 overflow-x-auto">
            {ORDER_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={filteredOrders.filter((o) => o.status === status)}
                profiles={profiles}
                onOpen={setSelectedOrder}
              />
            ))}
          </div>
          <DragOverlay>
            {dragging ? (
              <Card className="border-2 shadow-lg rotate-2 w-[170px]">
                <CardContent className="p-3 space-y-1">
                  <p className="font-mono text-xs font-semibold">{dragging.order_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{profiles[dragging.client_id]}</p>
                  <span className="text-xs font-bold">${dragging.total.toFixed(2)}</span>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
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
                <div>
                  <Label>Status</Label>
                  <Select value={selectedOrder.status} onValueChange={(v) => handleStatusChange(selectedOrder.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={`${PRIORITY_COLORS[selectedOrder.priority]}`}>{selectedOrder.priority}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Subtotal</span><p className="font-medium">${selectedOrder.subtotal.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground">Discount</span><p className="font-medium">-${selectedOrder.discount.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground">Tax</span><p className="font-medium">${selectedOrder.tax.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground font-bold">Total</span><p className="font-bold text-lg">${selectedOrder.total.toFixed(2)}</p></div>
              </div>
              {selectedOrder.notes && (
                <div><Label>Notes</Label><p className="text-sm text-muted-foreground">{selectedOrder.notes}</p></div>
              )}
              <div className="text-xs text-muted-foreground">
                Created: {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
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
            <div>
              <Label>Client ID</Label>
              <Input value={newOrder.client_id} onChange={(e) => setNewOrder((p) => ({ ...p, client_id: e.target.value }))} placeholder="Client UUID" />
            </div>
            <div>
              <Label>Service Category</Label>
              <Input value={newOrder.service_category} onChange={(e) => setNewOrder((p) => ({ ...p, service_category: e.target.value }))} placeholder="e.g. Notarization" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={newOrder.priority} onValueChange={(v) => setNewOrder((p) => ({ ...p, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="rush">Rush</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newOrder.notes} onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
