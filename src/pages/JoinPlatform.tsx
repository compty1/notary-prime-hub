import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { submitLead } from "@/lib/submitLead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import {
  Users, Shield, Calendar, DollarSign, CheckCircle, ChevronRight,
  Award, Monitor, FileText, Briefcase, ArrowRight, Loader2, Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";

import { fadeUp } from "@/lib/animations";

const benefits = [
  { icon: Calendar, title: "Flexible Schedule", desc: "Set your own hours and availability. Accept appointments that fit your schedule." },
  { icon: Users, title: "Client Pipeline", desc: "Receive pre-qualified client referrals. No cold calling or lead generation required." },
  { icon: DollarSign, title: "Competitive Revenue", desc: "Transparent fee structure with competitive per-signing rates and travel fee reimbursement." },
  { icon: Monitor, title: "Admin Tools", desc: "Full access to our notary dashboard: journal, scheduling, document management, and AI assistant." },
  { icon: Shield, title: "Compliance Support", desc: "Built-in Ohio ORC §147 compliance checks, e-seal verification, and automated journal entries." },
  { icon: FileText, title: "Document Services", desc: "Offer digitization, template preparation, and secure storage as value-add services to your clients." },
];

const requirements = [
  "Active Ohio Notary Public commission",
  "NNA background check (completed within last 5 years)",
  "Errors & Omissions (E&O) insurance ($25,000+ recommended)",
  "Surety bond as required by Ohio law",
  "Reliable transportation for mobile notarizations",
  "RON certification (optional but preferred)",
];

const howItWorks = [
  { step: "01", title: "Apply", desc: "Complete the application form below with your credentials and experience." },
  { step: "02", title: "Verify", desc: "We verify your commission, background check, and insurance documentation." },
  { step: "03", title: "Onboard", desc: "Access our platform, set up your profile, availability, and service preferences." },
  { step: "04", title: "Start", desc: "Begin accepting appointments and earning. Full support from day one." },
];

const providerFaqs = [
  { q: "How is compensation structured?", a: "You receive a competitive per-signing rate based on the service type. Travel fees are passed through to the client. Platform fees are transparent and deducted only from completed appointments." },
  { q: "Can I set my own schedule?", a: "Yes. You have full control over your availability through the notary dashboard. Set recurring hours or specific dates, and only accept appointments that work for you." },
  { q: "What technology do I need?", a: "A smartphone or computer with internet access. For RON sessions, you'll need a webcam, microphone, and stable internet connection. We provide the platform — you bring the commission." },
  { q: "Do I need RON certification?", a: "RON certification is not required but strongly preferred. We provide onboarding support for notaries seeking RON authorization under Ohio ORC §147.65-.66." },
  { q: "What areas do you serve?", a: "We primarily serve Franklin County and the greater Columbus, Ohio metropolitan area for in-person services. RON services are available statewide." },
  { q: "How quickly can I start?", a: "Once your credentials are verified (typically 3-5 business days), you can begin accepting appointments immediately." },
];

const serviceOptions = [
  "In-Person Notarization",
  "Remote Online Notarization (RON)",
  "Loan Signing",
  "Real Estate Closings",
  "I-9 Employment Verification",
  "Apostille Coordination",
  "Document Preparation",
  "Mobile Notary Services",
];

export default function JoinPlatform() {
  usePageMeta({ title: "Join Our Notary Network", description: "Apply to join the Notar notary network. Commission-based opportunities for Ohio-commissioned notaries and signing agents." });
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", commissionNumber: "",
    state: "OH", experience: "", message: "",
  });
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Required fields", description: "Please fill in your name and email.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { success, error } = await submitLead({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      source: "provider_application",
      state: form.state,
      notes: [
        form.commissionNumber ? `Commission #: ${form.commissionNumber}` : "",
        form.experience ? `Experience: ${form.experience} years` : "",
        selectedServices.size > 0 ? `Services: ${Array.from(selectedServices).join(", ")}` : "",
        form.message ? `Message: ${form.message}` : "",
      ].filter(Boolean).join("\n"),
      service_needed: "Provider Application",
    });
    setSubmitting(false);
    if (!success) {
      toast({ title: "Submission failed", description: "Please try again or contact us directly.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Application received!", description: "We'll review your application and get back to you within 3-5 business days." });
    }
  };

  return (
    <PageShell>

      {/* Hero */}
      <section className="bg-gradient-hero py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <Breadcrumbs />
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-6 border-primary/20 bg-primary/10 text-primary">
                <Users className="mr-1 h-3 w-3" /> Now Accepting Applications
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
              Join Our Notary Network
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Partner with us to grow your notary business. Get pre-qualified clients, professional tools, 
              and the support you need to deliver exceptional notarization and document services across Ohio.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8">
              <a href="#apply">
                <Button size="lg" className="">
                  Apply Now <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center font-sans text-3xl font-bold text-foreground">Why Join Our Platform?</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <b.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-2 font-sans text-base font-semibold">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center font-sans text-3xl font-bold text-foreground">Requirements</h2>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <ul className="space-y-3">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-12 text-center font-sans text-3xl font-bold text-foreground">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {howItWorks.map((s, i) => (
              <motion.div key={s.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                  <span className="font-sans text-lg font-bold text-primary-foreground">{s.step}</span>
                </div>
                <h3 className="mb-2 font-sans text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-2xl px-4">
          <h2 className="mb-8 text-center font-sans text-3xl font-bold text-foreground">Apply to Join</h2>
          {submitted ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle className="mx-auto h-12 w-12 text-primary" />
                <h3 className="font-sans text-xl font-bold">Application Received!</h3>
                <p className="text-muted-foreground">Thank you for your interest. We'll review your application and contact you within 3-5 business days.</p>
                <Link to="/"><Button variant="outline">Return Home</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="join-name">Full Name *</Label>
                      <Input id="join-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" maxLength={100} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="join-email">Email *</Label>
                      <Input id="join-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" maxLength={255} required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="join-phone">Phone</Label>
                      <Input id="join-phone" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(614) 000-0000" maxLength={20} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="join-commission">Commission Number</Label>
                      <Input id="join-commission" value={form.commissionNumber} onChange={e => setForm(p => ({ ...p, commissionNumber: e.target.value }))} placeholder="OH commission #" maxLength={30} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Commissioned State</Label>
                      <Select value={form.state} onValueChange={v => setForm(p => ({ ...p, state: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="IN">Indiana</SelectItem>
                          <SelectItem value="KY">Kentucky</SelectItem>
                          <SelectItem value="WV">West Virginia</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="join-experience">Years of Experience</Label>
                      <Select value={form.experience} onValueChange={v => setForm(p => ({ ...p, experience: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1">Less than 1 year</SelectItem>
                          <SelectItem value="1-3">1-3 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5-10">5-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Services You Can Offer</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {serviceOptions.map(svc => (
                        <div key={svc} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedServices.has(svc)}
                            onCheckedChange={(checked) => {
                              setSelectedServices(prev => {
                                const next = new Set(prev);
                                if (checked) next.add(svc); else next.delete(svc);
                                return next;
                              });
                            }}
                          />
                          <label className="text-sm text-muted-foreground cursor-pointer">{svc}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="join-message">Additional Information</Label>
                    <Textarea id="join-message" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us about your experience, certifications, and why you'd like to join..." rows={4} maxLength={1000} />
                  </div>

                  <Button type="submit" className="w-full " disabled={submitting}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <>Submit Application <ArrowRight className="ml-1 h-4 w-4" /></>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Provider FAQ */}
      <section className="py-16">
        <div className="container mx-auto max-w-2xl px-4">
          <h2 className="mb-8 text-center font-sans text-3xl font-bold text-foreground">Provider FAQ</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {providerFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

    </PageShell>
  );
}
