import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Truck, MessageSquare, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  received: "bg-info/20 text-info", design_review: "bg-warning/20 text-warning",
  sent_to_vendor: "bg-purple-500/20 text-purple-700", in_production: "bg-warning/20 text-warning",
  quality_check: "bg-info/20 text-info", shipped: "bg-success/20 text-success",
  delivered: "bg-success/20 text-success", cancelled: "bg-destructive/20 text-destructive",
};

export default function VendorPortal() {
  usePageMeta({ title: "Vendor Portal | NotarDex", description: "Manage your print orders, update statuses, and communicate with NotarDex." });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("print_orders").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const activeOrders = orders.filter((o: any) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o: any) => o.status === "delivered");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-6"><Package className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Vendor Portal</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{activeOrders.length}</p><p className="text-xs text-muted-foreground">Active Orders</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-info" /><div><p className="text-2xl font-bold">{orders.filter((o: any) => o.status === "in_production").length}</p><p className="text-xs text-muted-foreground">In Production</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><Truck className="h-5 w-5 text-success" /><div><p className="text-2xl font-bold">{orders.filter((o: any) => o.status === "shipped").length}</p><p className="text-xs text-muted-foreground">Shipped</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /><div><p className="text-2xl font-bold">{completedOrders.length}</p><p className="text-xs text-muted-foreground">Completed</p></div></div></CardContent></Card>
        </div>
        <Tabs defaultValue="active">
          <TabsList><TabsTrigger value="active">Active Orders</TabsTrigger><TabsTrigger value="completed">Completed</TabsTrigger><TabsTrigger value="messages">Messages</TabsTrigger></TabsList>
          <TabsContent value="active"><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Due</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> : activeOrders.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No active orders</TableCell></TableRow> : activeOrders.map((o: any) => (
              <TableRow key={o.id}><TableCell className="font-mono text-sm">{o.order_number || o.id.slice(0, 8)}</TableCell><TableCell>{o.product_type}</TableCell><TableCell>{o.quantity}</TableCell><TableCell><Badge className={STATUS_COLORS[o.status] || ""}>{o.status.replace(/_/g, " ")}</Badge></TableCell><TableCell>{o.due_date || "—"}</TableCell><TableCell>${Number(o.total_price || 0).toFixed(2)}</TableCell></TableRow>
            ))}</TableBody></Table></CardContent></Card></TabsContent>
          <TabsContent value="completed"><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Delivered</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody>
            {completedOrders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No completed orders</TableCell></TableRow> : completedOrders.map((o: any) => (
              <TableRow key={o.id}><TableCell className="font-mono text-sm">{o.order_number || o.id.slice(0, 8)}</TableCell><TableCell>{o.product_type}</TableCell><TableCell>{o.quantity}</TableCell><TableCell>{o.updated_at ? new Date(o.updated_at).toLocaleDateString() : "—"}</TableCell><TableCell>${Number(o.total_price || 0).toFixed(2)}</TableCell></TableRow>
            ))}</TableBody></Table></CardContent></Card></TabsContent>
          <TabsContent value="messages"><Card><CardContent className="py-12 text-center text-muted-foreground"><MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" /><p className="font-medium">Order Communications</p><p className="text-sm">Select an order to view or send messages.</p></CardContent></Card></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
