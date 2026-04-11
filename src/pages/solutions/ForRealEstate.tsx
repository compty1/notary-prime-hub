import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Icon3D, FEATURE_3D_ICON } from "@/lib/icon3dMap";

const features = [
  { icon3d: FEATURE_3D_ICON.closing, title: "Closing Documents", desc: "Deeds, mortgages, settlement statements, and all closing documents notarized on-site or via RON for seamless transactions." },
  { icon3d: FEATURE_3D_ICON.titleWork, title: "Deed Transfers & Title Work", desc: "Warranty deeds, quitclaim deeds, title affidavits, and lien releases notarized with proper Ohio recording requirements." },
  { icon3d: FEATURE_3D_ICON.mortgage, title: "Mortgage & Refinance", desc: "Complete loan signing packages — refinances, HELOCs, reverse mortgages, and modifications with certified signing agent services." },
  { icon3d: FEATURE_3D_ICON.ron, title: "RON for Remote Closings", desc: "Ohio-authorized Remote Online Notarization for out-of-state buyers, sellers, or anyone who can't attend in person." },
  { icon3d: FEATURE_3D_ICON.multiSigner, title: "Multi-Signer Coordination", desc: "We coordinate schedules for transactions involving multiple signers, witnesses, and parties across different locations." },
  { icon3d: FEATURE_3D_ICON.bulkSigning, title: "Bulk Signing Packages", desc: "Volume pricing for title companies, brokerages, and lenders with recurring notarization needs. Dedicated account management." },
];

const complianceItems = [
  "Ohio ORC §5301 — Deed execution and recording requirements",
  "ORC §147 — Notary public standards for real estate transactions",
  "ORC §5301.01 — Acknowledgment requirements for conveyances",
  "ORC §1337.60 — Remote notarization standards for real property",
  "County recorder formatting and margin requirements",
  "NNA-certified signing agent protocols for loan packages",
  "Title company integration and document return procedures",
  "E-recording compatibility for Franklin County and surrounding areas",
];

export default function ForRealEstate() {
  usePageMeta({ title: "For Real Estate — Closings & Title Services", description: "Professional notarization for real estate closings, deed transfers, and loan signings in Ohio. In-person and RON available." });

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-4">For Real Estate Professionals</Badge>
              <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">Real Estate Closings & Loan Signings</h1>
              <p className="mb-6 text-lg text-muted-foreground">From purchase agreements to refinance packages, we handle the full spectrum of real estate notarization — on-site at the closing table or remotely via Ohio-authorized RON.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/book"><Button size="lg" className="rounded-full px-8">Schedule a Closing <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <Link to="/loan-signing"><Button size="lg" variant="outline">Loan Signing Services</Button></Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-lg">
                <Icon3D src={FEATURE_3D_ICON.realEstate} alt="Real estate closing" className="mx-auto mb-4 h-[184px] w-[184px]" />
                <p className="text-center text-lg font-semibold text-foreground">Closing Table Ready</p>
                <p className="mt-2 text-center text-sm text-muted-foreground">NNA-certified signing agent</p>
                <div className="absolute -bottom-3 -right-3 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-lg">Mobile & RON</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-sans text-3xl font-bold text-foreground">Real Estate Notarization Services</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Complete notarization support for every stage of a real estate transaction.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="mb-4"><Icon3D src={f.icon3d} alt={f.title} className="h-[129px] w-[129px]" /></div>
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
              <Badge variant="outline" className="mb-4">Ohio Real Estate Compliance</Badge>
              <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Recording-Ready Notarization</h2>
              <p className="text-muted-foreground">Every document is notarized to meet Ohio county recorder requirements — proper acknowledgments, correct formatting, and compliant e-seals.</p>
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
          <Icon3D src={FEATURE_3D_ICON.realEstate} alt="Ready to close" className="mx-auto mb-4 h-[147px] w-[147px]" />
          <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Ready to Close?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">Schedule a closing, request a loan signing agent, or set up a volume account for your title company or brokerage.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="rounded-full px-8">Book a Closing</Button></Link>
            <Link to="/fee-calculator"><Button size="lg" variant="outline">View Pricing</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
