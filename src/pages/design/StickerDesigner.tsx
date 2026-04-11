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
import { ProductPreview3D } from "@/components/ProductPreview3D";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Upload, Sticker, Circle, Square, Star, Heart } from "lucide-react";

const SHAPES = [
  { id: "circle", label: "Circle", icon: Circle },
  { id: "square", label: "Square", icon: Square },
  { id: "star", label: "Star", icon: Star },
  { id: "heart", label: "Heart", icon: Heart },
  { id: "custom", label: "Custom Contour", icon: Sticker },
];

const SIZES = ["2×2 in", "3×3 in", "4×4 in", "5×5 in", "Custom"];
const FINISHES = ["Gloss Vinyl", "Matte Vinyl", "Holographic", "Transparent", "Kraft Paper"];
const MATERIALS = ["Standard Vinyl (Outdoor 3yr)", "Premium Vinyl (Outdoor 5yr)", "Paper (Indoor)", "Clear BOPP"];

export default function StickerDesigner() {
  usePageMeta({ title: "Sticker Designer | NotarDex", description: "Design custom die-cut stickers with shape tools and instant preview." });
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shape, setShape] = useState("circle");
  const [size, setSize] = useState(SIZES[1]);
  const [finish, setFinish] = useState(FINISHES[0]);
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [quantity, setQuantity] = useState(250);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [borderRadius, setBorderRadius] = useState([50]);

  const getShapePath = () => {
    switch (shape) {
      case "circle": return "rounded-full";
      case "square": return "rounded-lg";
      case "star": return "rounded-lg";
      case "heart": return "rounded-3xl";
      default: return "rounded-2xl";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Sticker className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Sticker Designer</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px]">
                <div
                  className={`w-48 h-48 ${getShapePath()} border-2 border-dashed border-border flex items-center justify-center shadow-lg transition-all`}
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Drop artwork here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ProductPreview3D productType="stickers" label="Die-Cut Preview" className="h-40" />
          </div>

          {/* Config */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Shape & Size</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {SHAPES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setShape(s.id)}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${shape === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <s.icon className="h-5 w-5" />
                      <span className="text-xs">{s.label}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <Label>Size</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {shape === "square" && (
                  <div>
                    <Label>Corner Radius: {borderRadius[0]}%</Label>
                    <Slider value={borderRadius} onValueChange={setBorderRadius} min={0} max={50} step={5} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Material & Finish</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Material</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Finish</Label>
                  <Select value={finish} onValueChange={setFinish}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FINISHES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Background Color</Label>
                  <Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Quantity & Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={100} step={50} />
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <div className="flex justify-between"><span>Unit price:</span><span className="font-medium">${quantity >= 1000 ? "0.15" : quantity >= 500 ? "0.26" : quantity >= 250 ? "0.28" : "0.39"}</span></div>
                  <div className="flex justify-between font-semibold mt-1"><span>Total:</span><span>${(quantity * (quantity >= 1000 ? 0.15 : quantity >= 500 ? 0.26 : quantity >= 250 ? 0.28 : 0.39)).toFixed(2)}</span></div>
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
