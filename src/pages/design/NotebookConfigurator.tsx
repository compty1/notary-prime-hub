import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ProductScene3D } from "@/components/design/ProductScene3D";
import { DesignFileUpload } from "@/components/design/DesignFileUpload";
import { useDesignState } from "@/hooks/useDesignState";
import { useDesignCart } from "@/hooks/useDesignCart";
import { ArrowLeft, ShoppingCart, NotebookPen, RotateCcw } from "lucide-react";

const SIZES = ["A5 (5.5×8.5)", "A4 (8.5×11)", "B5 (6.9×9.8)", "Pocket (3.5×5.5)"];
const BINDINGS = ["Perfect Bound", "Spiral", "Wire-O", "Saddle Stitch", "Lay-Flat"];
const PAPERS = ["80lb Uncoated", "70lb Recycled", "100lb Premium", "Dotted Grid", "Graph (5mm)", "Lined", "Blank"];
const COVERS = ["Soft Cover", "Hard Cover", "Leather-Wrapped", "Kraft Cardboard"];

export default function NotebookConfigurator() {
  usePageMeta({ title: "Notebook Configurator | NotarDex", description: "Design custom notebooks with cover art, binding, and paper choices." });
  const navigate = useNavigate();
  const { addDesignToCart } = useDesignCart();

  const { state: config, update, reset, getSerializable } = useDesignState("notebook", {
    title: "", size: SIZES[0], binding: BINDINGS[0], paper: PAPERS[0], cover: COVERS[0],
    pageCount: 100, coverColor: "#1a1a2e", foilStamping: false, ribbonBookmark: false,
    elasticClosure: false, penLoop: false, quantity: 25,
    coverArtUrl: "", coverArtName: "",
  });

  const unitPrice = config.cover === "Hard Cover" ? 8.99 : config.cover === "Leather-Wrapped" ? 14.99 : 4.49;
  const extras = (config.foilStamping ? 1.50 : 0) + (config.ribbonBookmark ? 0.50 : 0) + (config.elasticClosure ? 0.75 : 0) + (config.penLoop ? 0.60 : 0);
  const total = (unitPrice + extras) * config.quantity;
  const spineWidth = (config.pageCount * 0.005).toFixed(2);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div className="flex items-center gap-3 mb-6"><NotebookPen className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Notebook Configurator</h1></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[300px]">
                <div className="relative w-40 h-56 rounded-r-lg shadow-xl overflow-hidden" style={{ backgroundColor: config.coverColor, transform: "rotateY(-8deg)" }}>
                  <div className="absolute inset-y-0 left-0 w-3 bg-black/20" />
                  <div className="absolute top-8 left-6 right-4 space-y-2">
                    <div className="h-3 bg-background/30 rounded w-3/4" />
                    <div className="h-2 bg-background/20 rounded w-1/2" />
                  </div>
                  {config.ribbonBookmark && <div className="absolute bottom-0 right-6 w-2 h-12 bg-red-500/80 rounded-b" />}
                  <div className="absolute bottom-4 left-6 text-primary-foreground/60 text-xs font-medium">{config.title || "Untitled"}</div>
                </div>
              </CardContent>
            </Card>
            <div className="p-4 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-1">Spine Width</p>
              <p className="text-muted-foreground">{config.pageCount} pages → <span className="font-semibold">{spineWidth}"</span> spine ({config.binding})</p>
            </div>
            <ProductScene3D
              productType="notebooks"
              design={{ text: config.title || "Notebook", bgColor: config.coverColor, textColor: "#ffffff" }}
              label="3D Notebook Mockup — Drag to rotate"
              className="h-56"
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Notebook Title</Label><Input value={config.title} onChange={e => update("title", e.target.value)} placeholder="My Custom Notebook" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Size</Label><Select value={config.size} onValueChange={v => update("size", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Pages</Label><Input type="number" value={config.pageCount} onChange={e => update("pageCount", Number(e.target.value))} min={50} max={400} step={10} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Binding</Label><Select value={config.binding} onValueChange={v => update("binding", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BINDINGS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Paper</Label><Select value={config.paper} onValueChange={v => update("paper", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAPERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Cover Type</Label><Select value={config.cover} onValueChange={v => update("cover", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COVERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Cover Color</Label><Input type="color" value={config.coverColor} onChange={e => update("coverColor", e.target.value)} /></div>
                </div>
                <DesignFileUpload
                  label="Upload Cover Art"
                  currentUrl={config.coverArtUrl}
                  onUpload={(url, name) => { update("coverArtUrl", url); update("coverArtName", name); }}
                  onRemove={() => { update("coverArtUrl", ""); update("coverArtName", ""); }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add-Ons</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><Label>Foil Stamping (+$1.50/ea)</Label><Switch checked={config.foilStamping} onCheckedChange={v => update("foilStamping", v)} /></div>
                <div className="flex items-center justify-between"><Label>Ribbon Bookmark (+$0.50/ea)</Label><Switch checked={config.ribbonBookmark} onCheckedChange={v => update("ribbonBookmark", v)} /></div>
                <div className="flex items-center justify-between"><Label>Elastic Closure (+$0.75/ea)</Label><Switch checked={config.elasticClosure} onCheckedChange={v => update("elasticClosure", v)} /></div>
                <div className="flex items-center justify-between"><Label>Pen Loop (+$0.60/ea)</Label><Switch checked={config.penLoop} onCheckedChange={v => update("penLoop", v)} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity</Label><Input type="number" value={config.quantity} onChange={e => update("quantity", Number(e.target.value))} min={1} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price:</span><span>${(unitPrice + extras).toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => addDesignToCart.mutate({ productType: "notebooks", designConfig: getSerializable(), quantity: config.quantity, unitPrice: unitPrice + extras })} disabled={addDesignToCart.isPending}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart — ${total.toFixed(2)}
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
