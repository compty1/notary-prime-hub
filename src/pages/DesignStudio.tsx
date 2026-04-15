import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductScene3D } from "@/components/design/ProductScene3D";
import { Search, PenTool, BookOpen, NotebookPen, CreditCard, Shirt, Bookmark, FileText, Palette, Sticker } from "lucide-react";

const DESIGN_TOOLS = [
  { id: "business-cards", label: "Business Card Designer", description: "Design professional business cards with templates and instant preview", icon: CreditCard, route: "/design/business-cards", productType: "business-cards" },
  { id: "stickers", label: "Sticker Designer", description: "Create custom die-cut stickers, labels, and decals", icon: Sticker, route: "/design/stickers", productType: "stickers" },
  { id: "notebooks", label: "Notebook Configurator", description: "Design custom notebook covers with binding and paper choices", icon: NotebookPen, route: "/design/notebooks", productType: "notebooks" },
  { id: "book-covers", label: "Book Cover Designer", description: "Create book covers with spine calculation and barcode placement", icon: BookOpen, route: "/design/book-covers", productType: "books" },
  { id: "letterhead", label: "Letterhead & Stationery", description: "Design matching letterhead, envelopes, and memo pads", icon: FileText, route: "/design/letterhead", productType: "stationery" },
  { id: "apparel", label: "Apparel Designer", description: "Place logos and graphics on t-shirts, polos, and hats", icon: Shirt, route: "/design/apparel", productType: "apparel" },
  { id: "signage", label: "Sign & Banner Builder", description: "Create banners, yard signs, and window graphics", icon: Bookmark, route: "/design/signage", productType: "signage" },
  { id: "promo", label: "Promotional Items", description: "Customize pens, mugs, tote bags, and giveaway items", icon: Palette, route: "/design/promo", productType: "promotional" },
];

export default function DesignStudio() {
  usePageMeta({ title: "Design Studio | NotarDex", description: "Create custom designs for print products with our built-in design tools." });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filtered = DESIGN_TOOLS.filter(t => !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"><PenTool className="h-4 w-4" /> Design Studio</div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Create Your Custom Design</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Choose a product type below to launch the designer. Upload logos, choose colors, add text, and preview your design in 3D before ordering.</p>
        </div>
        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search design tools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(tool => (
            <Card key={tool.id} className="group hover:shadow-lg transition-all cursor-pointer border-border/60 hover:border-primary/40" onClick={() => navigate(tool.route)}>
              <CardContent className="p-0">
                <div className="p-4"><ProductPreview3D productType={tool.productType} className="h-40 mb-4" /></div>
                <div className="px-4 pb-5">
                  <div className="flex items-center gap-2 mb-2"><tool.icon className="h-5 w-5 text-primary" /><h3 className="font-semibold text-foreground">{tool.label}</h3></div>
                  <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                  <Button size="sm" className="w-full">Open Designer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground"><PenTool className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>No design tools match your search.</p></div>
        )}
      </main>
      <Footer />
    </div>
  );
}
