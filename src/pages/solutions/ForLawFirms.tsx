import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Icon3D, FEATURE_3D_ICON } from "@/lib/icon3dMap";
import { ZoomConsultCTA } from "@/components/ZoomConsultCTA";

const features = [
  { icon3d: FEATURE_3D_ICON.affidavit, title: "Affidavits & Depositions", desc: "Sworn statements, affidavits, and deposition transcripts notarized with proper jurat or acknowledgment certificates." },
  { icon3d: FEATURE_3D_ICON.poa, title: "Power of Attorney", desc: "General, durable, limited, and healthcare POA documents — executed per Ohio ORC §1337.60 requirements." },
  { icon3d: FEATURE_3D_ICON.court, title: "Court Filings & Discovery", desc: "Verified pleadings, interrogatory responses, and discovery documents notarized for court submission deadlines." },
  { icon3d: FEATURE_3D_ICON.witness, title: "Witness Coordination", desc: "Impartial witnesses provided for document executions requiring attestation — estate plans, wills, and healthcare directives." },
  { icon3d: FEATURE_3D_ICON.journal, title: "Digital Journal & Audit Trail", desc: "Complete notarial records with sequential journal entries, signer ID details, and e-seal verification for litigation support." },
  { icon3d: FEATURE_3D_ICON.retainer, title: "Volume & Retainer Pricing", desc: "Dedicated notary availability for firms with recurring needs. Flat-rate retainer packages and priority scheduling." },
];

const complianceItems = [
  "Ohio ORC §147 — Full compliance with notary public standards",
  "ORC §2319.02 — Proper administration of oaths and affirmations",
  "ORC §1337.60 — Power of attorney execution requirements",
  "UPL Boundary — Notary does not provide legal advice or draft legal documents",
  "Attorney-client privilege safeguards — notary process respects confidentiality",
  "Proper certificate selection — jurat vs. acknowledgment per document type",
  "Credible witness provisions per ORC §147.53 when ID is unavailable",
  "10-year record retention for RON session recordings per ORC §147.66",
];

export default function ForLawFirms() {
  usePageMeta({ title: "For Law Firms — Legal Document Notarization", description: "Professional notarization services for law firms in Ohio. Affidavits, depositions, POA, and court filings. Volume pricing available." });

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-4">For Law Firms</Badge>
              <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
                Legal Document Notarization at Scale
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                Reliable, compliant notarization for affidavits, depositions, powers of attorney, and court filings.
                On-site at your office, mobile to your client, or via Remote Online Notarization.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/book">
                  <Button size="lg" className="rounded-full px-8">Schedule Notarization <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="outline">Explore Services</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-lg">
                <Icon3D src={FEATURE_3D_ICON.lawFirm} alt="Law firm notarization" className="mx-auto mb-4 h-[184px] w-[184px]" />
                <p className="text-center text-lg font-semibold text-foreground">Trusted by Ohio Law Firms</p>
                <p className="mt-2 text-center text-sm text-muted-foreground">Volume pricing & priority scheduling</p>
                <div className="absolute -bottom-3 -right-3 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-lg">
                  Retainer Available
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-sans text-3xl font-bold text-foreground">Legal Notarization Services</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Purpose-built for the demands of legal practice — deadlines, precision, and compliance.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <Icon3D src={f.icon3d} alt={f.title} className="h-[129px] w-[129px]" />
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

      <section className="border-y border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">Legal Compliance</Badge>
              <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Compliant & UPL-Safe</h2>
              <p className="text-muted-foreground">We maintain strict boundaries between notarization services and the practice of law. Our notaries are trained in proper certificate selection and oath administration.</p>
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

      <section className="py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <ZoomConsultCTA />
        </div>
      </section>

            <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Icon3D src={FEATURE_3D_ICON.lawFirm} alt="Partner with us" className="mx-auto mb-4 h-[147px] w-[147px]" />
          <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Partner With Us</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">Set up a firm account for priority scheduling, volume pricing, and dedicated notary availability for your practice.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="rounded-full px-8">Book Notarization</Button></Link>
            <Link to="/fee-calculator"><Button size="lg" variant="outline">View Pricing</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
