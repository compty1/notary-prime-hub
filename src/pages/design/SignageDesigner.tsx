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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProductPreview3D } from "@/components/ProductPreview3D";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Bookmark, Upload } from "lucide-react";

const SIGN_TYPES = ["Yard Sign (18×24)", "Banner (3×6 ft)", "Banner (4×8 ft)", "Window Cling", "Retractable Banner", "A-Frame Sign", "Car Magnet", "Wall Decal"];
const MATERIALS = ["Coroplast (Corrugated)", "PVC/Sintra", "Aluminum", "Vinyl Banner", "Static Cling", "Magnetic"];
const FINISHES = ["Standard", "UV Laminated", "Grommets + Hemmed", "Pole Pockets"];

export default function SignageDesigner() {
  usePageMeta({ title: "Sign & Banner Builder | NotarDex", description: "Create banners, yard signs, window graphics and more." });
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    signType: SIGN_TYPES[0], material: MATERIALS[0], finish: FINISHES[0],
    headline: "", subtext: "", bgColor: "#1a1a2e", textColor: "#ffffff",
    doubleSided: false, withStake: true, quantity: 10,
  });
  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const basePrice = form.signType.includes("Banner") ? 89 : form.signType.includes("Retractable") ? 149 : form.signType.includes("Window") ? 29 : form.signType.includes("Car") ? 35 : form.signType.includes("Wall") ? 45 : 14.90;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Sign & Banner Builder</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px]">
                <div className="w-64 h-40 rounded border-2 border-border shadow-lg flex flex-col items-center justify-center p-4" style={{ backgroundColor: form.bgColor }}>
                  <p className="text-xl font-bold text-center leading-tight" style={{ color: form.textColor }}>{form.headline || "Your Headline"}</p>
                  {form.subtext && <p className="text-sm mt-1 opacity-80 text-center" style={{ color: form.textColor }}>{form.subtext}</p>}
                </div>
              </CardContent>
            </Card>
            <ProductPreview3D productType="signage" label="Sign Preview" className="h-40" />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Sign Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Sign Type</Label><Select value={form.signType} onValueChange={v => update("signType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SIGN_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Material</Label><Select value={form.material} onValueChange={v => update("material", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Finish</Label><Select value={form.finish} onValueChange={v => update("finish", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FINISHES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><Label>Headline</Label><Input value={form.headline} onChange={e => update("headline", e.target.value)} placeholder="NOW OPEN" /></div>
                <div><Label>Sub Text</Label><Textarea value={form.subtext} onChange={e => update("subtext", e.target.value)} placeholder="Visit us at 123 Main St" rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Background</Label><Input type="color" value={form.bgColor} onChange={e => update("bgColor", e.target.value)} /></div>
                  <div><Label>Text Color</Label><Input type="color" value={form.textColor} onChange={e => update("textColor", e.target.value)} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>Double-Sided (+40%)</Label><Switch checked={form.doubleSided} onCheckedChange={v => update("doubleSided", v)} /></div>
                <div className="flex items-center justify-between"><Label>Include H-Stakes</Label><Switch checked={form.withStake} onCheckedChange={v => update("withStake", v)} /></div>
                <Button variant="outline" className="w-full"><Upload className="h-4 w-4 mr-2" />Upload Artwork</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} min={1} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price:</span><span>${basePrice.toFixed(2)}{form.doubleSided ? " × 1.4" : ""}</span></div>
                  <div className="flex justify-between font-semibold"><span>Est. Total:</span><span>${(form.quantity * basePrice * (form.doubleSided ? 1.4 : 1)).toFixed(2)}</span></div>
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
