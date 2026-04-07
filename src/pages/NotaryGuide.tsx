import { Link } from "react-router-dom";
import { useEffect } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, FileText, Home, Briefcase, Scale, Heart, ChevronRight, Search, Users, Clock, CreditCard, MapPin, Monitor, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";
import { fadeUp } from "@/lib/animations";

const documentCategories = [
  {
    icon: Home,
    title: "Real Estate Documents",
    color: "text-primary",
    bgColor: "bg-primary/10",
    documents: [
      {
        name: "Deeds (Warranty, Quit Claim, Transfer on Death)",
        method: "Acknowledgment",
        whoPresent: ["All grantors (sellers/transferors) must appear before the notary"],
        witnesses: "Not required by Ohio law for deeds",
        idRequired: "Valid government-issued photo ID for each signer",
        ohioNotes: "Must include legal description of property. County recorder may have specific formatting requirements.",
        ronEligible: true,
        estimatedTime: "10-15 minutes",
        fee: "$5.00 per signature per document (Ohio statutory max)",
      },
      {
        name: "Mortgages & Refinancing Documents",
        method: "Acknowledgment",
        whoPresent: ["All borrowers must appear", "Lender representative may be present"],
        witnesses: "Not required for mortgages in Ohio",
        idRequired: "Valid government-issued photo ID for each borrower",
        ohioNotes: "Closing packages typically contain multiple documents. Each notarized signature requires a separate journal entry.",
        ronEligible: true,
        estimatedTime: "30-60 minutes (full closing package)",
        fee: "$5.00 per signature per document",
      },
      {
        name: "HELOCs & Home Equity Documents",
        method: "Acknowledgment",
        whoPresent: ["All borrowers on the account"],
        witnesses: "Not required",
        idRequired: "Valid government-issued photo ID",
        ohioNotes: "Some lenders have specific notary requirements — confirm with your lender.",
        ronEligible: true,
        estimatedTime: "20-30 minutes",
        fee: "$5.00 per signature per document",
      },
    ],
  },
  {
    icon: Scale,
    title: "Legal Documents",
    color: "text-secondary-foreground",
    bgColor: "bg-secondary",
    documents: [
      {
        name: "Power of Attorney (General, Durable, Limited)",
        method: "Acknowledgment",
        whoPresent: ["The principal (person granting power) must appear", "The agent/attorney-in-fact does NOT need to be present"],
        witnesses: "Recommended but not required in Ohio (except for Healthcare POA)",
        idRequired: "Valid government-issued photo ID for the principal",
        ohioNotes: "ORC §1337.09 governs durable POA. Principal must be mentally competent at time of signing. Notary should note any concerns about capacity.",
        ronEligible: true,
        estimatedTime: "10-15 minutes",
        fee: "$5.00 per signature",
      },
      {
        name: "Affidavits & Sworn Statements",
        method: "Jurat (Oath Required)",
        whoPresent: ["The affiant (person making the statement) must appear and swear/affirm"],
        witnesses: "Not typically required unless specified in the document",
        idRequired: "Valid government-issued photo ID",
        ohioNotes: "ORC §147.53 — Notary MUST administer an oath or affirmation. The affiant must swear or affirm that the contents are true. This is different from an acknowledgment.",
        ronEligible: true,
        estimatedTime: "10 minutes",
        fee: "$5.00 per signature",
      },
      {
        name: "Court Documents & Legal Filings",
        method: "Varies (check document)",
        whoPresent: ["The person signing the document"],
        witnesses: "As specified by the court",
        idRequired: "Valid government-issued photo ID",
        ohioNotes: "Some courts have specific requirements. Check with the clerk of courts for any special instructions.",
        ronEligible: true,
        estimatedTime: "10-15 minutes",
        fee: "$5.00 per signature",
      },
    ],
  },
  {
    icon: Heart,
    title: "Estate Planning Documents",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    documents: [
      {
        name: "Last Will & Testament",
        method: "Acknowledgment (for self-proving affidavit)",
        whoPresent: ["The testator (person making the will)", "TWO disinterested witnesses (required by Ohio law)"],
        witnesses: "2 witnesses required — they cannot be beneficiaries of the will",
        idRequired: "Valid government-issued photo ID for testator and witnesses",
        ohioNotes: "ORC §2107.03 requires 2 witnesses. The notary can notarize the self-proving affidavit attached to the will. The notary should NOT be a beneficiary or named in the will.",
        ronEligible: true,
        estimatedTime: "15-20 minutes",
        fee: "$5.00 per signature",
      },
      {
        name: "Trusts (Revocable Living Trust, Irrevocable Trust)",
        method: "Acknowledgment",
        whoPresent: ["The settlor/grantor(s) creating the trust"],
        witnesses: "Recommended but not required in Ohio",
        idRequired: "Valid government-issued photo ID for each settlor",
        ohioNotes: "Trust documents are often lengthy. Notary only notarizes the signature page(s). Ensure settlor understands they are signing the trust.",
        ronEligible: true,
        estimatedTime: "15-20 minutes",
        fee: "$5.00 per signature",
      },
      {
        name: "Healthcare Directive / Living Will",
        method: "Acknowledgment",
        whoPresent: ["The principal (person creating the directive)", "TWO witnesses (Ohio requirement)"],
        witnesses: "2 witnesses required — cannot be the attending physician, administrator of the nursing home, or the agent",
        idRequired: "Valid government-issued photo ID",
        ohioNotes: "ORC §1337.12 — Witnesses have specific disqualification criteria. Notarization is in addition to, not a substitute for, witness requirements.",
        ronEligible: true,
        estimatedTime: "15 minutes",
        fee: "$5.00 per signature",
      },
    ],
  },
  {
    icon: Briefcase,
    title: "Business Documents",
    color: "text-accent-foreground",
    bgColor: "bg-accent",
    documents: [
      {
        name: "Articles of Incorporation / Organization",
        method: "Acknowledgment",
        whoPresent: ["Incorporator(s) or organizer(s)"],
        witnesses: "Not required",
        idRequired: "Valid government-issued photo ID",
        ohioNotes: "Filed with Ohio Secretary of State. Ensure document meets SOS formatting requirements.",
        ronEligible: true,
        estimatedTime: "10 minutes",
        fee: "$5.00 per signature",
      },
      {
        name: "Operating Agreements & Contracts",
        method: "Acknowledgment",
        whoPresent: ["All signing parties to the agreement"],
        witnesses: "Not typically required",
        idRequired: "Valid government-issued photo ID for each signer",
        ohioNotes: "Verify the authority of the person signing on behalf of an entity (officer, manager, authorized signatory).",
        ronEligible: true,
        estimatedTime: "10-20 minutes",
        fee: "$5.00 per signature per document",
      },
      {
        name: "I-9 Employment Verification",
        method: "NOT a notarization",
        whoPresent: ["The employer representative who reviewed original documents"],
        witnesses: "N/A",
        idRequired: "N/A — Notary acts as Authorized Representative, not as Notary",
        ohioNotes: "IMPORTANT: A notary CANNOT notarize an I-9 form. However, a notary CAN act as an Authorized Representative to verify identity documents on behalf of the employer. This is NOT a notarial act and should NOT be recorded in the notary journal.",
        ronEligible: false,
        estimatedTime: "10 minutes",
        fee: "Not subject to notary fee caps (this is not a notarial act)",
      },
    ],
  },
];

const inPersonSteps = [
  { step: "1", title: "Bring Valid ID", desc: "Government-issued photo ID (driver's license, passport, or state ID). Must not be expired." },
  { step: "2", title: "Appear in Person", desc: "All signers must be physically present before the notary at the time of signing." },
  { step: "3", title: "Sign in Notary's Presence", desc: "Do NOT sign the document beforehand. The notary must witness the actual signing." },
  { step: "4", title: "Oath if Required", desc: "For jurats (affidavits), you'll be asked to raise your right hand and swear or affirm the document is truthful." },
  { step: "5", title: "Notary Completes Certificate", desc: "The notary applies their seal, signature, and completes the notarial certificate." },
];

const ronSteps = [
  { step: "1", title: "Schedule Your Session", desc: "Book a RON appointment online. You'll receive a link to join the video session." },
  { step: "2", title: "Prepare Your ID", desc: "Have your government-issued photo ID ready. You'll need to show it on camera." },
  { step: "3", title: "Credential Analysis", desc: "The RON platform verifies your ID through automated credential analysis." },
  { step: "4", title: "Knowledge-Based Authentication", desc: "Answer 5 identity verification questions generated from public records. You must answer 4/5 correctly." },
  { step: "5", title: "Video Signing Session", desc: "Join the live video call with the notary. Sign documents electronically while being observed." },
  { step: "6", title: "Digital Notarization", desc: "The notary applies their electronic seal and signature. The entire session is recorded per Ohio law." },
];

export default function NotaryGuide() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  usePageMeta({ title: "Ohio Notary Guide", description: "Complete guide to Ohio notarization — requirements, document types, fees, and Ohio Revised Code compliance. Everything you need to know." });

  const filteredCategories = documentCategories.map((cat) => ({
    ...cat,
    documents: cat.documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.method.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.documents.length > 0);

  return (
    <PageShell>
      {/* Nav */}

      {/* Hero */}
      <section className="bg-gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Breadcrumbs />
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
                <FileText className="mr-1 h-3 w-3" /> Comprehensive Notary Guide
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="mb-4 font-sans text-3xl font-bold text-white md:text-5xl">
              What You Need to Know
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mx-auto max-w-2xl text-white/70">
              Everything about notarization requirements, document types, ID requirements, and what to expect — all compliant with Ohio Revised Code §147.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Search */}
      <section className="border-b border-border/50 bg-muted/30 py-6">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents (e.g., 'power of attorney', 'deed', 'affidavit')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Accepted ID Section */}
      <section className="border-b border-border/50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground">Accepted Forms of Identification</h2>
          <p className="mb-4 text-sm text-muted-foreground">Per ORC §147.542, a notary must identify each signer through satisfactory evidence:</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["State Driver's License", "State ID Card", "U.S. Passport", "U.S. Military ID"].map((id) => (
              <Card key={id} className="border-border/50">
                <CardContent className="flex items-center gap-2 p-4">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{id}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>ID must be <strong>current and unexpired</strong>. Expired IDs are not acceptable for notarization.</span>
          </div>
        </div>
      </section>

      {/* Document Categories */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 font-sans text-2xl font-bold text-foreground">Document Types & Requirements</h2>
          <div className="space-y-8">
            {filteredCategories.map((category, catIdx) => (
              <motion.div key={category.title} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.div variants={fadeUp} custom={catIdx}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.bgColor}`}>
                      <category.icon className={`h-5 w-5 ${category.color}`} />
                    </div>
                    <h3 className="font-sans text-xl font-semibold text-foreground">{category.title}</h3>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.documents.map((doc, docIdx) => (
                      <AccordionItem key={docIdx} value={`${catIdx}-${docIdx}`} className="rounded-lg border border-border/50 bg-card px-4">
                        <AccordionTrigger className="text-left text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span>{doc.name}</span>
                            <Badge variant="outline" className="text-xs">{doc.method}</Badge>
                            {doc.ronEligible && <Badge className="bg-primary/10 text-primary text-xs">RON OK</Badge>}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pb-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Users className="h-3 w-3" /> Who Must Be Present</p>
                                <ul className="space-y-1 text-sm">
                                  {doc.whoPresent.map((w, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                                      <span>{w}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Shield className="h-3 w-3" /> ID Required</p>
                                <p className="text-sm">{doc.idRequired}</p>
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Users className="h-3 w-3" /> Witnesses</p>
                                <p className="text-sm">{doc.witnesses}</p>
                              </div>
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Clock className="h-3 w-3" /> Estimated Time</p>
                                <p className="text-sm">{doc.estimatedTime}</p>
                              </div>
                              <div>
                                <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><CreditCard className="h-3 w-3" /> Fee</p>
                                <p className="text-sm">{doc.fee}</p>
                              </div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="flex items-start gap-1.5 text-xs">
                                <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                                <span><strong>Ohio Note:</strong> {doc.ohioNotes}</span>
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Cannot Notarize */}
      <section className="border-b border-border/50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" /> What We Cannot Notarize
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Documents the signer does not understand",
              "Documents in a language the notary cannot communicate in (unless an interpreter is present)",
              "Documents where the signer appears coerced or not of sound mind",
              "Documents where the notary has a direct financial interest",
              "Vital records (birth certificates, death certificates) — these require certified copies from the issuing agency",
              "Photocopies of vital records presented as originals",
              "Documents with blank spaces intended to be filled after notarization",
              "I-9 forms (as a notarial act — we can act as Authorized Representative instead)",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notarial Act Education */}
      <section className="border-b border-border/50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground">Understanding Notarial Acts</h2>
          <p className="mb-6 text-sm text-muted-foreground">Ohio law authorizes several types of notarial acts. Understanding the difference helps you prepare correctly.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="mb-2 font-sans text-base font-semibold text-foreground">Acknowledgment</h3>
                <p className="text-sm text-muted-foreground mb-2">The signer acknowledges that they signed the document voluntarily and for its intended purpose. The notary verifies identity but does <strong>not</strong> administer an oath.</p>
                <p className="text-xs text-muted-foreground"><strong>Common uses:</strong> Deeds, mortgages, power of attorney, trusts</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="mb-2 font-sans text-base font-semibold text-foreground">Jurat (Oath/Affirmation)</h3>
                <p className="text-sm text-muted-foreground mb-2">The signer swears or affirms under penalty of perjury that the document's contents are true. The notary <strong>must</strong> administer an oath per ORC §147.53.</p>
                <p className="text-xs text-muted-foreground"><strong>Common uses:</strong> Affidavits, sworn statements, depositions</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="mb-2 font-sans text-base font-semibold text-foreground">Copy Certification</h3>
                <p className="text-sm text-muted-foreground mb-2">The notary certifies that a copy of a document is a true and accurate reproduction of the original. <strong>Cannot</strong> certify copies of vital records.</p>
                <p className="text-xs text-muted-foreground"><strong>Common uses:</strong> Diplomas, corporate records, licenses</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <h3 className="mb-2 font-sans text-base font-semibold text-foreground">Signature Witnessing</h3>
                <p className="text-sm text-muted-foreground mb-2">The notary observes the signing of a document without an oath. Often used for I-9 verification and employment forms.</p>
                <p className="text-xs text-muted-foreground"><strong>Common uses:</strong> I-9 forms (as Authorized Representative), general witnessing</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Witness Policy */}
      <section className="border-b border-border/50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-4 font-sans text-2xl font-bold text-foreground">Witness Requirements</h2>
          <div className="prose prose-sm text-muted-foreground max-w-none space-y-3">
            <p>Some Ohio documents legally require witnesses in addition to notarization:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Wills (ORC §2107.03):</strong> 2 disinterested witnesses required — cannot be beneficiaries</li>
              <li><strong>Healthcare Directives (ORC §1337.12):</strong> 2 witnesses required — specific disqualifications apply</li>
              <li><strong>Living Wills (ORC §2133.02):</strong> 2 witnesses required — cannot be attending physician or healthcare agent</li>
            </ul>
            <p>Notar provides witness services at <strong>$10 per witness</strong> per session. It is the signer's responsibility to arrange their own witnesses if preferred. If you need witnesses provided, please request them when booking.</p>
          </div>
        </div>
      </section>

      {/* Signer Preparation Checklist */}
      <section className="border-b border-border/50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-4 font-sans text-2xl font-bold text-foreground">Signer Preparation</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> Bring valid, unexpired government-issued photo ID</p>
                <p className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> Do NOT sign your document before the appointment</p>
                <p className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> All signers must be present (no representatives unless POA is established)</p>
                <p className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> Ensure you understand the document before signing</p>
                <p className="flex items-start gap-2"><CheckCircle className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> Bring payment method (card, Venmo, Zelle, CashApp, or cash)</p>
              </div>
            </div>
            <div>
              <h2 className="mb-4 font-sans text-2xl font-bold text-foreground">Signature by Mark</h2>
              <p className="text-sm text-muted-foreground mb-3">
                If a signer is unable to write their name, Ohio law allows "signature by mark" (typically an "X"). 
                Two witnesses must be present and sign the document attesting to the mark. The notary records the mark 
                in their journal and notes the witnesses.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Minors:</strong> Ohio law does not prohibit notarizing a minor's signature, but the notary must 
                assess the minor's understanding and willingness. Parental consent is recommended but not legally mandated 
                for the notarial act itself.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center font-sans text-2xl font-bold text-foreground">Step-by-Step Process</h2>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* In-Person */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-sans text-lg font-semibold">In-Person Notarization</h3>
              </div>
              <div className="space-y-4">
                {inPersonSteps.map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{s.step}</div>
                    <div>
                      <p className="font-medium text-foreground">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* RON */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                <h3 className="font-sans text-lg font-semibold">Remote Online Notarization (RON)</h3>
              </div>
              <div className="space-y-4">
                {ronSteps.map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{s.step}</div>
                    <div>
                      <p className="font-medium text-foreground">{s.title}</p>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Out-of-State Signers */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 font-sans text-2xl font-bold text-foreground">If You're Outside Ohio</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" /> Full Faith & Credit
                </h3>
                <p className="text-sm text-muted-foreground">
                  Under Article IV, Section 1 of the U.S. Constitution, Ohio RON notarizations are recognized in all 50 states. 
                  An Ohio notary can legally notarize documents for signers located anywhere — the signer does not need to be in Ohio.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" /> Receiving Entity Requirements
                </h3>
                <p className="text-sm text-muted-foreground">
                  While RON is legally valid nationwide, some receiving entities (county recorders, banks, government agencies) 
                  may have their own acceptance policies. Always confirm with the entity receiving your document before your session.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-lg font-semibold flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> Common Acceptance Issues
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Real estate:</strong> Most title companies accept RON; some county recorders in rural areas may not yet</li>
                  <li>• <strong>Wills:</strong> Accepted in most states but verify witness requirements in the testator's home state</li>
                  <li>• <strong>International:</strong> Foreign governments may not accept RON — check embassy requirements</li>
                  <li>• <strong>Court filings:</strong> Most courts accept, but some jurisdictions require in-person for specific filings</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-2 font-sans text-lg font-semibold flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" /> Tips for Out-of-State Signers
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Confirm your document type is eligible for RON in your state</li>
                  <li>• Have your valid government-issued photo ID ready (all 50 states' IDs are accepted)</li>
                  <li>• Check with the receiving entity that they accept Ohio RON</li>
                  <li>• <Link to="/ron-info" className="text-primary hover:underline">View our 50-state RON reference →</Link></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 font-sans text-2xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mb-6 text-muted-foreground">Book your notarization appointment in minutes</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/book"><Button size="lg" className="">Book Appointment <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
            <Link to="/ron-info"><Button size="lg" variant="outline">Learn About RON <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </PageShell>
  );
}
