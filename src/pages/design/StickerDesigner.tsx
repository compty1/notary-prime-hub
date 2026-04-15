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
import { Slider } from "@/components/ui/slider";
import { ProductScene3D } from "@/components/design/ProductScene3D";
import { DesignFileUpload } from "@/components/design/DesignFileUpload";
import { useDesignState } from "@/hooks/useDesignState";
import { useDesignCart } from "@/hooks/useDesignCart";
import { ArrowLeft, ShoppingCart, Sticker, Circle, Square, Star, Heart, RotateCcw } from "lucide-react";

const SHAPES = [{ id: "circle", label: "Circle", icon: Circle }, { id: "square", label: "Square", icon: Square }, { id: "star", label: "Star", icon: Star }, { id: "heart", label: "Heart", icon: Heart }, { id: "custom", label: "Custom", icon: Sticker }];
const SIZES = ["2×2 in", "3×3 in", "4×4 in", "5×5 in", "Custom"];
const FINISHES = ["Gloss Vinyl", "Matte Vinyl", "Holographic", "Transparent", "Kraft Paper"];
const MATERIALS = ["Standard Vinyl (Outdoor 3yr)", "Premium Vinyl (Outdoor 5yr)", "Paper (Indoor)", "Clear BOPP"];

function getShapeClipPath(shape: string) {
  switch (shape) {
    case "star": return "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
    case "heart": return "polygon(50% 100%, 0% 35%, 25% 0%, 50% 20%, 75% 0%, 100% 35%)";
    default: return undefined;
  }
}

export default function StickerDesigner() {
  usePageMeta({ title: "Sticker Designer | NotarDex", description: "Design custom die-cut stickers with shape tools and instant preview." });
  const navigate = useNavigate();
  const { addDesignToCart } = useDesignCart();

  const { state, update, reset, getSerializable } = useDesignState("sticker", {
    shape: "circle", size: SIZES[1], finish: FINISHES[0], material: MATERIALS[0],
    quantity: 250, bgColor: "#ffffff", borderRadius: 50,
    artworkUrl: "", artworkName: "", text: "",
  });

  const getShapeClass = () => { switch (state.shape) { case "circle": return "rounded-full"; case "square": return `rounded-[${state.borderRadius}%]`; default: return "rounded-2xl"; } };
  const clipPath = getShapeClipPath(state.shape);
  const unitPrice = state.quantity >= 1000 ? 0.15 : state.quantity >= 500 ? 0.26 : state.quantity >= 250 ? 0.28 : 0.39;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div className="flex items-center gap-3 mb-6"><Sticker className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Sticker Designer</h1></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px]">
                <div
                  className={`w-48 h-48 ${!clipPath ? getShapeClass() : ""} border-2 border-dashed border-border flex items-center justify-center shadow-lg overflow-hidden`}
                  style={{ backgroundColor: state.bgColor, clipPath }}
                >
                  {state.artworkUrl ? (
                    <img src={state.artworkUrl} alt="Artwork" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      {state.text ? (
                        <p className="text-sm font-bold">{state.text}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Upload or add text</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <ProductScene3D
              productType="stickers"
              design={{ bgColor: state.bgColor, text: state.text }}
              label="3D Die-Cut Preview — Drag to rotate"
              className="h-48"
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Shape & Size</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {SHAPES.map(s => (
                    <button key={s.id} onClick={() => update("shape", s.id)}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${state.shape === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <s.icon className="h-5 w-5" /><span className="text-xs">{s.label}</span>
                    </button>
                  ))}
                </div>
                <div><Label>Size</Label>
                  <Select value={state.size} onValueChange={v => update("size", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                </div>
                {state.shape === "square" && <div><Label>Corner Radius: {state.borderRadius}%</Label><Slider value={[state.borderRadius]} onValueChange={v => update("borderRadius", v[0])} min={0} max={50} step={5} /></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Artwork & Text</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <DesignFileUpload
                  label="Upload Sticker Artwork"
                  currentUrl={state.artworkUrl}
                  onUpload={(url, name) => { update("artworkUrl", url); update("artworkName", name); }}
                  onRemove={() => { update("artworkUrl", ""); update("artworkName", ""); }}
                />
                <div><Label>Text (optional)</Label><Input value={state.text} onChange={e => update("text", e.target.value)} placeholder="Your text here" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Material & Finish</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Material</Label><Select value={state.material} onValueChange={v => update("material", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Finish</Label><Select value={state.finish} onValueChange={v => update("finish", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FINISHES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Background Color</Label><Input type="color" value={state.bgColor} onChange={e => update("bgColor", e.target.value)} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Quantity & Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Quantity</Label><Input type="number" value={state.quantity} onChange={e => update("quantity", Number(e.target.value))} min={100} step={50} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price:</span><span className="font-medium">${unitPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg"><span>Total:</span><span>${(state.quantity * unitPrice).toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => addDesignToCart.mutate({ productType: "stickers", designConfig: getSerializable(), quantity: state.quantity, unitPrice })} disabled={addDesignToCart.isPending}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart — ${(state.quantity * unitPrice).toFixed(2)}
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
