import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import {
  Shield, Award, MapPin, Phone, Mail, ChevronRight, CheckCircle,
  FileText, Monitor, Users, Briefcase, Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const credentials = [
  { icon: Award, title: "NNA Certified & Trained", desc: "National Notary Association certified notary signing agent with advanced training in loan document signing and compliance." },
  { icon: Shield, title: "Ohio Commissioned", desc: "Commissioned notary public by the State of Ohio, authorized under Ohio Revised Code §147 with full RON authorization." },
  { icon: Shield, title: "Surety Bonded & Insured", desc: "$25,000 surety bond and E&O insurance for your protection on every notarization." },
  { icon: CheckCircle, title: "Background Checked", desc: "Successfully completed comprehensive background screening required for notary commission and NNA certification." },
  { icon: Monitor, title: "RON Certified", desc: "Authorized to perform Remote Online Notarization (RON) under Ohio law, using MISMO-compliant platforms with full session recording." },
  { icon: FileText, title: "Document Specialist", desc: "Trained in document preparation, digitization, OCR transcription, and secure document management for individuals and businesses." },
];

const serviceAreas = [
  "Franklin County", "Delaware County", "Licking County", "Fairfield County",
  "Pickaway County", "Madison County", "Union County",
];

export default function About() {
  const [contactInfo, setContactInfo] = useState({ phone: "(614) 300-6890", email: "shane@shanegoble.com" });

  useEffect(() => {
    document.title = "About Shane Goble — Ohio Notary Public & Document Specialist";
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
    return () => { document.title = "Shane Goble Notary — Ohio Notary Public | In-Person & RON"; };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">SG</span>
            </div>
            <div>
              <span className="block font-display text-lg font-bold text-foreground">Shane Goble</span>
              <span className="block text-xs text-muted-foreground">Notary Public & Document Services</span>
            </div>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-foreground">Services</Link>
            <Link to="/templates" className="text-sm font-medium text-muted-foreground hover:text-foreground">Templates</Link>
            <Link to="/digitize" className="text-sm font-medium text-muted-foreground hover:text-foreground">Digitize</Link>
            <DarkModeToggle />
            <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
            <Link to="/book"><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button></Link>
          </div>
          <Sheet>
            <SheetTrigger asChild className="md:hidden"><Button variant="ghost" size="sm"><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="mt-8 flex flex-col gap-4">
                <Link to="/services" className="text-sm font-medium">Services</Link>
                <Link to="/templates" className="text-sm font-medium">Templates</Link>
                <Link to="/digitize" className="text-sm font-medium">Digitize</Link>
                <Link to="/login"><Button variant="outline" className="w-full">Sign In</Button></Link>
                <Link to="/book"><Button className="w-full bg-accent text-accent-foreground">Book Now</Button></Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-navy py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div initial="hidden" animate="visible" className="flex flex-col md:flex-row items-center gap-8">
            <motion.div variants={fadeUp} custom={0} className="flex-shrink-0">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-accent/20 border-4 border-accent/30">
                <span className="font-display text-5xl font-bold text-accent">SG</span>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <Badge className="mb-3 border-gold/30 bg-gold/10 text-gold-light">
                <Award className="mr-1 h-3 w-3" /> NNA Certified Notary Signing Agent
              </Badge>
              <h1 className="mb-3 font-display text-4xl font-bold text-primary-foreground md:text-5xl">
                Shane Goble
              </h1>
              <p className="mb-2 text-xl text-primary-foreground/80">
                Notary Public & Document Specialist — Ohio
              </p>
              <p className="text-primary-foreground/60 max-w-xl">
                Providing professional notarization, document management, and business services 
                throughout Franklin County and the greater Columbus, Ohio metropolitan area.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`}>
                  <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    <Phone className="mr-2 h-4 w-4" /> {contactInfo.phone}
                  </Button>
                </a>
                <a href={`mailto:${contactInfo.email}`}>
                  <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    <Mail className="mr-2 h-4 w-4" /> {contactInfo.email}
                  </Button>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="mb-6 font-display text-3xl font-bold text-foreground">
              About Shane
            </motion.h2>
            <motion.div variants={fadeUp} custom={1} className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Shane Goble is a dedicated Ohio-commissioned Notary Public and NNA Certified Notary Signing Agent 
                based in Columbus, Ohio. With professional training from the National Notary Association and a 
                commitment to accuracy, security, and client service, Shane provides comprehensive notarization 
                and document services for individuals, families, and businesses throughout central Ohio.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Beyond traditional notarization, Shane specializes in document digitization, secure cloud storage, 
                form preparation, and business document management. Whether you need a simple notarization for a 
                power of attorney, a complex real estate closing, I-9 employment verification, or full document 
                digitization services — Shane delivers professional, reliable service with a focus on compliance 
                and client convenience.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                As both an in-person and Remote Online Notarization (RON) provider, Shane leverages technology to 
                make notarization accessible from anywhere while maintaining the highest standards of identity 
                verification and document security required under Ohio law.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-8 font-display text-3xl font-bold text-foreground text-center">
            Credentials & Certifications
          </motion.h2>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {credentials.map((cred, i) => (
              <motion.div key={cred.title} variants={fadeUp} custom={i}>
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                      <cred.icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="mb-2 font-display text-base font-semibold">{cred.title}</h3>
                    <p className="text-sm text-muted-foreground">{cred.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <MapPin className="h-6 w-6 text-accent" /> Service Area
              </h2>
              <p className="mb-4 text-muted-foreground">
                In-person notarization and mobile services available throughout central Ohio. 
                Remote Online Notarization (RON) available from anywhere.
              </p>
              <div className="flex flex-wrap gap-2">
                {serviceAreas.map(area => (
                  <Badge key={area} variant="secondary">{area}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Mobile notary available within 30 miles of Columbus. Travel fees may apply.
              </p>
            </div>
            <div>
              <h2 className="mb-4 font-display text-2xl font-bold text-foreground flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-accent" /> Services Overview
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> In-Person & Remote Online Notarization</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Document Digitization & OCR</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Apostille & Authentication</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> I-9 Employment Verification</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Real Estate & Loan Signing</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Document Preparation & Templates</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Secure Cloud Document Storage</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-accent" /> Business & Volume Services</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Response time + CTA */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Get in Touch</h2>
          <p className="mb-2 text-muted-foreground">
            Message us for a response within 24 hours — we typically respond within 2 hours during business hours.
          </p>
          <p className="mb-6 text-xs text-muted-foreground">Mon–Wed 10 AM – 7 PM EST</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-gold-dark">
                Book Appointment <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline">View All Services</Button>
            </Link>
            <Link to="/join">
              <Button size="lg" variant="outline">
                <Users className="mr-2 h-4 w-4" /> Join as Provider
              </Button>
            </Link>
            <Link to="/#contact">
              <Button size="lg" variant="outline">
                <Mail className="mr-2 h-4 w-4" /> Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Shane Goble — Ohio Commissioned Notary Public & Document Specialist</p>
      </footer>
    </div>
  );
}
