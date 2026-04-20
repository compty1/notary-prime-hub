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
import { ArrowLeft, ShoppingCart, FileText, RotateCcw } from "lucide-react";

const PAPER_OPTIONS = ["24lb Bond", "28lb Linen", "32lb Cotton", "70lb Premium"];
const ENVELOPE_STYLES = ["#10 Standard", "#10 Window", "A7 Invitation", "6×9 Catalog"];

export default function LetterheadDesigner() {
  usePageMeta({ title: "Letterhead & Stationery Designer | NotarDex", description: "Design matching letterhead, envelopes, and memo pads." });
  const navigate = useNavigate();
  const { addDesignToCart } = useDesignCart();

  const { state: form, update, reset, getSerializable } = useDesignState("letterhead", {
    companyName: "", tagline: "", address: "", phone: "", email: "", website: "",
    primaryColor: "#1a1a2e", accentColor: "#c9a96e", paper: PAPER_OPTIONS[0],
    envelope: ENVELOPE_STYLES[0], includeEnvelopes: true, includeMemoPads: false,
    showWatermark: false, quantity: 500, logoUrl: "", logoName: "",
  });

  const basePrice = 0.12;
  const envelopePrice = form.includeEnvelopes ? 0.08 : 0;
  const memoPrice = form.includeMemoPads ? 29 : 0;
  const total = form.quantity * (basePrice + envelopePrice) + memoPrice;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
          <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
        </div>
        <div className="flex items-center gap-3 mb-6"><FileText className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Letterhead & Stationery Designer</h1></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[400px]">
                <div className="w-56 h-72 bg-background rounded shadow-xl border border-border overflow-hidden relative">
                  <div className="h-2 w-full" style={{ backgroundColor: form.accentColor }} />
                  <div className="p-4">
                    <p className="text-sm font-bold" style={{ color: form.primaryColor }}>{form.companyName || "Company Name"}</p>
                    {form.tagline && <p className="text-[8px] opacity-60">{form.tagline}</p>}
                  </div>
                  {form.showWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-5">
                      <p className="text-6xl font-bold rotate-[-30deg]" style={{ color: form.primaryColor }}>DRAFT</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-4 right-4 space-y-0.5">
                    <div className="h-px w-full" style={{ backgroundColor: form.accentColor, opacity: 0.3 }} />
                    <div className="flex justify-between text-[6px] text-muted-foreground">
                      <span>{form.phone}</span><span>{form.email}</span><span>{form.website}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ProductScene3D
              productType="stationery"
              design={{ text: form.companyName || "Company", bgColor: "#ffffff", accentColor: form.accentColor, textColor: form.primaryColor }}
              label="Stationery Suite 3D — Drag to rotate"
              className="h-48"
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Company Name</Label><Input value={form.companyName} onChange={e => update("companyName", e.target.value)} placeholder="NotarDex LLC" /></div>
                <div><Label>Tagline</Label><Input value={form.tagline} onChange={e => update("tagline", e.target.value)} placeholder="Professional Notary Services" /></div>
                <div><Label>Address</Label><Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St, Columbus, OH 43215" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} /></div>
                  <div><Label>Email</Label><Input value={form.email} onChange={e => update("email", e.target.value)} /></div>
                  <div><Label>Website</Label><Input value={form.website} onChange={e => update("website", e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Primary Color</Label><Input type="color" value={form.primaryColor} onChange={e => update("primaryColor", e.target.value)} /></div>
                  <div><Label>Accent Color</Label><Input type="color" value={form.accentColor} onChange={e => update("accentColor", e.target.value)} /></div>
                </div>
                <DesignFileUpload
                  label="Upload Logo"
                  currentUrl={form.logoUrl}
                  onUpload={(url, name) => { update("logoUrl", url); update("logoName", name); }}
                  onRemove={() => { update("logoUrl", ""); update("logoName", ""); }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Specs & Add-Ons</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Paper Stock</Label><Select value={form.paper} onValueChange={v => update("paper", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAPER_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center justify-between"><Label>Matching Envelopes</Label><Switch checked={form.includeEnvelopes} onCheckedChange={v => update("includeEnvelopes", v)} /></div>
                {form.includeEnvelopes && (
                  <div><Label>Envelope Style</Label><Select value={form.envelope} onValueChange={v => update("envelope", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ENVELOPE_STYLES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
                )}
                <div className="flex items-center justify-between"><Label>Memo Pads (+$29/pad of 50)</Label><Switch checked={form.includeMemoPads} onCheckedChange={v => update("includeMemoPads", v)} /></div>
                <div className="flex items-center justify-between"><Label>Watermark Toggle</Label><Switch checked={form.showWatermark} onCheckedChange={v => update("showWatermark", v)} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity (letterhead sheets)</Label><Input type="number" value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} min={250} step={250} /></div>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between"><span>Letterhead:</span><span>${(form.quantity * basePrice).toFixed(2)}</span></div>
                  {form.includeEnvelopes && <div className="flex justify-between"><span>Envelopes:</span><span>${(form.quantity * envelopePrice).toFixed(2)}</span></div>}
                  {form.includeMemoPads && <div className="flex justify-between"><span>Memo Pad:</span><span>$29.00</span></div>}
                  <div className="flex justify-between font-semibold text-lg"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                </div>
                <Button className="w-full" onClick={() => addDesignToCart.mutate({ productType: "letterhead", designConfig: getSerializable(), quantity: form.quantity, unitPrice: total / form.quantity })} disabled={addDesignToCart.isPending}>
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
