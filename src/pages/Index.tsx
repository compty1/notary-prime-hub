import { usePageMeta } from "@/hooks/usePageMeta";
import { ORGANIZATION_JSONLD, reviewAggregateJsonLd, setOpenGraphMeta } from "@/lib/seoHelpers";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
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
  Phone, Mail, Send, Loader2, ArrowRight, Globe, Car, Copy, UserCheck, Stamp, BookOpen, Star,
  FileSignature, Check
} from "lucide-react";
import WhatDoINeed from "@/components/WhatDoINeed";
import { PageShell } from "@/components/PageShell";
import { fadeUp, blurIn, scaleReveal } from "@/lib/animations";
import { Icon3D, FEATURE_3D_ICON } from "@/lib/icon3dMap";
import heroIllustration from "@/assets/hero-3d-illustration.jpg";
import aboutIllustration from "@/assets/about-3d-illustration.jpg";

const primaryServices = [
  {
    icon3d: FEATURE_3D_ICON.ron,
    title: "Remote Online Notarization",
    badge: "Most Popular",
    desc: "Get documents notarized from anywhere via secure video call. Ohio-authorized under ORC §147.65-.66 with full identity verification, KBA, and tamper-evident seals.",
    cta: "/book?type=ron",
    ctaLabel: "Start RON Session",
    features: ["Available 24/7", "All 50 states accepted", "10-year recording retention"],
  },
  {
    icon3d: FEATURE_3D_ICON.mobile,
    title: "Mobile Notarization",
    badge: "Central Ohio",
    desc: "We come to you — home, office, hospital, or any location within the greater Columbus area. Same-day appointments available for Franklin County.",
    cta: "/book?type=in_person",
    ctaLabel: "Book Mobile Notary",
    features: ["Same-day available", "30-mile radius", "After-hours options"],
  },
];

const otherServices = [
  { icon3d: FEATURE_3D_ICON.copy, title: "Certified Copy Services", desc: "Certified true copies of original documents", to: "/services?category=notarization" },
  { icon3d: FEATURE_3D_ICON.loan, title: "Loan Signing Agent", desc: "Professional loan document signing services", to: "/loan-signing" },
  { icon3d: FEATURE_3D_ICON.i9, title: "I-9 / Employment Verification", desc: "Authorized agent for Form I-9 completion", to: "/services?category=verification" },
  { icon3d: FEATURE_3D_ICON.apostille, title: "Apostille Facilitation", desc: "Document authentication for international use", to: "/services?category=authentication" },
  { icon3d: FEATURE_3D_ICON.poa, title: "Power of Attorney", desc: "POA notarization with proper witnessing", to: "/services?category=notarization" },
  { icon3d: FEATURE_3D_ICON.oath, title: "Oaths & Affirmations", desc: "Sworn statements, jurats, and affidavits", to: "/services?category=notarization" },
];

const fallbackTestimonials = [
  { name: "Sarah M.", text: "Notar made our home closing so easy. Professional, punctual, and thorough.", rating: 5 },
  { name: "James R.", text: "Used the remote notarization while traveling. Incredibly convenient and secure.", rating: 5 },
  { name: "Lisa K.", text: "Best notary experience I've had. Will definitely use Notar again for our business documents.", rating: 5 },
];

const howItWorksSteps = [
  { num: "1", title: "Upload Document", icon3d: FEATURE_3D_ICON.upload, desc: "Formats: PDF, JPEG. Verify text clarity before uploading." },
  { num: "2", title: "Identity Verification", icon3d: FEATURE_3D_ICON.identity, desc: "Secure KBA or biometric scan. Have your government ID ready." },
  { num: "3", title: "Live Notary Session", icon3d: FEATURE_3D_ICON.video, desc: "Connect via video chat with a commissioned Notary Public." },
  { num: "4", title: "Download Doc", icon3d: FEATURE_3D_ICON.download, desc: "Receive your secure, digitally notarized file immediately." },
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

  return <span ref={ref} aria-live="polite" className="font-bold tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

export default function Index() {
  usePageMeta({ title: "Ohio Notary & Document Services | Notar", description: "Trusted Ohio notary services — in-person and remote online notarization (RON) in Franklin County, Columbus. Book online, get notarized today.", schema: ORGANIZATION_JSONLD });
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    setOpenGraphMeta({
      title: "Ohio Notary & Document Services | Notar",
      description: "Trusted Ohio notary services — in-person and remote online notarization (RON). Book online, get notarized today.",
      url: "/",
      type: "website",
    });
  }, []);

  const [dbServices, setDbServices] = useState<{ name: string; short_description: string | null; icon: string | null; category: string | null }[]>([]);
  const [dbReviews, setDbReviews] = useState<{ name: string; text: string; rating: number }[]>([]);

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

  const { get } = useSettings(["notary_phone", "notary_email"]);
  const contactInfo = {
    phone: get("notary_phone", "(614) 300-6890"),
    email: get("notary_email", "contact@notardex.com"),
  };

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
    "name": "Notar — Ohio Notary Public",
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

  const reviewSchema = reviewAggregateJsonLd(5, testimonials.length);

  useEffect(() => {
    const scripts: HTMLScriptElement[] = [];
    [jsonLd, faqSchema, reviewSchema].forEach(data => {
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
      {/* ===== HERO ===== */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.h1
                variants={blurIn}
                custom={0}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] text-foreground mb-6"
              >
                Legal Online<br />
                Notarization
              </motion.h1>

              <motion.p
                variants={blurIn}
                custom={1}
                className="text-base md:text-lg text-muted-foreground font-medium mb-8 max-w-md leading-relaxed"
              >
                We are a team of passionate certified notaries specializing in secure document authentication.
              </motion.p>

              <motion.div variants={fadeUp} custom={2} className="flex flex-row gap-4 items-center">
                <Link to="/book?type=ron">
                  <Button
                    size="lg"
                    variant="dark"
                    className="rounded-full px-8 py-3 font-bold text-base"
                  >
                    Notarize Now
                  </Button>
                </Link>
                <Link to="/ron-info">
                  <Button variant="outline" size="lg" className="rounded-full px-8 py-3 font-bold text-base border-foreground/20 text-foreground hover:bg-foreground/5">
                    More Info
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Hero 3D Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <img
                src={heroIllustration}
                alt="Notarization documents and security verification icons"
                className="w-full max-w-md object-contain drop-shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== About Us ===== */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={aboutIllustration}
                alt="3D illustration of document folders"
                className="w-full max-w-sm mx-auto object-contain drop-shadow-2xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary-foreground mb-6">About us</h2>
              <p className="text-lg text-primary-foreground/80 font-medium leading-relaxed max-w-lg">
                We are a team of passionate creatives specializing in branding, content, and design. Our goal is to provide our clients with innovative ideas that translate to real, wonderful experiences.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 4-Step Process ===== */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-label font-bold uppercase tracking-widest text-muted-foreground mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">The 4-Step Process</h2>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">Complete your notarization online quickly and securely from anywhere in the world.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-border -translate-y-1/2 z-0" />

            {howItWorksSteps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative z-10 group"
              >
                <div className="bg-card rounded-[24px] border border-border p-6 shadow-card hover:-translate-y-1 transition-all duration-300">
                  <div className="w-[129px] h-[129px] rounded-xl flex items-center justify-center mb-5">
                    <Icon3D src={step.icon3d} alt={step.title} className="w-[110px] h-[110px]" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Key Benefits ===== */}
      <section id="benefits" className="py-20 bg-sidebar text-sidebar-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-label font-bold uppercase tracking-widest text-sidebar-foreground/50 mb-3">Why Notar</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-sidebar-foreground mb-4">Key Benefits</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
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
                className="bg-sidebar-accent/50 backdrop-blur-sm p-8 rounded-[24px] border border-sidebar-border text-center hover:-translate-y-1 transition duration-300 group"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-sidebar-foreground">{benefit.title}</h3>
                <p className="text-sm text-sidebar-foreground/50 font-medium">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services Grid ===== */}
      <section id="services" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-label font-bold uppercase tracking-widest text-muted-foreground mb-3">Our Services</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Services We Handle</h2>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">Expert notarization for all your personal and business documents.</p>
          </div>

          {/* Primary Services */}
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 mb-12">
            {primaryServices.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group h-full rounded-[24px] border-border hover:border-primary/30 transition-all shadow-sm hover:shadow-card">
                  <CardContent className="p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-[129px] w-[129px] items-center justify-center">
                        <Icon3D src={s.icon3d} alt={s.title} className="h-[129px] w-[129px]" />
                      </div>
                      <Badge className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border-border">{s.badge}</Badge>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-foreground">{s.title}</h3>
                    <p className="mb-5 text-sm text-muted-foreground font-medium leading-relaxed">{s.desc}</p>
                    <ul className="mb-6 space-y-2">
                      {s.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link to={s.cta}>
                      <Button variant="dark" className="w-full font-bold rounded-2xl">
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
            {otherServices.map((service) => (
              <Link key={service.title} to={service.to}>
                <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm flex flex-col items-center text-center hover:border-primary/30 hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className="w-[110px] h-[110px] flex items-center justify-center mb-4">
                    <Icon3D src={service.icon3d} alt={service.title} className="w-[92px] h-[92px]" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{service.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{service.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Helper */}
      <WhatDoINeed />

      {/* ===== Trust Badges ===== */}
      <section className="py-12 bg-muted border-t border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { label: "Ohio Commissioned", icon: ShieldCheck },
              { label: "NNA Certified", icon: FileCheck2 },
              { label: "RON Authorized", icon: Globe },
              { label: "MISMO Compliant", icon: Lock },
              { label: "10-Year Retention", icon: Clock },
            ].map(badge => (
              <div key={badge.label} className="flex items-center gap-2 text-muted-foreground">
                <badge.icon className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-label font-bold uppercase tracking-widest text-muted-foreground mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">What Clients Say</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full rounded-[24px] border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground font-medium">{t.text}</p>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Banner ===== */}
      <section className="bg-primary py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground mb-6">Ready to Notarize Your Document?</h2>
          <p className="text-primary-foreground/70 text-lg font-medium mb-8">Join thousands of users who have securely notarized their documents online.</p>
          <Link to="/book">
            <Button size="lg" variant="dark" className="px-10 py-4 rounded-2xl font-bold text-lg">
              Book a Session Now
            </Button>
          </Link>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-label font-bold uppercase tracking-widest text-muted-foreground mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="rounded-[24px] border border-border bg-muted px-6">
                  <AccordionTrigger className="text-left text-sm font-bold text-foreground">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground font-medium">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== Contact Form ===== */}
      <section id="contact" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl md:text-4xl font-bold tracking-tight text-foreground">Get in Touch</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground font-medium">
            Have a question or need notarization services? Fill out the form below and we'll respond within 24 hours — we typically respond within 2 hours during business hours.
          </p>
          <div className="mx-auto max-w-lg">
            <Card className="rounded-[32px] border-border shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name *</Label>
                      <Input id="contact-name" placeholder="Your full name" value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} maxLength={100} required aria-required="true" autoComplete="name" className="bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email *</Label>
                      <Input id="contact-email" type="email" inputMode="email" placeholder="you@example.com" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} maxLength={255} required aria-required="true" autoComplete="email" className="bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</Label>
                      <Input id="contact-phone" type="tel" inputMode="tel" placeholder="(614) 000-0000" value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} maxLength={20} autoComplete="tel" className="bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary" />
                      <p className="text-xs text-muted-foreground font-medium">Used only for appointment coordination.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-service" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Service Needed</Label>
                      <Select value={contactForm.service} onValueChange={(v) => setContactForm((prev) => ({ ...prev, service: v }))}>
                        <SelectTrigger id="contact-service" className="bg-muted border-none rounded-xl">
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
                    <Label htmlFor="contact-message" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message *</Label>
                    <Textarea id="contact-message" placeholder="Tell us about your notarization needs..." value={contactForm.message} onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))} maxLength={1000} rows={4} required aria-required="true" className="bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary" />
                  </div>
                  {/* Honeypot */}
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                  </div>
                  {/* Legal consent */}
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="agree-terms" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" required />
                    <Label htmlFor="agree-terms" className="text-xs text-muted-foreground font-medium leading-tight">
                      I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/terms#privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </Label>
                  </div>
                  <div aria-live="polite" className="text-sm text-destructive" />
                  <Button type="submit" variant="dark" className="w-full rounded-2xl font-bold" disabled={submitting || !agreeTerms}>
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
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground">Industry Insights</h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <Card className="rounded-[24px] border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-bold text-foreground">Why Remote Notarization is Growing 300% Year-Over-Year</h3>
                <p className="text-sm text-muted-foreground font-medium">The adoption of RON has accelerated dramatically since 2020. Over 40 states now have RON legislation, and major GSEs (Fannie Mae, Freddie Mac) accept RON for mortgage transactions. Ohio was among the early adopters under ORC §147.65-.66.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-bold text-foreground">Understanding Ohio's Electronic Notarization Standards</h3>
                <p className="text-sm text-muted-foreground font-medium">Ohio's RON framework requires multi-factor identity verification including credential analysis and Knowledge-Based Authentication (KBA), plus full session recording stored for 10+ years. These MISMO-compliant standards exceed the security of traditional in-person notarization.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-bold text-foreground">What Title Companies Should Know About RON Closings</h3>
                <p className="text-sm text-muted-foreground font-medium">Title companies benefit from RON with faster closing timelines, reduced scheduling friction, and a complete audit trail. ALTA best practices now include RON as a standard closing option.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-border shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-bold text-foreground">Common Notarization Mistakes and How to Avoid Them</h3>
                <p className="text-sm text-muted-foreground font-medium">From incomplete certificates to improper identification, common errors can invalidate a notarization and delay important transactions. Working with an experienced, Ohio-commissioned notary ensures compliance with ORC §147.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 text-center">
            <Link to="/services" className="text-sm text-primary font-bold hover:underline">View all our professional notary and document services →</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
