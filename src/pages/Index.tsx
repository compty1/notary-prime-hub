import { usePageTitle } from "@/lib/usePageTitle";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { submitLead } from "@/lib/submitLead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Monitor, FileText, Shield, Clock, CheckCircle, Star, ChevronRight, Phone, Mail, Scale, Send, Loader2, Sparkles, ArrowRight, TrendingUp } from "lucide-react";
import WhatDoINeed from "@/components/WhatDoINeed";
import { PageShell } from "@/components/PageShell";
import { fadeUp, blurIn, scaleReveal } from "@/lib/animations";
import HeroPhoneAnimation from "@/components/HeroPhoneAnimation";

const fallbackServices = [
{ icon: FileText, title: "Real Estate Documents", desc: "Deeds, mortgages, refinancing, title transfers" },
{ icon: Shield, title: "Legal Documents", desc: "Power of attorney, affidavits, sworn statements" },
{ icon: Scale, title: "Estate Planning", desc: "Wills, trusts, healthcare directives" },
{ icon: FileText, title: "Business Documents", desc: "Contracts, agreements, corporate filings" }];


const fallbackTestimonials = [
{ name: "Sarah M.", text: "Notar made our home closing so easy. Professional, punctual, and thorough.", rating: 5 },
{ name: "James R.", text: "Used the remote notarization while traveling. Incredibly convenient and secure.", rating: 5 },
{ name: "Lisa K.", text: "Best notary experience I've had. Will definitely use Notar again for our business documents.", rating: 5 }];


const steps = [
{ num: "01", title: "Book", desc: "Choose in-person or remote and select your time slot" },
{ num: "02", title: "Verify", desc: "Complete identity verification and KBA for RON sessions" },
{ num: "03", title: "Sign", desc: "Documents notarized securely with digital seal" }];


const faqs = [
{ q: "What is Remote Online Notarization (RON)?", a: "RON allows you to have documents notarized via a secure video call from anywhere. Ohio authorizes RON under Ohio Revised Code §147.65-.66, making it fully legal and binding." },
{ q: "What identification do I need?", a: "You'll need a valid government-issued photo ID (driver's license, passport, or state ID). For RON sessions, you'll also complete Knowledge-Based Authentication (KBA) questions." },
{ q: "How long does a notarization take?", a: "Most notarizations take 10-15 minutes for in-person sessions. RON sessions may take 20-30 minutes including the identity verification process." },
{ q: "What areas do you serve for in-person notarization?", a: "We serve Franklin County and the greater Columbus, Ohio metropolitan area for in-person notarizations. Mobile notary services are available within a 30-mile radius." },
{ q: "Is RON notarization accepted everywhere?", a: "RON notarizations performed under Ohio law are recognized in all 50 states. However, some specific transactions may have unique requirements. Contact us to confirm for your situation." }];


function AnimatedCounter({ value, suffix = "" }: {value: number;suffix?: string;}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {setCount(value);clearInterval(timer);} else
      setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref} aria-live="polite" className="font-semibold tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

export default function Index() {
  usePageTitle("Ohio Notary & Document Services");
  const [serviceType, setServiceType] = useState<"in_person" | "ron">("in_person");
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("services").select("name, short_description, icon, category").
    eq("is_active", true).order("display_order").limit(6).
    then(({ data }) => {if (data && data.length > 0) setDbServices(data);});

    supabase.from("reviews").select("rating, comment, created_at, client_id").
    eq("rating", 5).order("created_at", { ascending: false }).limit(3).
    then(async ({ data: reviews }) => {
      if (!reviews || reviews.length === 0) return;
      const clientIds = [...new Set(reviews.map((r) => r.client_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", clientIds);
      const enriched = reviews.map((r) => ({
        name: (profiles?.find((p) => p.user_id === r.client_id)?.full_name || "").split(" ")[0] || "Client",
        text: r.comment || "Excellent service!",
        rating: r.rating
      }));
      if (enriched.length > 0) setDbReviews(enriched);
    });
  }, []);

  const services = dbServices.length > 0 ?
  dbServices.map((s) => ({ icon: FileText, title: s.name, desc: s.short_description || s.category })) :
  fallbackServices;

  const testimonials = dbReviews.length > 0 ? dbReviews : fallbackTestimonials;

  const [contactInfo, setContactInfo] = useState({ phone: "(614) 300-6890", email: "contact@notardex.com" });

  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value").
    in("setting_key", ["notary_phone", "notary_email"]).
    then(({ data }) => {
      if (data) {
        const phone = data.find((s) => s.setting_key === "notary_phone")?.setting_value;
        const email = data.find((s) => s.setting_key === "notary_email")?.setting_value;
        if (phone) setContactInfo((prev) => ({ ...prev, phone }));
        if (email) setContactInfo((prev) => ({ ...prev, email }));
      }
    });
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Honeypot check
    if (honeypot) return;
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({ title: "Required fields missing", description: "Please fill in your name, email, and message.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    const now = Date.now();
    if (now - lastSubmitTime < 60000) {
      toast({ title: "Please wait", description: "You can submit again in a minute.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { success, error } = await submitLead({
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim() || null,
      service_needed: contactForm.service || null,
      notes: contactForm.message.trim(),
      source: "website_contact_form",
    });
    setSubmitting(false);
    if (!success) {
      toast({ title: "Something went wrong", description: "Please try again or call us directly.", variant: "destructive" });
    } else {
      setLastSubmitTime(now);
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
      setContactForm({ name: "", email: "", phone: "", service: "", message: "" });
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Notar — Ohio Notary Public",
    "description": "Professional notary services in Columbus, Ohio. In-person and Remote Online Notarization (RON).",
    "url": window.location.origin,
    "telephone": contactInfo.phone,
    "email": contactInfo.email,
    "address": { "@type": "PostalAddress", "addressLocality": "Columbus", "addressRegion": "OH", "addressCountry": "US" },
    "areaServed": { "@type": "State", "name": "Ohio" },
    "priceRange": "$$",
    "openingHoursSpecification": [
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday"], "opens": "10:00", "closes": "19:00" }
    ],
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero — Dealflow-style split layout */}
      <section className="relative overflow-hidden bg-background py-16 md:py-24">
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — Copy */}
            <motion.div initial="hidden" animate="visible">
              <motion.p variants={blurIn} custom={0} className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Designed for High-Touch Document Services
              </motion.p>
              <motion.h1
                variants={blurIn}
                custom={1}
                className="mb-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl"
              >
                Get documents notarized with less hassle
              </motion.h1>
              <motion.p
                variants={blurIn}
                custom={2}
                className="mb-10 max-w-lg text-lg text-muted-foreground"
              >
                Notar is a full-service notary platform you'll actually enjoy using. Book appointments, verify identities, and sign documents — not chase paperwork.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
                <Link to="/book">
                  <Button variant="accent" size="lg" className="rounded-full px-8 shadow-sm">
                    Online Notarization <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg" className="rounded-full px-8">
                    Other Services
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right — Phone Animation */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative flex items-center justify-center"
            >
              <HeroPhoneAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar — Dealflow partner-strip style */}
      <section className="border-y border-border bg-card py-6">
        <div className="container mx-auto px-4">
          <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Trusted & Compliant</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-foreground/40" />
              <span>ORC §147 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-foreground/40" />
              <span>Franklin County Commissioned</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-foreground/40" />
              <span>$25,000 Surety Bond</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground/40" />
              <span>Same-Day Appointments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Beyond Notarization Banner */}
      <section className="border-b border-border py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Beyond notarization:</span> document digitization, secure cloud storage, form preparation, business services, and more.{" "}
            <Link to="/services" className="text-primary hover:underline font-medium">View All Services →</Link>
          </p>
        </div>
      </section>

      {/* AI Helper */}
      <WhatDoINeed />

      {/* Services */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mx-auto mb-12 max-w-2xl text-center">
            
            <motion.h2 variants={fadeUp} custom={0} className="mb-4 font-sans text-3xl font-bold text-foreground md:text-4xl">
              Notary Services
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground">
              Professional notarization for all your important documents
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            {services.map((s, i) =>
            <motion.div key={s.title} variants={scaleReveal} custom={i}>
                <Card className="group h-full hover:border-primary/20">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mx-auto mb-16 max-w-2xl text-center">
            
            <motion.p variants={fadeUp} custom={0} className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Simple Process</motion.p>
            <motion.h2 variants={fadeUp} custom={0} className="mb-4 font-sans text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground">
              Three simple steps to get your documents notarized
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            
            {steps.map((step, i) =>
            <motion.div key={step.num} variants={scaleReveal} custom={i} className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-border bg-card">
                  <span className="font-mono text-lg font-bold text-foreground">{step.num}</span>
                </div>
                <h3 className="mb-2 font-sans text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 &&
              <div className="absolute right-0 top-7 hidden w-full -translate-y-1/2 md:block">
                    <ChevronRight className="absolute -right-4 h-5 w-5 text-border" />
                  </div>
              }
              </motion.div>
            )}
          </motion.div>
          <div className="mt-12 text-center">
            <Link to="/book">
              <Button variant="accent" size="lg" className="rounded-full px-8">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Testimonials</p>
            <h2 className="font-sans text-3xl font-bold text-foreground md:text-4xl">What Clients Say</h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            
            {testimonials.map((t, i) =>
            <motion.div key={t.name} variants={scaleReveal} custom={i}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) =>
                    <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    )}
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">{t.text}</p>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">FAQ</p>
            <h2 className="font-sans text-3xl font-bold text-foreground md:text-4xl">Frequently Asked Questions</h2>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mx-auto max-w-2xl">
            
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) =>
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-background px-4">
                  <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-4 text-center font-sans text-3xl font-bold text-foreground md:text-4xl">
            
            Get in Touch
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
            
            Have a question or need notarization services? Fill out the form below and we'll respond within 24 hours — we typically respond within 2 hours during business hours.
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="mx-auto max-w-lg">
            
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Your full name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                        maxLength={100}
                        required />
                      
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="you@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                        maxLength={255}
                        required />
                      
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="(614) 000-0000"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                        maxLength={20} />
                      
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-service">Service Needed</Label>
                      <Select value={contactForm.service} onValueChange={(v) => setContactForm((prev) => ({ ...prev, service: v }))}>
                        <SelectTrigger id="contact-service">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In-Person Notarization">In-Person Notarization</SelectItem>
                          <SelectItem value="Remote Online Notarization">Remote Online Notarization (RON)</SelectItem>
                          <SelectItem value="Real Estate Closing">Real Estate Closing</SelectItem>
                          <SelectItem value="Apostille">Apostille</SelectItem>
                          <SelectItem value="I-9 Verification">I-9 Verification</SelectItem>
                          <SelectItem value="Document Preparation">Document Preparation</SelectItem>
                          <SelectItem value="Witness Services">Witness Services</SelectItem>
                          <SelectItem value="Virtual Mailroom">Virtual Mailroom</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message *</Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Tell us about your notarization needs..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                      maxLength={1000}
                      rows={4}
                      required />
                    
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Industry Insights */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center font-sans text-2xl font-bold text-foreground">Industry Insights</h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-base font-semibold">Why Remote Notarization is Growing 300% Year-Over-Year</h3>
                <p className="text-sm text-muted-foreground">The adoption of RON has accelerated dramatically since 2020. Over 40 states now have RON legislation, and major GSEs (Fannie Mae, Freddie Mac) accept RON for mortgage transactions. Ohio was among the early adopters under ORC §147.65-.66, making it a leader in secure digital notarization.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-base font-semibold">Understanding Ohio's Electronic Notarization Standards</h3>
                <p className="text-sm text-muted-foreground">Ohio's RON framework requires multi-factor identity verification including credential analysis and Knowledge-Based Authentication (KBA), plus full session recording stored for 10+ years. These MISMO-compliant standards exceed the security of traditional in-person notarization.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-base font-semibold">What Title Companies Should Know About RON Closings</h3>
                <p className="text-sm text-muted-foreground">Title companies benefit from RON with faster closing timelines, reduced scheduling friction, and a complete audit trail. ALTA best practices now include RON as a standard closing option, with most underwriters approving RON transactions nationwide.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-base font-semibold">Common Notarization Mistakes and How to Avoid Them</h3>
                <p className="text-sm text-muted-foreground">From incomplete certificates to improper identification, common errors can invalidate a notarization and delay important transactions. Working with an experienced, Ohio-commissioned notary ensures compliance with ORC §147 and protects your documents from rejection.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 text-center">
            <Link to="/services" className="text-sm text-primary hover:underline">View all our professional notary and document services →</Link>
          </div>
        </div>
      </section>
    </PageShell>);

}