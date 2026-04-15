import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductScene3D } from "@/components/design/ProductScene3D";
import { DesignFileUpload } from "@/components/design/DesignFileUpload";
import { useDesignState } from "@/hooks/useDesignState";
import { useDesignCart } from "@/hooks/useDesignCart";
import { ArrowLeft, ShoppingCart, Palette, RotateCcw } from "lucide-react";

const PRODUCT_TYPES = ["Pens", "Mugs (11oz)", "Mugs (15oz)", "Tote Bags", "Koozies", "Keychains", "Lanyards", "Magnets", "Mousepads", "USB Drives"];
const PRINT_AREAS = ["Full Wrap", "One Side", "Front & Back", "Laser Engraved"];

const PRODUCT_EMOJI: Record<string, string> = {
  Pens: "🖊️", "Mugs (11oz)": "☕", "Mugs (15oz)": "☕", "Tote Bags": "👜",
  Koozies: "🥤", Keychains: "🔑", Lanyards: "🪪", Magnets: "🧲", Mousepads: "🖱️", "USB Drives": "💾",
};

const PRICE_MAP: Record<string, number> = {
  Pens: 0.89, "Mugs (11oz)": 5.99, "Mugs (15oz)": 7.99, "Tote Bags": 3.49,
  Koozies: 1.29, Keychains: 1.99, Lanyards: 1.49, Magnets: 0.79, Mousepads: 4.99, "USB Drives": 6.99,
};

export default function PromoDesigner() {
  usePageMeta({ title: "Promotional Item Designer | NotarDex", description: "Customize promotional items with your logo and branding." });
  const navigate = useNavigate();
  const { addDesignToCart } = useDesignCart();

  const { state: form, update, reset, getSerializable } = useDesignState("promo", {
    product: PRODUCT_TYPES[0], printArea: PRINT_AREAS[1], color: "#1a1a2e",
    text: "", quantity: 100, logoUrl: "", logoName: "",
  });

  const unitPrice = PRICE_MAP[form.product] || 1.99;
  const emoji = PRODUCT_EMOJI[form.product] || "🎁";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div className="flex items-center gap-3 mb-6"><Palette className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Promotional Item Designer</h1></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px]">
                <div className="w-40 h-40 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/30 relative overflow-hidden">
                  <span className="text-4xl mb-2">{emoji}</span>
                  {form.text && <p className="text-xs font-medium text-center px-3" style={{ color: form.color }}>{form.text}</p>}
                  {/* Imprint area indicator */}
                  <div className="absolute inset-4 border border-dashed border-primary/20 rounded pointer-events-none" />
                  <span className="absolute bottom-1 text-[8px] text-muted-foreground/50">Imprint Area</span>
                </div>
              </CardContent>
            </Card>
            <ProductScene3D
              productType="promotional"
              design={{ text: form.text, bgColor: "#ffffff", textColor: form.color }}
              label={`3D ${form.product} Preview — Drag to rotate`}
              className="h-56"
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Product Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Product Type</Label><Select value={form.product} onValueChange={v => update("product", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}><div className="flex items-center gap-2"><span>{PRODUCT_EMOJI[p] || "🎁"}</span>{p}</div></SelectItem>)}</SelectContent></Select></div>
                <div><Label>Print Area</Label><Select value={form.printArea} onValueChange={v => update("printArea", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRINT_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Imprint Text</Label><Input value={form.text} onChange={e => update("text", e.target.value)} placeholder="NotarDex.com" /></div>
                <div><Label>Imprint Color</Label><Input type="color" value={form.color} onChange={e => update("color", e.target.value)} /></div>
                <DesignFileUpload
                  label="Upload Logo"
                  currentUrl={form.logoUrl}
                  onUpload={(url, name) => { update("logoUrl", url); update("logoName", name); }}
                  onRemove={() => { update("logoUrl", ""); update("logoName", ""); }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} min={25} step={25} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price:</span><span>${unitPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg"><span>Est. Total:</span><span>${(form.quantity * unitPrice).toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => addDesignToCart.mutate({ productType: "promo", designConfig: getSerializable(), quantity: form.quantity, unitPrice })} disabled={addDesignToCart.isPending}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart — ${(form.quantity * unitPrice).toFixed(2)}
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
