import { usePageMeta } from "@/hooks/usePageMeta";
import { ORGANIZATION_JSONLD } from "@/lib/seoHelpers";
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
  FileSignature, Play, Check
} from "lucide-react";
import WhatDoINeed from "@/components/WhatDoINeed";
import { PageShell } from "@/components/PageShell";
import { fadeUp, blurIn, scaleReveal } from "@/lib/animations";

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

  return <span ref={ref} aria-live="polite" className="font-black tabular-nums">{count.toLocaleString()}{suffix}</span>;
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
      {/* ===== HERO — Light with Floating Composition ===== */}
      <section className="relative bg-gradient-to-b from-[#fcfcfc] to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              {/* RON Badge Pill */}
              <motion.div variants={blurIn} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f8f9fa] border border-gray-100 mb-6">
                <span className="text-label font-black uppercase tracking-widest text-gray-400">Ohio RON Authorized</span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </motion.div>

              <motion.h1
                variants={blurIn}
                custom={1}
                className="text-6xl md:text-7xl font-black tracking-tighter leading-[1.1] text-[#212529] mb-6"
              >
                Legal documents{" "}
                <span className="relative inline-block">
                  notarized
                  <span className="absolute bottom-1 left-0 w-full h-3 bg-[#eab308]/30 -z-10 rounded-sm" />
                </span>{" "}
                in minutes.
              </motion.h1>

              <motion.p
                variants={blurIn}
                custom={2}
                className="text-lg text-gray-500 font-medium mb-8 max-w-lg leading-relaxed"
              >
                Secure biometric verification, state-approved standards, and 24/7 availability. Trusted by thousands across Ohio.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 items-start">
                <Link to="/book?type=ron">
                  <Button
                    size="lg"
                    className="rounded-2xl px-8 py-4 font-bold text-lg bg-[#212529] text-white shadow-block hover:-translate-y-0.5 active:translate-y-1 active:shadow-block-active transition-all"
                  >
                    Start Notarization <ChevronRight className="ml-1 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/ron-info">
                  <Button variant="ghost" size="lg" className="rounded-2xl px-8 py-4 font-bold text-lg text-gray-500 hover:text-foreground">
                    View Requirements
                  </Button>
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                  ))}
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  <span className="font-black text-foreground">2,400+</span> documents notarized
                </p>
              </motion.div>
            </motion.div>

            {/* Hero Floating Composition */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative hidden lg:flex items-center justify-center min-h-[420px]"
            >
              {/* Document Card */}
              <div className="absolute top-8 left-8 w-56 bg-white rounded-[24px] border border-gray-100 shadow-lg p-5 rotate-6 hover:rotate-2 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <FileSignature className="h-5 w-5 text-[#eab308]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Document</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full w-full" />
                  <div className="h-2 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full w-5/6" />
                  <div className="h-2 bg-gray-100 rounded-full w-2/3" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-6 w-16 bg-[#eab308]/20 rounded-md" />
                  <div className="h-6 w-12 bg-gray-100 rounded-md" />
                </div>
              </div>

              {/* Dark Video Frame */}
              <div className="absolute top-20 right-4 w-52 bg-[#212529] rounded-[24px] shadow-xl p-4 -rotate-6 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">LIVE RON</span>
                  </div>
                  <Play className="h-3 w-3 text-gray-400" />
                </div>
                <div className="bg-gray-700 rounded-xl h-24 flex items-center justify-center">
                  <Video className="h-8 w-8 text-gray-500" />
                </div>
              </div>

              {/* Golden Seal */}
              <div className="absolute bottom-12 left-16 w-24 h-24 animate-bounce-slow">
                <div className="relative w-full h-full">
                  {/* Dashed spinning ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#eab308]/40 animate-spin-slow" />
                  <div className="absolute inset-2 rounded-full bg-[#eab308] flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <Stamp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Emerald Checkmark Badge */}
              <div className="absolute bottom-24 right-12 bg-emerald-500 text-white rounded-full p-3 shadow-lg">
                <Check className="h-5 w-5" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 4-Step Process — Block Shadow Cards ===== */}
      <section id="how-it-works" className="py-20 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-label font-black uppercase tracking-widest text-gray-400 mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#212529] mb-4">The 4-Step Process</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Complete your notarization online quickly and securely from anywhere in the world.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting dashed line */}
            <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-gray-200 -translate-y-1/2 z-0" />

            {howItWorksSteps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative z-10 group"
              >
                <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-block-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center mb-5 group-hover:bg-[#eab308] group-hover:border-[#eab308] group-hover:text-white transition-all">
                    <step.icon className="w-7 h-7 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-black text-[#212529] mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Key Benefits ===== */}
      <section id="benefits" className="py-20 bg-[#212529] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-label font-black uppercase tracking-widest text-gray-500 mb-3">Why NotarDex</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Key Benefits</h2>
            <div className="w-16 h-1 bg-[#eab308] mx-auto rounded-full" />
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
                className="bg-white/5 backdrop-blur-sm p-8 rounded-[24px] border border-white/10 text-center hover:-translate-y-1 transition duration-300 group"
              >
                <div className="w-16 h-16 bg-[#eab308]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-[#eab308]/20 transition-colors">
                  <benefit.icon className="w-8 h-8 text-[#eab308]" />
                </div>
                <h3 className="text-lg font-black mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-400 font-medium">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services Grid ===== */}
      <section id="services" className="py-20 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-label font-black uppercase tracking-widest text-gray-400 mb-3">Our Services</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#212529] mb-4">Services We Handle</h2>
            <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">Expert notarization for all your personal and business documents.</p>
          </div>

          {/* Primary Services */}
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 mb-12">
            {primaryServices.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group h-full rounded-[24px] border-gray-100 hover:border-[#eab308]/30 transition-all shadow-sm hover:shadow-md">
                  <CardContent className="p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eab308]/10 transition-colors group-hover:bg-[#eab308]/15">
                        <s.icon className="h-7 w-7 text-[#eab308]" />
                      </div>
                      <Badge className="text-[10px] font-black uppercase tracking-wider bg-[#f8f9fa] text-gray-500 border-gray-200">{s.badge}</Badge>
                    </div>
                    <h3 className="mb-3 text-xl font-black text-[#212529]">{s.title}</h3>
                    <p className="mb-5 text-sm text-gray-500 font-medium leading-relaxed">{s.desc}</p>
                    <ul className="mb-6 space-y-2">
                      {s.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link to={s.cta}>
                      <Button className="w-full font-bold rounded-2xl bg-[#212529] text-white shadow-block hover:-translate-y-0.5 active:translate-y-0 active:shadow-block-active transition-all">
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
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center text-center hover:border-[#eab308]/30 hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-[#f8f9fa] flex items-center justify-center text-gray-400 mb-4 group-hover:bg-[#eab308]/10 group-hover:text-[#eab308] transition">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-[#212529] text-sm">{service.title}</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">{service.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Helper */}
      <WhatDoINeed />

      {/* ===== Testimonials ===== */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-label font-black uppercase tracking-widest text-gray-400 mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#212529]">What Clients Say</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full rounded-[24px] border-gray-100 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-[#eab308] text-[#eab308]" />
                      ))}
                    </div>
                    <p className="mb-4 text-sm text-gray-500 font-medium">{t.text}</p>
                    <p className="text-sm font-black text-[#212529]">{t.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Banner ===== */}
      <section className="bg-[#eab308] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#212529] mb-6">Ready to Notarize Your Document?</h2>
          <p className="text-[#212529]/70 text-lg font-medium mb-8">Join thousands of users who have securely notarized their documents online.</p>
          <Link to="/book">
            <Button size="lg" className="bg-[#212529] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-[4px_4px_0px_#fff] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
              Book a Session Now
            </Button>
          </Link>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="border-t border-gray-100 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-label font-black uppercase tracking-widest text-gray-400 mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#212529]">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="rounded-[24px] border border-gray-100 bg-[#f8f9fa] px-6">
                  <AccordionTrigger className="text-left text-sm font-bold text-[#212529]">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-500 font-medium">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== Contact Form ===== */}
      <section id="contact" className="py-20 bg-[#fcfcfc]">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl md:text-4xl font-black tracking-tight text-[#212529]">Get in Touch</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-gray-500 font-medium">
            Have a question or need notarization services? Fill out the form below and we'll respond within 24 hours — we typically respond within 2 hours during business hours.
          </p>
          <div className="mx-auto max-w-lg">
            <Card className="rounded-[32px] border-gray-100 shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Name *</Label>
                      <Input id="contact-name" placeholder="Your full name" value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} maxLength={100} required aria-required="true" autoComplete="name" className="bg-[#f8f9fa] border-none rounded-xl focus:ring-2 focus:ring-[#eab308]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email *</Label>
                      <Input id="contact-email" type="email" inputMode="email" placeholder="you@example.com" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} maxLength={255} required aria-required="true" autoComplete="email" className="bg-[#f8f9fa] border-none rounded-xl focus:ring-2 focus:ring-[#eab308]" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</Label>
                      <Input id="contact-phone" type="tel" inputMode="tel" placeholder="(614) 000-0000" value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} maxLength={20} autoComplete="tel" className="bg-[#f8f9fa] border-none rounded-xl focus:ring-2 focus:ring-[#eab308]" />
                      <p className="text-xs text-gray-400 font-medium">Used only for appointment coordination.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-service" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Needed</Label>
                      <Select value={contactForm.service} onValueChange={(v) => setContactForm((prev) => ({ ...prev, service: v }))}>
                        <SelectTrigger id="contact-service" className="bg-[#f8f9fa] border-none rounded-xl">
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
                    <Label htmlFor="contact-message" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Message *</Label>
                    <Textarea id="contact-message" placeholder="Tell us about your notarization needs..." value={contactForm.message} onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))} maxLength={1000} rows={4} required aria-required="true" className="bg-[#f8f9fa] border-none rounded-xl focus:ring-2 focus:ring-[#eab308]" />
                  </div>
                  {/* Honeypot */}
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                  </div>
                  {/* Legal consent */}
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="agree-terms" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-200 text-[#eab308] focus:ring-[#eab308]" required />
                    <Label htmlFor="agree-terms" className="text-xs text-gray-400 font-medium leading-tight">
                      I agree to the <Link to="/terms" className="text-[#eab308] hover:underline">Terms of Service</Link> and <Link to="/terms#privacy" className="text-[#eab308] hover:underline">Privacy Policy</Link>.
                    </Label>
                  </div>
                  <div aria-live="polite" className="text-sm text-destructive" />
                  <Button type="submit" className="w-full rounded-2xl font-bold bg-[#212529] text-white shadow-block hover:-translate-y-0.5 active:translate-y-0 active:shadow-block-active transition-all" disabled={submitting || !agreeTerms}>
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Message</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== Industry Insights ===== */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-black tracking-tight text-[#212529]">Industry Insights</h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            <Card className="rounded-[24px] border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-black text-[#212529]">Why Remote Notarization is Growing 300% Year-Over-Year</h3>
                <p className="text-sm text-gray-500 font-medium">The adoption of RON has accelerated dramatically since 2020. Over 40 states now have RON legislation, and major GSEs (Fannie Mae, Freddie Mac) accept RON for mortgage transactions. Ohio was among the early adopters under ORC §147.65-.66.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-black text-[#212529]">Understanding Ohio's Electronic Notarization Standards</h3>
                <p className="text-sm text-gray-500 font-medium">Ohio's RON framework requires multi-factor identity verification including credential analysis and Knowledge-Based Authentication (KBA), plus full session recording stored for 10+ years. These MISMO-compliant standards exceed the security of traditional in-person notarization.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-black text-[#212529]">What Title Companies Should Know About RON Closings</h3>
                <p className="text-sm text-gray-500 font-medium">Title companies benefit from RON with faster closing timelines, reduced scheduling friction, and a complete audit trail. ALTA best practices now include RON as a standard closing option.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="mb-2 text-base font-black text-[#212529]">Common Notarization Mistakes and How to Avoid Them</h3>
                <p className="text-sm text-gray-500 font-medium">From incomplete certificates to improper identification, common errors can invalidate a notarization and delay important transactions. Working with an experienced, Ohio-commissioned notary ensures compliance with ORC §147.</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 text-center">
            <Link to="/services" className="text-sm text-[#eab308] font-bold hover:underline">View all our professional notary and document services →</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
