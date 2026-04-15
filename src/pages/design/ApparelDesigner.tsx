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
import { ArrowLeft, ShoppingCart, Shirt, RotateCcw } from "lucide-react";
import { useState } from "react";

const GARMENT_TYPES = ["T-Shirt", "Polo Shirt", "Hoodie", "Quarter-Zip", "Hat/Cap", "Apron"];
const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const COLORS: { label: string; hex: string }[] = [
  { label: "White", hex: "#f5f5f5" }, { label: "Black", hex: "#1a1a1a" }, { label: "Navy", hex: "#1b2a4a" },
  { label: "Heather Gray", hex: "#b0b0b0" }, { label: "Royal Blue", hex: "#2563eb" }, { label: "Red", hex: "#dc2626" },
  { label: "Forest Green", hex: "#166534" },
];
const PRINT_METHODS = ["Screen Print", "Embroidery", "DTG (Direct to Garment)", "Heat Transfer"];
const POSITIONS = ["Left Chest", "Full Front", "Full Back", "Sleeve (L)", "Sleeve (R)", "Hat Front"];

export default function ApparelDesigner() {
  usePageMeta({ title: "Apparel Designer | NotarDex", description: "Design custom branded apparel with logo placement tools." });
  const navigate = useNavigate();
  const { addDesignToCart } = useDesignCart();

  const { state: form, update, reset, getSerializable } = useDesignState("apparel", {
    garment: GARMENT_TYPES[0], color: "White", printMethod: PRINT_METHODS[0],
    position: POSITIONS[0], text: "", textColor: "#1a1a2e",
    logoUrl: "", logoName: "",
  });

  const [sizes, setSizes] = useState<Record<string, number>>({ M: 10, L: 10, XL: 5 });
  const totalQty = Object.values(sizes).reduce((a, b) => a + b, 0);
  const unitPrice = form.printMethod === "Embroidery" ? 18.99 : form.printMethod === "DTG (Direct to Garment)" ? 14.99 : 9.99;
  const colorHex = COLORS.find(c => c.label === form.color)?.hex || "#f5f5f5";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div className="flex items-center gap-3 mb-6"><Shirt className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Apparel Designer</h1></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[350px]">
                <div className="relative">
                  <div className="w-48 h-56 rounded-t-[60px] border-2 border-border" style={{ backgroundColor: colorHex }}>
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center">
                      {form.position === "Left Chest" ? (
                        <div className="absolute top-0 left-2 w-8 h-8 border border-dashed border-white/40 rounded flex items-center justify-center">
                          <span className="text-[6px] text-white/60">LOGO</span>
                        </div>
                      ) : (
                        <div className="w-24 h-16 border border-dashed border-white/40 rounded flex items-center justify-center">
                          <span className="text-xs font-medium" style={{ color: form.textColor }}>{form.text || "Your Design"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ProductScene3D
              productType="apparel"
              design={{ bgColor: colorHex, text: form.text, textColor: form.textColor }}
              label="3D Garment Preview — Drag to rotate"
              className="h-56"
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Garment Options</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Garment Type</Label><Select value={form.garment} onValueChange={v => update("garment", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GARMENT_TYPES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Color</Label><Select value={form.color} onValueChange={v => update("color", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COLORS.map(c => <SelectItem key={c.label} value={c.label}><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.hex }} />{c.label}</div></SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Print Method</Label><Select value={form.printMethod} onValueChange={v => update("printMethod", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRINT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Position</Label><Select value={form.position} onValueChange={v => update("position", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>Text (optional)</Label><Input value={form.text} onChange={e => update("text", e.target.value)} placeholder="NotarDex" /></div>
                <div><Label>Text/Design Color</Label><Input type="color" value={form.textColor} onChange={e => update("textColor", e.target.value)} /></div>
                <DesignFileUpload
                  label="Upload Logo/Artwork"
                  currentUrl={form.logoUrl}
                  onUpload={(url, name) => { update("logoUrl", url); update("logoName", name); }}
                  onRemove={() => { update("logoUrl", ""); update("logoName", ""); }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Size Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {SIZES.map(s => (
                    <div key={s}><Label className="text-xs">{s}</Label>
                      <Input type="number" min={0} value={sizes[s] || 0} onChange={e => setSizes(prev => ({ ...prev, [s]: Number(e.target.value) }))} className="h-8 text-sm" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Total: {totalQty} garments</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price ({form.printMethod}):</span><span className="font-medium">${unitPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg"><span>Est. Total:</span><span>${(totalQty * unitPrice).toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => addDesignToCart.mutate({ productType: "apparel", designConfig: { ...getSerializable(), sizeBreakdown: sizes }, quantity: totalQty, unitPrice })} disabled={addDesignToCart.isPending}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart — ${(totalQty * unitPrice).toFixed(2)}
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
