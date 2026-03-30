import { usePageTitle } from "@/lib/usePageTitle";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import { ChevronLeft, CheckCircle, AlertTriangle, XCircle, Monitor, Shield, ChevronRight, ArrowRight, Globe, FileText, Scale, Briefcase } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";

const allStates = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
  "District of Columbia"
];

const ronLawStates = new Set([
  "Ohio","Virginia","Texas","Florida","Nevada","Montana","Michigan","Minnesota","Tennessee","Indiana",
  "Nebraska","North Dakota","Iowa","Idaho","Oklahoma","Kentucky","Utah","Arizona","Colorado","Wyoming",
  "Maryland","Vermont","Alaska","Hawaii","New York","Pennsylvania","Wisconsin","Arkansas","Kansas",
  "New Hampshire","New Mexico","North Carolina","South Dakota","Washington","West Virginia","Georgia",
  "Illinois","Missouri","Oregon","Connecticut","Louisiana","Maine","Alabama","South Carolina"
]);

const documentTypes = [
  { value: "real_estate", label: "Real Estate Documents (Deeds, Mortgages, Refinancing)" },
  { value: "poa", label: "Power of Attorney" },
  { value: "will_trust", label: "Will, Trust, or Estate Planning" },
  { value: "affidavit", label: "Affidavit or Sworn Statement" },
  { value: "business_contract", label: "Business Contract or Agreement" },
  { value: "court_filing", label: "Court Filing or Legal Pleading" },
  { value: "i9_employment", label: "I-9 Employment Verification" },
  { value: "vehicle_title", label: "Vehicle Title Transfer" },
  { value: "medical_directive", label: "Healthcare Directive or Medical POA" },
  { value: "other", label: "Other Document" },
];

const entityTypes = [
  { value: "county_recorder", label: "County Recorder / Register of Deeds" },
  { value: "bank_lender", label: "Bank, Lender, or Title Company" },
  { value: "court", label: "Court or Legal Filing Office" },
  { value: "government", label: "Government Agency (State/Federal)" },
  { value: "employer", label: "Employer or HR Department" },
  { value: "private_party", label: "Private Party or Individual" },
  { value: "insurance", label: "Insurance Company" },
  { value: "foreign_entity", label: "Foreign Government / International Entity" },
  { value: "other", label: "Other / Not Sure" },
];

const purposes = [
  { value: "real_estate_closing", label: "Real Estate Closing / Refinance" },
  { value: "estate_planning", label: "Estate Planning" },
  { value: "legal_filing", label: "Legal Filing or Court Proceeding" },
  { value: "personal_use", label: "Personal Use" },
  { value: "business_transaction", label: "Business Transaction" },
  { value: "employment", label: "Employment / HR Requirement" },
  { value: "immigration", label: "Immigration or International Use" },
  { value: "financial", label: "Financial / Banking Requirement" },
];

type ResultLevel = "green" | "yellow" | "red";

interface EligibilityResult {
  level: ResultLevel;
  title: string;
  explanation: string;
  details: string[];
  recommendation: string;
}

function getEligibility(state: string, docType: string, entity: string, purpose: string): EligibilityResult {
  // Foreign entity / immigration — generally requires apostille or consular legalization
  if (entity === "foreign_entity" || purpose === "immigration") {
    return {
      level: "yellow",
      title: "RON May Be Accepted — Additional Steps Likely Required",
      explanation: "Documents intended for international use may require an Apostille or consular legalization in addition to notarization. RON itself is valid, but the receiving country may have specific requirements.",
      details: [
        "Ohio RON is legally valid for the notarization step",
        "An Apostille from the Ohio Secretary of State may be needed",
        "Some countries require consular legalization instead of or in addition to an Apostille",
        "Contact the receiving entity or embassy to confirm requirements"
      ],
      recommendation: "We offer Apostille facilitation services. Contact us to discuss your specific international document needs."
    };
  }

  // I-9 — cannot be done via RON per federal requirements
  if (docType === "i9_employment") {
    return {
      level: "red",
      title: "I-9 Verification Requires In-Person Physical Inspection",
      explanation: "Federal I-9 employment verification requires physical inspection of original documents. While the employer section can use an authorized representative, the actual document inspection must be done in person per USCIS guidelines.",
      details: [
        "USCIS requires physical examination of original identity and work authorization documents",
        "A notary can serve as the authorized representative for the employer",
        "The inspection must occur in person — RON is not accepted for I-9 purposes",
        "Virtual I-9 inspection under DHS flexibilities ended in 2023"
      ],
      recommendation: "Book an in-person appointment for I-9 verification. We offer mobile notary services for convenience."
    };
  }

  // Vehicle title — state-specific, many BMVs still want wet ink
  if (docType === "vehicle_title") {
    return {
      level: "yellow",
      title: "RON May Be Accepted — Check with Your State BMV/DMV",
      explanation: "Vehicle title transfers often have state-specific requirements. While the notarization itself is valid via RON, some state DMV/BMV offices may still prefer or require wet-ink signatures on title documents.",
      details: [
        "Ohio BMV accepts RON for Ohio title transfers",
        "Other states' DMVs may have different policies",
        `${state} DMV should be contacted to confirm RON acceptance for title transfers`,
        "Full Faith & Credit Clause supports acceptance, but practical implementation varies"
      ],
      recommendation: "We recommend calling your local DMV to confirm before proceeding with RON for a title transfer."
    };
  }

  // Court filings — some courts are slow to adopt
  if (docType === "court_filing" || entity === "court") {
    return {
      level: "yellow",
      title: "RON Is Likely Accepted — Verify with the Specific Court",
      explanation: "Most courts accept RON notarizations, but some individual courts or judges may have specific preferences. The notarization itself is legally valid, but filing acceptance can vary.",
      details: [
        "RON notarizations carry the same legal weight as in-person under Ohio law (ORC §147.65-.66)",
        "Federal courts generally accept RON",
        "State courts in RON-law states widely accept RON",
        "Individual court clerks may have specific submission requirements"
      ],
      recommendation: "Contact the specific court clerk's office to confirm they accept electronically notarized documents before your session."
    };
  }

  // County recorder — varies by county
  if (entity === "county_recorder") {
    const hasRonLaw = ronLawStates.has(state);
    if (hasRonLaw) {
      return {
        level: "green",
        title: "RON Is Widely Accepted for Recording",
        explanation: `${state} has enacted RON legislation, and county recorders in RON-law states generally accept RON notarizations for recording real estate documents.`,
        details: [
          `${state} has its own RON legislation recognizing remote notarization`,
          "Major title companies (First American, Fidelity, Old Republic) accept RON closings",
          "Fannie Mae and Freddie Mac accept RON for mortgage documents",
          "The notarization includes tamper-evident technology and a full audio/video recording"
        ],
        recommendation: "You're in great shape for RON! Book a session and we'll handle the rest."
      };
    } else {
      return {
        level: "yellow",
        title: "RON Should Be Accepted — Confirm with County Recorder",
        explanation: `${state} does not have its own RON law, but Ohio RON notarizations are protected under the U.S. Constitution's Full Faith and Credit Clause (Article IV, Section 1). Most county recorders accept them.`,
        details: [
          "Ohio RON is legally valid and must be given full faith and credit by all states",
          `${state} recorders may not be as familiar with RON — call ahead to confirm`,
          "Provide the recorder with a copy of the session recording certificate if requested",
          "Consider having the title company coordinate with the recorder"
        ],
        recommendation: "We recommend calling the county recorder's office before your RON session to ensure smooth recording."
      };
    }
  }

  // Bank/lender — generally excellent acceptance
  if (entity === "bank_lender") {
    return {
      level: "green",
      title: "RON Is Widely Accepted by Banks and Lenders",
      explanation: "The vast majority of banks, lenders, and title companies now accept RON notarizations. GSEs (Fannie Mae, Freddie Mac) and FHA all accept RON for mortgage transactions.",
      details: [
        "Fannie Mae, Freddie Mac, and FHA accept RON",
        "Most major lenders (Wells Fargo, Chase, Bank of America, etc.) accept RON closings",
        "Title insurance underwriters support RON transactions",
        "RON provides enhanced security vs. traditional notarization (recording + KBA + ID verification)"
      ],
      recommendation: "RON is an excellent choice for your banking/lending transaction. Book a session to get started."
    };
  }

  // Wills and trusts — need witness considerations
  if (docType === "will_trust") {
    return {
      level: "yellow",
      title: "RON Is Valid — Witness Requirements Apply",
      explanation: "Ohio allows RON for wills and trusts, but Ohio law requires 2 disinterested witnesses for a valid will. These witnesses can participate remotely in the RON session.",
      details: [
        "Ohio RON is authorized for estate planning documents under ORC §147.65-.66",
        "Wills require 2 disinterested witnesses (not beneficiaries) — they can join the video call",
        "Self-proving affidavits can be notarized via RON",
        "Consult your estate planning attorney about specific requirements for your situation"
      ],
      recommendation: "We can accommodate witnesses in your RON session. Book an appointment and let us know about witness requirements."
    };
  }

  // Default — most cases are green in RON-law states
  const hasRonLaw = ronLawStates.has(state);
  if (hasRonLaw) {
    return {
      level: "green",
      title: "RON Is Widely Accepted for This Use Case",
      explanation: `${state} has enacted RON legislation, making RON notarizations fully recognized. Your document type and receiving entity are commonly handled via RON without issues.`,
      details: [
        `${state} recognizes RON under its own state law`,
        "Ohio RON notarizations carry the same legal weight as in-person",
        "Full audio/video recording provides enhanced security and auditability",
        "Multi-factor identity verification (credential analysis + KBA) ensures signer authenticity"
      ],
      recommendation: "You're all set for RON! Schedule a session at your convenience."
    };
  }

  return {
    level: "green",
    title: "RON Should Be Accepted — Full Faith & Credit Applies",
    explanation: `While ${state} may not have its own RON law, Ohio RON notarizations are protected under the U.S. Constitution's Full Faith and Credit Clause. The notarization is legally valid nationwide.`,
    details: [
      "The Full Faith and Credit Clause (Article IV, Section 1) requires all states to recognize Ohio RON",
      "Ohio RON is performed under ORC §147.65-.66 with full compliance",
      "The receiving entity should accept the notarization, though some may be less familiar with RON",
      "If the entity questions acceptance, we can provide legal authority references"
    ],
    recommendation: "RON is a strong choice. If you want extra certainty, verify with the receiving entity before your session."
  };
}

export default function RonEligibilityChecker() {
  usePageTitle("RON Eligibility Checker");
  const [state, setState] = useState("");
  const [docType, setDocType] = useState("");
  const [entity, setEntity] = useState("");
  const [purpose, setPurpose] = useState("");
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const canCheck = state && docType && entity && purpose;

  const handleCheck = () => {
    if (!canCheck) return;
    setResult(getEligibility(state, docType, entity, purpose));
  };

  const handleReset = () => {
    setState("");
    setDocType("");
    setEntity("");
    setPurpose("");
    setResult(null);
  };

  const levelConfig = {
    green: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-800" },
    yellow: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-800" },
    red: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-800" },
  };

  return (
    <PageShell>

      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary">
            <Monitor className="mr-1 h-3 w-3" /> RON Eligibility Tool
          </Badge>
          <h1 className="mb-3 font-sans text-3xl font-bold text-primary-foreground md:text-4xl">
            Will Remote Notarization Work for You?
          </h1>
          <p className="mx-auto max-w-2xl text-primary-foreground/70">
            Answer four questions to find out if your document can be notarized remotely. Based on Ohio RON law (ORC §147.65-.66), 
            Full Faith & Credit Clause, and known entity-specific requirements.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl px-4 py-10">
        {!result ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label className="text-base font-semibold">1. Which state will this document be used in?</Label>
                  <p className="text-sm text-muted-foreground mb-2">Where the receiving entity is located or where the document will be filed.</p>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                    <SelectContent>
                      {allStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold">2. What type of document needs notarization?</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold">3. Who is the receiving entity?</Label>
                  <p className="text-sm text-muted-foreground mb-2">The organization or party that will receive the notarized document.</p>
                  <Select value={entity} onValueChange={setEntity}>
                    <SelectTrigger><SelectValue placeholder="Select receiving entity" /></SelectTrigger>
                    <SelectContent>
                      {entityTypes.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold">4. What is the purpose?</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      {purposes.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCheck}
                  disabled={!canCheck}
                  className="w-full "
                  size="lg"
                >
                  <Shield className="mr-2 h-4 w-4" /> Check Eligibility
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Result */}
            <Card className={`border ${levelConfig[result.level].bg}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {(() => { const Icon = levelConfig[result.level].icon; return <Icon className={`h-8 w-8 flex-shrink-0 mt-1 ${levelConfig[result.level].color}`} />; })()}
                  <div>
                    <Badge className={`mb-2 ${levelConfig[result.level].badge}`}>
                      {result.level === "green" ? "Widely Accepted" : result.level === "yellow" ? "Verify First" : "In-Person Recommended"}
                    </Badge>
                    <h2 className="font-sans text-xl font-bold mb-2">{result.title}</h2>
                    <p className="text-muted-foreground mb-4">{result.explanation}</p>
                    <ul className="space-y-2 mb-4">
                      {result.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-lg bg-background/80 p-3 border border-border/50">
                      <p className="text-sm font-medium">Our Recommendation:</p>
                      <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/book" className="flex-1">
                <Button className="w-full " size="lg">
                  {result.level === "red" ? "Book In-Person Appointment" : "Book RON Session"} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" onClick={handleReset} size="lg">Check Another</Button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              This tool provides general guidance based on current laws and common practices. It is not legal advice. 
              Always verify with the specific receiving entity for your situation. Laws and policies change — 
              last updated March 2026.
            </p>
          </motion.div>
        )}

        {/* Cross-sell */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5 text-center">
              <Globe className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-sans text-sm font-semibold mb-1">Learn About RON</h3>
              <p className="text-xs text-muted-foreground mb-3">Full comparison, state acceptance, and FAQ</p>
              <Link to="/ron-info"><Button variant="outline" size="sm" className="w-full">RON Info <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-sans text-sm font-semibold mb-1">Document Templates</h3>
              <p className="text-xs text-muted-foreground mb-3">Free templates for common documents</p>
              <Link to="/templates"><Button variant="outline" size="sm" className="w-full">View Templates <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
            </CardContent>
          </Card>
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5 text-center">
              <Briefcase className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-sans text-sm font-semibold mb-1">All Services</h3>
              <p className="text-xs text-muted-foreground mb-3">View our full catalog of notary & document services</p>
              <Link to="/services"><Button variant="outline" size="sm" className="w-full">View Services <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>

    </PageShell>
  );
}
