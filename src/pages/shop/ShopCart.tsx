/**
 * Shopping Cart — /shop/cart
 */
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, useShopPackages, useShopAddons } from "@/hooks/useShop";
import { Trash2, ArrowLeft, ShoppingCart, Package } from "lucide-react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

export default function ShopCart() {
  const { user } = useAuth();
  const { cart, isLoading, removeFromCart, clearCart } = useCart();
  const { data: packages } = useShopPackages();
  const { data: addons } = useShopAddons();

  const getItemDetails = (item: any) => {
    if (item.item_type === "package") {
      const pkg = packages?.find(p => p.id === item.item_id);
      if (!pkg) return { name: "Unknown Package", price: 0 };
      const priceKey = `${item.variation}_price` as any;
      return { name: `${pkg.tier_name} Package (${item.variation})`, price: (pkg as any)[priceKey] || 0 };
    }
    const addon = addons?.find(a => a.id === item.item_id);
    return { name: addon?.name || "Unknown Add-On", price: addon?.price || 0 };
  };

  const total = cart.reduce((sum, item) => {
    const details = getItemDetails(item);
    return sum + details.price * item.quantity;
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="rounded-[24px] max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Sign in to view your cart</h2>
            <Link to="/login"><Button className="rounded-full">Sign In</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageErrorBoundary pageName="Cart">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Link>

          <h1 className="text-3xl font-black mb-6 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" /> Your Cart
          </h1>

          {cart.length === 0 ? (
            <Card className="rounded-[24px]">
              <CardContent className="py-12 text-center space-y-4">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <h2 className="text-xl font-bold">Your cart is empty</h2>
                <p className="text-muted-foreground">Browse our packages and add-ons to get started.</p>
                <Link to="/shop"><Button className="rounded-full">Browse Shop</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="rounded-[24px]">
                <CardContent className="pt-6 space-y-4">
                  {cart.map(item => {
                    const details = getItemDetails(item);
                    return (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-sm">{details.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">${(details.price * item.quantity).toFixed(2)}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart.mutate(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-[24px]">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-black text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  <Button className="w-full rounded-full font-bold" size="lg" disabled>
                    Proceed to Checkout — ${total.toFixed(2)}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Secure checkout powered by Stripe</p>
                  <Button variant="ghost" size="sm" className="w-full text-xs text-destructive"
                    onClick={() => clearCart.mutate()}>
                    Clear Cart
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
