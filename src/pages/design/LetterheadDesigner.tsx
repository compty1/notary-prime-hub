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
import { Switch } from "@/components/ui/switch";
import { ProductPreview3D } from "@/components/ProductPreview3D";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, FileText } from "lucide-react";

const PAPER_OPTIONS = ["24lb Bond", "28lb Linen", "32lb Cotton", "70lb Premium"];
const ENVELOPE_STYLES = ["#10 Standard", "#10 Window", "A7 Invitation", "6×9 Catalog"];

export default function LetterheadDesigner() {
  usePageMeta({ title: "Letterhead & Stationery Designer | NotarDex", description: "Design matching letterhead, envelopes, and memo pads." });
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    companyName: "", tagline: "", address: "", phone: "", email: "", website: "",
    primaryColor: "#1a1a2e", accentColor: "#c9a96e", paper: PAPER_OPTIONS[0],
    envelope: ENVELOPE_STYLES[0], includeEnvelopes: true, includeMemoPads: false,
    quantity: 500,
  });

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Letterhead & Stationery Designer</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center min-h-[400px]">
                <div className="w-56 h-72 bg-white rounded shadow-xl border border-border overflow-hidden relative">
                  <div className="h-2 w-full" style={{ backgroundColor: form.accentColor }} />
                  <div className="p-4">
                    <p className="text-sm font-bold" style={{ color: form.primaryColor }}>{form.companyName || "Company Name"}</p>
                    {form.tagline && <p className="text-[8px] opacity-60">{form.tagline}</p>}
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 space-y-0.5">
                    <div className="h-px w-full" style={{ backgroundColor: form.accentColor, opacity: 0.3 }} />
                    <div className="flex justify-between text-[6px] text-muted-foreground">
                      <span>{form.phone}</span>
                      <span>{form.email}</span>
                      <span>{form.website}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <ProductPreview3D productType="stationery" label="Stationery Suite" className="h-40" />
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div><Label>Quantity (letterhead sheets)</Label><Input type="number" value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} min={250} step={250} /></div>
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
