import { usePageMeta } from "@/hooks/usePageMeta";
import { ORGANIZATION_JSONLD, reviewAggregateJsonLd, setOpenGraphMeta } from "@/lib/seoHelpers";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
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
import { ZoomConsultCTA } from "@/components/ZoomConsultCTA";
import { RonAdvisorWidget } from "@/components/RonAdvisorWidget";
import { TrustBar } from "@/components/trust";
import heroDocumentCard from "@/assets/hero-document-card.png";
import heroDocumentCardMobile from "@/assets/hero-document-card-mobile.png";
import stepUpload from "@/assets/step-upload.png";
import stepVerify from "@/assets/step-verify.png";
import stepSign from "@/assets/step-sign.png";
import featurePhoneMockup from "@/assets/feature-phone-mockup.png";

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

 // C-06: Removed dead dbServices query — services are rendered from static arrays above
 const [dbReviews, setDbReviews] = useState<{ name: string; text: string; rating: number }[]>([]);

 useEffect(() => {
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
 email: get("notary_email", "contact@notar.com"),
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
 "url": "https://notar.com",
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
 <TrustBar />
      {/* ===== HERO — Navy with yellow underline accent ===== */}
      <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
        {/* Decorative background: yellow ring + blue ring + dot pattern */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.18]">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full border-[24px] border-primary/40" />
          <div className="absolute top-1/3 right-10 h-32 w-32 rounded-full border-[10px] border-accent/60" />
          <div className="absolute bottom-10 left-1/3 h-3 w-3 rounded-full bg-primary" />
          <div className="absolute top-20 right-1/4 h-2 w-2 rounded-full bg-accent" />
          <div className="absolute inset-0 dot-pattern opacity-30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible">
              <motion.div variants={fadeUp} custom={0} className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Online · Trusted Nationally
                </span>
              </motion.div>

              <motion.h1
                variants={blurIn}
                custom={1}
                className="font-display font-bold tracking-tight leading-[1.05] text-secondary-foreground mb-6 text-5xl md:text-6xl lg:text-7xl"
              >
                Legal Online<br />
                <span className="relative inline-block">
                  Notarization
                  <span aria-hidden className="absolute left-0 right-0 -bottom-2 h-3 bg-primary rounded-full" />
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-base md:text-lg text-secondary-foreground/70 font-medium mb-8 max-w-md leading-relaxed"
              >
                We are a team of passionate certified notaries specializing in secure, accessible, and modern document authentication.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3 items-center mb-10">
                <Link to="/book?type=ron">
                  <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-7 py-6 font-bold text-base">
                    Start Notarizing Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-7 py-6 font-bold text-base border-secondary-foreground/30 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-bold uppercase tracking-widest text-secondary-foreground/60">
                {[
                  { icon: FileCheck2, label: "Free Quotes" },
                  { icon: ShieldCheck, label: "Commissioned Notaries" },
                  { icon: Globe, label: "All 50 States" },
                  { icon: Scale, label: "ABA Approved" },
                  { icon: Lock, label: "EU Trust Seal" },
                ].map((b) => (
                  <span key={b.label} className="inline-flex items-center gap-1.5">
                    <b.icon className="h-3.5 w-3.5 text-primary" /> {b.label}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Hero illustration — paper document card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute inset-0 -m-8 rounded-[40px] bg-primary/10 blur-3xl" aria-hidden />
              <img
                src={heroDocumentCard}
                alt="Notarized document with signature and verified seal"
                width={1024}
                height={1024}
                className="relative w-full max-w-md h-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.35)]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== How can we help you today? — 3 service cards ===== */}
      <section id="services" className="section-padding bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary-accessible px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
              Choose your service
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              How can we help you today?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
              Select the notarization service that best fits your location and document requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: "Mobile Notary",
                badge: "Trusted Mobile Notary",
                desc: "We travel directly to your home, office, or local coffee shop for convenient, in-person notarization.",
                cta: "/book?type=in_person",
                ctaLabel: "Book Mobile Notary",
                highlight: false,
              },
              {
                icon: Video,
                title: "Remote Online",
                badge: "Most Popular",
                desc: "Secure, fast, and completely online. Connect instantly with an Ohio-commissioned notary from any computer.",
                cta: "/book?type=ron",
                ctaLabel: "Start Online Session",
                highlight: true,
              },
              {
                icon: Globe,
                title: "Remote Apostille",
                badge: "Legal Treaty Facilitation",
                desc: "Expedited international document authentication for participation in the Hague Convention.",
                cta: "/services?category=authentication",
                ctaLabel: "Request Apostille",
                highlight: false,
              },
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`group h-full relative rounded-3xl shadow-soft transition-all hover:-translate-y-1 ${
                    s.highlight
                      ? "border-2 border-primary bg-card shadow-lg ring-4 ring-primary/10"
                      : "border border-border bg-card"
                  }`}
                >
                  {s.highlight && (
                    <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-accent text-accent-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-md">
                      Most Popular
                    </span>
                  )}
                  <CardContent className="p-7">
                    <div className={`mb-5 inline-flex items-center justify-center h-12 w-12 rounded-2xl ${s.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary-accessible"}`}>
                      <s.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-1">{s.title}</h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {s.badge}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6 min-h-[60px]">
                      {s.desc}
                    </p>
                    <Link to={s.cta}>
                      <Button
                        className={`w-full rounded-full font-bold ${
                          s.highlight
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        }`}
                      >
                        {s.ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works — 3 steps with paper-card illustrations ===== */}
      <section id="how-it-works" className="section-padding bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
              Complete your notarization securely and legally in three simple, guided steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { num: "Step 1", title: "Upload Document", desc: "Upload your PDF. Our platform ensures it meets legal requirements immediately.", img: stepUpload },
              { num: "Step 2", title: "Verify & Connect", desc: "Verify your identity (KBA) and connect with a live Ohio notary via secure video.", img: stepVerify },
              { num: "Step 3", title: "Sign & Download", desc: "Sign electronically. Your fully legalized, tamper-proof document is ready.", img: stepSign },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-card rounded-3xl border border-border p-7 shadow-soft text-center"
              >
                <div className="mx-auto mb-5 flex h-40 w-40 items-center justify-center">
                  <img src={step.img} alt={step.title} loading="lazy" width={512} height={512} className="h-full w-full object-contain" />
                </div>
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {step.num}
                </span>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Trusted by Ohioans — Testimonials ===== */}
      <section className="section-padding bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary-accessible px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
              Word on the street
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Trusted by Ohioans
            </h2>
            <p className="text-base md:text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
              Don't just take our word for it. See what clients have to say about the Notar experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => {
              const cities = ["Columbus, OH", "Dublin, OH", "Westerville, OH"];
              return (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative bg-card rounded-3xl border border-border p-7 shadow-soft"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="text-3xl font-display font-bold leading-none text-primary/40" aria-hidden>"</span>
                  </div>
                  <p className="text-sm text-foreground font-medium leading-relaxed mb-6 min-h-[80px]">
                    {t.text}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/15 text-primary-accessible flex items-center justify-center font-bold text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{cities[i % 3]}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Legal expertise meets modern convenience ===== */}
      <section className="section-padding bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary-accessible px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              Why we are
            </span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative flex items-center justify-center"
            >
              <img
                src={featurePhoneMockup}
                alt="Notar mobile app showing notarization in progress"
                loading="lazy"
                width={1024}
                height={1024}
                className="w-full max-w-md h-auto"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                Legal expertise meets modern convenience.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-8 max-w-lg">
                We are a team of Ohio-commissioned notary professionals dedicated to making document authentication simple, secure, and accessible. From remote online notarization (RON) to mobile signings across Central Ohio, we combine legal expertise with modern technology to deliver fast, compliant services you can trust.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Ohio-Commissioned", "Background Checked", "Insured & Bonded", "NNA Certified"].map((label) => (
                  <span key={label} className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-xs font-bold">
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Final CTA — Navy with yellow + outline buttons ===== */}
      <section className="relative section-padding bg-secondary text-secondary-foreground overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.15]">
          <div className="absolute -top-20 right-10 h-64 w-64 rounded-full border-[16px] border-primary/40" />
          <div className="absolute bottom-10 left-1/4 h-3 w-3 rounded-full bg-primary" />
          <div className="absolute inset-0 dot-pattern opacity-40" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-secondary-foreground mb-5 leading-[1.1]">
            Ready to notarize<br />your document?
          </h2>
          <p className="text-base md:text-lg text-secondary-foreground/70 font-medium mb-8 max-w-xl mx-auto">
            Skip the lines and the hassle. Connect with a commissioned Ohio notary public online right now.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/book?type=ron">
              <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-7 py-6 font-bold text-base">
                Start Notarizing Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-7 py-6 font-bold text-base border-secondary-foreground/30 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

 {/* ===== FAQ ===== */}
 <section id="faq" className="border-t border-border bg-card section-padding">
 <div className="container mx-auto px-4">
 <div className="mx-auto mb-12 max-w-2xl text-center">
 <p className="text-label font-bold uppercase tracking-widest text-muted-foreground mb-3">FAQ</p>
 <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
 </div>
 <div className="mx-auto max-w-2xl">
 <Accordion type="single" collapsible className="space-y-2">
 {faqs.map((faq, i) => (
 <AccordionItem key={i} value={`faq-${i}`} className="rounded-card border border-border bg-muted px-6">
 <AccordionTrigger className="text-left text-sm font-bold text-foreground">{faq.q}</AccordionTrigger>
 <AccordionContent className="text-sm text-muted-foreground font-medium">{faq.a}</AccordionContent>
 </AccordionItem>
 ))}
 </Accordion>
 </div>
 </div>
 </section>

 {/* ===== Contact Form ===== */}
 <section id="contact" className="section-padding bg-background">
 <div className="container mx-auto px-4">
 <h2 className="mb-4 text-center text-3xl md:text-4xl font-bold tracking-tight text-foreground">Get in Touch</h2>
 <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground font-medium">
 Have a question or need notarization services? Fill out the form below and we'll respond within 24 hours — we typically respond within 2 hours during business hours.
 </p>
 <div className="mx-auto max-w-lg">
 <Card className="rounded-card-lg border-border shadow-sm">
 <CardContent className="pt-6">
 <form onSubmit={handleContactSubmit} className="space-y-4">
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="contact-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name *</Label>
 <Input id="contact-name" placeholder="Your full name" value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} maxLength={100} required aria-required="true" autoComplete="name" className="bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="contact-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email *</Label>
 <Input id="contact-email" type="email" inputMode="email" placeholder="you@example.com" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} autoComplete="email" maxLength={255} required aria-required="true" className="bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary" />
 </div>
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="contact-phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</Label>
 <Input id="contact-phone" type="tel" inputMode="tel" placeholder="(614) 000-0000" value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} autoComplete="tel" maxLength={20} className="bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary" />
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
 <Card className="rounded-card border-border shadow-sm interactive-card">
 <CardContent className="p-6">
 <h3 className="mb-2 text-base font-bold text-foreground">Why Remote Notarization is Growing 300% Year-Over-Year</h3>
 <p className="text-sm text-muted-foreground font-medium">The adoption of RON has accelerated dramatically since 2020. Over 40 states now have RON legislation, and major GSEs (Fannie Mae, Freddie Mac) accept RON for mortgage transactions. Ohio was among the early adopters under ORC §147.65-.66.</p>
 </CardContent>
 </Card>
 <Card className="rounded-card border-border shadow-sm interactive-card">
 <CardContent className="p-6">
 <h3 className="mb-2 text-base font-bold text-foreground">Understanding Ohio's Electronic Notarization Standards</h3>
 <p className="text-sm text-muted-foreground font-medium">Ohio's RON framework requires multi-factor identity verification including credential analysis and Knowledge-Based Authentication (KBA), plus full session recording stored for 10+ years. These MISMO-compliant standards exceed the security of traditional in-person notarization.</p>
 </CardContent>
 </Card>
 <Card className="rounded-card border-border shadow-sm interactive-card">
 <CardContent className="p-6">
 <h3 className="mb-2 text-base font-bold text-foreground">What Title Companies Should Know About RON Closings</h3>
 <p className="text-sm text-muted-foreground font-medium">Title companies benefit from RON with faster closing timelines, reduced scheduling friction, and a complete audit trail. ALTA best practices now include RON as a standard closing option.</p>
 </CardContent>
 </Card>
 <Card className="rounded-card border-border shadow-sm interactive-card">
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

 {/* RON Quick-Check + Zoom Consult */}
 <section className="bg-muted/20 py-16">
   <div className="mx-auto grid max-w-5xl gap-8 px-4 md:grid-cols-2">
     <div>
       <h2 className="mb-2 font-sans text-2xl font-bold text-foreground">Will RON work for your document?</h2>
       <p className="mb-4 text-sm text-muted-foreground">Quick eligibility check based on Ohio RON law (ORC §147.60–.66) and 50-state acceptance data.</p>
       <RonAdvisorWidget />
       <div className="mt-3">
         <Link to="/ron-info" className="text-sm font-semibold text-primary hover:underline">Learn more about RON →</Link>
       </div>
     </div>
     <div>
       <h2 className="mb-2 font-sans text-2xl font-bold text-foreground">Have questions?</h2>
       <p className="mb-4 text-sm text-muted-foreground">Free 15-minute Zoom consultation — get personalized guidance for your situation.</p>
       <ZoomConsultCTA />
     </div>
   </div>
 </section>
 </PageShell>
 );
}
