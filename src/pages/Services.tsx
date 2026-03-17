import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { ChevronRight, Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home, Loader2, Menu, Search, Sparkles, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import WhatDoINeed from "@/components/WhatDoINeed";

const iconMap: Record<string, any> = {
  Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home,
  Copy: FileText, ScanFace: Shield, ClipboardCheck: FileText, Search: FileText,
  FileEdit: FileText, FileType: FileText, Scan: FileText, Paintbrush: FileText,
  FormInput: FileText, Building: Briefcase, Flag: Globe, Languages: Globe,
  Layers: FileText, CreditCard: Briefcase, Code: FileText, Award: Shield,
  Building2: Briefcase, Inbox: FileText, Bell: FileText, Layout: FileText,
  GraduationCap: Briefcase, ClipboardList: FileText, Workflow: FileText, Plane: Globe,
};

const categoryLabels: Record<string, { label: string; description: string }> = {
  notarization: { label: "Core Notarization", description: "RON, in-person, witness, and certified copy services" },
  verification: { label: "Identity & Verification", description: "ID checks, I-9 verification, employment onboarding" },
  document_services: { label: "Document Services", description: "Preparation, PDF processing, scanning, and formatting" },
  authentication: { label: "Authentication & International", description: "Apostille, consular legalization, and translation services" },
  business: { label: "Business & Volume", description: "Bulk packages, subscriptions, API access, and partner programs" },
  recurring: { label: "Recurring & Value-Add", description: "Storage, virtual mailroom, reminders, and compliance packages" },
  consulting: { label: "Consulting & Training", description: "RON onboarding, workflow audits, and custom automation" },
};

const categoryOrder = ["notarization", "verification", "document_services", "authentication", "business", "recurring", "consulting"];

type Service = {
  id: string; name: string; category: string; description: string | null;
  short_description: string | null; price_from: number | null; price_to: number | null;
  pricing_model: string; icon: string | null;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [helpQuery, setHelpQuery] = useState("");
  const [helpResult, setHelpResult] = useState("");
  const [helpLoading, setHelpLoading] = useState(false);

  const submitHelp = async () => {
    if (!helpQuery.trim() || helpLoading) return;
    setHelpLoading(true);
    setHelpResult("");
    let soFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: "user", content: helpQuery }] }),
      });
      if (!resp.ok) throw new Error("AI unavailable");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { soFar += content; setHelpResult(soFar); }
          } catch { /* partial */ }
        }
      }
    } catch {
      setHelpResult("AI assistant is temporarily unavailable. Please contact us directly.");
    }
    setHelpLoading(false);
  };

  useEffect(() => {
    document.title = "Services — Shane Goble Notary";
    supabase.from("services").select("*").eq("is_active", true).order("display_order").then(({ data }) => {
      if (data) setServices(data as Service[]);
      setLoading(false);
    });
    return () => { document.title = "Shane Goble Notary — Ohio Notary Public | In-Person & RON"; };
  }, []);

  const formatPrice = (s: Service) => {
    if (s.pricing_model === "custom") return "Custom Quote";
    const from = Number(s.price_from || 0);
    const to = Number(s.price_to || 0);
    if (from === 0 && to === 0) return "Contact Us";
    const suffix = s.pricing_model === "monthly" ? "/mo" : "";
    return to > from ? `$${from}–$${to}${suffix}` : `$${from}${suffix}`;
  };

  // Phase 2.2: Search filter
  const filteredServices = searchQuery
    ? services.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.short_description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : services;

  const grouped = categoryOrder
    .filter(cat => activeCategory === "all" || activeCategory === cat)
    .map(cat => ({
      category: cat,
      ...categoryLabels[cat],
      items: filteredServices.filter(s => s.category === cat),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">SG</span>
            </div>
            <div>
              <span className="block font-display text-lg font-bold text-foreground">Shane Goble</span>
              <span className="block text-xs text-muted-foreground">Notary Public — Ohio</span>
            </div>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/templates" className="text-sm font-medium text-muted-foreground hover:text-foreground">Templates</Link>
            <Link to="/fee-calculator" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</Link>
            <DarkModeToggle />
            <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
            <Link to="/book"><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button></Link>
          </div>
          <Sheet>
            <SheetTrigger asChild className="md:hidden"><Button variant="ghost" size="sm" aria-label="Open menu"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-8 flex flex-col gap-4">
                <Link to="/" className="text-sm font-medium">Home</Link>
                <Link to="/templates" className="text-sm font-medium">Templates</Link>
                <Link to="/fee-calculator" className="text-sm font-medium">Pricing</Link>
                <Link to="/login"><Button variant="outline" className="w-full">Sign In</Button></Link>
                <Link to="/book"><Button className="w-full bg-accent text-accent-foreground">Book Now</Button></Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 font-display text-4xl font-bold text-primary-foreground md:text-5xl">Services</h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/70">
            Fast, secure notary and document services for individuals and businesses in Ohio.
            Transparent pricing, secure storage, and business plans available.
          </p>
        </div>
      </section>

      {/* "What Do I Need?" Quick Helper */}
      <WhatDoINeed />

      {/* Search + Filter */}
      <div className="container mx-auto px-4 py-8">
        <div className="relative mb-4 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Phase 2.3: Horizontal scroll on mobile */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-8 overflow-x-auto flex-nowrap h-auto gap-1 w-full justify-start sm:flex-wrap sm:justify-center">
            <TabsTrigger value="all">All Services</TabsTrigger>
            {categoryOrder.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs whitespace-nowrap">{categoryLabels[cat].label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : grouped.length === 0 && searchQuery ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p>No services match "{searchQuery}"</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>Clear Search</Button>
          </div>
        ) : (
          <div className="space-y-16">
            {grouped.map((group) => (
              <motion.section key={group.category} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
                <motion.div variants={fadeUp} custom={0} className="mb-6">
                  <h2 className="font-display text-2xl font-bold text-foreground">{group.label}</h2>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </motion.div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((s, i) => {
                    const IconComp = iconMap[s.icon || "FileText"] || FileText;
                    // Phase 2.1: Pass service context to booking
                    const bookUrl = `/book?service=${encodeURIComponent(s.name)}${!["notarization", "authentication"].includes(s.category) ? "&type=in_person" : ""}`;
                    return (
                      <motion.div key={s.id} variants={fadeUp} custom={i + 1}>
                        <Card className="group h-full border-border/50 transition-all hover:border-accent/30 hover:shadow-lg">
                          <CardContent className="flex h-full flex-col p-6">
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                                <IconComp className="h-5 w-5 text-accent" />
                              </div>
                              <Badge variant="outline" className="text-xs">{formatPrice(s)}</Badge>
                            </div>
                            <h3 className="mb-1 font-display text-base font-semibold text-foreground">{s.name}</h3>
                            <p className="mb-4 flex-1 text-sm text-muted-foreground">{s.description || s.short_description}</p>
                            <div className="flex gap-2">
                              <Link to={`/services/${s.id}`} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full">
                                  More Info
                                </Button>
                              </Link>
                              <Link to={bookUrl} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                                  Get Started <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mb-6 text-muted-foreground">Book an appointment or contact us for a custom quote.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Appointment</Button></Link>
            <Link to="/fee-calculator"><Button size="lg" variant="outline">View Pricing</Button></Link>
            <Link to="/loan-signing"><Button size="lg" variant="outline">Loan Signing Partnership</Button></Link>
            <Link to="/ron-check"><Button size="lg" variant="outline">RON Eligibility Checker</Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Shane Goble — Ohio Commissioned Notary Public</p>
      </footer>
    </div>
  );
}
