import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ShoppingBag, Package, Truck, CheckCircle2, Clock, Eye, AlertTriangle,
  Send, FileCheck, Factory, Search as SearchIcon, MessageSquare, Upload,
} from "lucide-react";

const LIFECYCLE_STAGES = [
  { key: "received", label: "Received", icon: Package, color: "bg-blue-500/20 text-blue-700" },
  { key: "design_review", label: "Design Review", icon: Eye, color: "bg-yellow-500/20 text-yellow-700" },
  { key: "sent_to_vendor", label: "Sent to Vendor", icon: Send, color: "bg-purple-500/20 text-purple-700" },
  { key: "in_production", label: "In Production", icon: Factory, color: "bg-orange-500/20 text-orange-700" },
  { key: "quality_check", label: "Quality Check", icon: FileCheck, color: "bg-cyan-500/20 text-cyan-700" },
  { key: "shipped", label: "Shipped", icon: Truck, color: "bg-green-500/20 text-green-700" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, color: "bg-emerald-500/20 text-emerald-700" },
];

const STATUS_COLOR: Record<string, string> = Object.fromEntries(LIFECYCLE_STAGES.map(s => [s.key, s.color]));
STATUS_COLOR["cancelled"] = "bg-destructive/20 text-destructive";

export default function AdminPrintOrders() {
  usePageMeta({ title: "Print Order Management", noIndex: true });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Record<string, any> | null>(null);
  const [newNote, setNewNote] = useState("");
  const [tab, setTab] = useState("list");

  const { data: orders = [] } = useQuery({
    queryKey: ["print-orders-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("print_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["print-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("print_vendors").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: comms = [] } = useQuery({
    queryKey: ["print-comms", selectedOrder?.id],
    enabled: !!selectedOrder,
    queryFn: async () => {
      const { data, error } = await supabase.from("print_order_communications").select("*").eq("order_id", selectedOrder.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("print_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["print-orders-admin"] }); toast({ title: "Status updated" }); },
  });

  const assignVendor = useMutation({
    mutationFn: async ({ id, vendor_id }: { id: string; vendor_id: string }) => {
      const { error } = await supabase.from("print_orders").update({ vendor_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["print-orders-admin"] }); toast({ title: "Vendor assigned" }); },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !newNote.trim()) return;
      const { error } = await supabase.from("print_order_communications").insert({ order_id: selectedOrder.id, sender_type: "admin", message: newNote.trim() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["print-comms"] }); setNewNote(""); toast({ title: "Message sent" }); },
  });

  const filtered = orders.filter((o: any) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !(o.product_name || "").toLowerCase().includes(search.toLowerCase()) && !(o.order_number || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stageCounts = LIFECYCLE_STAGES.map(s => ({ ...s, count: orders.filter((o: any) => o.status === s.key).length }));
  const kanbanStages = [...LIFECYCLE_STAGES, { key: "cancelled", label: "Cancelled", icon: AlertTriangle, color: "bg-destructive/20 text-destructive" }];

  const getVendorName = (vid: string | null) => {
    if (!vid) return "Unassigned";
    const v = vendors.find((v: any) => v.id === vid);
    return v?.name || vid.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Print Order Management</h1>
          <p className="text-sm text-muted-foreground">Full lifecycle: Received → Design Review → Vendor → Production → QC → Shipped → Delivered</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stageCounts.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.key} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setStatusFilter(s.key); setTab("list"); }}>
              <CardContent className="pt-3 pb-3 px-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold">{s.count}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-8 w-48 h-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {LIFECYCLE_STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LIST VIEW */}
        <TabsContent value="list">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>
                ) : filtered.map((o: any) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedOrder(o)}>
                    <TableCell className="font-mono text-xs">{o.order_number || o.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium text-sm">{o.product_name || o.product_type}</TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell className="text-xs">{getVendorName(o.vendor_id)}</TableCell>
                    <TableCell><Badge className={STATUS_COLOR[o.status] || ""}>{o.status?.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{o.total_price ? `$${Number(o.total_price).toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-xs">{o.due_date || "—"}</TableCell>
                    <TableCell className="text-xs">{format(new Date(o.created_at), "MMM d")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedOrder(o); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* KANBAN VIEW */}
        <TabsContent value="kanban">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {kanbanStages.map(stage => {
              const stageOrders = orders.filter((o: any) => o.status === stage.key);
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="min-w-[200px] flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 px-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">{stageOrders.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
                    {stageOrders.map((o: any) => (
                      <Card key={o.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelectedOrder(o)}>
                        <CardContent className="p-3">
                          <p className="text-xs font-mono text-muted-foreground">{o.order_number || o.id.slice(0, 8)}</p>
                          <p className="text-sm font-medium mt-1 truncate">{o.product_name || o.product_type}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">Qty: {o.quantity}</span>
                            <span className="text-xs font-semibold text-primary">{o.total_price ? `$${Number(o.total_price).toFixed(2)}` : ""}</span>
                          </div>
                          {o.rush_order && <Badge variant="destructive" className="text-[9px] mt-1">RUSH</Badge>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ORDER DETAIL DIALOG */}
      <Dialog open={!!selectedOrder} onOpenChange={o => !o && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Order: {selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                  {selectedOrder.rush_order && <Badge variant="destructive">RUSH</Badge>}
                </DialogTitle>
              </DialogHeader>

              {/* Status Timeline */}
              <div className="flex items-center gap-1 overflow-x-auto py-2">
                {LIFECYCLE_STAGES.map((stage, idx) => {
                  const currentIdx = LIFECYCLE_STAGES.findIndex(s => s.key === selectedOrder.status);
                  const isPast = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = stage.icon;
                  return (
                    <div key={stage.key} className="flex items-center gap-1">
                      <button
                        className={`flex flex-col items-center min-w-[70px] p-1 rounded transition-colors ${isCurrent ? "bg-primary/10 ring-1 ring-primary" : ""}`}
                        onClick={() => updateStatus.mutate({ id: selectedOrder.id, status: stage.key })}
                      >
                        <Icon className={`h-4 w-4 ${isPast ? "text-primary" : "text-muted-foreground/40"}`} />
                        <span className={`text-[9px] mt-0.5 ${isCurrent ? "font-bold text-primary" : isPast ? "text-foreground" : "text-muted-foreground/40"}`}>{stage.label}</span>
                      </button>
                      {idx < LIFECYCLE_STAGES.length - 1 && <div className={`w-4 h-0.5 ${isPast ? "bg-primary" : "bg-muted"}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Product:</span> <strong>{selectedOrder.product_name || selectedOrder.product_type}</strong></div>
                <div><span className="text-muted-foreground">Quantity:</span> <strong>{selectedOrder.quantity}</strong></div>
                <div><span className="text-muted-foreground">Total:</span> <strong>{selectedOrder.total_price ? `$${Number(selectedOrder.total_price).toFixed(2)}` : "—"}</strong></div>
                <div><span className="text-muted-foreground">Vendor Cost:</span> <strong>{selectedOrder.vendor_cost ? `$${Number(selectedOrder.vendor_cost).toFixed(2)}` : "—"}</strong></div>
                <div><span className="text-muted-foreground">Margin:</span> <strong>{selectedOrder.margin ? `${Number(selectedOrder.margin).toFixed(1)}%` : "—"}</strong></div>
                <div><span className="text-muted-foreground">Tracking:</span> <strong>{selectedOrder.shipping_tracking || "—"}</strong></div>
                <div><span className="text-muted-foreground">Due Date:</span> <strong>{selectedOrder.due_date || "—"}</strong></div>
                <div><span className="text-muted-foreground">Created:</span> <strong>{format(new Date(selectedOrder.created_at), "MMM d, yyyy")}</strong></div>
              </div>

              {/* Vendor Assignment */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Assign Vendor</label>
                <Select value={selectedOrder.vendor_id || ""} onValueChange={v => { assignVendor.mutate({ id: selectedOrder.id, vendor_id: v }); setSelectedOrder({ ...selectedOrder, vendor_id: v }); }}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Communications */}
              <div className="space-y-2">
                <p className="text-xs font-medium flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Communications</p>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-muted/30 rounded-lg p-2">
                  {comms.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>
                  ) : comms.map((c: any) => (
                    <div key={c.id} className={`text-xs p-2 rounded ${c.sender_type === "admin" ? "bg-primary/10 ml-4" : c.sender_type === "vendor" ? "bg-blue-500/10 mr-4" : "bg-muted"}`}>
                      <span className="font-semibold capitalize">{c.sender_type}:</span> {c.message}
                      <span className="text-muted-foreground ml-2">{format(new Date(c.created_at), "MMM d HH:mm")}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea className="h-16 text-sm" placeholder="Type a message to vendor or client..." value={newNote} onChange={e => setNewNote(e.target.value)} />
                  <Button size="sm" onClick={() => sendMessage.mutate()} disabled={!newNote.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: selectedOrder.id, status: "cancelled" })}>Cancel Order</Button>
                <Button size="sm" onClick={() => setSelectedOrder(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
