import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ShoppingBag } from "lucide-react";

export default function AdminPrintOrders() {
  usePageMeta({ title: "Print Marketplace", noIndex: true });

  const { data: orders = [] } = useQuery({
    queryKey: ["print-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("print_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["print-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("print_products").select("*").order("name");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Print Marketplace</h1>
          <p className="text-sm text-muted-foreground">Orders, product catalog, and vendor management.</p>
        </div>
      </div>
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Total</TableHead>
                <TableHead>Tracking</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders</TableCell></TableRow>
                ) : orders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.product_name}</TableCell>
                    <TableCell>{o.quantity}</TableCell>
                    <TableCell>{o.total_price ? `$${Number(o.total_price).toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-xs">{o.shipping_tracking || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                    <TableCell>{format(new Date(o.created_at), "MMM d")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="products">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Base Price</TableHead><TableHead>Active</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No products</TableCell></TableRow>
                ) : products.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="capitalize">{p.category}</TableCell>
                    <TableCell>${Number(p.base_price).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="vendors">
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vendor</TableHead><TableHead>Email</TableHead><TableHead>Turnaround</TableHead><TableHead>Active</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No vendors</TableCell></TableRow>
                ) : vendors.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.contact_email || "—"}</TableCell>
                    <TableCell>{v.turnaround_days} days</TableCell>
                    <TableCell><Badge variant={v.is_active ? "default" : "secondary"}>{v.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
