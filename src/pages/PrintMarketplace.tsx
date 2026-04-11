import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PRINT_CATEGORIES, PRINT_PRODUCTS, type PrintProduct } from "@/lib/printCatalog";
import { PrintOrderTracker } from "@/components/PrintOrderTracker";
import { Search, ShoppingCart, Package, Minus, Plus, PenTool } from "lucide-react";

export default function PrintMarketplace() {
  const navigate = useNavigate();
  usePageMeta({
    title: "Print & Brand Shop | NotarDex",
    description: "Order custom business cards, stationery, signage, apparel, and notary supplies. Professional printing with fast turnaround.",
  });

  const { toast } = useToast();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(null);
  const [selectedQty, setSelectedQty] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<{ product: PrintProduct; qty: number; options: Record<string, string>; price: number }[]>([]);

  const filtered = useMemo(() => {
    return PRINT_PRODUCTS.filter(p => {
      if (category !== "all" && p.category !== category) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => a.sort_order - b.sort_order);
  }, [category, search]);

  const getPrice = (product: PrintProduct, qty: number) => {
    const tier = [...product.price_tiers].reverse().find(t => qty >= t.qty);
    return tier ? tier.price : product.base_price;
  };

  const openProduct = (p: PrintProduct) => {
    setSelectedProduct(p);
    setSelectedQty(p.min_quantity);
    const defaults: Record<string, string> = {};
    p.options.forEach(o => { defaults[o.name] = o.values[0]; });
    setSelectedOptions(defaults);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const price = getPrice(selectedProduct, selectedQty);
    setCart(prev => [...prev, { product: selectedProduct, qty: selectedQty, options: { ...selectedOptions }, price }]);
    setSelectedProduct(null);
    toast({ title: "Added to cart", description: `${selectedProduct.name} × ${selectedQty}` });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading text-foreground">Print & Brand Shop</h1>
            <p className="text-muted-foreground mt-1">Professional printing for your business</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/design/studio")}>
              <PenTool className="h-4 w-4" /> Design Studio
            </Button>
            {cart.length > 0 && (
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart ({cart.length}) — ${cartTotal.toFixed(2)}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={category === "all" ? "default" : "outline"} size="sm" onClick={() => setCategory("all")}>All</Button>
            {PRINT_CATEGORIES.map(c => (
              <Button key={c.id} variant={category === c.id ? "default" : "outline"} size="sm" onClick={() => setCategory(c.id)}>
                {c.icon} {c.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid + Order Tracker */}
        <div className="flex gap-6">
          <div className="flex-1">
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p, i) => (
                <Card key={i} className="cursor-pointer hover:border-primary/40 transition-colors group" onClick={() => openProduct(p)}>
                  <CardHeader className="pb-2">
                    <div className="h-32 rounded-lg bg-muted flex items-center justify-center mb-2">
                      <Package className="h-12 w-12 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                    <CardTitle className="text-sm font-medium">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">From ${p.base_price.toFixed(2)}</span>
                      <Badge variant="outline" className="text-[10px]">{p.turnaround_days}-day</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No products found</p>
              </div>
            )}
          </div>

          {/* Sidebar Order Tracker */}
          {cart.length > 0 && (
            <div className="hidden lg:block w-80 shrink-0">
              <div className="sticky top-24">
                <PrintOrderTracker cart={cart} onClearCart={() => setCart([])} />
              </div>
            </div>
          )}
        </div>

        {/* Product Detail Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={o => !o && setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-lg">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedProduct.name}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>

                {/* Options */}
                {selectedProduct.options.map(opt => (
                  <div key={opt.name} className="space-y-1">
                    <label className="text-xs font-medium">{opt.name}</label>
                    <Select value={selectedOptions[opt.name] || opt.values[0]} onValueChange={v => setSelectedOptions(prev => ({ ...prev, [opt.name]: v }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {opt.values.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-medium">Quantity (min {selectedProduct.min_quantity})</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedQty(q => Math.max(selectedProduct.min_quantity, q - selectedProduct.min_quantity))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input type="number" value={selectedQty} onChange={e => setSelectedQty(Math.max(selectedProduct.min_quantity, Number(e.target.value)))} className="w-24 h-8 text-center" />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedQty(q => q + selectedProduct.min_quantity)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Pricing Tiers */}
                <div className="text-xs space-y-1">
                  <p className="font-medium">Volume Pricing</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedProduct.price_tiers.map((t, i) => (
                      <Badge key={i} variant={selectedQty >= t.qty ? "default" : "outline"} className="text-[10px]">
                        {t.qty}+ → ${t.price.toFixed(2)} ea
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Estimated Total</p>
                  <p className="text-2xl font-bold text-primary">${(getPrice(selectedProduct, selectedQty) * selectedQty).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{selectedProduct.turnaround_days}-day turnaround</p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
                  <Button onClick={addToCart} className="gap-2">
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
