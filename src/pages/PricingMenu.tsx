import { useState, useMemo } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICE_PRICING, PRICING_CATEGORIES } from "@/lib/servicePricing";
import { Search, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PricingMenu() {
  usePageMeta({
    title: "Pricing Menu | NotarDex",
    description: "Transparent pricing for notarization, document services, business filings, and more. Ohio-compliant rates.",
  });

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const categories = Object.entries(PRICING_CATEGORIES);

  const filtered = useMemo(() => {
    return SERVICE_PRICING.filter(s => {
      if (activeCategory !== "all" && s.category !== activeCategory) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeCategory, search]);

  const popularServices = SERVICE_PRICING.filter(s => s.popular);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading text-foreground mb-3">Service Pricing</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparent, competitive pricing for all our services. Ohio-compliant notarization rates per ORC §147.08.
          </p>
        </div>

        {/* Popular Services */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Most Popular
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularServices.map((s, i) => (
              <Card key={i} className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sm">{s.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-primary">
                        ${s.priceFrom}{s.priceTo ? `–$${s.priceTo}` : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{s.priceUnit}</p>
                    </div>
                  </div>
                  {s.compliance && (
                    <Badge variant="outline" className="mt-2 text-[10px]">{s.compliance}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="all" className="text-xs">All Services</TabsTrigger>
            {categories.map(([key, { label, icon }]) => (
              <TabsTrigger key={key} value={key} className="text-xs">{icon} {label}</TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No services match your search.</p>
            )}
            {filtered.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{s.name}</h3>
                    {s.popular && <Badge className="text-[10px] h-4">Popular</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  {s.compliance && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{s.compliance}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-semibold text-foreground">
                    ${s.priceFrom.toFixed(2)}{s.priceTo ? ` – $${s.priceTo.toFixed(2)}` : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.priceUnit}</p>
                </div>
              </div>
            ))}
          </div>
        </Tabs>

        {/* Travel Zones */}
        <div className="mt-10 mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">📍 Service Area & Travel Zones</h2>
          <p className="text-sm text-muted-foreground mb-4">Zone-based travel from West Jefferson, OH 43162. Travel under 5 miles is free.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { zone: 1, range: "0–15 mi", fee: "$25", areas: "West Jefferson, Plain City, London" },
              { zone: 2, range: "15–30 mi", fee: "$40", areas: "Columbus, Hilliard, Dublin, Grove City" },
              { zone: 3, range: "30–45 mi", fee: "$55", areas: "Delaware, Marysville, Circleville" },
              { zone: 4, range: "45+ mi", fee: "$55 + $1.50/mi", areas: "Dayton, Springfield, Zanesville" },
            ].map(z => (
              <Card key={z.zone} className="border-primary/10">
                <CardContent className="pt-4 pb-3">
                  <p className="font-semibold text-sm">Zone {z.zone}</p>
                  <p className="text-xs text-muted-foreground">{z.range}</p>
                  <p className="font-bold text-primary text-sm mt-1">{z.fee}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{z.areas}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cancellation & Payment Policies */}
        <div className="grid gap-6 sm:grid-cols-2 mt-6 mb-10">
          <Card>
            <CardContent className="pt-5 space-y-2">
              <h3 className="font-semibold text-sm">🛡️ Cancellation & No-Show Policy</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Less than 2 hours notice: <strong>$40 fee</strong></li>
                <li>• 2–24 hours notice: <strong>$25 fee</strong></li>
                <li>• No-show: <strong>$50 fee</strong> (loan signing = full charge)</li>
                <li>• Wait time: <strong>$20 per 15 min</strong> after grace period</li>
                <li>• Reschedule: <strong>Free</strong> with 4+ hours notice</li>
                <li>• Weekends: <strong>No surcharge</strong> — competitive advantage</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-2">
              <h3 className="font-semibold text-sm">💳 Accepted Payment Methods</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Credit & Debit Cards (Visa, MC, Amex, Discover)</li>
                <li>• Venmo, Zelle, CashApp</li>
                <li>• Apple Pay & Google Pay</li>
                <li>• Cash (in-person appointments only)</li>
                <li>• Invoice / Net-30 (business accounts)</li>
              </ul>
              <p className="text-[10px] text-muted-foreground italic mt-2">25% deposit due at booking. Balance due at appointment.</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
          <h2 className="text-xl font-bold mb-2">Need a Custom Quote?</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Volume discounts available for businesses. Contact us for custom pricing.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild>
              <Link to="/book">Book Appointment <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/request">Request Quote</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
