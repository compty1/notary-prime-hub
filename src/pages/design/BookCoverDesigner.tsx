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
import { ArrowLeft, ShoppingCart, BookOpen, RotateCcw } from "lucide-react";

const TRIM_SIZES = ["5×8", "5.25×8", "5.5×8.5", "6×9", "7×10", "8.5×11"];
const COVER_TYPES = ["Glossy Laminate", "Matte Laminate", "Soft Touch", "Spot UV"];

export default function BookCoverDesigner() {
  usePageMeta({ title: "Book Cover Designer | NotarDex", description: "Design professional book covers with spine calculation and barcode placement." });
  const navigate = useNavigate();
  const { addDesignToCart } = useDesignCart();

  const { state: form, update, reset, getSerializable } = useDesignState("book-cover", {
    title: "", subtitle: "", author: "", trimSize: TRIM_SIZES[2], pageCount: 200,
    coverType: COVER_TYPES[0], bgColor: "#1a1a2e", textColor: "#ffffff",
    includeISBN: false, includeBarcode: false, quantity: 50,
    coverArtUrl: "", coverArtName: "",
  });

  const spineWidth = (form.pageCount * 0.0025).toFixed(2);
  const unitPrice = form.quantity >= 100 ? 6.49 : form.quantity >= 50 ? 6.98 : 19.99;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div className="flex items-center gap-3 mb-6"><BookOpen className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Book Cover Designer</h1></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Cover Preview (Front + Spine)</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[350px]">
                <div className="flex" style={{ perspective: "600px", transform: "rotateY(-5deg)" }}>
                  <div className="w-6 h-72 flex items-center justify-center" style={{ backgroundColor: form.bgColor, borderLeft: "1px solid rgba(0,0,0,0.2)" }}>
                    <p className="text-[8px] whitespace-nowrap" style={{ color: form.textColor, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{form.title || "Book Title"} — {form.author || "Author"}</p>
                  </div>
                  <div className="w-48 h-72 rounded-r-md shadow-xl overflow-hidden relative" style={{ backgroundColor: form.bgColor }}>
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div><p className="text-lg font-bold leading-tight" style={{ color: form.textColor }}>{form.title || "Book Title"}</p>{form.subtitle && <p className="text-xs mt-1 opacity-70" style={{ color: form.textColor }}>{form.subtitle}</p>}</div>
                      <p className="text-sm font-medium" style={{ color: form.textColor }}>{form.author || "Author Name"}</p>
                    </div>
                    {form.includeBarcode && <div className="absolute bottom-3 right-3 w-12 h-8 bg-white rounded flex items-center justify-center"><div className="space-y-0.5">{[...Array(5)].map((_, i) => <div key={i} className="h-0.5 bg-black" style={{ width: `${8 + Math.random() * 8}px` }} />)}</div></div>}
                    {/* Bleed area */}
                    <div className="absolute inset-0 border-2 border-dashed border-red-500/15 pointer-events-none m-0.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="p-4 rounded-lg bg-muted/50 text-sm"><p className="font-medium mb-1">Spine Width Calculation</p><p className="text-muted-foreground">{form.pageCount} pages × 0.0025" = <span className="font-semibold">{spineWidth}"</span> spine</p></div>
            <ProductScene3D
              productType="books"
              design={{ text: form.title || "Book Title", bgColor: form.bgColor, textColor: form.textColor }}
              label="3D Book Mockup — Drag to rotate"
              className="h-56"
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Book Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={e => update("title", e.target.value)} /></div>
                <div><Label>Subtitle</Label><Input value={form.subtitle} onChange={e => update("subtitle", e.target.value)} /></div>
                <div><Label>Author</Label><Input value={form.author} onChange={e => update("author", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Trim Size</Label><Select value={form.trimSize} onValueChange={v => update("trimSize", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRIM_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Page Count</Label><Input type="number" value={form.pageCount} onChange={e => update("pageCount", Number(e.target.value))} min={20} max={800} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Background</Label><Input type="color" value={form.bgColor} onChange={e => update("bgColor", e.target.value)} /></div>
                  <div><Label>Text Color</Label><Input type="color" value={form.textColor} onChange={e => update("textColor", e.target.value)} /></div>
                </div>
                <div><Label>Cover Finish</Label><Select value={form.coverType} onValueChange={v => update("coverType", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COVER_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <DesignFileUpload
                  label="Upload Cover Art"
                  currentUrl={form.coverArtUrl}
                  onUpload={(url, name) => { update("coverArtUrl", url); update("coverArtName", name); }}
                  onRemove={() => { update("coverArtUrl", ""); update("coverArtName", ""); }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add-Ons</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><Label>Include ISBN</Label><Switch checked={form.includeISBN} onCheckedChange={v => update("includeISBN", v)} /></div>
                <div className="flex items-center justify-between"><Label>Include Barcode</Label><Switch checked={form.includeBarcode} onCheckedChange={v => update("includeBarcode", v)} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} min={1} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Unit price:</span><span className="font-medium">${unitPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-lg"><span>Est. Total:</span><span>${(form.quantity * unitPrice).toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => addDesignToCart.mutate({ productType: "book-covers", designConfig: getSerializable(), quantity: form.quantity, unitPrice })} disabled={addDesignToCart.isPending}>
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
