import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Monitor, FileText, Shield, Clock, CheckCircle, Star, ChevronRight, Phone, Mail, Scale, Menu, Send, Loader2 } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const services = [
  { icon: FileText, title: "Real Estate Documents", desc: "Deeds, mortgages, refinancing, title transfers" },
  { icon: Shield, title: "Legal Documents", desc: "Power of attorney, affidavits, sworn statements" },
  { icon: Scale, title: "Estate Planning", desc: "Wills, trusts, healthcare directives" },
  { icon: FileText, title: "Business Documents", desc: "Contracts, agreements, corporate filings" },
];

const steps = [
  { num: "01", title: "Book", desc: "Choose in-person or remote and select your time slot" },
  { num: "02", title: "Verify", desc: "Complete identity verification and KBA for RON sessions" },
  { num: "03", title: "Sign", desc: "Documents notarized securely with digital seal" },
];

const faqs = [
  { q: "What is Remote Online Notarization (RON)?", a: "RON allows you to have documents notarized via a secure video call from anywhere. Ohio authorizes RON under Ohio Revised Code §147.65-.66, making it fully legal and binding." },
  { q: "What identification do I need?", a: "You'll need a valid government-issued photo ID (driver's license, passport, or state ID). For RON sessions, you'll also complete Knowledge-Based Authentication (KBA) questions." },
  { q: "How long does a notarization take?", a: "Most notarizations take 10-15 minutes for in-person sessions. RON sessions may take 20-30 minutes including the identity verification process." },
  { q: "What areas do you serve for in-person notarization?", a: "I serve Franklin County and the greater Columbus, Ohio metropolitan area for in-person notarizations. Mobile notary services are available within a 30-mile radius." },
  { q: "Is RON notarization accepted everywhere?", a: "RON notarizations performed under Ohio law are recognized in all 50 states. However, some specific transactions may have unique requirements. Contact me to confirm for your situation." },
];

const testimonials = [
  { name: "Sarah M.", text: "Shane made our home closing so easy. Professional, punctual, and thorough.", rating: 5 },
  { name: "James R.", text: "Used the remote notarization while traveling. Incredibly convenient and secure.", rating: 5 },
  { name: "Lisa K.", text: "Best notary experience I've had. Will definitely use again for our business documents.", rating: 5 },
];

export default function Index() {
  const [serviceType, setServiceType] = useState<"in_person" | "ron">("in_person");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({ title: "Required fields missing", description: "Please fill in your name, email, and message.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      name: contactForm.name.trim().slice(0, 100),
      email: contactForm.email.trim().slice(0, 255),
      phone: contactForm.phone.trim().slice(0, 20) || null,
      service_needed: contactForm.service || null,
      notes: contactForm.message.trim().slice(0, 1000),
      source: "website_contact_form",
      lead_type: "individual",
      intent_score: "medium",
      status: "new",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: "Please try again or call us directly.", variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
      setContactForm({ name: "", email: "", phone: "", service: "", message: "" });
    }
  };

  const [contactInfo, setContactInfo] = useState({ phone: "(614) 300-6890", email: "shane@shanegoble.com" });

  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value")
      .in("setting_key", ["notary_phone", "notary_email"])
      .then(({ data }) => {
        if (data) {
          const phone = data.find(s => s.setting_key === "notary_phone")?.setting_value;
          const email = data.find(s => s.setting_key === "notary_email")?.setting_value;
          if (phone) setContactInfo(prev => ({ ...prev, phone }));
          if (email) setContactInfo(prev => ({ ...prev, email }));
        }
      });
  }, []);


  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/services" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Services</Link>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How It Works</a>
            <Link to="/templates" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Templates</Link>
            <Link to="/fee-calculator" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
            <Link to="/ron-info" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">RON Info</Link>
            <a href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
            <DarkModeToggle />
            <Link to="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/book">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button>
            </Link>
          </div>

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-8 flex flex-col gap-4">
                <Link to="/services" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Services</Link>
                <a href="#how-it-works" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <Link to="/templates" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Templates</Link>
                <Link to="/fee-calculator" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                <Link to="/ron-info" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>RON Info</Link>
                <hr className="border-border" />
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link to="/book" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-navy py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, hsl(42 78% 55% / 0.15) 0%, transparent 50%)" }} />
        </div>
        <div className="container relative mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-6 border-gold/30 bg-gold/10 text-gold-light">
                <Shield className="mr-1 h-3 w-3" /> Ohio Commissioned Notary Public
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mb-6 font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl"
            >
              Professional Notary Services in{" "}
              <span className="text-gradient-gold">Franklin County</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mb-8 text-lg text-primary-foreground/70 md:text-xl"
            >
              In-person and remote online notarization — secure, convenient, and fully compliant with Ohio law.
            </motion.p>

            {/* Service Type Toggle */}
            <motion.div variants={fadeUp} custom={3} className="mb-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setServiceType("in_person")}
                className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all ${
                  serviceType === "in_person"
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "bg-primary-foreground/10 text-primary-foreground/70 hover:bg-primary-foreground/20"
                }`}
              >
                <MapPin className="h-4 w-4" /> In-Person
              </button>
              <button
                onClick={() => setServiceType("ron")}
                className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all ${
                  serviceType === "ron"
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "bg-primary-foreground/10 text-primary-foreground/70 hover:bg-primary-foreground/20"
                }`}
              >
                <Monitor className="h-4 w-4" /> Remote (RON)
              </button>
            </motion.div>

            <motion.div variants={fadeUp} custom={4}>
              {serviceType === "in_person" ? (
                <p className="mb-6 text-primary-foreground/60">
                  Available throughout Franklin County & greater Columbus area. Mobile notary available within 30 miles.
                </p>
              ) : (
                <p className="mb-6 text-primary-foreground/60">
                  Secure video notarization from anywhere — fully authorized under Ohio Revised Code §147.65-.66.
                </p>
              )}
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={`/book?type=${serviceType}`}>
                <Button size="lg" className="bg-accent text-accent-foreground shadow-lg hover:bg-gold-dark">
                  Schedule Appointment <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`}>
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Phone className="mr-2 h-4 w-4" /> {contactInfo.phone}
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border bg-muted/50 py-6">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-8 px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <span>Ohio Revised Code §147 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-accent" />
            <span>Franklin County Commissioned</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <span>$25,000 Surety Bond</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            <span>Same-Day Appointments Available</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <motion.h2 variants={fadeUp} custom={0} className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
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
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {services.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp} custom={i}>
                <Card className="group h-full border-border/50 transition-all hover:border-accent/30 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                      <s.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <motion.h2 variants={fadeUp} custom={0} className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
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
            className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3"
          >
            {steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} custom={i} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold shadow-lg">
                  <span className="font-display text-xl font-bold text-accent-foreground">{step.num}</span>
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden w-full -translate-y-1/2 md:block">
                    <ChevronRight className="absolute -right-4 h-5 w-5 text-accent/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-12 text-center">
            <Link to="/book">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-gold-dark">
                Get Started <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-12 text-center font-display text-3xl font-bold text-foreground md:text-4xl"
          >
            What Clients Say
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3"
          >
            {testimonials.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground italic">"{t.text}"</p>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-12 text-center font-display text-3xl font-bold text-foreground md:text-4xl"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mx-auto max-w-2xl"
          >
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                  <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
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
            className="mb-4 text-center font-display text-3xl font-bold text-foreground md:text-4xl"
          >
            Get in Touch
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mx-auto mb-12 max-w-xl text-center text-muted-foreground"
          >
            Have a question or need notarization services? Fill out the form below and we'll respond within 24 hours.
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="mx-auto max-w-lg"
          >
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="Your full name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="you@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        maxLength={255}
                        required
                      />
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
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-service">Service Needed</Label>
                      <Select value={contactForm.service} onValueChange={(v) => setContactForm(prev => ({ ...prev, service: v }))}>
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
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      maxLength={1000}
                      rows={4}
                      required
                    />
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


      <footer className="bg-gradient-navy py-12 text-primary-foreground/70">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
                  <span className="font-display text-sm font-bold text-accent-foreground">SG</span>
                </div>
                <span className="font-display text-lg font-bold text-primary-foreground">Shane Goble</span>
              </div>
              <p className="text-sm">Ohio Commissioned Notary Public serving Franklin County and the greater Columbus area.</p>
            </div>
            <div>
              <h4 className="mb-3 font-display text-sm font-semibold text-primary-foreground">Contact</h4>
              <div className="space-y-2 text-sm">
                <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:text-accent"><Phone className="h-3 w-3" /> {contactInfo.phone}</a>
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 hover:text-accent"><Mail className="h-3 w-3" /> {contactInfo.email}</a>
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-display text-sm font-semibold text-primary-foreground">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/book" className="block hover:text-accent">Book Appointment</Link>
                <Link to="/services" className="block hover:text-accent">All Services</Link>
                <Link to="/templates" className="block hover:text-accent">Document Templates</Link>
                <Link to="/fee-calculator" className="block hover:text-accent">Pricing</Link>
                <Link to="/ron-info" className="block hover:text-accent">RON Information</Link>
                <Link to="/login" className="block hover:text-accent">Client Portal</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-primary-foreground/10 pt-8 text-center text-xs">
            <p>© {new Date().getFullYear()} Shane Goble Notary Services. All rights reserved.</p>
            <p className="mt-1">Ohio Commissioned Notary Public — Franklin County</p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link to="/terms" className="hover:text-accent">Terms of Service & Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
