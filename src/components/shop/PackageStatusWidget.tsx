/**
 * Layer 2: Active package status widget for notary dashboard.
 * Shows most recent paid shop_orders + reorder CTA.
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Package, RotateCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function PackageStatusWidget() {
  const { user } = useAuth();

  const { data: order } = useQuery({
    queryKey: ["latest-shop-order", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("shop_orders" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  if (!user || !order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const packageItem = items.find((i: any) => i.item_type === "package");
  const isAuthority = packageItem?.name?.toLowerCase().includes("authority");

  return (
    <Card className="rounded-[24px] border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          {isAuthority ? <Crown className="h-4 w-4 text-primary" /> : <Package className="h-4 w-4 text-primary" />}
          Active Package
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">{packageItem?.name || "Notary Package"}</p>
            <p className="text-xs text-muted-foreground">
              Purchased {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          {isAuthority && <Badge variant="default" className="text-xs">Priority</Badge>}
        </div>
        <div className="flex gap-2">
          <Link to="/shop/add-ons" className="flex-1">
            <Button size="sm" variant="outline" className="w-full rounded-full text-xs">
              <RotateCw className="h-3 w-3 mr-1" /> Reorder Supplies
            </Button>
          </Link>
          <Link to="/shop/packages" className="flex-1">
            <Button size="sm" className="w-full rounded-full text-xs">Upgrade</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
