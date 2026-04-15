import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ProductScene3D } from "@/components/design/ProductScene3D";
import { DesignFileUpload } from "@/components/design/DesignFileUpload";
import { useDesignState } from "@/hooks/useDesignState";
import { useDesignCart } from "@/hooks/useDesignCart";
import { ArrowLeft, ShoppingCart, Bookmark, RotateCcw, Ruler } from "lucide-react";

const SIGN_TYPES = [
  { label: "Yard Sign (18×24)", dims: "18\" × 24\"" },
  { label: "Banner (3×6 ft)", dims: "3' × 6'" },
  { label: "Banner (4×8 ft)", dims: "4' × 8'" },
  { label: "Window Cling", dims: "Custom" },
  { label: "Retractable Banner", dims: "33\" × 81\"" },
  { label: "A-Frame Sign", dims: "24\" × 36\"" },
  { label: "Car Magnet", dims: "12\" × 24\"" },
  { label: "Wall Decal", dims: "Custom" },
];
const MATERIALS = ["Coroplast (Corrugated)", "PVC/Sintra", "Aluminum", "Vinyl Banner", "Static Cling", "Magnetic"];
const FINISHES = ["Standard", "UV Laminated", "Grommets + Hemmed", "Pole Pockets"];
const THICKNESSES = ["4mm (Standard)", "6mm (Heavy Duty)", "10mm (Premium)"];

export default function SignageDesigner() {
  usePageMeta({ title: "Sign & Banner Builder | NotarDex", description: "Create banners, yard signs, window graphics and more." });
  const navigate = useNavigate();
  const { addDesignToCart } = useDesignCart();

  const { state: form, update, reset, getSerializable } = useDesignState("signage", {
    signType: SIGN_TYPES[0].label, material: MATERIALS[0], finish: FINISHES[0],
    thickness: THICKNESSES[0], headline: "", subtext: "", bgColor: "#1a1a2e",
    textColor: "#ffffff", doubleSided: false, withStake: true, quantity: 10,
    artworkUrl: "", artworkName: "",
  });

  const selectedType = SIGN_TYPES.find(s => s.label === form.signType);
  const basePrice = form.signType.includes("Banner") ? 89 : form.signType.includes("Retractable") ? 149 : form.signType.includes("Window") ? 29 : form.signType.includes("Car") ? 35 : form.signType.includes("Wall") ? 45 : 14.90;
  const finalPrice = basePrice * (form.doubleSided ? 1.4 : 1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div className="flex items-center gap-3 mb-6"><Bookmark className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Sign & Banner Builder</h1></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px]">
                <div className="relative">
                  <div className="w-64 h-40 rounded border-2 border-border shadow-lg flex flex-col items-center justify-center p-4" style={{ backgroundColor: form.bgColor }}>
                    <p className="text-xl font-bold text-center leading-tight" style={{ color: form.textColor }}>{form.headline || "Your Headline"}</p>
                    {form.subtext && <p className="text-sm mt-1 opacity-80 text-center" style={{ color: form.textColor }}>{form.subtext}</p>}
                  </div>
                  {/* Scale ruler */}
                  {selectedType && (
                    <div className="flex items-center gap-1 mt-2 justify-center text-xs text-muted-foreground">
                      <Ruler className="h-3 w-3" />
                      <span>{selectedType.dims}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <ProductScene3D
              productType="signage"
              design={{ text: form.headline || "Your Sign", bgColor: form.bgColor, textColor: form.textColor }}
              label="3D Sign Preview — Drag to rotate"
              className="h-56"
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Sign Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Sign Type</Label><Select value={form.signType} onValueChange={v => update("signType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SIGN_TYPES.map(s => <SelectItem key={s.label} value={s.label}>{s.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Material</Label><Select value={form.material} onValueChange={v => update("material", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Finish</Label><Select value={form.finish} onValueChange={v => update("finish", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FINISHES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>Material Thickness</Label><Select value={form.thickness} onValueChange={v => update("thickness", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{THICKNESSES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Headline</Label><Input value={form.headline} onChange={e => update("headline", e.target.value)} placeholder="NOW OPEN" /></div>
                <div><Label>Sub Text</Label><Textarea value={form.subtext} onChange={e => update("subtext", e.target.value)} placeholder="Visit us at 123 Main St" rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Background</Label><Input type="color" value={form.bgColor} onChange={e => update("bgColor", e.target.value)} /></div>
                  <div><Label>Text Color</Label><Input type="color" value={form.textColor} onChange={e => update("textColor", e.target.value)} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>Double-Sided (+40%)</Label><Switch checked={form.doubleSided} onCheckedChange={v => update("doubleSided", v)} /></div>
                <div className="flex items-center justify-between"><Label>Include H-Stakes</Label><Switch checked={form.withStake} onCheckedChange={v => update("withStake", v)} /></div>
                <DesignFileUpload
                  label="Upload Artwork"
                  currentUrl={form.artworkUrl}
                  onUpload={(url, name) => { update("artworkUrl", url); update("artworkName", name); }}
                  onRemove={() => { update("artworkUrl", ""); update("artworkName", ""); }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} min={1} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price:</span><span>${finalPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg"><span>Est. Total:</span><span>${(form.quantity * finalPrice).toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => addDesignToCart.mutate({ productType: "signage", designConfig: getSerializable(), quantity: form.quantity, unitPrice: finalPrice })} disabled={addDesignToCart.isPending}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart — ${(form.quantity * finalPrice).toFixed(2)}
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
