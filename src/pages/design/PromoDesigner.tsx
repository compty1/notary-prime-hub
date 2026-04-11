import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductPreview3D } from "@/components/ProductPreview3D";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Palette, Upload } from "lucide-react";

const PRODUCT_TYPES = ["Pens", "Mugs (11oz)", "Mugs (15oz)", "Tote Bags", "Koozies", "Keychains", "Lanyards", "Magnets", "Mousepads", "USB Drives"];
const PRINT_AREAS = ["Full Wrap", "One Side", "Front & Back", "Laser Engraved"];

export default function PromoDesigner() {
  usePageMeta({ title: "Promotional Item Designer | NotarDex", description: "Customize promotional items with your logo and branding." });
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    product: PRODUCT_TYPES[0], printArea: PRINT_AREAS[1], color: "#1a1a2e",
    text: "", quantity: 100,
  });
  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const priceMap: Record<string, number> = {
    Pens: 0.89, "Mugs (11oz)": 5.99, "Mugs (15oz)": 7.99, "Tote Bags": 3.49,
    Koozies: 1.29, Keychains: 1.99, Lanyards: 1.49, Magnets: 0.79, Mousepads: 4.99, "USB Drives": 6.99,
  };
  const unitPrice = priceMap[form.product] || 1.99;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <Palette className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Promotional Item Designer</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px]">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/30">
                  <span className="text-3xl mb-2">{form.product.includes("Mug") ? "☕" : form.product === "Pens" ? "🖊️" : form.product === "Tote Bags" ? "👜" : form.product === "Keychains" ? "🔑" : "🎁"}</span>
                  {form.text && <p className="text-xs font-medium text-center px-2" style={{ color: form.color }}>{form.text}</p>}
                </div>
              </CardContent>
            </Card>
            <ProductPreview3D productType="promotional" label="Product Mockup" className="h-40" />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Product Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Product Type</Label><Select value={form.product} onValueChange={v => update("product", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Print Area</Label><Select value={form.printArea} onValueChange={v => update("printArea", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRINT_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Imprint Text</Label><Input value={form.text} onChange={e => update("text", e.target.value)} placeholder="NotarDex.com" /></div>
                <div><Label>Imprint Color</Label><Input type="color" value={form.color} onChange={e => update("color", e.target.value)} /></div>
                <Button variant="outline" className="w-full"><Upload className="h-4 w-4 mr-2" />Upload Logo</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} min={25} step={25} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price:</span><span>${unitPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Est. Total:</span><span>${(form.quantity * unitPrice).toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => { toast({ title: "Added to cart" }); navigate("/print-shop"); }}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
