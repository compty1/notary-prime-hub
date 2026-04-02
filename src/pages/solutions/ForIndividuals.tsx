import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { motion } from "framer-motion";
import { User, FileText, Car, Monitor, Shield, Globe, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { icon: FileText, title: "Wills & Estate Planning", desc: "Last wills, trusts, healthcare directives, and beneficiary designations notarized with proper witness coordination per Ohio law." },
  { icon: Car, title: "Vehicle Title Transfers", desc: "BMV title transfers, lien releases, and vehicle-related affidavits notarized for Ohio DMV submission." },
  { icon: Shield, title: "Affidavits & Sworn Statements", desc: "General affidavits, name change affidavits, residency declarations, and other sworn documents with proper jurat certificates." },
  { icon: Globe, title: "Immigration Documents", desc: "I-864 affidavits of support, translation certifications, passport applications, and consulate-required notarizations." },
  { icon: Monitor, title: "RON from Home", desc: "Complete your notarization from anywhere via secure video call. Ohio-authorized Remote Online Notarization — no travel needed." },
  { icon: User, title: "ID Verification & KBA", desc: "Government-issued ID verification and Knowledge-Based Authentication for RON sessions. Secure identity confirmation every time." },
];

const complianceItems = [
  "Ohio ORC §147 — Full compliance with notary public standards",
  "ORC §2107 — Will execution and witness requirements",
  "ORC §2133 — Advance directive and living will standards",
  "ORC §1337.12 — Power of attorney proper execution",
  "ORC §4505 — Vehicle title transfer notarization requirements",
  "Federal I-9 and I-864 notarization standards",
  "Knowledge-Based Authentication (KBA) for RON identity verification",
  "Signer awareness and willingness confirmation per Ohio law",
];

export default function ForIndividuals() {
  usePageMeta({ title: "For Individuals — Personal Document Services", description: "Personal notarization services in Ohio — wills, vehicle titles, affidavits, immigration documents, and RON from home." });

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-4">For Individuals</Badge>
              <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
                Personal Document Services Made Simple
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                Wills, vehicle titles, affidavits, immigration forms — whatever you need notarized,
                we make it easy. In-person in Columbus or remotely from anywhere via RON.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/book">
                  <Button size="lg" className="rounded-full px-8">Book Appointment <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link to="/ron-check">
                  <Button size="lg" variant="outline">Check RON Eligibility</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-lg">
                <User className="mx-auto mb-4 h-16 w-16 text-primary" />
                <p className="text-center text-lg font-semibold text-foreground">Fast & Affordable</p>
                <p className="mt-2 text-center text-sm text-muted-foreground">Starting at $5 per notarization</p>
                <div className="absolute -bottom-3 -right-3 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-lg">
                  In-Person & RON
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-sans text-3xl font-bold text-foreground">Personal Notarization Services</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">From everyday documents to life's most important paperwork — we're here to help.</p>
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
              <Badge variant="outline" className="mb-4">Ohio Compliance</Badge>
              <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Legally Sound, Every Time</h2>
              <p className="text-muted-foreground">Every notarization meets Ohio Revised Code requirements. Proper certificates, ID verification, and journal records — so your documents are accepted everywhere.</p>
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
          <User className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">Book an in-person appointment in Columbus or start a remote notarization session from anywhere.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="rounded-full px-8">Book Now</Button></Link>
            <Link to="/fee-calculator"><Button size="lg" variant="outline">View Pricing</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
