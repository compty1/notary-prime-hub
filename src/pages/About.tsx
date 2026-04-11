import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Shield, Award, MapPin, Phone, Mail, ChevronRight, CheckCircle,
  FileText, Monitor, Users, Briefcase
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageMeta } from "@/hooks/usePageMeta";
import { fadeUp, scaleReveal } from "@/lib/animations";

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
  const [contactInfo, setContactInfo] = useState({ phone: "(614) 300-6890", email: "contact@notardex.com" });
  const [commissionExp, setCommissionExp] = useState<string | null>(null);
  const [eoStatus, setEoStatus] = useState<string | null>(null);
  const [bondStatus, setBondStatus] = useState<string | null>(null);
  usePageMeta({ title: "About Notar | Ohio Notary Services", description: "Learn about Notar — Ohio-commissioned notary providing in-person and remote online notarization (RON) in Franklin County, Columbus." });

  useEffect(() => {
    supabase.from("platform_settings").select("setting_key, setting_value")
      .in("setting_key", ["notary_phone", "notary_email", "commission_expiration_date", "eo_expiration_date", "bond_expiration_date"]).limit(10)
      .then(({ data }) => {
        if (data) {
          const phone = data.find(s => s.setting_key === "notary_phone")?.setting_value;
          const email = data.find(s => s.setting_key === "notary_email")?.setting_value;
          const commExp = data.find(s => s.setting_key === "commission_expiration_date")?.setting_value;
          const eoExp = data.find(s => s.setting_key === "eo_expiration_date")?.setting_value;
          const bondExp = data.find(s => s.setting_key === "bond_expiration_date")?.setting_value;
          if (phone) setContactInfo(prev => ({ ...prev, phone }));
          if (email) setContactInfo(prev => ({ ...prev, email }));
          if (commExp) setCommissionExp(commExp);
          if (eoExp) setEoStatus(eoExp);
          if (bondExp) setBondStatus(bondExp);
        }
      });
  }, []);

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="container mx-auto max-w-4xl px-4 pt-4"><Breadcrumbs /></div>
      {/* Hero — Block Shadow */}
      <section className="relative overflow-hidden border-b-2 border-border bg-card py-16 md:py-24">
        <div className="container relative mx-auto max-w-4xl px-4">
          <motion.div initial="hidden" animate="visible" className="flex flex-col md:flex-row items-center gap-8">
            <motion.div variants={fadeUp} custom={0} className="flex-shrink-0">
              <Logo size="xl" />
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <Badge className="mb-3 bg-[hsl(45,96%,50%)]/10 text-[hsl(45,96%,40%)] border-[hsl(45,96%,50%)]/20 rounded-lg font-bold">
                <Award className="mr-1 h-3 w-3" /> NNA Certified Notary Signing Agent
              </Badge>
              <h1 className="mb-3 text-4xl font-black text-[hsl(220,26%,14%)] md:text-5xl">
                Notar
              </h1>
              <p className="mb-2 text-xl text-muted-foreground">
                Professional Notary & Document Services — Ohio
              </p>
              <p className="text-muted-foreground/70 max-w-xl">
                Notar is a team of Ohio-commissioned notaries providing professional notarization, 
                document management, and business services throughout Franklin County and the greater Columbus area.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`}>
                  <Button variant="outline" className="rounded-xl font-bold border-2">
                    <Phone className="mr-2 h-4 w-4" /> {contactInfo.phone}
                  </Button>
                </a>
                <a href={`mailto:${contactInfo.email}`}>
                  <Button variant="outline" className="rounded-xl font-bold border-2">
                    <Mail className="mr-2 h-4 w-4" /> {contactInfo.email}
                  </Button>
                </a>
              </div>
            </motion.div>
          </motion.div>

          {/* Commission & Insurance Status Badges */}
          <motion.div variants={fadeUp} custom={2} className="mt-6 flex flex-wrap gap-3">
            {commissionExp && (() => {
              const days = Math.ceil((new Date(commissionExp).getTime() - Date.now()) / 86400000);
              return (
                <Badge variant={days > 90 ? "secondary" : days > 0 ? "outline" : "destructive"} className="text-xs rounded-lg font-bold">
                  <Award className="mr-1 h-3 w-3" />
                  Commission {days > 0 ? `expires ${new Date(commissionExp).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "EXPIRED"}
                </Badge>
              );
            })()}
            {eoStatus && (() => {
              const days = Math.ceil((new Date(eoStatus).getTime() - Date.now()) / 86400000);
              return (
                <Badge variant={days > 60 ? "secondary" : "outline"} className="text-xs rounded-lg font-bold">
                  <Shield className="mr-1 h-3 w-3" />
                  E&O Insurance {days > 0 ? "Active" : "Expired"}
                </Badge>
              );
            })()}
            {bondStatus && (() => {
              const days = Math.ceil((new Date(bondStatus).getTime() - Date.now()) / 86400000);
              return (
                <Badge variant={days > 60 ? "secondary" : "outline"} className="text-xs rounded-lg font-bold">
                  <Shield className="mr-1 h-3 w-3" />
                  Surety Bond {days > 0 ? "Active" : "Expired"}
                </Badge>
              );
            })()}
          </motion.div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} custom={0} className="mb-6 text-3xl font-black text-[hsl(220,26%,14%)]">
              Who We Are
            </motion.h2>
            <motion.div variants={fadeUp} custom={1} className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Notar was founded with a clear mission: to make professional notarization accessible, secure,
                and convenient for everyone. Based in Columbus, Ohio, our team of Ohio-commissioned Notaries Public
                and NNA Certified Notary Signing Agents brings together deep expertise in notarial law, document
                management, and digital security.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong className="text-foreground font-black">Our Vision:</strong> To be Ohio's most trusted digital notarization
                partner — combining the legal rigor of traditional notary practice with modern technology that saves
                our clients time and ensures compliance at every step.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                <strong className="text-foreground font-black">Our Values:</strong> Integrity in every notarial act. Transparency in
                pricing and process. Security that meets enterprise standards. Accessibility through both in-person and
                Remote Online Notarization. Compliance with Ohio Revised Code §147 and all applicable regulations.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Beyond traditional notarization, the Notar team specializes in document digitization, secure cloud
                storage, form preparation, apostille facilitation, and business document management. Whether you need
                a simple notarization for a power of attorney, a complex real estate closing, I-9 employment verification,
                or full document digitization services — Notar delivers professional, reliable service with a focus
                on compliance and client convenience.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                As both in-person and Remote Online Notarization (RON) providers, our team leverages technology to
                make notarization accessible from anywhere while maintaining the highest standards of identity
                verification and document security required under Ohio law.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Credentials — Block Shadow cards */}
      <section className="bg-[hsl(45,96%,50%)]/5 py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-8 text-3xl font-black text-[hsl(220,26%,14%)] text-center">
            Credentials & Certifications
          </motion.h2>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {credentials.map((cred, i) => (
              <motion.div key={cred.title} variants={scaleReveal} custom={i}>
                <Card className="h-full rounded-[24px] border-2 border-border shadow-[4px_4px_0px_hsl(220,10%,85%)] hover:shadow-[6px_6px_0px_hsl(45,96%,50%)] transition-shadow">
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(45,96%,50%)]/10">
                      <cred.icon className="h-5 w-5 text-[hsl(45,96%,50%)]" />
                    </div>
                    <h3 className="mb-2 text-base font-black">{cred.title}</h3>
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
              <h2 className="mb-4 text-2xl font-black text-[hsl(220,26%,14%)] flex items-center gap-2">
                <MapPin className="h-6 w-6 text-[hsl(45,96%,50%)]" /> Service Area
              </h2>
              <p className="mb-4 text-muted-foreground">
                In-person notarization and mobile services available throughout central Ohio. 
                Remote Online Notarization (RON) available from anywhere.
              </p>
              <div className="flex flex-wrap gap-2">
                {serviceAreas.map(area => (
                  <Badge key={area} className="bg-[hsl(220,10%,95%)] text-[hsl(220,26%,14%)] rounded-lg font-bold">{area}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Mobile notary available within 30 miles of Columbus. Travel fees may apply.
              </p>
            </div>
            <div>
              <h2 className="mb-4 text-2xl font-black text-[hsl(220,26%,14%)] flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-[hsl(45,96%,50%)]" /> Services Overview
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> In-Person & Remote Online Notarization</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> Document Digitization & OCR</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> Apostille & Authentication</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> I-9 Employment Verification</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> Real Estate & Loan Signing</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> Document Preparation & Templates</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> Secure Cloud Document Storage</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-[hsl(45,96%,50%)]" /> Business & Volume Services</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Verification */}
      <section className="border-t-2 border-border py-8">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Verify our notary commission status on the{" "}
            <a
              href="https://www.ohiosos.gov/businesses/notary-public/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(45,96%,50%)] font-bold hover:underline"
            >
              Ohio Secretary of State Notary Lookup →
            </a>
          </p>
        </div>
      </section>

      {/* CTA — Block Shadow */}
      <section className="border-t-2 border-border bg-card py-16">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-black text-[hsl(220,26%,14%)]">Get in Touch</h2>
          <p className="mb-2 text-muted-foreground">
            Message us for a response within 24 hours — we typically respond within 2 hours during business hours.
          </p>
          <p className="mb-6 text-xs text-muted-foreground">Mon–Fri 9 AM – 7 PM ET &nbsp;|&nbsp; Sat 10 AM – 4 PM ET</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book">
              <Button size="lg" className="rounded-xl font-bold bg-[hsl(45,96%,50%)] text-[hsl(220,26%,14%)] hover:bg-[hsl(45,96%,45%)] shadow-[4px_4px_0px_hsl(220,26%,14%)]">
                Book Appointment <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/services">
              <Button size="lg" variant="outline" className="rounded-xl font-bold border-2">View All Services</Button>
            </Link>
            <Link to="/join">
              <Button size="lg" variant="outline" className="rounded-xl font-bold border-2">
                <Users className="mr-2 h-4 w-4" /> Join as Provider
              </Button>
            </Link>
            <Link to="/#contact">
              <Button size="lg" variant="outline" className="rounded-xl font-bold border-2">
                <Mail className="mr-2 h-4 w-4" /> Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
