import { Link } from "react-router-dom";
import { useEffect } from "react";
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const documentCategories = [
  {
    icon: Home,
    title: "Real Estate Documents",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
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
    color: "text-purple-600",
    bgColor: "bg-purple-50",
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
    color: "text-rose-600",
    bgColor: "bg-rose-50",
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
    color: "text-amber-600",
    bgColor: "bg-amber-50",
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
  useEffect(() => {
    document.title = "What Can Be Notarized? — Notar";
    return () => { document.title = "Notar — Ohio Notary Public | In-Person & RON"; };
  }, []);

  const filteredCategories = documentCategories.map((cat) => ({
    ...cat,
    documents: cat.documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.method.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.documents.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
            <div>
              <span className="block font-display text-lg font-bold text-foreground">Notar</span>
              <span className="block text-xs text-muted-foreground">Notary & Document Services</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/ron-info" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:block">RON Info</Link>
            <Link to="/notary-guide-process" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:block">Process Guide</Link>
            {user ? (
              <Link to="/portal"><Button variant="outline" size="sm">My Portal</Button></Link>
            ) : (
              <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
            )}
            <Link to="/book"><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Now</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-navy py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4 border-gold/30 bg-gold/10 text-gold-light">
                <FileText className="mr-1 h-3 w-3" /> Comprehensive Notary Guide
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-5xl">
              What You Need to Know
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mx-auto max-w-2xl text-primary-foreground/70">
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
          <h2 className="mb-6 font-display text-2xl font-bold text-foreground">Accepted Forms of Identification</h2>
          <p className="mb-4 text-sm text-muted-foreground">Per ORC §147.542, a notary must identify each signer through satisfactory evidence:</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["State Driver's License", "State ID Card", "U.S. Passport", "U.S. Military ID"].map((id) => (
              <Card key={id} className="border-border/50">
                <CardContent className="flex items-center gap-2 p-4">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">{id}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>ID must be <strong>current and unexpired</strong>. Expired IDs are not acceptable for notarization.</span>
          </div>
        </div>
      </section>

      {/* Document Categories */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 font-display text-2xl font-bold text-foreground">Document Types & Requirements</h2>
          <div className="space-y-8">
            {filteredCategories.map((category, catIdx) => (
              <motion.div key={category.title} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.div variants={fadeUp} custom={catIdx}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.bgColor}`}>
                      <category.icon className={`h-5 w-5 ${category.color}`} />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground">{category.title}</h3>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.documents.map((doc, docIdx) => (
                      <AccordionItem key={docIdx} value={`${catIdx}-${docIdx}`} className="rounded-lg border border-border/50 bg-card px-4">
                        <AccordionTrigger className="text-left text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span>{doc.name}</span>
                            <Badge variant="outline" className="text-xs">{doc.method}</Badge>
                            {doc.ronEligible && <Badge className="bg-emerald-100 text-emerald-800 text-xs">RON OK</Badge>}
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
                                      <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-500" />
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
                                <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
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

      {/* Workflow Steps */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center font-display text-2xl font-bold text-foreground">Step-by-Step Process</h2>
          <div className="grid gap-12 lg:grid-cols-2">
            {/* In-Person */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-display text-lg font-semibold">In-Person Notarization</h3>
              </div>
              <div className="space-y-4">
                {inPersonSteps.map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">{s.step}</div>
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
                <Monitor className="h-5 w-5 text-accent" />
                <h3 className="font-display text-lg font-semibold">Remote Online Notarization (RON)</h3>
              </div>
              <div className="space-y-4">
                {ronSteps.map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">{s.step}</div>
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

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mb-6 text-muted-foreground">Book your notarization appointment in minutes</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/book"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-gold-dark">Book Appointment <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
            <Link to="/ron-info"><Button size="lg" variant="outline">Learn About RON <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Notar — Ohio Notary & Document Services</p>
          <p className="mt-1">Information provided for educational purposes. Consult legal counsel for specific legal advice.</p>
        </div>
      </footer>
    </div>
  );
}
