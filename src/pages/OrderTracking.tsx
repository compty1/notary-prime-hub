import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, CheckCircle, Clock, Truck, Loader2, AlertCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const STATUS_STEPS = ["received", "in_progress", "ready", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  received: "Order Received", in_progress: "In Progress", ready: "Ready",
  shipped: "Shipped", delivered: "Delivered", pending: "Pending",
};

export default function OrderTracking() {
  usePageMeta({ title: "Track Your Order | Notar", description: "Track the status of your print or service order" });
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true); setError(""); setOrder(null);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber.trim().toUpperCase())
      .limit(1)
      .maybeSingle();
    if (err || !data) setError("Order not found. Please check the order number and try again.");
    else setOrder(data);
    setLoading(false);
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <PageShell>
      <div className="container mx-auto max-w-2xl py-12 px-4">
        <Breadcrumbs />
        <h1 className="font-heading text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground mb-8">Enter your order number to see real-time status updates.</p>

        <div className="flex gap-2 mb-8">
          <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="e.g. NTR-20260412-00001"
            onKeyDown={e => e.key === "Enter" && search()} className="flex-1" />
          <Button onClick={search} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="mr-1.5 h-4 w-4" /> Track</>}
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/30">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {order && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Package className="h-5 w-5" /> {order.order_number}</span>
                <Badge>{STATUS_LABELS[order.status] || order.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i === currentStep ? <Clock className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                    </div>
                    <span className="text-[10px] text-center">{STATUS_LABELS[step]}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 text-sm">
                {order.product_type && <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span>{order.product_type}</span></div>}
                {order.quantity && <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span>{order.quantity}</span></div>}
                {order.total_price && <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>${Number(order.total_price).toFixed(2)}</span></div>}
                {order.tracking_number && <div className="flex justify-between"><span className="text-muted-foreground">Tracking #</span><span className="font-mono">{order.tracking_number}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Ordered</span><span>{new Date(order.created_at).toLocaleDateString()}</span></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
