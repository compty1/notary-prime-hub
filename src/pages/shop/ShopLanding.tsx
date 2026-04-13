/**
 * Shop Landing Page — /shop
 * Hero, persona filter, 4-tier comparison cards, trust signals
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopPackages, useCart } from "@/hooks/useShop";
import { ShoppingCart, Star, Shield, Truck, CheckCircle, Package } from "lucide-react";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";

type Variation = "physical" | "digital" | "complete";

const VARIATION_LABELS: Record<Variation, string> = {
  physical: "Physical Kit",
  digital: "Digital Only",
  complete: "Complete Bundle",
};

export default function ShopLanding() {
  const { data: packages, isLoading } = useShopPackages();
  const { addToCart } = useCart();
  const [variation, setVariation] = useState<Variation>("complete");

  const getPrice = (pkg: any) => {
    if (variation === "physical") return pkg.physical_price;
    if (variation === "digital") return pkg.digital_price;
    return pkg.complete_price;
  };

  return (
    <PageErrorBoundary pageName="Shop">
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Package className="h-3 w-3 mr-1" /> Notary Supply Shop
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Everything You Need to{" "}
              <span className="text-primary">Start & Grow</span> Your Notary Business
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Professional packages with Ohio-compliant supplies, digital tools, and marketing essentials. Choose your tier and get started today.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {(Object.entries(VARIATION_LABELS) as [Variation, string][]).map(([key, label]) => (
                <Button
                  key={key}
                  variant={variation === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVariation(key)}
                  className="rounded-full"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Package Grid */}
        <section className="container mx-auto px-4 py-12 -mt-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-[480px] rounded-[24px]" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages?.map(pkg => {
                const price = getPrice(pkg);
                const isPopular = pkg.badge === "Most Popular";
                return (
                  <Card
                    key={pkg.id}
                    className={`relative rounded-[24px] overflow-hidden transition-all hover:shadow-lg ${
                      isPopular ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""
                    }`}
                  >
                    {pkg.badge && (
                      <div className={`absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-bold ${
                        isPopular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {pkg.badge}
                      </div>
                    )}
                    <CardHeader className={pkg.badge ? "pt-10" : ""}>
                      <CardTitle className="text-xl font-black">{pkg.tier_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{pkg.tagline}</p>
                      <div className="mt-3">
                        <span className="text-3xl font-black">${price}</span>
                        <span className="text-sm text-muted-foreground ml-1">/ {VARIATION_LABELS[variation].toLowerCase()}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {pkg.features.slice(0, 6).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                        {pkg.features.length > 6 && (
                          <li className="text-xs text-muted-foreground pl-6">
                            +{pkg.features.length - 6} more features
                          </li>
                        )}
                      </ul>
                      <div className="space-y-2 pt-2">
                        <Button
                          className="w-full rounded-full font-bold"
                          onClick={() => addToCart.mutate({ item_type: "package", item_id: pkg.id, variation })}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                        </Button>
                        <Link to={`/shop/${pkg.slug}`}>
                          <Button variant="ghost" className="w-full text-xs">
                            View Full Details →
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Trust Signals */}
        <section className="container mx-auto px-4 py-12 border-t">
          <div className="grid md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Shield, title: "Ohio Compliant", desc: "All supplies meet ORC §147 requirements" },
              { icon: Truck, title: "Fast Shipping", desc: "Physical kits ship within 2 business days" },
              { icon: Star, title: "Professional Grade", desc: "Premium materials built to last" },
              { icon: CheckCircle, title: "Satisfaction Guaranteed", desc: "30-day return policy on all items" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Add-ons CTA */}
        <section className="container mx-auto px-4 py-12">
          <Card className="rounded-[24px] bg-gradient-to-r from-primary/5 to-accent/10 border-primary/20">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
              <div>
                <h2 className="text-2xl font-black mb-2">Need Individual Items?</h2>
                <p className="text-muted-foreground">Browse our add-on marketplace for stamps, journals, digital tools, and marketing materials.</p>
              </div>
              <Link to="/shop/add-ons">
                <Button size="lg" variant="outline" className="rounded-full font-bold whitespace-nowrap">
                  Browse Add-Ons →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageErrorBoundary>
  );
}
