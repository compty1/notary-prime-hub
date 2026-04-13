/**
 * Layer 2: Dashboard contextual shop recommendation widget
 */
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Sparkles } from "lucide-react";
import { useShopPackages } from "@/hooks/useShop";

export function ShopRecommendationWidget() {
  const { data: packages } = useShopPackages();
  const starter = packages?.find(p => p.slug === "starter");

  if (!starter) return null;

  return (
    <Card className="rounded-[24px] border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Get Started Faster
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Our Starter Package includes everything you need for your first notarization — stamp, journal, and more.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-primary">From ${starter.physical_price}</span>
          <Link to="/shop">
            <Button size="sm" className="rounded-full text-xs">
              <ShoppingCart className="h-3 w-3 mr-1" /> Shop Now
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
