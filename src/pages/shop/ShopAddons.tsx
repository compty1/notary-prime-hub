/**
 * Add-on Marketplace — /shop/add-ons
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopAddons, useCart } from "@/hooks/useShop";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "supplies", label: "Supplies" },
  { key: "digital", label: "Digital Tools" },
  { key: "branding", label: "Branding" },
  { key: "marketing", label: "Marketing" },
];

export default function ShopAddons() {
  const [category, setCategory] = useState("all");
  const { data: addons, isLoading } = useShopAddons(category);
  const { addToCart } = useCart();

  return (
    <PageErrorBoundary pageName="Add-Ons">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>

          <h1 className="text-3xl font-black mb-2">Add-On Marketplace</h1>
          <p className="text-muted-foreground mb-6">Individual supplies, tools, and services to enhance your notary practice.</p>

          <div className="flex gap-2 mb-8 flex-wrap">
            {CATEGORIES.map(c => (
              <Button key={c.key} size="sm" variant={category === c.key ? "default" : "outline"}
                className="rounded-full" onClick={() => setCategory(c.key)}>
                {c.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[24px]" />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {addons?.map(addon => (
                <Card key={addon.id} className="rounded-[24px] hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-3">
                    <Badge variant="outline" className="text-xs capitalize">{addon.category}</Badge>
                    <h3 className="font-bold text-sm">{addon.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{addon.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-black">${addon.price}</span>
                      <Button size="sm" className="rounded-full"
                        onClick={() => addToCart.mutate({ item_type: "addon", item_id: addon.id })}>
                        <ShoppingCart className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {addon.sku && <p className="text-[10px] text-muted-foreground">SKU: {addon.sku}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
