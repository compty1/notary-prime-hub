import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductPreview3D } from "@/components/ProductPreview3D";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, ShoppingCart, Type, Palette, Image, CreditCard } from "lucide-react";

const TEMPLATES = [
  { id: "classic", label: "Classic", colors: ["#1a1a2e", "#e94560"] },
  { id: "modern", label: "Modern", colors: ["#0f3460", "#16213e"] },
  { id: "minimal", label: "Minimal", colors: ["#ffffff", "#333333"] },
  { id: "bold", label: "Bold", colors: ["#e94560", "#0f3460"] },
  { id: "elegant", label: "Elegant", colors: ["#2c3e50", "#c9a96e"] },
  { id: "corporate", label: "Corporate", colors: ["#1b262c", "#3282b8"] },
];
const PAPER_OPTIONS = ["14pt Matte", "14pt Glossy", "16pt Uncoated", "18pt Silk Laminate", "32pt Ultra Thick", "Kraft/Recycled"];
const FINISH_OPTIONS = ["None", "Spot UV", "Foil Stamping (Gold)", "Foil Stamping (Silver)", "Embossed", "Rounded Corners"];

export default function BusinessCardDesigner() {
  usePageMeta({ title: "Business Card Designer | NotarDex", description: "Design professional business cards with our drag-and-drop editor." });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", title: "", company: "", phone: "", email: "", website: "", address: "", template: "classic", paper: PAPER_OPTIONS[0], finish: FINISH_OPTIONS[0], primaryColor: "#1a1a2e", accentColor: "#e94560" });
  const [side, setSide] = useState<"front" | "back">("front");
  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/design/studio")} className="mb-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio</Button>
        <div className="flex items-center gap-3 mb-6"><CreditCard className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold text-foreground">Business Card Designer</h1></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-lg">Preview</CardTitle><div className="flex gap-1"><Button variant={side === "front" ? "default" : "outline"} size="sm" onClick={() => setSide("front")}>Front</Button><Button variant={side === "back" ? "default" : "outline"} size="sm" onClick={() => setSide("back")}>Back</Button></div></div></CardHeader>
              <CardContent>
                <div className="relative w-full aspect-[3.5/2] rounded-lg border border-border shadow-xl overflow-hidden" style={{ background: side === "front" ? form.primaryColor : "#ffffff" }}>
                  {side === "front" ? (
                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                      <div><p className="text-xl font-bold">{form.name || "Your Name"}</p><p className="text-sm opacity-80">{form.title || "Your Title"}</p></div>
                      <div className="space-y-0.5 text-xs opacity-70">{form.phone && <p>{form.phone}</p>}{form.email && <p>{form.email}</p>}{form.website && <p>{form.website}</p>}</div>
                      <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: form.accentColor }}>{(form.company || "CO").slice(0, 2).toUpperCase()}</div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: form.accentColor + "15" }}>
                      <div className="text-center"><p className="text-2xl font-bold" style={{ color: form.primaryColor }}>{form.company || "Company Name"}</p>{form.address && <p className="text-sm text-muted-foreground mt-2">{form.address}</p>}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <ProductPreview3D productType="business-cards" label="3D Mockup" className="h-48" />
          </div>
          <div>
            <Tabs defaultValue="content">
              <TabsList className="w-full grid grid-cols-3"><TabsTrigger value="content"><Type className="h-4 w-4 mr-1" />Content</TabsTrigger><TabsTrigger value="style"><Palette className="h-4 w-4 mr-1" />Style</TabsTrigger><TabsTrigger value="specs"><Image className="h-4 w-4 mr-1" />Specs</TabsTrigger></TabsList>
              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3"><div><Label>Full Name</Label><Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Jane Smith" /></div><div><Label>Title</Label><Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="Notary Public" /></div></div>
                <div><Label>Company</Label><Input value={form.company} onChange={e => update("company", e.target.value)} placeholder="NotarDex" /></div>
                <div className="grid grid-cols-2 gap-3"><div><Label>Phone</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} /></div><div><Label>Email</Label><Input value={form.email} onChange={e => update("email", e.target.value)} /></div></div>
                <div><Label>Website</Label><Input value={form.website} onChange={e => update("website", e.target.value)} /></div>
                <div><Label>Address</Label><Textarea value={form.address} onChange={e => update("address", e.target.value)} rows={2} /></div>
              </TabsContent>
              <TabsContent value="style" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-2">{TEMPLATES.map(t => (<button key={t.id} onClick={() => { update("template", t.id); update("primaryColor", t.colors[0]); update("accentColor", t.colors[1]); }} className={`p-3 rounded-lg border-2 transition-all ${form.template === t.id ? "border-primary" : "border-border hover:border-primary/40"}`}><div className="flex gap-1 mb-1"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors[0] }} /><div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors[1] }} /></div><p className="text-xs font-medium">{t.label}</p></button>))}</div>
                <div className="grid grid-cols-2 gap-3"><div><Label>Primary Color</Label><Input type="color" value={form.primaryColor} onChange={e => update("primaryColor", e.target.value)} /></div><div><Label>Accent Color</Label><Input type="color" value={form.accentColor} onChange={e => update("accentColor", e.target.value)} /></div></div>
              </TabsContent>
              <TabsContent value="specs" className="space-y-4 mt-4">
                <div><Label>Paper Stock</Label><Select value={form.paper} onValueChange={v => update("paper", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAPER_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Finish / Special Effects</Label><Select value={form.finish} onValueChange={v => update("finish", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FINISH_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
                <div className="p-4 rounded-lg bg-muted/50"><p className="text-sm font-medium mb-2">Specifications</p><ul className="text-xs text-muted-foreground space-y-1"><li>• Standard size: 3.5" × 2"</li><li>• Full bleed with 0.125" bleed area</li><li>• CMYK color mode for print</li><li>• 300 DPI resolution</li></ul></div>
              </TabsContent>
            </Tabs>
            <div className="flex gap-3 mt-6"><Button onClick={() => { toast({ title: "Added to cart" }); navigate("/print-shop"); }} className="flex-1"><ShoppingCart className="h-4 w-4 mr-2" />Add to Cart</Button><Button variant="outline"><Download className="h-4 w-4 mr-2" />Export PDF</Button></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
