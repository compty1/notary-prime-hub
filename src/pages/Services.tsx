import { useState, useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useDebounce } from "@/lib/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ChevronRight, FileText, Search, Sparkles, ArrowRight, Mail, Scan, FileEdit, Wand2 } from "lucide-react";
import WhatDoINeed from "@/components/WhatDoINeed";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ServicesLoadingSkeleton } from "@/components/ServicesLoadingSkeleton";
import {
  INTAKE_ONLY_SERVICES, SAAS_LINKS, SUBSCRIPTION_SERVICES,
  PRICING_SUFFIXES, CATEGORY_LABELS, CATEGORY_ORDER,
  SERVICE_ICON_MAP, NOTARY_CATEGORIES,
} from "@/lib/serviceConstants";

const aiTools = [
  { icon: Wand2, title: "AI Tools Hub", description: "50+ professional AI tools — contracts, proposals, reports, analysis, compliance docs, and more.", link: "/ai-tools", cta: "Explore Tools" },
  { icon: Mail, title: "AI Writing Tools", description: "Generate professional emails, social media posts, and documents in seconds with AI.", link: "/ai-writer", cta: "Start Writing" },
  { icon: FileEdit, title: "Document Generator", description: "Build resumes, invoices, and contracts with beautiful templates and PDF export.", link: "/builder", cta: "Create Document" },
  { icon: Scan, title: "Document Digitization", description: "AI-powered OCR to convert paper documents and scans into editable, searchable text.", link: "/digitize", cta: "Digitize Now" },
];

type Service = {
  id: string; name: string; category: string; description: string | null;
  short_description: string | null; price_from: number | null; price_to: number | null;
  pricing_model: string; icon: string | null; is_popular: boolean;
  estimated_turnaround: string | null;
};

/** Gap #21/#20: Use "Notarize Now" only for notary categories */
function getServiceAction(s: Service): { url: string; label: string } {
  if (SAAS_LINKS[s.name]) return { url: SAAS_LINKS[s.name], label: "Use Tool" };
  if (INTAKE_ONLY_SERVICES.has(s.name)) return { url: `/request?service=${encodeURIComponent(s.name)}`, label: "Get Started" };
  if (SUBSCRIPTION_SERVICES.has(s.name)) return { url: "/subscribe", label: "View Plans" };
  if (s.name === "White-Label Partner Programs") return { url: "/join", label: "Apply" };
  const isNotary = NOTARY_CATEGORIES.has(s.category);
  return {
    url: `/book?service=${encodeURIComponent(s.name)}${!isNotary ? "&type=in_person" : ""}`,
    label: isNotary ? "Notarize Now" : "Book Now",
  };
}

function formatPrice(s: Service) {
  if (s.pricing_model === "custom") return "Custom Quote";
  const from = Number(s.price_from || 0);
  const to = Number(s.price_to || 0);
  if (from === 0 && to === 0) return "Contact Us";
  const suffix = PRICING_SUFFIXES[s.pricing_model] || "";
  return to > from ? `$${from}–$${to}${suffix}` : `$${from}${suffix}`;
}

const PROTECTED_PREFIXES = ["/request", "/subscribe", "/mailroom", "/digitize", "/builder", "/ai-writer", "/ai-extractors", "/ai-knowledge", "/signature-generator", "/grants", "/resume-builder", "/ai-tools", "/portal", "/verify-id", "/mobile-upload"];

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const categoryParam = searchParams.get("category");
  const queryParam = searchParams.get("q") || "";
  const [activeCategory, setActiveCategory] = useState(
    categoryParam && CATEGORY_ORDER.includes(categoryParam) ? categoryParam : "all"
  );
  const [searchQuery, setSearchQuery] = useState(queryParam);
  usePageMeta({ title: "Notary & Document Services", description: "Browse our full range of Ohio notary services including RON, mobile notarization, loan signing, apostille, I-9 verification, and more." });

  useEffect(() => {
    if (categoryParam && CATEGORY_ORDER.includes(categoryParam)) setActiveCategory(categoryParam);
  }, [categoryParam]);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Gap #14: Use Supabase client instead of raw fetch */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setError("Request timed out. Please try again.");
      setLoading(false);
    }, 10000);

    supabase
      .from("services")
      .select("id,name,category,description,short_description,price_from,price_to,pricing_model,icon,is_popular,estimated_turnaround")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        clearTimeout(timeout);
        if (fetchError) {
          console.error("Services fetch failed:", fetchError);
          setError(fetchError.message || "Failed to load services");
        } else {
          setServices((data as Service[]) || []);
          setError(null);
        }
        setLoading(false);
      });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  const debouncedSearch = useDebounce(searchQuery, 300);

  /** Gap #9: Deep-link search via ?q= URL param */
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  }, [debouncedSearch]);

  const filteredServices = debouncedSearch
    ? services.filter(s => {
        const q = debouncedSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q) ||
          (s.short_description || "").toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q);
      })
    : services;

  const knownCats = new Set(CATEGORY_ORDER);
  const grouped = [
    ...CATEGORY_ORDER
      .filter(cat => activeCategory === "all" || activeCategory === cat)
      .map(cat => ({
        category: cat,
        ...(CATEGORY_LABELS[cat] || { label: cat, description: "" }),
        items: filteredServices.filter(s => s.category === cat),
      })),
    ...(activeCategory === "all"
      ? [{
          category: "_other",
          label: "Other Services",
          description: "",
          items: filteredServices.filter(s => !knownCats.has(s.category)),
        }]
      : []),
  ].filter(g => g.items.length > 0);

  /** Gap #35: Retry preserves filter/search state */
  const retry = () => { setLoading(true); setError(null); window.location.search = searchParams.toString(); };

  return (
    <PageShell>
      {/* Hero — Block Shadow */}
      <section className="relative overflow-hidden border-b-2 border-border bg-card py-16 md:py-20">
        <div className="container relative mx-auto px-4 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Everything you need</p>
          <h1 className="mb-4 text-4xl font-bold text-[hsl(220,26%,14%)] md:text-5xl">
            Services
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Fast, secure notary and document services for individuals and businesses in Ohio.
            Transparent pricing, secure storage, and business plans available.
          </p>
        </div>
      </section>

      <WhatDoINeed />

      {/* AI Tools — Block Shadow cards */}
      <section className="border-b-2 border-border bg-[hsl(45,96%,50%)]/5 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <Badge className="mb-3 bg-[hsl(45,96%,50%)]/10 text-[hsl(45,96%,40%)] border-[hsl(45,96%,50%)]/20 rounded-lg font-bold"><Sparkles className="mr-1 h-3 w-3" /> AI-Powered</Badge>
            <h2 className="mb-2 text-2xl font-bold text-[hsl(220,26%,14%)] md:text-3xl">Do It Yourself</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">Every tool is enhanced with AI — smarter suggestions, auto-fill, and intelligent recommendations.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {aiTools.map((tool, i) => (
              <motion.div key={tool.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group h-full rounded-[24px] border-2 border-border shadow-[4px_4px_0px_hsl(220,10%,85%)] hover:shadow-[6px_6px_0px_hsl(45,96%,50%)] transition-shadow">
                  <CardContent className="flex h-full flex-col items-center p-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(45,96%,50%)]/10 group-hover:bg-[hsl(45,96%,50%)]/20 transition-colors">
                      <tool.icon className="h-7 w-7 text-[hsl(45,96%,50%)]" />
                    </div>
                    <h3 className="mb-2 font-bold text-foreground">{tool.title}</h3>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground">{tool.description}</p>
                    <Link to={tool.link} className="w-full">
                      <Button variant="outline" className="w-full rounded-xl font-bold border-2 group-hover:bg-[hsl(45,96%,50%)] group-hover:text-[hsl(220,26%,14%)] group-hover:border-[hsl(220,26%,14%)] transition-colors">
                        {tool.cta} <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search + Filter */}
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="relative mb-4 max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search services..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl border-2 border-border" />
        </div>

        <Tabs value={activeCategory} onValueChange={(val) => { setActiveCategory(val); const params = new URLSearchParams(searchParams); if (val === "all") params.delete("category"); else params.set("category", val); setSearchParams(params, { replace: true }); }}>
          <TabsList className="mb-8 overflow-x-auto flex-nowrap h-auto gap-1 w-full justify-start sm:flex-wrap sm:justify-center scroll-smooth snap-x bg-[hsl(220,10%,95%)] rounded-2xl p-1">
            <TabsTrigger value="all" className="snap-start rounded-xl font-bold text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">All Services ({services.length})</TabsTrigger>
            {CATEGORY_ORDER.map(cat => {
              const count = services.filter(s => s.category === cat).length;
              return (
                <TabsTrigger key={cat} value={cat} className="text-xs whitespace-nowrap snap-start rounded-xl font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">{CATEGORY_LABELS[cat]?.label || cat} ({count})</TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {loading ? (
          <ServicesLoadingSkeleton />
        ) : error ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-bold">We couldn't load services right now.</p>
            <p className="mt-2 text-xs text-muted-foreground/80">{error}</p>
            <Button variant="outline" className="mt-4 rounded-xl font-bold border-2" onClick={retry}>Retry</Button>
          </div>
        ) : grouped.length === 0 && searchQuery ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-bold">No services match "{searchQuery}"</p>
            <Button variant="outline" className="mt-4 rounded-xl font-bold border-2" onClick={() => setSearchQuery("")}>Clear Search</Button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground"><p>No active services are available right now.</p></div>
        ) : (
          <div className="space-y-16">
            {grouped.map((group) => (
              <section key={group.category}>
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.35 }} className="mb-6">
                  <h2 className="text-2xl font-bold text-[hsl(220,26%,14%)]">{group.label}</h2>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </motion.div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((s, i) => {
                    const IconComp = SERVICE_ICON_MAP[s.icon || "FileText"] || FileText;
                    const { url: actionUrl, label: actionLabel } = getServiceAction(s);
                    return (
                      <motion.div key={s.id} initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.25, delay: i * 0.03 }}>
                        <Card className="group h-full rounded-[24px] border-2 border-border shadow-[4px_4px_0px_hsl(220,10%,85%)] hover:shadow-[6px_6px_0px_hsl(45,96%,50%)] transition-shadow" role="article">
                          <CardContent className="flex h-full flex-col p-6">
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(45,96%,50%)]/10 group-hover:bg-[hsl(45,96%,50%)]/20 transition-colors">
                                <IconComp className="h-5 w-5 text-[hsl(45,96%,50%)]" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                {s.is_popular && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-[hsl(45,96%,50%)] text-[hsl(220,26%,14%)] font-bold rounded-md">Popular</Badge>
                                )}
                                <Badge variant="outline" className="text-xs font-mono font-bold rounded-lg border-2">{formatPrice(s)}</Badge>
                              </div>
                            </div>
                            <h3 className="mb-1 text-base font-bold text-foreground">{s.name}</h3>
                            <p className="mb-4 flex-1 text-sm text-muted-foreground">{s.description || s.short_description}</p>
                            <div className="flex gap-2">
                              <Link to={`/services/${s.id}`} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full rounded-xl font-bold border-2">More Info</Button>
                              </Link>
                              {!user && PROTECTED_PREFIXES.some(p => actionUrl.startsWith(p)) ? (
                                <Button size="sm" className="flex-1 rounded-xl font-bold bg-[hsl(45,96%,50%)] text-[hsl(220,26%,14%)] hover:bg-[hsl(45,96%,45%)] shadow-[3px_3px_0px_hsl(220,26%,14%)]"
                                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(actionUrl)}`)}>
                                  {actionLabel} <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                              ) : (
                                <Link to={actionUrl} className="flex-1">
                                  <Button size="sm" className="w-full rounded-xl font-bold bg-[hsl(45,96%,50%)] text-[hsl(220,26%,14%)] hover:bg-[hsl(45,96%,45%)] shadow-[3px_3px_0px_hsl(220,26%,14%)]">
                                    {actionLabel} <ChevronRight className="ml-1 h-3 w-3" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* CTA — Block Shadow */}
      <section className="border-t-2 border-border bg-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-[hsl(220,26%,14%)]">Ready to Get Started?</h2>
          <p className="mb-6 text-muted-foreground">Book an appointment or contact us for a custom quote.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="rounded-xl font-bold bg-[hsl(45,96%,50%)] text-[hsl(220,26%,14%)] hover:bg-[hsl(45,96%,45%)] shadow-[4px_4px_0px_hsl(220,26%,14%)] px-8">Notarize Now</Button></Link>
            <Link to="/fee-calculator"><Button size="lg" variant="outline" className="rounded-xl font-bold border-2">View Pricing</Button></Link>
            <Link to="/loan-signing"><Button size="lg" variant="outline" className="rounded-xl font-bold border-2">Loan Signing Partnership</Button></Link>
            <Link to="/ron-check"><Button size="lg" variant="outline" className="rounded-xl font-bold border-2">RON Eligibility Checker</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
