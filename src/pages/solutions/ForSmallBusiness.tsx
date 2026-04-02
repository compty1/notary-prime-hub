import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { motion } from "framer-motion";
import { Briefcase, FileText, Users, Monitor, CreditCard, Shield, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { icon: FileText, title: "Corporate Resolutions & Minutes", desc: "Board resolutions, meeting minutes, and corporate governance documents notarized for official filing." },
  { icon: Briefcase, title: "Operating & Partnership Agreements", desc: "LLC operating agreements, partnership documents, and business formation papers properly executed and notarized." },
  { icon: Shield, title: "Contracts & Vendor Agreements", desc: "Non-disclosure agreements, vendor contracts, lease agreements, and other business documents requiring notarization." },
  { icon: Users, title: "I-9 & Employment Verification", desc: "Employee identity verification, I-9 completion, and employment authorization documents for HR compliance." },
  { icon: Monitor, title: "Remote Notarization", desc: "RON sessions for remote employees, out-of-state partners, or anyone who can't visit in person. Ohio-authorized and secure." },
  { icon: CreditCard, title: "Subscription Plans", desc: "Monthly and annual plans for businesses with recurring notarization needs — flat-rate pricing, priority scheduling, and dedicated support." },
];

const complianceItems = [
  "Ohio ORC §147 — Full compliance with Ohio notary standards",
  "ORC §1705 — LLC formation and operating agreement requirements",
  "ORC §1782 — Partnership agreement execution standards",
  "Ohio Secretary of State filing requirements met",
  "Proper acknowledgment certificates for business documents",
  "Authorized signer verification for corporate entities",
  "Digital journal entries with complete audit trail",
  "Bulk document handling with consistent quality",
];

export default function ForSmallBusiness() {
  usePageTitle("For Small Business — Notary & Document Services", "Affordable notarization and document services for Ohio small businesses. Corporate documents, contracts, I-9 verification, and subscription plans.");

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-4">For Small Business</Badge>
              <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
                Business Document Services Made Simple
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                From formation documents to vendor contracts, we provide reliable, affordable notarization
                for Ohio small businesses. Subscription plans available for recurring needs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/book">
                  <Button size="lg" className="rounded-full px-8">Book Appointment <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link to="/services?category=business">
                  <Button size="lg" variant="outline">Business Services</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-lg">
                <Briefcase className="mx-auto mb-4 h-16 w-16 text-primary" />
                <p className="text-center text-lg font-semibold text-foreground">Built for Business</p>
                <p className="mt-2 text-center text-sm text-muted-foreground">Subscription plans from $29/mo</p>
                <div className="absolute -bottom-3 -right-3 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-lg">
                  Volume Discounts
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-sans text-3xl font-bold text-foreground">Business Notarization Services</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Everything your business needs — from formation to day-to-day operations.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><f.icon className="h-6 w-6 text-primary" /></div>
                    <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">Business Compliance</Badge>
              <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Ohio Business Document Standards</h2>
              <p className="text-muted-foreground">We ensure every business document meets Ohio filing requirements and notarization standards.</p>
            </div>
            <div className="space-y-3">
              {complianceItems.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <p className="text-sm text-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Briefcase className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Ready to Streamline Your Document Needs?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">Book a one-time appointment or explore subscription plans for ongoing business notarization support.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="rounded-full px-8">Book Now</Button></Link>
            <Link to="/fee-calculator"><Button size="lg" variant="outline">View Pricing</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
