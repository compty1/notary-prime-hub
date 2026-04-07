import { usePageMeta } from "@/hooks/usePageMeta";
import { ORGANIZATION_JSONLD } from "@/lib/seoHelpers";
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
import {
  ShieldCheck, Clock, FileCheck2, UploadCloud, Fingerprint, Video, Download,
  Scale, Home, Briefcase, FileText, Smartphone, CheckCircle2, Lock, ChevronRight,
  Phone, Mail, Send, Loader2, ArrowRight, Globe, Car, Copy, UserCheck, Stamp, BookOpen, Star
} from "lucide-react";
import WhatDoINeed from "@/components/WhatDoINeed";
import { PageShell } from "@/components/PageShell";
import { fadeUp, blurIn, scaleReveal } from "@/lib/animations";
import HeroPhoneAnimation from "@/components/HeroPhoneAnimation";
import heroBackground from "@/assets/hero-background.jpg";
import stepProcessImg from "@/assets/hero-4-step-process.jpg";

const primaryServices = [
  {
    icon: Globe,
    title: "Remote Online Notarization",
    badge: "Most Popular",
    desc: "Get documents notarized from anywhere via secure video call. Ohio-authorized under ORC §147.65-.66 with full identity verification, KBA, and tamper-evident seals.",
    cta: "/book?type=ron",
    ctaLabel: "Start RON Session",
    features: ["Available 24/7", "All 50 states accepted", "10-year recording retention"],
  },
  {
    icon: Car,
    title: "Mobile Notarization",
    badge: "Central Ohio",
    desc: "We come to you — home, office, hospital, or any location within the greater Columbus area. Same-day appointments available for Franklin County.",
    cta: "/book?type=in_person",
    ctaLabel: "Book Mobile Notary",
    features: ["Same-day available", "30-mile radius", "After-hours options"],
  },
];

const otherServices = [
  { icon: Copy, title: "Certified Copy Services", desc: "Certified true copies of original documents", to: "/services?category=notarization" },
  { icon: Briefcase, title: "Loan Signing Agent", desc: "Professional loan document signing services", to: "/loan-signing" },
  { icon: UserCheck, title: "I-9 / Employment Verification", desc: "Authorized agent for Form I-9 completion", to: "/services?category=verification" },
  { icon: Stamp, title: "Apostille Facilitation", desc: "Document authentication for international use", to: "/services?category=authentication" },
  { icon: Scale, title: "Power of Attorney", desc: "POA notarization with proper witnessing", to: "/services?category=notarization" },
  { icon: BookOpen, title: "Oaths & Affirmations", desc: "Sworn statements, jurats, and affidavits", to: "/services?category=notarization" },
];

const fallbackTestimonials = [
  { name: "Sarah M.", text: "NotarDex made our home closing so easy. Professional, punctual, and thorough.", rating: 5 },
  { name: "James R.", text: "Used the remote notarization while traveling. Incredibly convenient and secure.", rating: 5 },
  { name: "Lisa K.", text: "Best notary experience I've had. Will definitely use NotarDex again for our business documents.", rating: 5 },
];

const howItWorksSteps = [
  { num: "1", title: "Upload Document", icon: UploadCloud, desc: "Formats: PDF, JPEG. Verify text clarity before uploading." },
  { num: "2", title: "Identity Verification", icon: Fingerprint, desc: "Secure KBA or biometric scan. Have your government ID ready." },
  { num: "3", title: "Live Notary Session", icon: Video, desc: "Connect via video chat with a commissioned Notary Public." },
  { num: "4", title: "Download Doc", icon: Download, desc: "Receive your secure, digitally notarized file immediately." },
];

const faqs = [
  { q: "What is Remote Online Notarization (RON)?", a: "RON allows you to have documents notarized via a secure video call from anywhere. Ohio authorizes RON under Ohio Revised Code §147.65-.66, making it fully legal and binding." },
  { q: "What identification do I need?", a: "You'll need a valid government-issued photo ID (driver's license, passport, or state ID). For RON sessions, you'll also complete Knowledge-Based Authentication (KBA) questions." },
  { q: "How long does a notarization take?", a: "Most notarizations take 10-15 minutes for in-person sessions. RON sessions may take 20-30 minutes including the identity verification process." },
  { q: "What areas do you serve for in-person notarization?", a: "We serve Franklin County and the greater Columbus, Ohio metropolitan area for in-person notarizations. Mobile notary services are available within a 30-mile radius." },
  { q: "Is RON notarization accepted everywhere?", a: "RON notarizations performed under Ohio law are recognized in all 50 states. However, some specific transactions may have unique requirements. Contact us to confirm for your situation." },
];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
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
      if (start >= value) { setCount(value); clearInterval(timer); } else
        setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref} aria-live="polite" className="font-semibold tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

export default function Index() {
  usePageMeta({ title: "Ohio Notary & Document Services | NotarDex", description: "Trusted Ohio notary services — in-person and remote online notarization (RON) in Franklin County, Columbus. Book online, get notarized today.", schema: ORGANIZATION_JSONLD });
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("services").select("name, short_description, icon, category")
      .eq("is_active", true).order("display_order").limit(6)
      .then(({ data }) => { if (data && data.length > 0) setDbServices(data); });

    supabase.from("reviews").select("rating, comment, created_at, client_id")
      .eq("rating", 5).order("created_at", { ascending: false }).limit(3)
      .then(async ({ data: reviews }) => {
        if (!reviews || reviews.length === 0) return;
        const clientIds = [...new Set(reviews.map((r) => r.client_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", clientIds);
        const enriched = reviews.map((r) => ({
          name: (profiles?.find((p) => p.user_id === r.client_id)?.full_name || "").split(" ")[0] || "Client",
          text: r.comment || "Excellent service!",
          rating: r.rating,
        }));
        if (enriched.length > 0) setDbReviews(enriched);
      });
  }, []);

  const testimonials = dbReviews.length > 0 ? dbReviews : fallbackTestimonials;

  const [contactInfo, setContactInfo] = useState({ phone: "(614) 300-6890", email: "contact@notardex.com" });

  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value")
      .in("setting_key", ["notary_phone", "notary_email"])
      .then(({ data }) => {
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
    const { success } = await submitLead({
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
      toast({ title: "Message sent!", description: "We'll get back to you within 2 hours during business hours." });
      setContactForm({ name: "", email: "", phone: "", service: "", message: "" });
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "NotarDex — Ohio Notary Public",
    "description": "Professional notary services in Columbus, Ohio. In-person and Remote Online Notarization (RON).",
    "url": "https://notardex.com",
    "telephone": contactInfo.phone,
    "email": contactInfo.email,
    "address": { "@type": "PostalAddress", "addressLocality": "Columbus", "addressRegion": "OH", "addressCountry": "US" },
    "areaServed": { "@type": "State", "name": "Ohio" },
    "geo": { "@type": "GeoCoordinates", "latitude": 39.9612, "longitude": -82.9988 },
    "priceRange": "$$",
    "sameAs": [],
    "openingHoursSpecification": [
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "19:00" },
      { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday"], "opens": "10:00", "closes": "16:00" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  useEffect(() => {
    const scripts: HTMLScriptElement[] = [];
    [jsonLd, faqSchema].forEach(data => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
      scripts.push(script);
    });
    return () => scripts.forEach(s => s.remove());
  }, [contactInfo.phone, contactInfo.email]);

  return (
    <PageShell>
      {/* ===== HERO — Dark Slate with Amber Accents ===== */}
      <section className="relative bg-sidebar-background text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${heroBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-sidebar-background to-sidebar-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.div variants={blurIn} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sidebar-accent border border-sidebar-border mb-6 text-primary text-sm font-medium">
                <ShieldCheck className="h-4 w-4" />
                Safe, Secure, Legal — RON
              </motion.div>
              <motion.h1
                variants={blurIn}
                custom={1}
                className="text-5xl md:text-6xl font-extrabold leading-tight mb-6"
              >
                Your Trusted <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">Digital Partner</span>
              </motion.h1>
              <motion.p
                variants={blurIn}
                custom={2}
                className="text-xl text-slate-300 mb-8 max-w-lg leading-relaxed"
              >
                Legally binding online notarization in minutes. Secure biometric verification, state-approved standards, and 24/7 availability.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
                <Link to="/book?type=ron">
                  <Button size="lg" className="rounded-lg px-8 py-4 font-bold text-lg glow-amber-lg">
                    Start Notarization <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/ron-info">
                  <Button variant="outline" size="lg" className="rounded-lg px-8 py-4 font-semibold text-lg text-white border-slate-600 hover:bg-slate-800 bg-transparent">
                    View Requirements
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <HeroPhoneAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 4-Step Process ===== */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">The 4-Step Process</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Complete your notarization online quickly and securely from anywhere in the world.</p>
          </div>

          {/* Branded infographic */}
          <div className="mb-12">
            <img
              src={stepProcessImg}
              alt="NotarDex 4-Step Digital Notary Process: Upload Document, Identity Verification, Live Notary Session, Download Document"
              className="w-full rounded-2xl shadow-lg"
              loading="lazy"
              width={1920}
              height={640}
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-6 bg-muted rounded-2xl border border-border hover:shadow-xl transition duration-300 group"
              >
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-sidebar-background text-white rounded-full flex items-center justify-center font-bold text-lg border-4 border-background shadow-sm z-10 group-hover:bg-primary group-hover:text-primary-foreground transition">
                  {step.num}
                </div>
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform dark:bg-blue-900/30 dark:text-blue-400">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-border transform -translate-y-1/2" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Key Benefits — Dark Section ===== */}
      <section id="benefits" className="py-20 bg-sidebar-background text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Key Benefits</h2>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Lock, title: "Secure & Tamper-Evident", desc: "Advanced cryptographic seals ensure document integrity." },
              { icon: Clock, title: "Convenient & Fast", desc: "Connect with a notary 24/7 in just a few minutes." },
              { icon: FileCheck2, title: "Legally Binding", desc: "Accepted Nationwide. Full legal validity guaranteed." },
              { icon: ShieldCheck, title: "Audit Trail & Encryption", desc: "Comprehensive session logs and military-grade encryption." },
            ].map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-sidebar-accent p-8 rounded-2xl border border-sidebar-border text-center hover:-translate-y-2 transition duration-300"
              >
                <div className="w-16 h-16 bg-sidebar-border rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-400">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services Grid ===== */}
      <section id="services" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Services We Handle</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Expert notarization for all your personal and business documents.</p>
          </div>

          {/* Primary Services — Two Featured */}
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 mb-12">
            {primaryServices.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group h-full border-2 hover:border-primary/30 transition-all">
                  <CardContent className="p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <s.icon className="h-7 w-7 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{s.badge}</Badge>
                    </div>
                    <h3 className="mb-3 font-heading text-xl font-bold text-foreground">{s.title}</h3>
                    <p className="mb-5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    <ul className="mb-6 space-y-2">
                      {s.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link to={s.cta}>
                      <Button className="w-full font-semibold">
                        {s.ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Other Services Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-8 max-w-5xl mx-auto">
            {otherServices.map((service, idx) => (
              <Link key={service.title} to={service.to}>
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-center text-center hover:border-primary transition cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4 group-hover:bg-primary/10 group-hover:text-primary transition">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{service.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{service.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Helper */}
      <WhatDoINeed />

      {/* ===== Testimonials ===== */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Testimonials</p>
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">What Clients Say</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">{t.text}</p>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Banner — Amber Gradient ===== */}
      <section className="bg-gradient-to-br from-primary to-primary-glow py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-6">Ready to Notarize Your Document?</h2>
          <p className="text-primary-foreground/90 text-lg mb-8">Join thousands of users who have securely notarized their documents online.</p>
          <Link to="/book">
            <Button size="lg" className="bg-sidebar-background text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-sidebar-accent transition shadow-xl hover:-translate-y-1">
              Book a Session Now
            </Button>
          </Link>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">FAQ</p>
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-background px-4">
                  <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== Contact Form ===== */}
      <section id="contact" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center font-heading text-3xl font-bold text-foreground md:text-4xl">Get in Touch</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
            Have a question or need notarization services? Fill out the form below and we'll respond within 24 hours — we typically respond within 2 hours during business hours.
          </p>
          <div className="mx-auto max-w-lg">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name *</Label>
                      <Input id="contact-name" placeholder="Your full name" value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} maxLength={100} required aria-required="true" autoComplete="name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email *</Label>
                      <Input id="contact-email" type="email" inputMode="email" placeholder="you@example.com" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} maxLength={255} required aria-required="true" autoComplete="email" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input id="contact-phone" type="tel" inputMode="tel" placeholder="(614) 000-0000" value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} maxLength={20} autoComplete="tel" />
                      <p className="text-xs text-muted-foreground">Used only for appointment coordination.</p>
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
                    <Textarea id="contact-message" placeholder="Tell us about your notarization needs..." value={contactForm.message} onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))} maxLength={1000} rows={4} required aria-required="true" />
                  </div>
                  {/* Honeypot */}
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                  </div>
                  {/* Legal consent */}
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="agree-terms" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" required />
                    <Label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-tight">
                      I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/terms#privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </Label>
                  </div>
                  <div aria-live="polite" className="text-sm text-destructive" />
                  <Button type="submit" className="w-full" disabled={submitting || !agreeTerms}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== Industry Insights ===== */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold text-foreground">Industry Insights</h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-heading text-base font-semibold">Why Remote Notarization is Growing 300% Year-Over-Year</h3>
                <p className="text-sm text-muted-foreground">The adoption of RON has accelerated dramatically since 2020. Over 40 states now have RON legislation, and major GSEs (Fannie Mae, Freddie Mac) accept RON for mortgage transactions. Ohio was among the early adopters under ORC §147.65-.66.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-heading text-base font-semibold">Understanding Ohio's Electronic Notarization Standards</h3>
                <p className="text-sm text-muted-foreground">Ohio's RON framework requires multi-factor identity verification including credential analysis and Knowledge-Based Authentication (KBA), plus full session recording stored for 10+ years. These MISMO-compliant standards exceed the security of traditional in-person notarization.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-heading text-base font-semibold">What Title Companies Should Know About RON Closings</h3>
                <p className="text-sm text-muted-foreground">Title companies benefit from RON with faster closing timelines, reduced scheduling friction, and a complete audit trail. ALTA best practices now include RON as a standard closing option.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-2 font-heading text-base font-semibold">Common Notarization Mistakes and How to Avoid Them</h3>
                <p className="text-sm text-muted-foreground">From incomplete certificates to improper identification, common errors can invalidate a notarization and delay important transactions. Working with an experienced, Ohio-commissioned notary ensures compliance with ORC §147.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 text-center">
            <Link to="/services" className="text-sm text-primary hover:underline">View all our professional notary and document services →</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
