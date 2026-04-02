import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { motion } from "framer-motion";
import { Shield, Monitor, BookOpen, FileCheck, DollarSign, Clock, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { icon: Monitor, title: "Remote Online Notarization", desc: "Conduct RON sessions with any signing platform — SignNow, DocuSign, Pavaso, and more." },
  { icon: BookOpen, title: "Digital Notary Journal", desc: "ORC §147.04 compliant sequential journal with automated entries and PDF export." },
  { icon: Shield, title: "E-Seal Verification", desc: "Tamper-evident electronic seals with public verification URLs for every notarized document." },
  { icon: Clock, title: "Smart Scheduling", desc: "Availability management, double-booking prevention, and automated email reminders." },
  { icon: Sparkles, title: "AI Document Tools", desc: "AI-powered document detection, OCR digitization, and plain-language explanations." },
  { icon: DollarSign, title: "Revenue & Payout Tracking", desc: "Platform fee calculations, notary payouts, and financial reporting built in." },
];

const complianceItems = [
  "Ohio ORC §147.55 — Remote Online Notarization authorization",
  "ORC §147.60-66 — Technology standards and KBA requirements",
  "ORC §147.04 — Sequential journal numbering enforcement",
  "ORC §147.66 — 10-year session recording retention infrastructure",
  "ORC §147.03 — Commission expiry validation before sessions",
  "Two-party consent recording acknowledgment",
  "Maximum 2 KBA attempts enforced per session",
  "Signer IP geolocation capture for jurisdictional compliance",
];

export default function ForNotaries() {
  usePageMeta({ title: "For Notaries — Platform & Tools", description: "Join the Notar notary network. Access RON technology, client management tools, and commission-based signing opportunities in Ohio." });

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-4">For Notary Professionals</Badge>
              <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
                Built for Modern Notaries
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                A complete platform for Ohio notaries — RON sessions, digital journals, e-seal verification,
                scheduling, AI document tools, and revenue tracking. All Ohio ORC §147 compliant.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/join">
                  <Button size="lg" className="rounded-full px-8">
                    Join the Platform <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="outline">Explore Services</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <img
                  src="/images/notary-seal.png"
                  alt="Ohio Notary Public Seal — Shane Goble"
                  className="w-72 h-72 object-contain rounded-2xl shadow-lg"
                />
                <div className="absolute -bottom-3 -right-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-lg">
                  Ohio Commissioned
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-sans text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Purpose-built tools that streamline your notary practice and keep you compliant.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ohio Compliance */}
      <section className="border-y border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">Ohio ORC §147</Badge>
              <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">
                Ohio RON Compliance Built In
              </h2>
              <p className="text-muted-foreground">
                Every feature is designed with Ohio Revised Code Chapter 147 compliance at its core.
                From KBA enforcement to journal sequencing, the platform handles compliance so you can focus on your clients.
              </p>
            </div>
            <div className="space-y-3">
              {complianceItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <p className="text-sm text-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <FileCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Ready to Modernize Your Practice?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
            Join the platform today. Set up your availability, start accepting RON appointments,
            and let us handle compliance, scheduling, and document management.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/join">
              <Button size="lg" className="rounded-full px-8">Apply to Join</Button>
            </Link>
            <Link to="/ron-info">
              <Button size="lg" variant="outline">Learn About RON</Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
