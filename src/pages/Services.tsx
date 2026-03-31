import { useState, useEffect } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Link } from "react-router-dom";
// Services data is fetched via REST API directly
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";
import { useDebounce } from "@/lib/useDebounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ChevronRight, Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home, Search, Sparkles, ArrowRight, Headphones, PenTool, BarChart3, MessageSquare, Wrench, Eye, Mail, Scan, FileEdit } from "lucide-react";
import WhatDoINeed from "@/components/WhatDoINeed";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ServicesLoadingSkeleton } from "@/components/ServicesLoadingSkeleton";

const aiTools = [
  {
    icon: Mail,
    title: "AI Writing Tools",
    description: "Generate professional emails, social media posts, and documents in seconds with AI.",
    link: "/ai-writer",
    cta: "Start Writing",
  },
  {
    icon: FileEdit,
    title: "Document Generator",
    description: "Build resumes, invoices, and contracts with beautiful templates and PDF export.",
    link: "/builder",
    cta: "Create Document",
  },
  {
    icon: Scan,
    title: "Document Digitization",
    description: "AI-powered OCR to convert paper documents and scans into editable, searchable text.",
    link: "/digitize",
    cta: "Digitize Now",
  },
];

const iconMap: Record<string, any> = {
  Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home,
  Copy: FileText, ScanFace: Shield, ClipboardCheck: FileText, Search: FileText,
  FileEdit: FileText, FileType: FileText, Scan: FileText, Paintbrush: FileText,
  FormInput: FileText, Building: Briefcase, Flag: Globe, Languages: Globe,
  Layers: FileText, CreditCard: Briefcase, Code: FileText, Award: Shield,
  Building2: Briefcase, Inbox: FileText, Bell: FileText, Layout: FileText,
  GraduationCap: Briefcase, ClipboardList: FileText, Workflow: FileText, Plane: Globe,
  Headphones, PenTool, BarChart3, MessageSquare, Wrench, Eye,
  Mail: MessageSquare,
};

const categoryLabels: Record<string, { label: string; description: string }> = {
  notarization: { label: "Core Notarization", description: "RON, in-person, witness, and certified copy services" },
  verification: { label: "Identity & Verification", description: "ID checks, I-9 verification, employment onboarding" },
  document_services: { label: "Document Services", description: "Preparation, PDF processing, scanning, and formatting" },
  authentication: { label: "Authentication & International", description: "Apostille, consular legalization, and translation services" },
  business: { label: "Business & Volume", description: "Bulk packages, subscriptions, API access, and partner programs" },
  recurring: { label: "Recurring & Value-Add", description: "Storage, virtual mailroom, reminders, and compliance packages" },
  consulting: { label: "Consulting & Training", description: "RON onboarding, workflow audits, and custom automation" },
  business_services: { label: "Business Services", description: "Email management, correspondence handling, and administrative support" },
  admin_support: { label: "Administrative Support", description: "Data entry, travel planning, and general admin tasks" },
  content_creation: { label: "Content Creation", description: "Blog posts, social media, newsletters, and copywriting" },
  research: { label: "Research", description: "Market analysis, lead generation, and competitive intelligence" },
  customer_service: { label: "Customer Service", description: "Email support, live chat, and customer communication" },
  technical_support: { label: "Technical Support", description: "Website updates, content management, and tech tasks" },
  ux_testing: { label: "User Experience", description: "UX audits, usability testing, workflow analysis, and research" },
};

const categoryOrder = ["notarization", "verification", "document_services", "authentication", "business", "recurring", "consulting", "business_services", "admin_support", "content_creation", "research", "customer_service", "technical_support", "ux_testing"];

const INTAKE_ONLY_SERVICES = new Set([
  "Apostille Facilitation", "Consular Legalization Prep", "Background Check Coordination",
  "Clerical Document Preparation", "Document Cleanup & Formatting", "Form Filling Assistance",
  "Certified Document Prep for Agencies", "Registered Agent Coordination",
  "Email Management & Correspondence", "Notarized Translation Coordination",
  "Data Entry", "Travel Arrangements", "Blog Post Writing", "Social Media Content",
  "Newsletter Design", "Market Research Report", "Lead Generation",
  "Email Support Handling", "Live Chat Support", "Website Content Updates",
  "UX Audit & Heuristic Review", "User Flow & Workflow Testing",
  "Usability Testing & Report", "UX Research & Persona Development",
]);
const SAAS_LINKS: Record<string, string> = {
  "Document Storage Vault": "/portal",
  "Cloud Document Storage": "/portal",
  "PDF Services": "/digitize",
  "Document Digitization": "/digitize",
  "Document Scanning & Digitization": "/digitize",
  "Document Translation": "/digitize",
  "Template Library & Form Builder": "/templates",
  "Virtual Mailroom": "/mailroom",
  "ID Verification / KYC Checks": "/verify-id",
};
const SUBSCRIPTION_SERVICES = new Set([
  "Business Subscription Plans", "API & Integration Services", "White-Label Partner Programs",
]);

function getServiceAction(s: Service): { url: string; label: string } {
  if (SAAS_LINKS[s.name]) return { url: SAAS_LINKS[s.name], label: "Use Tool" };
  if (INTAKE_ONLY_SERVICES.has(s.name)) return { url: `/request?service=${encodeURIComponent(s.name)}`, label: "Get Started" };
  if (SUBSCRIPTION_SERVICES.has(s.name)) return { url: "/subscribe", label: "View Plans" };
  if (s.name === "White-Label Partner Programs") return { url: "/join", label: "Apply" };
  return { url: `/book?service=${encodeURIComponent(s.name)}${!["notarization", "authentication"].includes(s.category) ? "&type=in_person" : ""}`, label: "Book Now" };
}

type Service = {
  id: string; name: string; category: string; description: string | null;
  short_description: string | null; price_from: number | null; price_to: number | null;
  pricing_model: string; icon: string | null;
};

export default function Services() {
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
      const resp = await callEdgeFunctionStream("client-assistant", { messages: [{ role: "user", content: helpQuery }] }, 60000);
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

  usePageTitle("Services");

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    setIsError(false);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("services")
        .select("id, name, category, description, short_description, price_from, price_to, pricing_model, icon")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (fetchErr) throw new Error(fetchErr.message);
      setServices((data || []) as Service[]);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const refetch = fetchServices;

  const formatPrice = (s: Service) => {
    if (s.pricing_model === "custom") return "Custom Quote";
    const from = Number(s.price_from || 0);
    const to = Number(s.price_to || 0);
    if (from === 0 && to === 0) return "Contact Us";
    const suffixMap: Record<string, string> = { per_seal: "/seal", per_document: "/doc", per_page: "/pg", monthly: "/mo", hourly: "/hr", per_session: "/session", flat: "" };
    const suffix = suffixMap[s.pricing_model] || "";
    return to > from ? `$${from}–$${to}${suffix}` : `$${from}${suffix}`;
  };

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredServices = debouncedSearch
    ? services.filter(s => 
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.short_description || "").toLowerCase().includes(debouncedSearch.toLowerCase())
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
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card py-16">
        <div className="container relative mx-auto px-4 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Everything you need</p>
          <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">Services</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Fast, secure notary and document services for individuals and businesses in Ohio.
            Transparent pricing, secure storage, and business plans available.
          </p>
        </div>
      </section>

      <WhatDoINeed />

      {/* Do It Yourself — AI SaaS Tools */}
      <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-3"><Sparkles className="mr-1 h-3 w-3" /> AI-Powered</Badge>
            <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Do It Yourself</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Every tool is enhanced with AI — smarter suggestions, auto-fill, and intelligent recommendations.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {aiTools.map((tool, i) => (
              <motion.div key={tool.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group h-full border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="flex h-full flex-col items-center p-6 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <tool.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">{tool.title}</h3>
                    <p className="mb-4 flex-1 text-sm text-muted-foreground">{tool.description}</p>
                    <Link to={tool.link} className="w-full">
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-8 overflow-x-auto flex-nowrap h-auto gap-1 w-full justify-start sm:flex-wrap sm:justify-center">
            <TabsTrigger value="all">All Services</TabsTrigger>
            {categoryOrder.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs whitespace-nowrap">{categoryLabels[cat].label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <ServicesLoadingSkeleton />
        ) : isError ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p>We couldn’t load services right now.</p>
            <p className="mt-2 text-xs text-muted-foreground/80">{(error as Error)?.message || "Please try again."}</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : grouped.length === 0 && searchQuery ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p>No services match "{searchQuery}"</p>
            <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>Clear Search</Button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p>No active services are available right now.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {grouped.map((group) => (
              <section key={group.category}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.35 }}
                  className="mb-6"
                >
                  <h2 className="font-sans text-2xl font-bold text-foreground">{group.label}</h2>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </motion.div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((s, i) => {
                    const IconComp = iconMap[s.icon || "FileText"] || FileText;
                    const { url: actionUrl, label: actionLabel } = getServiceAction(s);
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                      >
                        <Card className="group h-full hover:border-primary/20">
                          <CardContent className="flex h-full flex-col p-6">
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <IconComp className="h-5 w-5 text-primary" />
                              </div>
                              <Badge variant="outline" className="text-xs font-mono">{formatPrice(s)}</Badge>
                            </div>
                            <h3 className="mb-1 font-sans text-base font-semibold text-foreground">{s.name}</h3>
                            <p className="mb-4 flex-1 text-sm text-muted-foreground">{s.description || s.short_description}</p>
                            <div className="flex gap-2">
                              <Link to={`/services/${s.id}`} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full">
                                  More Info
                                </Button>
                              </Link>
                              <Link to={actionUrl} className="flex-1">
                                <Button size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                  {actionLabel} <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                              </Link>
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

      {/* CTA */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-sans text-2xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mb-6 text-muted-foreground">Book an appointment or contact us for a custom quote.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="rounded-full px-8">Book Appointment</Button></Link>
            <Link to="/fee-calculator"><Button size="lg" variant="outline">View Pricing</Button></Link>
            <Link to="/loan-signing"><Button size="lg" variant="outline">Loan Signing Partnership</Button></Link>
            <Link to="/ron-check"><Button size="lg" variant="outline">RON Eligibility Checker</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
