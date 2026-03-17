import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CheckCircle, FileText, Loader2, ArrowRight,
  Monitor, MapPin, Shield, Lock, Briefcase, Globe, Users, Home
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

export default function ServiceDetail() {
  const { serviceId } = useParams();
  const [service, setService] = useState<ServiceData | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [relatedServices, setRelatedServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

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
        // Fetch related services in same category
        const { data: related } = await supabase
          .from("services").select("*").eq("is_active", true)
          .eq("category", svcRes.data.category).neq("id", serviceId).limit(3);
        setRelatedServices((related || []) as ServiceData[]);
      }
      setRequirements((reqRes.data || []) as Requirement[]);
      setWorkflow((wfRes.data || []) as WorkflowStep[]);
      setLoading(false);
    };
    load();
  }, [serviceId]);

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
            <Link to={`/book?service=${encodeURIComponent(service?.name || "")}`}><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-navy py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-accent/20">
              <IconComp className="h-7 w-7 text-accent" />
            </div>
            <div>
              <Badge className="mb-2 border-gold/30 bg-gold/10 text-gold-light">{service.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</Badge>
              <h1 className="mb-2 font-display text-3xl font-bold text-primary-foreground md:text-4xl">{service.name}</h1>
              <p className="text-primary-foreground/70">{service.description || service.short_description}</p>
              <div className="mt-4 flex items-center gap-3">
                <Badge variant="outline" className="text-primary-foreground/80 border-primary-foreground/20 text-base px-3 py-1">{formatPrice(service)}</Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Requirements */}
            {requirements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="mb-4 font-display text-xl font-bold">Requirements</h2>
                <Card className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    {requirements.map(req => (
                      <div key={req.id} className="flex items-start gap-3">
                        <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${req.is_required ? "text-accent" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-sm">
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

            {/* Workflow Steps */}
            {workflow.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="mb-4 font-display text-xl font-bold">How It Works</h2>
                <div className="space-y-3">
                  {workflow.map((step, i) => (
                    <Card key={step.id} className="border-border/50">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                          <span className="font-display text-sm font-bold text-accent">{step.step_number}</span>
                        </div>
                        <div>
                          <h3 className="font-display font-semibold">{step.step_name}</h3>
                          {step.step_description && <p className="text-sm text-muted-foreground mt-0.5">{step.step_description}</p>}
                          <div className="mt-1 flex gap-1">
                            {step.requires_client_action && <Badge variant="secondary" className="text-xs">Client action</Badge>}
                            {step.requires_admin_action && <Badge variant="secondary" className="text-xs">Notary action</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-display text-lg font-semibold">Ready to Get Started?</h3>
                <Link to={`/book?service=${encodeURIComponent(service?.name || "")}`} className="block">
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" size="lg">
                    Book This Service <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/#contact" className="block">
                  <Button variant="outline" className="w-full">Contact Us</Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  Mon–Wed 10 AM – 7 PM · Responses within 2 hours
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="font-display text-sm font-semibold mb-3">Quick Links</h3>
                <div className="space-y-2 text-sm">
                  <Link to="/ron-check" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Monitor className="h-3 w-3" /> RON Eligibility Checker
                  </Link>
                  <Link to="/templates" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <FileText className="h-3 w-3" /> Document Templates
                  </Link>
                  <Link to="/fee-calculator" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Shield className="h-3 w-3" /> Fee Calculator
                  </Link>
                  <Link to="/loan-signing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Briefcase className="h-3 w-3" /> Loan Signing Partnership
                  </Link>
                </div>
              </CardContent>
            </Card>
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

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Shane Goble — Ohio Commissioned Notary Public</p>
      </footer>
    </div>
  );
}
