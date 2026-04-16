/**
 * Shop Checkout — /shop/checkout
 * Creates Stripe checkout session via shop-checkout edge function and redirects.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, useShopPackages, useShopAddons } from "@/hooks/useShop";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { toast } from "sonner";

export default function ShopCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, isLoading } = useCart();
  const { data: packages } = useShopPackages();
  const { data: addons } = useShopAddons();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !isLoading) navigate("/login?returnUrl=/shop/checkout");
  }, [user, isLoading, navigate]);

  const getDetails = (item: any) => {
    if (item.item_type === "package") {
      const pkg = packages?.find(p => p.id === item.item_id);
      if (!pkg) return { name: "Unknown Package", price: 0 };
      const priceKey = `${item.variation}_price` as any;
      return { name: `${pkg.tier_name} (${item.variation})`, price: (pkg as any)[priceKey] || 0 };
    }
    const addon = addons?.find(a => a.id === item.item_id);
    return { name: addon?.name || "Unknown Add-On", price: addon?.price || 0 };
  };

  const subtotal = cart.reduce((s, i) => s + getDetails(i).price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.0775 * 100) / 100; // OH 7.75% est.
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!user || cart.length === 0) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("shop-checkout", {
        body: {
          items: cart.map(i => ({
            item_type: i.item_type,
            item_id: i.item_id,
            variation: i.variation,
            quantity: i.quantity,
            ...getDetails(i),
          })),
          subtotal,
          tax,
          total,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err?.message || "Checkout failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (cart.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="rounded-[24px] max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-bold">Your cart is empty</h2>
            <Link to="/shop"><Button className="rounded-full">Browse Shop</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageErrorBoundary pageName="Shop Checkout">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link to="/shop/cart" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>

          <h1 className="text-3xl font-black mb-6">Checkout</h1>

          <div className="space-y-4">
            <Card className="rounded-[24px]">
              <CardContent className="pt-6 space-y-3">
                <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Order Summary</h2>
                {cart.map(item => {
                  const d = getDetails(item);
                  return (
                    <div key={item.id} className="flex justify-between text-sm py-2">
                      <span>{d.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
                      <span className="font-medium">${(d.price * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-muted-foreground"><span>Tax (est.)</span><span>${tax.toFixed(2)}</span></div>
                <Separator />
                <div className="flex justify-between font-black text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px]">
              <CardContent className="pt-6 space-y-3">
                <Button
                  className="w-full rounded-full font-bold"
                  size="lg"
                  variant="accent"
                  onClick={handleCheckout}
                  disabled={submitting}
                >
                  {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>) : `Pay $${total.toFixed(2)} with Stripe`}
                </Button>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Secure checkout powered by Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
