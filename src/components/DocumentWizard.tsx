import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Home, Briefcase, Users, Scale, Heart, HelpCircle, ChevronRight, CheckCircle, AlertTriangle, Sparkles, Loader2 } from "lucide-react";

interface WizardResult {
  category: string;
  serviceType: string;
  description: string;
  requiredDocs: string[];
  requiredIds: string[];
  tips: string[];
  ohioNotes: string;
}

const questions = [
  {
    id: "purpose",
    question: "What do you need notarized?",
    subtitle: "Don't worry if you're not sure — we'll help you figure it out.",
    options: [
      { value: "real_estate", label: "Real Estate / Property", icon: Home, description: "Deeds, mortgages, title transfers, closing documents" },
      { value: "legal", label: "Legal Documents", icon: Scale, description: "Power of attorney, affidavits, court documents" },
      { value: "business", label: "Business Documents", icon: Briefcase, description: "LLC filings, contracts, corporate resolutions" },
      { value: "personal", label: "Personal / Family", icon: Heart, description: "Wills, trusts, guardianship, medical directives" },
      { value: "employment", label: "Employment / Immigration", icon: Users, description: "I-9 verification, work permits, translations" },
      { value: "other", label: "I'm Not Sure", icon: HelpCircle, description: "We'll help identify what you need" },
    ],
  },
];

const resultMap: Record<string, WizardResult> = {
  real_estate: {
    category: "Real Estate",
    serviceType: "Real Estate Documents",
    description: "Real estate documents like deeds, mortgages, and closing papers require notarization to be legally recorded. In Ohio, these typically need acknowledgment notarization.",
    requiredDocs: ["The document(s) to be notarized (DO NOT sign beforehand)", "Any additional pages or riders"],
    requiredIds: ["Valid government-issued photo ID (driver's license, passport, or state ID)", "Must not be expired"],
    tips: ["Do NOT sign the document before meeting with the notary", "All signers must be present", "Bring the full document — all pages"],
    ohioNotes: "Per Ohio Revised Code §147, notary fees are $5 per signature for standard notarization. Real estate documents are typically recorded with the county recorder after notarization.",
  },
  legal: {
    category: "Legal",
    serviceType: "Affidavits & Sworn Statements",
    description: "Legal documents often require either acknowledgment (confirming identity and willingness to sign) or jurat (sworn statement under oath). The notary will determine which is appropriate.",
    requiredDocs: ["The legal document to be notarized", "Any court forms or filing instructions"],
    requiredIds: ["Valid government-issued photo ID", "Must not be expired"],
    tips: ["For affidavits, you'll take an oath — the notary will administer it", "Power of Attorney documents require the principal to be present and competent", "Some documents may need witnesses in addition to notarization"],
    ohioNotes: "Ohio law (ORC §147.04) requires notaries to administer oaths for jurats. For Powers of Attorney, Ohio follows the Uniform Power of Attorney Act.",
  },
  business: {
    category: "Business",
    serviceType: "Business Documents",
    description: "Business documents like corporate resolutions, operating agreements, and contracts may need notarization for filing with the Secretary of State or for legal enforceability.",
    requiredDocs: ["Business document(s) requiring notarization", "Articles of incorporation/organization (if relevant)", "Corporate resolution authorizing the signer (if applicable)"],
    requiredIds: ["Valid photo ID of the signer", "Proof of authority to sign on behalf of the business (corporate resolution, operating agreement, etc.)"],
    tips: ["The signer must have legal authority to sign for the business", "Bring supporting documentation showing signing authority", "LLC members or corporate officers typically sign"],
    ohioNotes: "Ohio Secretary of State filings may require notarized documents. Corporate resolutions should identify the authorized signer by name and title.",
  },
  personal: {
    category: "Personal",
    serviceType: "Estate Planning Documents",
    description: "Personal documents like wills, trusts, and medical directives often require notarization and sometimes witnesses. These are important legal documents that protect you and your family.",
    requiredDocs: ["The document(s) to be notarized", "Any related documents (existing wills, trust amendments, etc.)"],
    requiredIds: ["Valid government-issued photo ID", "Must be current and unexpired"],
    tips: ["For wills, Ohio requires two witnesses in addition to notarization", "Healthcare powers of attorney should have specific witnesses", "The signer must be of sound mind and acting voluntarily"],
    ohioNotes: "Ohio requires specific witnessing for wills (ORC §2107.03). Living wills and healthcare powers of attorney have additional witness requirements under ORC §1337.",
  },
  employment: {
    category: "Employment",
    serviceType: "I-9 Employment Verification",
    description: "Employment verification and immigration-related documents require careful identity verification. Notaries can serve as authorized representatives for I-9 verification.",
    requiredDocs: ["I-9 form (if applicable)", "Employment-related document requiring notarization", "Certified translations (if documents are in another language)"],
    requiredIds: ["Valid passport or passport card", "Permanent Resident Card (if applicable)", "Employment Authorization Document (if applicable)", "State-issued photo ID + Social Security card (for List B + C verification)"],
    tips: ["I-9 verification requires specific document combinations — bring all your documents", "Translations must be certified", "Original documents are required — no photocopies"],
    ohioNotes: "Notaries acting as authorized representatives for I-9 must verify original documents. This is separate from standard notarization services.",
  },
  other: {
    category: "General",
    serviceType: "Other",
    description: "Not sure what you need? No problem! Upload your document or describe what you're trying to accomplish, and we'll help identify the right service. You can also use our AI chat to ask questions.",
    requiredDocs: ["Whatever document(s) you have — we'll review them", "Any instructions you've received from courts, banks, or attorneys"],
    requiredIds: ["Valid government-issued photo ID"],
    tips: ["Take a photo of your document and upload it — our AI can identify the document type", "If someone told you to 'get this notarized,' bring any instructions they gave you", "Don't sign anything until you meet with the notary"],
    ohioNotes: "Ohio notary fees are standardized at $5 per notarial act (ORC §147.04). Additional fees may apply for travel or specialized services.",
  },
};

interface DocumentWizardProps {
  onSelectService?: (serviceType: string) => void;
  onClose?: () => void;
}

export default function DocumentWizard({ onSelectService, onClose }: DocumentWizardProps) {
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);

  const result = selectedPurpose ? resultMap[selectedPurpose] : null;

  if (result) {
    return (
      <Card className="border-border/50 bg-background">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-primary/10 text-primary mb-2">{result.category}</Badge>
              <h3 className="font-display text-lg font-bold text-foreground">{result.serviceType}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPurpose(null)}>← Back</Button>
          </div>

          <p className="text-sm text-muted-foreground">{result.description}</p>

          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> What to Bring</h4>
            <ul className="space-y-1">
              {result.requiredDocs.map((doc, i) => (
                <li key={i} className="text-sm flex items-start gap-2"><CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />{doc}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Required ID</h4>
            <ul className="space-y-1">
              {result.requiredIds.map((id, i) => (
                <li key={i} className="text-sm flex items-start gap-2"><CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />{id}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Important Tips</h4>
            <ul className="space-y-1">
              {result.tips.map((tip, i) => (
                <li key={i} className="text-sm text-amber-800 dark:text-amber-200">{tip}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-primary/5 p-4">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Scale className="h-4 w-4 text-primary" /> Ohio Law</h4>
            <p className="text-xs text-muted-foreground mt-1">{result.ohioNotes}</p>
          </div>

          <div className="flex gap-2 pt-2">
            {onSelectService && (
              <Button onClick={() => onSelectService(result.serviceType)} className="bg-gradient-primary text-white hover:opacity-90">
                <ChevronRight className="mr-1 h-4 w-4" /> Book This Service
              </Button>
            )}
            {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-background">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{questions[0].question}</h3>
            <p className="text-sm text-muted-foreground">{questions[0].subtitle}</p>
          </div>
          {onClose && <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {questions[0].options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedPurpose(opt.value)}
              className="flex items-start gap-3 rounded-lg border border-border/50 p-4 text-left transition-all hover:border-accent hover:bg-primary/5 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <opt.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
