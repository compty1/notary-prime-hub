import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Shield, ShieldCheck, FileCheck2, Fingerprint, Video, Lock,
  Eye, BookOpen, Scale, Award, CheckCircle2, ExternalLink
} from "lucide-react";
import securityBadge from "@/assets/security-compliance-badge.jpg";

const complianceSections = [
  {
    icon: Scale,
    title: "Ohio RON Legal Basis",
    content: [
      "NotarDex operates under the full authority of Ohio Revised Code (ORC) §147.60–147.66, which establishes the legal framework for Remote Online Notarization in the State of Ohio.",
      "Our notaries hold active commissions issued by the Ohio Secretary of State and maintain current RON authorization as required by ORC §147.63.",
      "All notarial acts performed through our platform carry the same legal validity and enforceability as traditional in-person notarizations under Ohio law.",
    ],
    links: [
      { label: "ORC §147.60 — Definitions", url: "https://codes.ohio.gov/ohio-revised-code/section-147.60" },
      { label: "ORC §147.63 — RON Authorization", url: "https://codes.ohio.gov/ohio-revised-code/section-147.63" },
      { label: "ORC §147.66 — RON Requirements", url: "https://codes.ohio.gov/ohio-revised-code/section-147.66" },
    ],
  },
  {
    icon: Fingerprint,
    title: "Identity Verification Standards",
    content: [
      "NotarDex employs a multi-layered identity verification process that meets or exceeds Ohio RON requirements:",
      "**Credential Analysis**: Government-issued photo IDs are analyzed using automated credential authentication technology to verify document authenticity, detect tampering, and confirm that the ID has not expired.",
      "**Knowledge-Based Authentication (KBA)**: Signers must successfully answer a series of identity-proofing questions generated from authoritative public and proprietary data sources. Per ORC §147.66, signers are permitted a maximum of 2 KBA attempts before the session is terminated.",
      "**Biometric Verification**: Where applicable, facial recognition technology compares the signer's live appearance to their government-issued photo ID in real time during the video session.",
    ],
  },
  {
    icon: Video,
    title: "Session Recording & Audit Trail",
    content: [
      "Per ORC §147.66, every RON session is recorded in its entirety via continuous, synchronized audio and video capture. These recordings constitute part of the official notarial record.",
      "**Retention**: All session recordings are securely stored for a minimum of 10 years from the date of the notarial act, as required by Ohio law.",
      "**Audit Trail**: Each session generates a comprehensive, tamper-evident audit log that records: signer identity verification results, timestamps of all actions, IP addresses and geolocation data, document hash values (SHA-256), and notary actions with digital seal application.",
      "**Access Controls**: Session recordings are accessible only to the commissioned notary, authorized platform administrators, and lawful authorities pursuant to valid legal process.",
    ],
  },
  {
    icon: Lock,
    title: "Data Handling & Encryption",
    content: [
      "All data transmitted through NotarDex is protected by TLS 1.2+ encryption in transit. Data at rest is encrypted using AES-256 encryption.",
      "Document integrity is verified using SHA-256 cryptographic hash values that are generated at the time of upload and validated before and after notarization to ensure no tampering has occurred.",
      "Tamper-evident digital seals are applied to all notarized documents, providing visual and cryptographic proof of authenticity that can be independently verified through our Seal Verification Portal.",
    ],
  },
  {
    icon: BookOpen,
    title: "Notary Journal & Recordkeeping",
    content: [
      "NotarDex maintains electronic notary journals in compliance with ORC §147.04 and ORC §147.551. Each journal entry includes:",
      "• Date and time of the notarial act",
      "• Type of notarial act performed (Acknowledgment, Jurat, Oath/Affirmation, etc.)",
      "• Signer's printed name, signature, and address",
      "• Type of identification used and credential analysis results",
      "• Fee charged for the notarial act",
      "• Description of the document(s) notarized",
      "Journal entries are retained for a minimum of 5 years as required by ORC §147.551.",
    ],
  },
  {
    icon: Shield,
    title: "Fee Disclosure & Transparency",
    content: [
      "NotarDex complies with Ohio statutory fee caps as established by ORC §147.08. The statutory maximum per notarial act is $5.00 per signature for traditional notarizations.",
      "RON platform fees, technology charges, and any additional service fees (travel, after-hours, witnesses) are disclosed transparently before the session begins. No hidden fees are charged.",
      "Detailed fee breakdowns are available on our Pricing page and are confirmed during the booking process before any charges are processed.",
    ],
  },
];

export default function Compliance() {
  usePageMeta({
    title: "Compliance & Legal Standards | NotarDex",
    description: "NotarDex compliance with Ohio RON law (ORC §147.60–147.66), identity verification standards, audit trail requirements, and data handling practices.",
  });

  return (
    <PageShell>
      <div className="container mx-auto max-w-4xl px-4 pt-4">
        <Breadcrumbs />
      </div>

      {/* Hero */}
      <section className="bg-sidebar-background text-white py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <ShieldCheck className="mr-1 h-3 w-3" /> Ohio Compliant
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Compliance & Legal Standards</h1>
              <p className="text-lg text-slate-300 max-w-xl">
                NotarDex is fully compliant with Ohio Revised Code §147.60–147.66 and maintains
                the highest standards of identity verification, data security, and notarial recordkeeping.
              </p>
            </div>
            <div className="flex-shrink-0">
              <img
                src={securityBadge}
                alt="NotarDex Security and Compliance Verification Badge — SOC 2 Type II, MISMO Certified, 256-bit Encryption"
                className="w-48 h-48 rounded-2xl object-cover shadow-xl"
                loading="lazy"
                width={192}
                height={192}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Sections */}
      <div className="container mx-auto max-w-4xl px-4 py-12 space-y-8">
        {complianceSections.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                {section.content.map((paragraph, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                ))}
              </div>
              {section.links && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {section.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition">
                        <ExternalLink className="mr-1 h-3 w-3" /> {link.label}
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* UPL Disclaimer */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Important Legal Disclaimer</h3>
                <p className="text-sm text-muted-foreground">
                  NotarDex is not a law firm and does not provide legal advice. Our notaries are not attorneys
                  (unless separately licensed) and cannot advise you on the legal sufficiency or consequences
                  of your documents. We notarize signatures — we do not draft, review, or validate legal documents.
                  If you need legal advice, please consult a licensed attorney. Per ORC §147.01, a notary public
                  is a public officer authorized to administer oaths, take acknowledgments, and perform other duties
                  as specified by law.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Verification */}
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            Verify our notary commission status directly with the Ohio Secretary of State
          </p>
          <a
            href="https://www.ohiosos.gov/businesses/notary-public/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <Award className="mr-2 h-4 w-4" /> Ohio SOS Notary Lookup
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </a>
        </div>

        {/* CTA */}
        <div className="text-center py-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/security">
              <Button>
                <Lock className="mr-2 h-4 w-4" /> View Security Overview
              </Button>
            </Link>
            <Link to="/terms">
              <Button variant="outline">
                <FileCheck2 className="mr-2 h-4 w-4" /> Terms & Privacy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
