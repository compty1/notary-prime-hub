/**
 * Individual package detail page — /shop/:tier
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useShopPackages, useShopAddons, useCart } from "@/hooks/useShop";
import { CheckCircle, ShoppingCart, ArrowLeft, Package } from "lucide-react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

type Variation = "physical" | "digital" | "complete";

export default function ShopPackageDetail() {
  const { tier } = useParams<{ tier: string }>();
  const { data: packages, isLoading } = useShopPackages();
  const { data: addons } = useShopAddons();
  const { addToCart } = useCart();
  const [variation, setVariation] = useState<Variation>("complete");

  const pkg = packages?.find(p => p.slug === tier);
  const compatibleAddons = addons?.filter(a => a.compatible_tiers.includes(tier || "")) || [];

  if (isLoading) return <div className="container mx-auto py-12 px-4"><Skeleton className="h-96 rounded-[24px]" /></div>;
  if (!pkg) return <div className="container mx-auto py-12 px-4 text-center"><h1 className="text-2xl font-bold">Package not found</h1><Link to="/shop" className="text-primary underline mt-4 block">← Back to Shop</Link></div>;

  const prices: Record<Variation, number | null> = { physical: pkg.physical_price, digital: pkg.digital_price, complete: pkg.complete_price };

  return (
    <PageErrorBoundary pageName="Package Detail">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                {pkg.badge && <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">{pkg.badge}</Badge>}
                <h1 className="text-3xl font-black">{pkg.tier_name} Package</h1>
                <p className="text-muted-foreground mt-1">{pkg.tagline}</p>
                {pkg.persona_match && <p className="text-sm text-muted-foreground mt-2 italic">Perfect for: {pkg.persona_match}</p>}
              </div>

              <Card className="rounded-[24px]">
                <CardContent className="pt-6">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Package className="h-5 w-5" /> What's Included</h2>
                  <ul className="space-y-3">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {compatibleAddons.length > 0 && (
                <Card className="rounded-[24px]">
                  <CardContent className="pt-6">
                    <h2 className="font-bold text-lg mb-4">Recommended Add-Ons</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {compatibleAddons.slice(0, 4).map(addon => (
                        <div key={addon.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                          <div>
                            <p className="text-sm font-medium">{addon.name}</p>
                            <p className="text-xs text-muted-foreground">${addon.price}</p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full text-xs"
                            onClick={() => addToCart.mutate({ item_type: "addon", item_id: addon.id })}>
                            + Add
                          </Button>
                        </div>
                      ))}
                    </div>
                    {compatibleAddons.length > 4 && (
                      <Link to="/shop/add-ons" className="text-sm text-primary hover:underline mt-3 block">
                        View all {compatibleAddons.length} compatible add-ons →
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar — Price + CTA */}
            <div className="lg:col-span-2">
              <Card className="rounded-[24px] sticky top-6">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-2">
                    {(["physical", "digital", "complete"] as Variation[]).map(v => (
                      <Button key={v} size="sm" variant={variation === v ? "default" : "outline"}
                        className="rounded-full flex-1 text-xs capitalize" onClick={() => setVariation(v)}>
                        {v}
                      </Button>
                    ))}
                  </div>
                  <Separator />
                  <div className="text-center py-2">
                    <span className="text-4xl font-black">${prices[variation]}</span>
                    <p className="text-xs text-muted-foreground mt-1">One-time purchase</p>
                  </div>
                  <Button className="w-full rounded-full font-bold" size="lg"
                    onClick={() => addToCart.mutate({ item_type: "package", item_id: pkg.id, variation })}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>✓ Ohio ORC §147 compliant</p>
                    <p>✓ 30-day satisfaction guarantee</p>
                    <p>✓ Secure Stripe checkout</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
