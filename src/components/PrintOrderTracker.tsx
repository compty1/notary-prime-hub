import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle2, Clock, MapPin } from "lucide-react";

interface OrderItem {
  product: { name: string };
  qty: number;
  options: Record<string, string>;
  price: number;
}

interface PrintOrderTrackerProps {
  cart: OrderItem[];
  onClearCart: () => void;
}

const ORDER_STATUSES = [
  { key: "pending", label: "Order Placed", icon: Clock, color: "text-yellow-500" },
  { key: "production", label: "In Production", icon: Package, color: "text-blue-500" },
  { key: "shipped", label: "Shipped", icon: Truck, color: "text-purple-500" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, color: "text-green-500" },
];

export function PrintOrderTracker({ cart, onClearCart }: PrintOrderTrackerProps) {
  const [showTracker, setShowTracker] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const currentStatus = "pending";

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    setShowTracker(true);
  };

  if (cart.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {orderPlaced ? "Order Status" : "Your Cart"}
          <Badge variant="secondary" className="ml-auto">{cart.length} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cart.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b border-border pb-2">
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.qty} • {Object.values(item.options).join(", ")}
                </p>
              </div>
              <span className="font-semibold text-primary">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
        </div>

        {/* Order Status Timeline */}
        {orderPlaced && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-3">SHIPMENT TRACKING</p>
            <div className="flex items-center gap-1">
              {ORDER_STATUSES.map((status, idx) => {
                const isActive = status.key === currentStatus;
                const isPast = idx <= ORDER_STATUSES.findIndex(s => s.key === currentStatus);
                const Icon = status.icon;
                return (
                  <div key={status.key} className="flex-1 flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isPast ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${isPast ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-[10px] mt-1 text-center ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {status.label}
                    </span>
                    {idx < ORDER_STATUSES.length - 1 && (
                      <div className={`h-0.5 w-full mt-1 ${isPast ? "bg-primary/40" : "bg-muted"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Estimated delivery: 5–7 business days</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!orderPlaced ? (
            <>
              <Button onClick={handlePlaceOrder} className="flex-1">Place Order</Button>
              <Button variant="outline" onClick={onClearCart}>Clear</Button>
            </>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => { onClearCart(); setOrderPlaced(false); setShowTracker(false); }}>
              New Order
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
