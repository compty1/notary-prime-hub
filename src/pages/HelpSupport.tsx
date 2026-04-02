import { usePageMeta } from "@/hooks/usePageMeta";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone,
  Mail,
  CalendarCheck,
  FileText,
  Shield,
  Monitor,
  DollarSign,
  HelpCircle,
  Clock,
  MapPin,
  Scale,
  BookOpen,
  Stamp,
  Users,
  Pen,
  Copy,
  Eye,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { BRAND } from "@/lib/brand";

/* ─── Service Use-Case Data ──────────────────────────────────── */

const serviceUseCases = [
  {
    title: "Acknowledgments",
    icon: Pen,
    description: "The signer acknowledges to the notary that they signed the document voluntarily. The notary verifies identity but does not need to witness the actual signing.",
    examples: [
      "Signing a deed to transfer ownership of your home to a family member or buyer at closing",
      "Executing a durable power of attorney so a trusted person can manage your finances if you become incapacitated",
      "Signing a revocable living trust to transfer assets and avoid probate for your heirs",
      "Recording a mortgage or deed of trust when refinancing your home loan",
      "Signing a prenuptial or postnuptial agreement before or during marriage",
      "Executing a quitclaim deed to add or remove a spouse from property title after marriage or divorce",
    ],
  },
  {
    title: "Jurats (Sworn Statements)",
    icon: Scale,
    description: "The signer must sign in the notary's presence and swear or affirm under oath that the contents of the document are true. Required for documents where truthfulness is legally critical.",
    examples: [
      "Filing a sworn affidavit for a court case — such as an affidavit of heirship, small estate affidavit, or affidavit of service",
      "Completing a financial affidavit for divorce proceedings or child custody disputes",
      "Signing a sworn statement for an insurance claim after a car accident, theft, or property damage",
      "Submitting a sworn declaration to U.S. Citizenship and Immigration Services (USCIS) for a visa or green card application",
      "Providing a sworn witness statement for a workers' compensation claim or workplace investigation",
      "Executing a sworn contractor's affidavit for a construction lien waiver",
    ],
  },
  {
    title: "Oaths & Affirmations",
    icon: Shield,
    description: "The notary administers a verbal oath (religious) or affirmation (secular) binding the person to tell the truth. Often used in conjunction with jurats but can be standalone.",
    examples: [
      "Swearing in a witness before a deposition transcript is signed in a civil or criminal litigation",
      "Administering an oath to a newly elected officer of a homeowners association (HOA) or nonprofit board",
      "Swearing in a court-appointed guardian ad litem or conservator before they assume duties",
      "Administering an oath for a public official taking office at municipal or county level in Ohio",
      "Providing an affirmation for a signer whose religious beliefs prohibit swearing oaths (e.g., Quaker affirmation)",
      "Swearing in a corporate officer or board member during annual organizational meetings",
    ],
  },
  {
    title: "Remote Online Notarization (RON)",
    icon: Monitor,
    description: "A fully digital notarization session conducted via secure audio-video link. Identity is verified through KBA and credential analysis. Authorized under Ohio ORC §147.65–.66.",
    examples: [
      "You're an Ohio resident traveling abroad and need to notarize a power of attorney for a real estate closing happening while you're away",
      "A deployed military service member needs to execute legal documents but cannot access a notary on base",
      "A hospital patient or homebound individual who cannot travel to a notary office needs healthcare directive documents notarized",
      "A multi-state real estate transaction where buyers and sellers are in different states and need to close remotely",
      "An out-of-state college student needs to sign and notarize financial aid or parental consent documents",
      "A business owner with partners in different cities needs operating agreements or amendments notarized simultaneously",
    ],
  },
  {
    title: "Copy Certification",
    icon: Copy,
    description: "The notary certifies that a photocopy is a true, complete, and accurate reproduction of an original document. Note: notaries cannot certify copies of vital records (birth/death certificates).",
    examples: [
      "Certifying a copy of a college diploma or professional license for a job application or employer verification",
      "Creating a certified copy of a passport for a rental application, bank account opening, or background check",
      "Certifying copies of corporate bylaws or articles of incorporation for a bank or government filing",
      "Providing a certified copy of a marriage certificate (non-vital record copy) for insurance enrollment or name change",
      "Certifying a copy of a professional certification (CPA, nursing license, etc.) for continuing education or reciprocity in another state",
      "Creating certified copies of military discharge papers (DD-214) for veteran benefits applications",
    ],
  },
  {
    title: "Signature Witnessing",
    icon: Eye,
    description: "The notary serves as an impartial witness to the signing of a document. The signer's identity is verified, and the notary confirms they observed the signature being applied.",
    examples: [
      "Witnessing the signing of an I-9 Employment Eligibility Verification form for a new hire at a small business without an HR department",
      "Witnessing the execution of a last will and testament that requires independent, disinterested witnesses under Ohio law",
      "Serving as a witness for a vehicle title transfer or bill of sale between private parties",
      "Witnessing a medical consent form for a clinical trial or surgical procedure that requires an independent observer",
      "Witnessing the signing of adoption papers or consent-to-adoption documents",
      "Observing the execution of a living will or advance healthcare directive alongside required witnesses",
    ],
  },
  {
    title: "Loan Signing (NSA Services)",
    icon: FileText,
    description: "A Notary Signing Agent (NSA) guides borrowers through mortgage and loan document packages, ensuring all signatures, initials, and dates are correctly placed, then notarizes the required documents.",
    examples: [
      "Closing on a home purchase — the NSA walks you through the deed of trust, promissory note, closing disclosure, and all rider documents",
      "Refinancing your mortgage to secure a lower interest rate — the full refinance package typically includes 100–150 pages",
      "Home equity line of credit (HELOC) signing at your kitchen table with a mobile NSA for convenience",
      "Reverse mortgage closing for a senior homeowner, where the NSA ensures all HUD-required counseling acknowledgments are signed",
      "Commercial real estate loan closing for a small business purchasing office or retail space",
      "Construction loan draw signing where periodic notarized documents release funds at each build milestone",
    ],
  },
  {
    title: "Apostille & International Authentication",
    icon: Globe,
    description: "An apostille (issued by the Ohio Secretary of State) authenticates a notarized document for use in countries that are members of the Hague Apostille Convention. Non-Hague countries require consular legalization.",
    examples: [
      "Authenticating a notarized power of attorney for use in Germany, France, or another Hague Convention country for property transactions",
      "Apostilling a certified diploma or transcript for a student enrolling in a foreign university",
      "Authenticating corporate documents (articles of incorporation, board resolutions) for establishing a subsidiary abroad",
      "Apostilling a birth certificate or marriage certificate copy for a dual-citizenship or immigration application",
      "Preparing documents for consular legalization for countries like China, Saudi Arabia, or UAE that are not Hague members",
      "Authenticating an FBI background check for a work visa or teaching position in South Korea, Japan, or the Middle East",
    ],
  },
];

/* ─── FAQ Data ────────────────────────────────────────────────── */

const faqCategories = [
  {
    label: "General",
    icon: HelpCircle,
    faqs: [
      {
        q: "What is notarization and why do I need it?",
        a: "Notarization is an official process where a commissioned notary public verifies the identity of a document signer, ensures they are signing willingly and knowingly, and applies a notarial seal. Many legal, financial, and real estate documents require notarization to be considered valid — including powers of attorney, deeds, affidavits, and loan documents.",
      },
      {
        q: "What areas do you serve?",
        a: "We serve all of Franklin County and the greater Columbus, Ohio metropolitan area for in-person notarization. For Remote Online Notarization (RON), we can serve clients located anywhere — Ohio law permits RON for signers in any U.S. state or abroad, as long as the notary is commissioned in Ohio.",
      },
      {
        q: "Do I need an appointment, or do you accept walk-ins?",
        a: "We strongly recommend booking an appointment to guarantee availability and minimize wait times. You can book online 24/7 through our booking page. Same-day and next-day appointments are often available.",
      },
      {
        q: "What are your hours of operation?",
        a: "Our standard hours are Monday–Friday, 9 AM – 6 PM EST. We also offer evening and weekend appointments by request (after-hours surcharge may apply). RON sessions can be scheduled with greater flexibility.",
      },
      {
        q: "How long does a notarization appointment take?",
        a: "Most standard notarizations take 10–20 minutes. More complex signings — such as loan closings or multi-document packages — may take 30–60 minutes. RON sessions include additional time for identity verification (KBA + credential analysis).",
      },
    ],
  },
  {
    label: "Identity & Documents",
    icon: Shield,
    faqs: [
      {
        q: "What forms of ID do you accept?",
        a: "We accept current (unexpired) government-issued photo IDs including: U.S. driver's license or state ID, U.S. passport or passport card, U.S. military ID, and foreign passports. The ID must contain a photograph, physical description, and signature. Expired IDs are not accepted per Ohio law.",
      },
      {
        q: "What documents can be notarized?",
        a: "Most legal documents can be notarized, including: powers of attorney, affidavits, deeds, contracts, loan documents, medical directives, wills (with witness requirements), business formation docs, and more. A notary cannot notarize vital records (birth/death certificates) or documents without a signer present.",
      },
      {
        q: "What documents cannot be notarized?",
        a: "A notary cannot notarize: documents the signer has not read or does not understand, documents without a signer physically or virtually present, vital records issued by government agencies, incomplete documents with blank fields, or any document where the notary suspects fraud or coercion.",
      },
      {
        q: "Do I need to sign the document before my appointment?",
        a: "No — do NOT sign the document in advance. The notary must witness your signature as part of the notarization process. If the document is already signed, the notary may not be able to notarize it.",
      },
      {
        q: "Can I notarize a document for someone who is not present?",
        a: "No. Ohio law requires the signer to be personally present before the notary — either in person or via an approved audio-video connection for RON sessions. Third parties cannot sign on behalf of someone else unless they hold a valid power of attorney.",
      },
    ],
  },
  {
    label: "Remote Online Notarization (RON)",
    icon: Monitor,
    faqs: [
      {
        q: "What is Remote Online Notarization (RON)?",
        a: "RON allows you to have documents notarized via a secure, live audio-video session from anywhere. Ohio authorizes RON under ORC §147.65–.66. The session is recorded, and identity is verified through knowledge-based authentication (KBA) and credential analysis.",
      },
      {
        q: "What do I need for a RON session?",
        a: "You'll need: a computer or tablet with a webcam and microphone, a stable internet connection, a valid government-issued photo ID, and the document(s) to be notarized in digital format (PDF). We'll guide you through a brief technology check before the session begins.",
      },
      {
        q: "Is RON legal and accepted everywhere?",
        a: "RON performed by an Ohio-commissioned notary is legal under Ohio law and widely accepted across the United States. However, some states, counties, or specific institutions may have their own acceptance policies. We recommend confirming with the receiving party if you're unsure.",
      },
      {
        q: "What is KBA (Knowledge-Based Authentication)?",
        a: "KBA is an identity verification step required for RON sessions. You'll be asked a series of personal questions (e.g., about past addresses, vehicles, loans) generated from public and credit records. You must answer at least 4 out of 5 questions correctly within 2 minutes. This is handled securely within the signing platform.",
      },
      {
        q: "What happens if I fail KBA?",
        a: "If you fail the initial KBA attempt, you may have one additional attempt during the same session. If you fail again, the session cannot proceed, and you will not be charged for the notarization. You may reschedule and try again after 24 hours.",
      },
      {
        q: "Are RON sessions recorded?",
        a: "Yes. Ohio law requires that the entire RON session be recorded via audio and video. The recording is securely stored for a minimum of 10 years as required by ORC §147.66(B)(2). Only the notary and authorized parties have access to the recording.",
      },
    ],
  },
  {
    label: "Pricing & Payment",
    icon: DollarSign,
    faqs: [
      {
        q: "How much does notarization cost?",
        a: "Ohio law caps notarization fees at $5 per notarial act and $2 per oath/affirmation (ORC §147.08). However, additional fees may apply for travel, after-hours service, document preparation, RON technology, and multi-signer sessions. Use our Fee Calculator for an accurate estimate.",
      },
      {
        q: "Do you charge for travel?",
        a: "Travel within 5 miles of our office is complimentary. Beyond that, a mileage-based travel fee applies (typically $0.655/mile per IRS standard rates). The exact travel fee is calculated and shown during booking.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) processed securely through Stripe. Payment is collected at the time of booking or upon appointment completion.",
      },
      {
        q: "Is there a cancellation fee?",
        a: "Cancellations made 24+ hours before the appointment are free of charge. Cancellations within 24 hours or no-shows may be subject to a cancellation fee. Please contact us as soon as possible if you need to reschedule.",
      },
      {
        q: "Do you offer volume discounts for businesses?",
        a: "Yes! We offer discounted per-act pricing for businesses and organizations that require frequent notarization services. Volume packages start at 10+ notarizations. Visit our Business Solutions page or contact us for a custom quote.",
      },
    ],
  },
  {
    label: "Booking & Appointments",
    icon: CalendarCheck,
    faqs: [
      {
        q: "How do I book an appointment?",
        a: "You can book online through our Book Appointment page. Select your service type, preferred date and time, enter your details, and confirm. You'll receive an email confirmation with all the details.",
      },
      {
        q: "Can I reschedule my appointment?",
        a: "Yes. You can reschedule through your Client Portal or by contacting us directly. We ask for at least 24 hours' notice when possible.",
      },
      {
        q: "What should I bring to my in-person appointment?",
        a: "Bring: a valid, unexpired government-issued photo ID, the document(s) to be notarized (unsigned), any additional signers who need to be present, and payment method. If the document requires witnesses, we can arrange that.",
      },
      {
        q: "Can you come to me for notarization?",
        a: "Yes — we offer mobile notary services throughout the greater Columbus area. We can travel to your home, office, hospital, care facility, or other location. Travel fees apply based on distance.",
      },
    ],
  },
  {
    label: "Legal & Compliance",
    icon: Scale,
    faqs: [
      {
        q: "Are your notaries properly commissioned?",
        a: "Yes. All notaries on our platform are commissioned by the Ohio Secretary of State, bonded, insured (E&O coverage), and NNA Certified Notary Signing Agents where applicable. Commission and certification details are available upon request.",
      },
      {
        q: "What is the difference between an acknowledgment and a jurat?",
        a: "An acknowledgment verifies that the signer voluntarily signed the document — the notary does not need to watch the signing. A jurat (or verification on oath/affirmation) requires the signer to sign in front of the notary and swear that the document contents are true. The document itself usually specifies which notarial act is required.",
      },
      {
        q: "Can a notary provide legal advice?",
        a: "No. Notaries are prohibited from providing legal advice, recommending specific legal actions, or explaining the legal effects of a document (unless the notary is also an attorney). We recommend consulting an attorney for legal questions about your documents.",
      },
      {
        q: "What is an apostille?",
        a: "An apostille is a certificate issued by the Ohio Secretary of State that authenticates a notarized document for use in another country (one that is part of the Hague Convention). We can assist with apostille requests — the current state fee is $5 per document, plus our processing fee.",
      },
      {
        q: "Can a notary refuse to notarize a document?",
        a: "Yes. A notary must refuse if: the signer cannot be identified, the signer appears to be under duress or mentally incapacitated, the document is incomplete, the notary suspects fraud, or the notary has a conflict of interest (e.g., is a party to the transaction).",
      },
    ],
  },
];

/* ─── Quick-link Resources ────────────────────────────────────── */

const quickLinks = [
  { title: "Book an Appointment", desc: "Schedule your notarization online", icon: CalendarCheck, link: "/book", color: "bg-primary/10 text-primary" },
  { title: "Fee Calculator", desc: "Get an instant price estimate", icon: DollarSign, link: "/fee-calculator", color: "bg-emerald-500/10 text-emerald-600" },
  { title: "RON Eligibility Check", desc: "See if your document qualifies for RON", icon: Monitor, link: "/ron-check", color: "bg-blue-500/10 text-blue-600" },
  { title: "Notary Guide", desc: "Step-by-step notarization guide", icon: BookOpen, link: "/notary-guide", color: "bg-amber-500/10 text-amber-600" },
  { title: "Document Templates", desc: "Download common legal forms", icon: FileText, link: "/templates", color: "bg-violet-500/10 text-violet-600" },
  { title: "RON Info", desc: "Learn about remote online notarization", icon: Shield, link: "/ron-info", color: "bg-rose-500/10 text-rose-600" },
];

/* ─── Component ───────────────────────────────────────────────── */

export default function HelpSupport() {
  usePageTitle(
    "Help & Support — Ohio Notary FAQ",
    "Find answers to common questions about notarization, remote online notarization (RON), pricing, ID requirements, and how to book an appointment with Notar."
  );

  return (
    <PageShell>
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <Breadcrumbs />

        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 font-sans text-3xl font-bold text-foreground md:text-4xl">
            Help & Support
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Everything you need to know about our notarization services, pricing, ID requirements, and the Remote Online Notarization process. Can't find your answer? Contact us directly.
          </p>
        </div>

        {/* Contact bar */}
        <Card className="mb-12 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-center gap-6 p-5 text-sm">
            <a href={`tel:${BRAND.defaultPhone.replace(/\D/g, "")}`} className="flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary">
              <Phone className="h-4 w-4 text-primary" /> {BRAND.defaultPhone}
            </a>
            <a href={`mailto:${BRAND.defaultEmail}`} className="flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary">
              <Mail className="h-4 w-4 text-primary" /> {BRAND.defaultEmail}
            </a>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Mon–Fri 9 AM – 6 PM EST
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> Columbus, OH & Nationwide (RON)
            </span>
          </CardContent>
        </Card>

        {/* Quick links */}
        <section className="mb-14">
          <h2 className="mb-5 text-lg font-semibold text-foreground">Quick Links</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((ql) => (
              <Link key={ql.link} to={ql.link} className="group">
                <Card className="h-full border-border/50 transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ql.color}`}>
                      <ql.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">{ql.title}</p>
                      <p className="text-sm text-muted-foreground">{ql.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* When You Need Each Service */}
        <section className="mb-14">
          <h2 className="mb-2 text-xl font-bold text-foreground">When Do You Need Each Notary Service?</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Not sure which service applies to your situation? Here are real-life circumstances for each type of notarial act and service we offer.
          </p>

          <div className="space-y-6">
            {serviceUseCases.map((svc) => (
              <Card key={svc.title} className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 border-b border-border/40 bg-muted/30 px-5 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <svc.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{svc.title}</h3>
                      <p className="text-xs text-muted-foreground">{svc.description}</p>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Common Situations</p>
                    <ul className="space-y-2.5">
                      {svc.examples.map((ex, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Sections */}
        <section>
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Browse by category or expand any question to see the answer.</p>
          </div>

          <div className="space-y-8">
            {faqCategories.map((cat) => (
              <div key={cat.label} id={`faq-${cat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <div className="mb-3 flex items-center gap-2">
                  <cat.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">{cat.label}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {cat.faqs.length} {cat.faqs.length === 1 ? "question" : "questions"}
                  </Badge>
                </div>

                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                      {cat.faqs.map((faq, idx) => (
                        <AccordionItem key={idx} value={`${cat.label}-${idx}`} className="border-border/40 px-5">
                          <AccordionTrigger className="gap-3 text-left text-sm font-medium text-foreground hover:no-underline">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Still Have Questions?</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Our team is here to help. Reach out by phone, email, or book an appointment and we'll walk you through the process.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/book">Book an Appointment</Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={`mailto:${BRAND.defaultEmail}`}>Email Us</a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`tel:${BRAND.defaultPhone.replace(/\D/g, "")}`}>Call Us</a>
            </Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
