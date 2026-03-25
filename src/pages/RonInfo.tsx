import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Monitor, MapPin, CheckCircle, XCircle, ChevronRight, Globe, Lock, Clock, FileText, Scale, Zap, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";

import { fadeUp } from "@/lib/animations";

const comparisonRows = [
  { feature: "Location Required", inPerson: "Must meet at physical location", ron: "From anywhere with internet", ronBetter: true },
  { feature: "Identity Verification", inPerson: "Visual ID inspection only", ron: "Credential analysis + KBA (5 questions)", ronBetter: true },
  { feature: "Session Recording", inPerson: "No recording", ron: "Full audio/video recording stored 10+ years", ronBetter: true },
  { feature: "Audit Trail", inPerson: "Paper journal only", ron: "Digital journal + tamper-evident technology + recording", ronBetter: true },
  { feature: "Fraud Prevention", inPerson: "Notary's judgment", ron: "Multi-factor: ID scan + KBA + live video + recording", ronBetter: true },
  { feature: "Accessibility", inPerson: "Requires physical mobility", ron: "Available to homebound, hospitalized, or remote signers", ronBetter: true },
  { feature: "Availability", inPerson: "Business hours, scheduling required", ron: "Flexible scheduling, no travel time", ronBetter: true },
  { feature: "Legal Standing", inPerson: "Universally accepted", ron: "Accepted in all 50 states (full faith and credit)", ronBetter: false },
  { feature: "Speed", inPerson: "10-15 minutes (excluding travel)", ron: "20-30 minutes (including ID verification)", ronBetter: false },
  { feature: "Technology Required", inPerson: "None", ron: "Computer with camera, microphone, and internet", ronBetter: false },
];

const stateCategories = [
  {
    title: "States with RON Laws (40+)",
    description: "These states have enacted their own RON legislation and fully recognize RON notarizations:",
    states: "Ohio, Virginia, Texas, Florida, Nevada, Montana, Michigan, Minnesota, Tennessee, Indiana, Nebraska, North Dakota, Iowa, Idaho, Oklahoma, Kentucky, Utah, Arizona, Colorado, Wyoming, Maryland, Vermont, Alaska, Hawaii, New York, Pennsylvania, and more",
    badge: "Full Recognition",
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    title: "States Accepting Under Full Faith & Credit",
    description: "Even states without their own RON laws must accept Ohio RON notarizations under the U.S. Constitution's Full Faith and Credit Clause (Article IV, Section 1):",
    states: "All 50 states and U.S. territories",
    badge: "Constitutional Protection",
    color: "bg-blue-100 text-blue-800",
  },
];

// Comprehensive 50-state RON legal reference data
const stateRonData: { state: string; status: "permanent" | "temporary" | "none"; statute: string; kba: string; restrictions: string; retention: string }[] = [
  { state: "Alabama", status: "permanent", statute: "Ala. Code §36-20-73", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Alaska", status: "permanent", statute: "AS §44.50.075", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Arizona", status: "permanent", statute: "ARS §41-371 et seq.", kba: "MISMO-compliant required", restrictions: "None specific", retention: "5 years" },
  { state: "Arkansas", status: "permanent", statute: "Ark. Code §21-14-301", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "California", status: "permanent", statute: "Cal. Civ. Code §1183.05 (eff. 2030)", kba: "Required", restrictions: "Limited to specific document types until 2030; current executive orders allow broader use", retention: "10 years" },
  { state: "Colorado", status: "permanent", statute: "CRS §24-21-501", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Connecticut", status: "permanent", statute: "Conn. Gen. Stat. §3-94a", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Delaware", status: "permanent", statute: "29 Del. C. §4321 et seq.", kba: "Required", restrictions: "None specific", retention: "5 years" },
  { state: "Florida", status: "permanent", statute: "Fla. Stat. §117.265", kba: "MISMO-compliant required", restrictions: "Self-proving wills require witnesses on video", retention: "10 years" },
  { state: "Georgia", status: "permanent", statute: "O.C.G.A. §45-17-8.3", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Hawaii", status: "permanent", statute: "HRS §456-91", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Idaho", status: "permanent", statute: "Idaho Code §51-121", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Illinois", status: "permanent", statute: "5 ILCS 312/6-109", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Indiana", status: "permanent", statute: "IC §33-42-17", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Iowa", status: "permanent", statute: "Iowa Code §9B.21", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Kansas", status: "permanent", statute: "KSA §53-601 et seq.", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Kentucky", status: "permanent", statute: "KRS §423.445", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Louisiana", status: "permanent", statute: "La. R.S. 35:626", kba: "Required", restrictions: "Civil law state — some acts require specific forms", retention: "10 years" },
  { state: "Maine", status: "permanent", statute: "4 MRSA §1051", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Maryland", status: "permanent", statute: "Md. State Gov't Code §18-214", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Massachusetts", status: "permanent", statute: "Mass. Gen. Laws ch. 222 §8", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Michigan", status: "permanent", statute: "MCL §55.286a", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Minnesota", status: "permanent", statute: "Minn. Stat. §358.645", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Mississippi", status: "permanent", statute: "Miss. Code §25-33-19", kba: "Required", restrictions: "None specific", retention: "5 years" },
  { state: "Missouri", status: "permanent", statute: "Mo. Rev. Stat. §486.1100", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Montana", status: "permanent", statute: "MCA §1-5-621", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Nebraska", status: "permanent", statute: "Neb. Rev. Stat. §64-402", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Nevada", status: "permanent", statute: "NRS §240.181 et seq.", kba: "MISMO-compliant required", restrictions: "Electronic notary must register with SOS", retention: "7 years" },
  { state: "New Hampshire", status: "permanent", statute: "RSA 456-B:12", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "New Jersey", status: "permanent", statute: "N.J.S.A. 52:7-10.12", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "New Mexico", status: "permanent", statute: "NMSA §14-14A-3", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "New York", status: "permanent", statute: "NY Exec. Law §135-c", kba: "Required", restrictions: "Some county clerks may have additional requirements", retention: "10 years" },
  { state: "North Carolina", status: "permanent", statute: "NCGS §10B-125 et seq.", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "North Dakota", status: "permanent", statute: "NDCC §44-06.1-13.2", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Ohio", status: "permanent", statute: "ORC §147.65-.66", kba: "MISMO-compliant required", restrictions: "None — Ohio is a leader in RON adoption", retention: "10 years (audio/video recording required)" },
  { state: "Oklahoma", status: "permanent", statute: "49 OS §208", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Oregon", status: "permanent", statute: "ORS §194.500 et seq.", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Pennsylvania", status: "permanent", statute: "57 Pa.C.S. §329", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Rhode Island", status: "permanent", statute: "R.I. Gen. Laws §42-30.1-18", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "South Carolina", status: "permanent", statute: "S.C. Code §26-2-410", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "South Dakota", status: "permanent", statute: "SDCL §18-1-12.3", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Tennessee", status: "permanent", statute: "Tenn. Code §66-22-128", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Texas", status: "permanent", statute: "Tex. Gov't Code §406.101 et seq.", kba: "MISMO-compliant required", restrictions: "None specific", retention: "5 years" },
  { state: "Utah", status: "permanent", statute: "Utah Code §46-1-2", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
  { state: "Vermont", status: "permanent", statute: "26 V.S.A. §5379", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Virginia", status: "permanent", statute: "Va. Code §47.1-2 (pioneer state, 2012)", kba: "MISMO-compliant required", restrictions: "None — first state to authorize RON", retention: "5 years" },
  { state: "Washington", status: "permanent", statute: "RCW §42.45.280", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "West Virginia", status: "permanent", statute: "W. Va. Code §39-4-37", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Wisconsin", status: "permanent", statute: "Wis. Stat. §140.145", kba: "Required", restrictions: "None specific", retention: "10 years" },
  { state: "Wyoming", status: "permanent", statute: "Wyo. Stat. §34-26-301 et seq.", kba: "MISMO-compliant required", restrictions: "None specific", retention: "10 years" },
];

const useCases = [
  { icon: MapPin, title: "Real Estate Closings", desc: "Close on your home from anywhere — sellers, buyers, and refinancing. Major title companies accept RON closings." },
  { icon: FileText, title: "Estate Planning", desc: "Execute wills, trusts, and healthcare directives remotely. Especially valuable for elderly or hospitalized signers." },
  { icon: Scale, title: "Legal Documents", desc: "Powers of attorney, affidavits, and court filings — notarized via secure video from your attorney's office or your home." },
  { icon: Globe, title: "Out-of-State Transactions", desc: "Ohio RON is accepted nationwide. Perfect for multi-state business deals or when parties are in different locations." },
];

const ronFaqs = [
  { q: "Is RON as legally binding as in-person notarization?", a: "Yes. Ohio RON notarizations performed under ORC §147.65-.66 carry the same legal weight as traditional in-person notarizations. They are recognized in all 50 states under the Full Faith and Credit Clause of the U.S. Constitution." },
  { q: "Do banks and title companies accept RON?", a: "Yes. Most major banks, title companies, and lenders accept RON notarizations. Some may have specific platform requirements — contact your lender to confirm. Fannie Mae and Freddie Mac both accept RON for mortgage closings." },
  { q: "What technology do I need for a RON session?", a: "You need: (1) A computer or tablet with a webcam and microphone, (2) a stable internet connection (at least 5 Mbps recommended), (3) a web browser (Chrome, Firefox, or Edge recommended). Mobile phones are generally not recommended due to screen size." },
  { q: "What is Knowledge-Based Authentication (KBA)?", a: "KBA is an identity verification method required for RON. You'll be asked 5 multiple-choice questions generated from public records (credit history, address history, etc.). You must answer at least 4 out of 5 correctly within 2 minutes. If you fail, you can retry once." },
  { q: "Is the RON session recorded?", a: "Yes. Ohio law requires the entire RON session to be audio/video recorded. The recording is stored securely for a minimum of 10 years per ORC §147.66. This actually provides better protection than in-person notarization, which has no recording requirement." },
  { q: "Can I notarize a will via RON?", a: "Yes, but with important considerations. Ohio allows RON for wills, but you still need 2 disinterested witnesses present during the signing. The witnesses can participate remotely if they are also on the video call. Check with your estate planning attorney for specific guidance." },
  { q: "What if my KBA fails?", a: "You get one retry opportunity. If KBA fails twice, the session cannot proceed that day. This is a security measure to prevent fraud. You may need to verify your identity through alternative means or try again another day." },
  { q: "Are there documents that CANNOT be notarized via RON?", a: "Very few. Under Ohio law, most documents are eligible for RON. However, some specific county recorder offices or government agencies may still require wet-ink signatures. Always check with the receiving entity if you're unsure." },
];

export default function RonInfo() {
  const { user } = useAuth();
  const [stateSearch, setStateSearch] = useState("");

  const filteredStates = stateRonData.filter(s =>
    s.state.toLowerCase().includes(stateSearch.toLowerCase())
  );
  useEffect(() => {
    document.title = "Remote Online Notarization (RON) — Notar";
    return () => { document.title = "Notar — Ohio Notary Public | In-Person & RON"; };
  }, []);

  return (
    <PageShell>
      {/* Nav */}

      {/* Hero */}
      <section className="bg-gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
                <Monitor className="mr-1 h-3 w-3" /> Remote Online Notarization
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="mb-4 font-sans text-3xl font-bold text-primary-foreground md:text-5xl">
              RON: The Future of Notarization
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mx-auto max-w-2xl text-primary-foreground/70">
              More secure than traditional notarization, accepted in all 50 states, and available from anywhere. Learn why RON is the smarter choice. Notar uses <strong>OneNotary</strong> as our certified RON platform.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Legal Foundation */}
      <section className="border-b border-border/50 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border/50 bg-primary/5">
              <CardContent className="p-6 text-center">
                <Shield className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-sans text-lg font-semibold">Ohio Law</h3>
                <p className="text-sm text-muted-foreground">Authorized under ORC §147.65-.66</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-primary/5">
              <CardContent className="p-6 text-center">
                <Lock className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-sans text-lg font-semibold">Multi-Factor Security</h3>
                <p className="text-sm text-muted-foreground">ID scan + KBA + live video + recording</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-primary/5">
              <CardContent className="p-6 text-center">
                <Globe className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-sans text-lg font-semibold">50-State Recognition</h3>
                <p className="text-sm text-muted-foreground">Full Faith & Credit Clause</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center font-sans text-2xl font-bold text-foreground">RON vs. Traditional Notarization</h2>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Feature</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" /> In-Person</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground"><Monitor className="mr-1 inline h-3 w-3" /> RON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="border-b border-border/30 last:border-0">
                        <td className="px-4 py-3 font-medium">{row.feature}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.inPerson}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-start gap-1.5">
                            {row.ronBetter ? <CheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" /> : <span className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />}
                            <span className={row.ronBetter ? "text-foreground" : "text-muted-foreground"}>{row.ron}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* State Acceptance */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center font-sans text-2xl font-bold text-foreground">Who Accepts RON?</h2>
          <div className="space-y-6">
            {stateCategories.map((cat) => (
              <Card key={cat.title} className="border-border/50">
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className={cat.color}>{cat.badge}</Badge>
                    <h3 className="font-sans text-lg font-semibold">{cat.title}</h3>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">{cat.description}</p>
                  <p className="text-sm">{cat.states}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Key Organizations Accepting RON:</strong> Fannie Mae, Freddie Mac, FHA, VA, most major title companies, and the majority of county recorder offices nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center font-sans text-2xl font-bold text-foreground">Perfect For</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {useCases.map((uc) => (
              <Card key={uc.title} className="border-border/50 transition-shadow hover:shadow-md">
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <uc.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-sans font-semibold text-foreground">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground">{uc.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center font-sans text-2xl font-bold text-foreground">RON FAQ</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {ronFaqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* KBA & Compliance Info */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-6 text-center font-sans text-2xl font-bold text-foreground">Knowledge-Based Authentication (KBA)</h2>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-sans text-lg font-semibold">Required Under Ohio Law</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ohio Revised Code §147.66 requires Knowledge-Based Authentication (KBA) as part of the identity verification process for all Remote Online Notarization sessions. This is a security measure that protects both signers and relying parties.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> 5 multiple-choice questions generated from public records</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Must answer 4 of 5 correctly within 2 minutes</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> One retry permitted if initial attempt fails</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> Questions drawn from credit history, address history, etc.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-sans text-lg font-semibold">Accepted KBA Providers</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ohio law requires the use of compliant KBA providers that meet STESSO (Secure Technology Standards for Electronic Submission and Storage of Online) standards. Commonly accepted providers include:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> <strong>IDology</strong> — Widely used in the RON industry, MISMO-compliant</li>
                    <li className="flex items-start gap-2"><Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> <strong>LexisNexis</strong> — Industry-standard identity verification platform</li>
                    <li className="flex items-start gap-2"><Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" /> <strong>OneNotary</strong> — Platform-integrated KBA with full RON workflow</li>
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground italic">
                    Our RON platform handles KBA automatically — signers complete the process as part of the session.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 text-center">
            <Link to="/ron-check">
              <Button variant="outline" size="lg">
                <Monitor className="mr-2 h-4 w-4" /> Check RON Eligibility for Your Situation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 50-State RON Legal Reference */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-center font-sans text-2xl font-bold text-foreground">50-State RON Legal Reference</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Search any state to see its RON status, governing statute, KBA requirements, and retention rules. Ohio RON notarizations are accepted nationwide under the Full Faith & Credit Clause.
          </p>
          <div className="mx-auto mb-6 max-w-md relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by state name..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">State</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Statute</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">KBA</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Retention</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredStates.map((s) => (
                  <tr key={s.state} className={`border-b border-border/30 last:border-0 ${s.state === "Ohio" ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2 font-medium">{s.state}</td>
                    <td className="px-3 py-2">
                      <Badge className={s.status === "permanent" ? "bg-emerald-100 text-emerald-800" : s.status === "temporary" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
                        {s.status === "permanent" ? "Permanent Law" : s.status === "temporary" ? "Temporary" : "No Law"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{s.statute}</td>
                    <td className="px-3 py-2 text-xs">{s.kba}</td>
                    <td className="px-3 py-2 text-xs">{s.retention}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{s.restrictions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center italic">
            Data current as of March 2026. Laws change frequently — verify with your state's Secretary of State office for the most current information. This is not legal advice.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <Zap className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h2 className="mb-4 font-sans text-2xl font-bold text-foreground">Try RON Today</h2>
          <p className="mb-6 mx-auto max-w-lg text-muted-foreground">
            Experience the convenience of remote notarization. Book a RON session and have your documents notarized from anywhere.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/book"><Button size="lg" className="bg-gradient-primary text-white hover:opacity-90">Schedule RON Session <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
            <Link to="/services"><Button size="lg" variant="outline">View All Services</Button></Link>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
