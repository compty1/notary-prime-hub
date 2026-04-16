/**
 * Shop Packages Comparison — /shop/packages
 * 4-tier side-by-side comparison grid.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useShopPackages } from "@/hooks/useShop";
import { Check, ArrowLeft, Crown } from "lucide-react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopPackages() {
  const { data: packages, isLoading } = useShopPackages();

  return (
    <PageErrorBoundary pageName="Shop Packages">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>

          <div className="text-center mb-10 space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Compare Packages</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find the right starter bundle for your notary practice. All tiers include physical, digital, and complete variations.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[600px] rounded-[24px]" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages?.map((pkg) => {
                const isAuthority = pkg.slug === "authority";
                return (
                  <Card key={pkg.id} className={`rounded-[24px] flex flex-col ${isAuthority ? "border-primary border-2 shadow-lg" : ""}`}>
                    <CardContent className="pt-6 flex-1 flex flex-col">
                      {pkg.badge && (
                        <Badge variant={isAuthority ? "default" : "secondary"} className="self-start mb-3">
                          {isAuthority && <Crown className="h-3 w-3 mr-1" />}
                          {pkg.badge}
                        </Badge>
                      )}
                      <h3 className="text-2xl font-black">{pkg.tier_name}</h3>
                      {pkg.tagline && <p className="text-sm text-muted-foreground mt-1">{pkg.tagline}</p>}

                      <div className="my-4">
                        <span className="text-4xl font-black">${pkg.complete_price ?? pkg.physical_price}</span>
                        <span className="text-sm text-muted-foreground ml-1">complete</span>
                      </div>

                      {pkg.persona_match && (
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{pkg.persona_match}</p>
                      )}

                      <Separator className="my-3" />

                      <ul className="space-y-2 flex-1">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <Link to={`/shop/${pkg.slug}`} className="mt-6">
                        <Button className="w-full rounded-full font-bold" variant={isAuthority ? "accent" : "default"}>
                          Select {pkg.tier_name}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageErrorBoundary>
  );
}
