import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ServicePreQualifier from "@/components/ServicePreQualifier";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CheckCircle, FileText, Loader2, ArrowRight,
  Monitor, MapPin, Shield, Lock, Briefcase, Globe, Users, Home, Clock, AlertTriangle,
  MessageSquare, ExternalLink, Sparkles, User
} from "lucide-react";

const iconMap: Record<string, any> = {
  Monitor, MapPin, Users, FileText, Globe, Shield, Lock, Briefcase, Home,
  Copy: FileText, ScanFace: Shield, ClipboardCheck: FileText, Search: FileText,
  FileEdit: FileText, FileType: FileText, Scan: FileText, Paintbrush: FileText,
  FormInput: FileText, Building: Briefcase, Flag: Globe, Languages: Globe,
  Layers: FileText, CreditCard: Briefcase, Code: FileText, Award: Shield,
  Building2: Briefcase, Inbox: FileText, Bell: FileText, Layout: FileText,
  GraduationCap: Briefcase, ClipboardList: FileText, Workflow: FileText, Plane: Globe,
};

// Phase 3.1: Category-specific resource links
const categoryResources: Record<string, { label: string; url: string; icon: any }[]> = {
  authentication: [
    { label: "Ohio SOS Apostille", url: "https://www.ohiosos.gov/businesses/apostille-and-certification/", icon: ExternalLink },
    { label: "Hague Member Countries", url: "https://www.hcch.net/en/instruments/conventions/status-table/?cid=41", icon: Globe },
    { label: "Embassy Finder", url: "https://www.usembassy.gov/", icon: Globe },
  ],
  verification: [
    { label: "USCIS I-9 Central", url: "https://www.uscis.gov/i-9-central", icon: ExternalLink },
    { label: "E-Verify", url: "https://www.e-verify.gov/", icon: Shield },
    { label: "Acceptable Documents (Lists A/B/C)", url: "https://www.uscis.gov/i-9-central/form-i-9-acceptable-documents", icon: FileText },
  ],
  notarization: [
    { label: "RON Eligibility Checker", url: "/ron-check", icon: Monitor },
    { label: "Ohio Notary Statutes", url: "https://codes.ohio.gov/ohio-revised-code/chapter-147", icon: Shield },
    { label: "Notary Guide", url: "/notary-guide", icon: FileText },
  ],
  consulting: [
    { label: "USCIS Forms Portal", url: "https://www.uscis.gov/forms/all-forms", icon: ExternalLink },
    { label: "Common USCIS Forms", url: "https://www.uscis.gov/forms", icon: FileText },
  ],
  document_services: [
    { label: "Document Templates", url: "/templates", icon: FileText },
    { label: "Document Builder", url: "/document-builder", icon: FileText },
  ],
  business: [
    { label: "Business Portal", url: "/business", icon: Briefcase },
    { label: "Loan Signing Partnership", url: "/loan-signing", icon: Briefcase },
  ],
};

// Phase 3.2: Category-specific FAQs
const categoryFaqs: Record<string, { q: string; a: string }[]> = {
  authentication: [
    { q: "What is an apostille?", a: "An apostille is a certificate that authenticates a document for use in countries that are part of the Hague Apostille Convention. It's issued by the Ohio Secretary of State." },
    { q: "How long does apostille processing take?", a: "Standard processing takes 5-10 business days from submission to the Ohio SOS. Rush processing (2-3 days) is available for an additional fee." },
    { q: "Hague vs. Non-Hague countries?", a: "Hague Convention member countries accept apostilles directly. For non-member countries, you'll need consular legalization (authentication by the embassy), which takes longer." },
    { q: "What documents can be apostilled?", a: "Birth certificates, marriage certificates, articles of incorporation, court documents, notarized documents, and other official documents. The document must first be notarized if it's not already an official government document." },
  ],
  consulting: [
    { q: "What forms can a notary help with?", a: "A notary can administer oaths, witness signatures, and certify copies for USCIS forms. Common forms include I-130, I-485, I-765, N-400, I-90, I-131, I-864, and DS-160." },
    { q: "Can a notary provide legal advice?", a: "No. A notary cannot provide legal advice, fill out forms for you, or represent you before USCIS. For legal questions, consult an immigration attorney." },
    { q: "Which USCIS forms require notarization?", a: "Most USCIS forms with affidavits (like the I-864 Affidavit of Support) require notarization. Translations of foreign documents also typically need a notarized certificate of accuracy." },
    { q: "What's the notary's role vs. an attorney?", a: "The notary verifies identity and witnesses signatures. An attorney provides legal advice and represents you. Both roles are important but distinct." },
  ],
  verification: [
    { q: "When must the I-9 be completed?", a: "Section 1 must be completed by the employee's first day of work. Section 2 must be completed within 3 business days of the start date." },
    { q: "What are acceptable documents?", a: "List A documents (passport, permanent resident card) establish both identity and work authorization. Alternatively, one List B document (driver's license) plus one List C document (Social Security card) together." },
    { q: "Can I-9 verification be done remotely?", a: "DHS has authorized remote document examination as an alternative procedure. However, in-person physical examination is still the standard method." },
  ],
  notarization: [
    { q: "What is RON?", a: "Remote Online Notarization (RON) allows you to have documents notarized via a secure video call. Ohio authorizes RON under ORC §147.65-.66." },
    { q: "Am I eligible for RON?", a: "Most people are eligible. You'll need a valid government ID, a computer with camera/microphone, and stable internet. Some document types have restrictions." },
    { q: "What do I need for RON?", a: "A government-issued photo ID, computer with webcam and mic, stable internet connection, and the documents to be notarized in digital format." },
    { q: "What is notarization?", a: "Notarization is a fraud-deterrent process where a state-commissioned notary verifies the identity of signers and witnesses their signatures on important documents." },
    { q: "What ID do I need?", a: "A valid, unexpired government-issued photo ID such as a driver's license, state ID card, or passport." },
  ],
};

// Phase 3.4: Timeline estimates
const categoryTimelines: Record<string, string> = {
  notarization: "Same day",
  authentication: "5-10 business days",
  verification: "Within 3 days of hire",
  consulting: "Varies by case",
  document_services: "1-3 business days",
  business: "Custom timeline",
  recurring: "Ongoing",
};

// Phase 3.6: Complexity indicators
const categoryComplexity: Record<string, { level: string; duration: string }> = {
  notarization: { level: "Simple", duration: "10-30 min" },
  authentication: { level: "Complex", duration: "5-10 business days" },
  verification: { level: "Moderate", duration: "15-30 min" },
  consulting: { level: "Complex", duration: "30-60 min session" },
  document_services: { level: "Simple", duration: "1-3 days" },
  business: { level: "Moderate", duration: "Custom" },
  recurring: { level: "Simple", duration: "Ongoing" },
};

// Phase 3.8: Bundle suggestions
const bundleSuggestions: Record<string, string[]> = {
  authentication: ["Translation Coordination", "Certified Copy", "Document Preparation"],
  notarization: ["Witness Service", "Certified Copy", "Document Storage Vault"],
  verification: ["Document Preparation", "Certified Copy"],
  consulting: ["Translation Coordination", "Apostille Facilitation", "Document Preparation"],
};

// Phase 3.3: Legal disclaimers
const LEGAL_DISCLAIMER_CATEGORIES = ["consulting", "authentication"];

interface ServiceData {
  id: string; name: string; category: string; description: string | null;
  short_description: string | null; price_from: number | null; price_to: number | null;
  pricing_model: string; icon: string | null;
}

interface Requirement {
  id: string; description: string; requirement_type: string; is_required: boolean;
  ohio_statute_ref: string | null; display_order: number;
}

interface WorkflowStep {
  id: string; step_number: number; step_name: string; step_description: string | null;
  requires_client_action: boolean; requires_admin_action: boolean;
}

const PRE_QUALIFY_CATEGORIES = ["authentication", "consulting", "verification"];

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceData | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [relatedServices, setRelatedServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);
  const [showPreQualifier, setShowPreQualifier] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    const load = async () => {
      setLoading(true);
      const [svcRes, reqRes, wfRes] = await Promise.all([
        supabase.from("services").select("*").eq("id", serviceId).eq("is_active", true).single(),
        supabase.from("service_requirements").select("*").eq("service_id", serviceId).order("display_order"),
        supabase.from("service_workflows").select("*").eq("service_id", serviceId).order("step_number"),
      ]);
      if (svcRes.data) {
        setService(svcRes.data as ServiceData);
        const { data: related } = await supabase
          .from("services").select("*").eq("is_active", true)
          .eq("category", svcRes.data.category).neq("id", serviceId).limit(3);
        setRelatedServices((related || []) as ServiceData[]);
      }
      setRequirements((reqRes.data || []) as Requirement[]);
      setWorkflow((wfRes.data || []) as WorkflowStep[]);
      setCheckedItems(new Set());
      setLoading(false);
    };
    load();
  }, [serviceId]);

  useEffect(() => {
    if (service) {
      document.title = `${service.name} — Shane Goble Notary`;
    } else if (!loading) {
      document.title = "Service Not Found — Shane Goble Notary";
    }
    return () => { document.title = "Shane Goble Notary — Ohio Notary Public | In-Person & RON"; };
  }, [service, loading]);

  const formatPrice = (s: ServiceData) => {
    if (s.pricing_model === "custom") return "Custom Quote";
    const from = Number(s.price_from || 0);
    const to = Number(s.price_to || 0);
    if (from === 0 && to === 0) return "Contact Us";
    const suffix = s.pricing_model === "monthly" ? "/mo" : "";
    return to > from ? `$${from}–$${to}${suffix}` : `$${from}${suffix}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="font-display text-2xl font-bold">Service Not Found</h1>
        <p className="text-muted-foreground">This service may no longer be available.</p>
        <Link to="/services"><Button variant="outline"><ChevronLeft className="mr-1 h-4 w-4" /> Back to Services</Button></Link>
      </div>
    );
  }

  const IconComp = iconMap[service.icon || "FileText"] || FileText;
  const resources = categoryResources[service.category] || categoryResources.notarization;
  const faqs = categoryFaqs[service.category] || categoryFaqs.notarization;
  const timeline = categoryTimelines[service.category] || "Contact Us";
  const complexity = categoryComplexity[service.category] || { level: "Moderate", duration: "Varies" };
  const bundles = bundleSuggestions[service.category] || [];
  const showDisclaimer = LEGAL_DISCLAIMER_CATEGORIES.includes(service.category);
  const bookUrl = `/book?service=${encodeURIComponent(service.name)}${!["notarization", "authentication"].includes(service.category) ? "&type=in_person" : ""}`;

  const readinessPercent = requirements.length > 0 
    ? Math.round((checkedItems.size / requirements.filter(r => r.is_required).length) * 100)
    : 0;

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
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Link to="/services"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Services</Button></Link>
            <Link to={bookUrl}><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero with complexity & timeline badges (Phase 3.4, 3.6) */}
      <section className="bg-gradient-navy py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-accent/20">
              <IconComp className="h-7 w-7 text-accent" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className="border-gold/30 bg-gold/10 text-gold-light">{service.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                <Badge variant="outline" className="text-primary-foreground/60 border-primary-foreground/20 text-xs">
                  <Clock className="mr-1 h-3 w-3" /> {timeline}
                </Badge>
                <Badge variant="outline" className={`text-xs border-primary-foreground/20 ${
                  complexity.level === "Simple" ? "text-emerald-300" : complexity.level === "Complex" ? "text-amber-300" : "text-blue-300"
                }`}>
                  {complexity.level} · {complexity.duration}
                </Badge>
              </div>
              <h1 className="mb-2 font-display text-3xl font-bold text-primary-foreground md:text-4xl">{service.name}</h1>
              <p className="text-primary-foreground/70">{service.description || service.short_description}</p>
              <div className="mt-4 flex items-center gap-3">
                <Badge variant="outline" className="text-primary-foreground/80 border-primary-foreground/20 text-base px-3 py-1">{formatPrice(service)}</Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Phase 3.3: Legal disclaimer */}
      {showDisclaimer && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto max-w-4xl px-4 py-3">
            <p className="text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <strong>Disclaimer:</strong> This service does not constitute legal advice. A notary can administer oaths, witness signatures, and certify copies but cannot provide legal counsel. Consult an attorney for specific legal questions.
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Phase 3.5: Interactive readiness checklist */}
            {requirements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold">Preparation Checklist</h2>
                  {requirements.filter(r => r.is_required).length > 0 && (
                    <Badge variant="outline" className={readinessPercent === 100 ? "border-emerald-500 text-emerald-600" : ""}>
                      {readinessPercent}% ready
                    </Badge>
                  )}
                </div>
                <Card className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    {requirements.map(req => (
                      <div key={req.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={checkedItems.has(req.id)}
                          onCheckedChange={(checked) => {
                            setCheckedItems(prev => {
                              const next = new Set(prev);
                              if (checked) next.add(req.id); else next.delete(req.id);
                              return next;
                            });
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <p className={`text-sm ${checkedItems.has(req.id) ? "line-through text-muted-foreground" : ""}`}>
                            {req.description}
                            {!req.is_required && <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>}
                          </p>
                          {req.ohio_statute_ref && (
                            <p className="text-xs text-muted-foreground mt-0.5">Ref: {req.ohio_statute_ref}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Phase 3.7: Visual workflow timeline */}
            {workflow.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="mb-4 font-display text-xl font-bold">How It Works</h2>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {workflow.map((wfStep, i) => (
                      <div key={wfStep.id} className="relative flex items-start gap-4 pl-0">
                        <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 border-2 border-accent">
                          <span className="font-display text-xs font-bold text-accent">{wfStep.step_number}</span>
                        </div>
                        <div className="flex-1 pb-2">
                          <h3 className="font-display font-semibold text-sm">{wfStep.step_name}</h3>
                          {wfStep.step_description && <p className="text-xs text-muted-foreground mt-0.5">{wfStep.step_description}</p>}
                          <div className="mt-1 flex gap-1">
                            {wfStep.requires_client_action && (
                              <Badge variant="secondary" className="text-xs gap-1"><User className="h-3 w-3" /> Your action</Badge>
                            )}
                            {wfStep.requires_admin_action && (
                              <Badge variant="secondary" className="text-xs gap-1"><Shield className="h-3 w-3" /> Notary action</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Phase 3.2: Category-specific FAQs */}
            {faqs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="mb-4 font-display text-xl font-bold">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                      <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            )}

            {/* Immigration-specific content (Phase 10.2, 10.4) */}
            {service.category === "consulting" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" /> Important: Notary Role Clarification
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      A notary can administer oaths, witness signatures, and certify copies. A notary <strong>cannot</strong> provide legal advice, fill out forms for you, or represent you before USCIS. For legal counsel, please consult a licensed immigration attorney.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We provide service in English. For translations, please bring your own certified translator or request our Translation Coordination service.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {showPreQualifier && service ? (
              <ServicePreQualifier
                category={service.category}
                serviceName={service.name}
                onComplete={(params) => {
                  setShowPreQualifier(false);
                  const extra = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
                  navigate(`${bookUrl}${extra ? "&" + extra : ""}`);
                }}
                onCancel={() => setShowPreQualifier(false)}
              />
            ) : (
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-display text-lg font-semibold">Ready to Get Started?</h3>
                  {PRE_QUALIFY_CATEGORIES.includes(service?.category || "") ? (
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" size="lg" onClick={() => setShowPreQualifier(true)}>
                      Book This Service <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Link to={bookUrl} className="block">
                      <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" size="lg">
                        Book This Service <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Link to="/#contact" className="block">
                    <Button variant="outline" className="w-full">Contact Us</Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Mon–Wed 10 AM – 7 PM · Responses within 2 hours
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Phase 3.1: Dynamic resource links */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="font-display text-sm font-semibold mb-3">Helpful Resources</h3>
                <div className="space-y-2 text-sm">
                  {resources.map((r, i) => (
                    <a key={i} href={r.url} target={r.url.startsWith("http") ? "_blank" : undefined} rel={r.url.startsWith("http") ? "noreferrer" : undefined} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      {r.url.startsWith("http") ? <ExternalLink className="h-3 w-3" /> : <r.icon className="h-3 w-3" />}
                      {r.label}
                    </a>
                  ))}
                  <Link to="/fee-calculator" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Shield className="h-3 w-3" /> Fee Calculator
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Phase 3.8: Bundle suggestions */}
            {bundles.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-display text-sm font-semibold mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-accent" /> Often Paired With
                  </h3>
                  <div className="space-y-2 text-sm">
                    {bundles.map((b, i) => (
                      <Link key={i} to={`/services`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <ArrowRight className="h-3 w-3" /> {b}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-display text-xl font-bold">Related Services</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedServices.map(s => {
                const Icon = iconMap[s.icon || "FileText"] || FileText;
                return (
                  <Link key={s.id} to={`/services/${s.id}`}>
                    <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <Icon className="mb-2 h-5 w-5 text-accent" />
                        <h3 className="font-display text-sm font-semibold mb-1">{s.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{s.short_description || s.description}</p>
                        <p className="mt-2 text-xs font-medium text-accent flex items-center gap-1">Learn More <ArrowRight className="h-3 w-3" /></p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Phase 3.9: AI Chat Bubble */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-gold-dark transition-colors"
        aria-label="Ask a question about this service"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {showChat && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-lg border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Ask About {service.name}
            </span>
            <button onClick={() => setShowChat(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-3">Have questions about this service? Contact us directly for personalized assistance.</p>
            <Link to="/#contact">
              <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-gold-dark">
                <MessageSquare className="mr-1 h-3 w-3" /> Contact Us
              </Button>
            </Link>
          </div>
        </div>
      )}

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Shane Goble — Ohio Commissioned Notary Public</p>
      </footer>
    </div>
  );
}
