import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Phone } from "lucide-react";
import { Icon3D, FEATURE_3D_ICON } from "@/lib/icon3dMap";

const features = [
  { icon3d: FEATURE_3D_ICON.bedside, title: "Bedside & ICU Notarization", desc: "Mobile notary services directly at the patient's bedside — including ICU, emergency, and recovery rooms. No patient transport required." },
  { icon3d: FEATURE_3D_ICON.hipaa, title: "HIPAA-Aware Process", desc: "Our notarization workflow is designed with healthcare privacy in mind. We never access, copy, or retain protected health information." },
  { icon3d: FEATURE_3D_ICON.healthcare, title: "Healthcare Directives & POA", desc: "Advance directives, living wills, healthcare powers of attorney, and DNR acknowledgments notarized on-site when time is critical." },
  { icon3d: FEATURE_3D_ICON.urgent, title: "Urgent & After-Hours Availability", desc: "Same-day and after-hours notarization for time-sensitive medical documents. Available evenings and weekends for critical situations." },
  { icon3d: FEATURE_3D_ICON.witness, title: "Witness Coordination", desc: "We provide impartial witnesses when required by Ohio law (ORC §2133.02) for healthcare directives and living wills." },
  { icon3d: FEATURE_3D_ICON.ron, title: "Remote Notarization Option", desc: "For patients who can participate via video, Ohio-authorized RON sessions allow notarization without an in-person visit." },
];

const useCases = [
  "Patient admission and consent forms",
  "Advance directives & living wills",
  "Healthcare power of attorney (HCPOA)",
  "Organ and tissue donor designations",
  "Insurance and billing authorizations",
  "Guardianship and conservatorship papers",
  "Discharge and facility transfer documents",
  "FMLA and disability certification forms",
  "Patient financial responsibility agreements",
  "Medical records release authorizations",
];

const complianceItems = [
  "Ohio ORC §147 — Full compliance with Ohio notary standards for all healthcare facility notarizations",
  "ORC §2133.02 — Witness requirements for advance directives and living wills properly observed",
  "ORC §1337.12 — Healthcare power of attorney execution requirements met",
  "HIPAA Privacy Rule — Notary process designed to avoid accessing protected health information",
  "Patient capacity assessment — Notary confirms signer awareness and willingness per Ohio law",
  "Facility coordination protocol — We work with nursing staff to schedule around patient care needs",
  "Two-party consent for RON recordings — Full compliance with Ohio recording requirements",
  "Credentialed facility access — Background-checked, insured, and facility-approved notaries",
];

export default function ForHospitals() {
  usePageMeta({ title: "For Hospitals — Bedside Notary Services", description: "Professional bedside and facility notarization services for hospitals and healthcare facilities in Ohio. HIPAA-aware, ORC §147 compliant." });

  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-4">For Healthcare Facilities</Badge>
              <h1 className="mb-4 font-sans text-4xl font-bold text-foreground md:text-5xl">
                Bedside Notarization for Hospitals & Care Facilities
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                When patients can't come to the notary, we come to them. Professional, HIPAA-aware notarization
                at the bedside — advance directives, powers of attorney, and critical documents handled with
                urgency and compassion. Ohio ORC §147 compliant.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/book">
                  <Button size="lg" className="rounded-full px-8">Schedule Bedside Visit <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link to="/services">
                  <Button size="lg" variant="outline">View All Services</Button>
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center">
              <div className="relative rounded-2xl border border-border bg-card p-8 shadow-lg">
                <Icon3D src={FEATURE_3D_ICON.healthcare} alt="Healthcare notarization" className="mx-auto mb-4 h-[184px] w-[184px]" />
                <p className="text-center text-lg font-semibold text-foreground">Compassionate. Professional. Compliant.</p>
                <p className="mt-2 text-center text-sm text-muted-foreground">Serving Columbus & Franklin County hospitals</p>
                <div className="absolute -bottom-3 -right-3 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-lg">
                  Same-Day Available
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 font-sans text-3xl font-bold text-foreground">Healthcare Notarization Services</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Specialized notary services designed for the unique needs of hospitals, nursing facilities, and healthcare providers.</p>
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

      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">Common Use Cases</Badge>
              <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Documents We Notarize at Healthcare Facilities</h2>
              <p className="mb-6 text-muted-foreground">From emergency advance directives to routine administrative forms, we handle the full range of healthcare-related documents that require notarization under Ohio law.</p>
              <Link to="/fee-calculator"><Button variant="outline">View Pricing</Button></Link>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {useCases.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <p className="text-sm text-foreground">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">Compliance & Privacy</Badge>
              <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">HIPAA-Aware & Ohio Compliant</h2>
              <p className="text-muted-foreground">Our healthcare notarization process is built to respect patient privacy and meet every Ohio statutory requirement. We coordinate with facility staff and follow all credentialing protocols.</p>
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
          <Icon3D src={FEATURE_3D_ICON.bedside} alt="Bedside notarization" className="mx-auto mb-4 h-[147px] w-[147px]" />
          <h2 className="mb-4 font-sans text-3xl font-bold text-foreground">Need a Notary at Your Facility?</h2>
          <p className="mx-auto mb-8 max-w-lg text-muted-foreground">We work with hospital administration, social workers, and nursing staff to coordinate bedside notarization visits. Contact us to set up a facility account or schedule a visit.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/book"><Button size="lg" className="rounded-full px-8">Book a Bedside Visit</Button></Link>
            <a href="tel:6143006890"><Button size="lg" variant="outline"><Phone className="mr-2 h-4 w-4" /> Call (614) 300-6890</Button></a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
