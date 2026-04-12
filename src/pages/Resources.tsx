import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FileText, Shield, Monitor, Scale, DollarSign, HelpCircle, Image, BookOpen, MapPin, Laptop, Gavel, UserCheck, Search, Globe, CheckCircle, ExternalLink } from "lucide-react";
import { DOCUMENT_ANATOMY } from "@/components/AnatomyDiagram";
import { ProcessGuide } from "@/components/ProcessGuide";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const resources = [
  {
    title: "How to Notarize a Power of Attorney in Ohio",
    desc: "Step-by-step guide for notarizing POA documents including durable, springing, and healthcare powers of attorney under Ohio law.",
    icon: Scale,
    link: "/notary-guide",
    category: "Guide",
  },
  {
    title: "Remote Online Notarization (RON) Explained",
    desc: "Learn how Ohio's RON framework works under ORC §147.65-.66, including KBA requirements, session recording, and interstate acceptance.",
    icon: Monitor,
    link: "/ron-info",
    category: "Education",
  },
  {
    title: "Ohio Notary Fee Schedule & Calculator",
    desc: "Understand Ohio's statutory fee caps (ORC §147.08), travel fees, after-hours surcharges, and get an instant estimate for your signing.",
    icon: DollarSign,
    link: "/fee-calculator",
    category: "Tool",
  },
  {
    title: "Notarial Certificates Guide",
    desc: "Comprehensive Ohio reference for Acknowledgments, Jurats, Copy Certifications, Signature Witnessing, and RON modifications with sample formats.",
    icon: Gavel,
    link: "/notary-certificates",
    category: "Reference",
  },
  {
    title: "ID Requirements for Notarization",
    desc: "Accepted forms of identification, expired ID policies, and special requirements for RON sessions including credential analysis.",
    icon: Shield,
    link: "/notary-guide#id-requirements",
    category: "Reference",
  },
  {
    title: "The Notarization Process Step by Step",
    desc: "From booking to e-seal — learn exactly what happens during an in-person or remote notarization appointment.",
    icon: HelpCircle,
    link: "/notary-guide-process",
    category: "Guide",
  },
  {
    title: "Document Templates",
    desc: "Free editable templates for common notary documents including affidavits, acknowledgments, powers of attorney, and more.",
    icon: FileText,
    link: "/templates",
    category: "Tool",
  },
  {
    title: "Signer Rights",
    desc: "Know your rights during notarization — understand what a notary can and cannot do, and how you are protected under Ohio law.",
    icon: UserCheck,
    link: "/signer-rights",
    category: "Education",
  },
  {
    title: "RON Eligibility Checker",
    desc: "Quickly check whether your document is eligible for Remote Online Notarization under Ohio law.",
    icon: CheckCircle,
    link: "/ron-eligibility",
    category: "Tool",
  },
  {
    title: "Find a Notary Near You",
    desc: "Search our directory of Ohio-commissioned notaries by location, availability, and specialization.",
    icon: Search,
    link: "/notary-directory",
    category: "Tool",
  },
  {
    title: "Verify a Notary Seal",
    desc: "Confirm the authenticity of a notarized document by verifying the notary's seal, commission number, and status.",
    icon: Globe,
    link: "/verify-seal",
    category: "Tool",
  },
];

export default function Resources() {
  usePageMeta({ title: "Notary Resources & Guides", description: "Free notary resources, Ohio compliance guides, document preparation tips, and helpful tools for signers and notaries." });

  return (
    <PageShell>
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <Breadcrumbs />
        <h1 className="mb-4 font-sans text-3xl font-bold text-foreground">Notary Resources & Guides</h1>
        <p className="mb-10 max-w-2xl text-muted-foreground">
          Educational resources to help you understand Ohio notarization requirements, prepare for your appointment, and make informed decisions about your document needs.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((r, i) => (
            <Link key={i} to={r.link} className="group">
              <Card className="h-full border-border/50 transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <r.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{r.category}</Badge>
                  </div>
                  <h2 className="font-sans text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {r.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Document Examples Section */}
        <DocumentExamplesSection />

        {/* Process Guides */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ohio Notary Process Guides</h2>
          <p className="text-muted-foreground mb-6">Step-by-step instructions for mobile and remote online notarization in Ohio. Print-friendly.</p>
          <ProcessGuide mode="both" />
        </div>
      </div>
    </PageShell>
  );
}

/** Document Examples gallery with lightbox */
const documentExamples = [
  { key: "acknowledgment", title: "Acknowledgment Certificate", desc: "Most common Ohio notarial act — signer acknowledges voluntary execution" },
  { key: "jurat", title: "Jurat Certificate", desc: "Oath/affirmation — signer swears truthfulness before notary" },
  { key: "copy_certification", title: "Copy Certification", desc: "Notary certifies a copy is true and accurate" },
  { key: "poa", title: "Power of Attorney", desc: "POA acknowledgment with notarized signature" },
  { key: "corporate", title: "Corporate Acknowledgment", desc: "Officer signs on behalf of a corporation" },
  { key: "signature_by_mark", title: "Signature by Mark", desc: "Special procedure when signer cannot write" },
  { key: "vehicle_title", title: "Vehicle Title", desc: "Ohio BMV title transfer with notarization" },
  { key: "self_proving_affidavit", title: "Self-Proving Affidavit", desc: "Attached to a Last Will & Testament" },
  { key: "oath_affirmation", title: "Oath / Affirmation Certificate", desc: "Signer swears or affirms before notary under oath" },
  { key: "certificate_correction", title: "Certificate of Correction", desc: "Corrective statement referencing original notarial act" },
];

function DocumentExamplesSection() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const anatomy = selectedDoc ? DOCUMENT_ANATOMY[selectedDoc] : null;

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        <Image className="inline h-6 w-6 mr-2 text-primary" />
        Ohio Document Examples
      </h2>
      <p className="text-muted-foreground mb-6">
        Sample notarized Ohio documents with anatomy callouts. All examples are marked "SAMPLE — NOT A LEGAL DOCUMENT."
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {documentExamples.map(doc => {
          const data = DOCUMENT_ANATOMY[doc.key];
          if (!data) return null;
          return (
            <button
              key={doc.key}
              className="text-left group"
              onClick={() => setSelectedDoc(doc.key)}
            >
              <Card className="border-border/50 overflow-hidden transition-all hover:border-primary/30 hover:shadow-md">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={data.image}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  {/* SAMPLE watermark overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-destructive/20 font-bold text-2xl tracking-widest -rotate-45 select-none uppercase">
                      SAMPLE
                    </span>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-semibold text-foreground">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{doc.desc}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{documentExamples.find(d => d.key === selectedDoc)?.title}</DialogTitle>
            <DialogDescription>
              Sample document anatomy with annotated callouts. This is not a legal document.
            </DialogDescription>
          </DialogHeader>
          {anatomy && (
            <div className="space-y-4">
              <img src={anatomy.image} alt="Document example" className="w-full rounded-lg border" loading="lazy" />
              <div className="space-y-2">
                {anatomy.callouts.map(c => (
                  <div key={c.id} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{c.id}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{c.label}</p>
                        {c.orc && <Badge variant="outline" className="text-[9px] font-mono">{c.orc}</Badge>}
                        {c.link && (
                          <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
