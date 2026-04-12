import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, FileText, Printer, AlertTriangle, Save, Loader2, Lock } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";
import { useFreeTierCheck } from "@/hooks/useFreeTierCheck";

type DocType = "affidavit" | "travel_consent" | "bill_of_sale" | "identity_statement" | "general_agreement" | "power_of_attorney" | "healthcare_directive" | "promissory_note";

const docTypeLabels: Record<DocType, string> = {
  affidavit: "General Affidavit",
  travel_consent: "Travel Consent Form",
  bill_of_sale: "Bill of Sale",
  identity_statement: "Identity Verification Statement",
  general_agreement: "General Agreement",
  power_of_attorney: "Power of Attorney",
  healthcare_directive: "Healthcare Directive / Living Will",
  promissory_note: "Promissory Note",
};

interface StepConfig {
  title: string;
  fields: { name: string; label: string; type: "text" | "date" | "textarea" | "select"; options?: string[]; placeholder?: string }[];
}

const getSteps = (docType: DocType): StepConfig[] => {
  const commonParty = [
    { name: "full_name", label: "Your Full Legal Name", type: "text" as const },
    { name: "address", label: "Your Address", type: "text" as const },
    { name: "city", label: "City", type: "text" as const },
    { name: "state", label: "State", type: "text" as const, placeholder: "OH" },
    { name: "zip", label: "Zip Code", type: "text" as const },
  ];

  switch (docType) {
    case "affidavit":
      return [
        { title: "Your Information", fields: commonParty },
        { title: "County & Purpose", fields: [
          { name: "county", label: "County", type: "text", placeholder: "Franklin" },
          { name: "purpose", label: "Purpose of Affidavit", type: "text", placeholder: "e.g., Name change, residency proof" },
        ]},
        { title: "Sworn Statement", fields: [
          { name: "statement", label: "Statement of Facts (what you are swearing to)", type: "textarea", placeholder: "I state under oath that..." },
        ]},
      ];
    case "travel_consent":
      return [
        { title: "Parent / Guardian Info", fields: commonParty.concat([{ name: "phone", label: "Contact Phone", type: "text" }]) },
        { title: "Child Information", fields: [
          { name: "child_name", label: "Child's Full Name", type: "text" },
          { name: "child_dob", label: "Child's Date of Birth", type: "date" },
        ]},
        { title: "Travel Details", fields: [
          { name: "companion_name", label: "Travel Companion Name", type: "text" },
          { name: "destination", label: "Destination", type: "text" },
          { name: "travel_dates", label: "Travel Dates", type: "text", placeholder: "March 15 - March 22, 2026" },
        ]},
      ];
    case "bill_of_sale":
      return [
        { title: "Seller Information", fields: [{ name: "seller_name", label: "Seller Full Name", type: "text" }, { name: "seller_address", label: "Seller Address", type: "text" }] },
        { title: "Buyer Information", fields: [{ name: "buyer_name", label: "Buyer Full Name", type: "text" }, { name: "buyer_address", label: "Buyer Address", type: "text" }] },
        { title: "Item & Price", fields: [
          { name: "item_description", label: "Item Description", type: "textarea", placeholder: "Describe the item(s) being sold..." },
          { name: "sale_price", label: "Sale Price ($)", type: "text" },
          { name: "sale_date", label: "Date of Sale", type: "date" },
        ]},
      ];
    case "identity_statement":
      return [
        { title: "Your Identity", fields: [
          { name: "full_name", label: "Full Legal Name", type: "text" },
          { name: "also_known_as", label: "Also Known As", type: "text", placeholder: "Other names used (if any)" },
          { name: "dob", label: "Date of Birth", type: "date" },
        ]},
        { title: "Address & ID", fields: [
          { name: "address", label: "Current Address", type: "text" },
          { name: "id_type", label: "ID Type", type: "text", placeholder: "Ohio Driver's License" },
          { name: "id_number", label: "ID Number", type: "text" },
        ]},
      ];
    case "general_agreement":
      return [
        { title: "Party A", fields: [{ name: "party_a", label: "Party A Full Name", type: "text" }, { name: "party_a_address", label: "Party A Address", type: "text" }] },
        { title: "Party B", fields: [{ name: "party_b", label: "Party B Full Name", type: "text" }, { name: "party_b_address", label: "Party B Address", type: "text" }] },
        { title: "Agreement Terms", fields: [
          { name: "effective_date", label: "Effective Date", type: "date" },
          { name: "terms", label: "Terms and Conditions", type: "textarea", placeholder: "Describe the terms of the agreement..." },
        ]},
      ];
    case "power_of_attorney":
      return [
        { title: "Principal Information", fields: [
          { name: "principal_name", label: "Principal's Full Legal Name", type: "text" },
          { name: "principal_address", label: "Principal's Address", type: "text" },
          { name: "principal_city", label: "City", type: "text" },
          { name: "principal_state", label: "State", type: "text", placeholder: "OH" },
        ]},
        { title: "Agent Information", fields: [
          { name: "agent_name", label: "Agent's Full Legal Name", type: "text" },
          { name: "agent_address", label: "Agent's Address", type: "text" },
          { name: "agent_phone", label: "Agent's Phone", type: "text" },
        ]},
        { title: "Powers Granted", fields: [
          { name: "poa_type", label: "Type of Power of Attorney", type: "select", options: ["General", "Durable", "Limited / Special"] },
          { name: "powers", label: "Specific Powers Granted", type: "textarea", placeholder: "Describe the powers being granted to the agent (e.g., financial, real estate, legal)..." },
          { name: "effective_date", label: "Effective Date", type: "date" },
        ]},
      ];
    case "healthcare_directive":
      return [
        { title: "Declarant Information", fields: [
          { name: "declarant_name", label: "Your Full Legal Name", type: "text" },
          { name: "declarant_dob", label: "Date of Birth", type: "date" },
          { name: "declarant_address", label: "Your Address", type: "text" },
        ]},
        { title: "Healthcare Agent", fields: [
          { name: "agent_name", label: "Healthcare Agent Full Name", type: "text" },
          { name: "agent_phone", label: "Agent Phone", type: "text" },
          { name: "alt_agent_name", label: "Alternate Agent (optional)", type: "text" },
        ]},
        { title: "Directives", fields: [
          { name: "life_sustaining", label: "Life-Sustaining Treatment Preferences", type: "select", options: ["I want all treatments to extend my life", "I do NOT want life-sustaining treatment if terminally ill", "I want my agent to decide"] },
          { name: "additional_instructions", label: "Additional Instructions", type: "textarea", placeholder: "Any specific wishes regarding pain management, organ donation, etc." },
        ]},
      ];
    case "promissory_note":
      return [
        { title: "Lender Information", fields: [
          { name: "lender_name", label: "Lender Full Name", type: "text" },
          { name: "lender_address", label: "Lender Address", type: "text" },
        ]},
        { title: "Borrower Information", fields: [
          { name: "borrower_name", label: "Borrower Full Name", type: "text" },
          { name: "borrower_address", label: "Borrower Address", type: "text" },
        ]},
        { title: "Loan Terms", fields: [
          { name: "principal_amount", label: "Principal Amount ($)", type: "text" },
          { name: "interest_rate", label: "Annual Interest Rate (%)", type: "text", placeholder: "e.g., 5.0" },
          { name: "loan_date", label: "Date of Loan", type: "date" },
          { name: "maturity_date", label: "Maturity Date", type: "date" },
          { name: "payment_terms", label: "Payment Terms", type: "textarea", placeholder: "e.g., Monthly payments of $500, due on the 1st of each month" },
        ]},
      ];
  }
};

export default function DocumentBuilder() {
  usePageMeta({ title: "Document Builder", description: "Build legal documents step by step — affidavits, travel consent forms, bills of sale, and more." });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docType, setDocType] = useState<DocType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const freeTier = useFreeTierCheck("document_builder");

  const steps = docType ? getSteps(docType) : [];
  const progress = docType ? ((currentStep + 1) / (steps.length + 1)) * 100 : 0;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>${docTypeLabels[docType!]}</title><style>body{font-family:serif;padding:2rem;line-height:1.8;white-space:pre-wrap;max-width:800px;margin:0 auto}</style></head><body>${buildDocument().replace(/\n/g, "<br/>")}</body></html>`);
      w.document.close();
      w.print();
    }
  };

  const buildDocument = () => {
    if (!docType) return "";
    const d = formData;
    switch (docType) {
      case "affidavit":
        return `GENERAL AFFIDAVIT\n\nState of Ohio\nCounty of ${d.county || "___"}\n\nI, ${d.full_name || "___"}, residing at ${d.address || "___"}, ${d.city || "___"}, ${d.state || "OH"} ${d.zip || "___"}, being duly sworn, do hereby state under oath:\n\n${d.statement || "[Statement]"}\n\nI declare under penalty of perjury that the foregoing is true and correct.\n\n_________________________\nSignature: ${d.full_name || "___"}\nDate: ___________\n\nJURAT\nSubscribed and sworn to before me this ___ day of _________, 20___.\n\n_________________________\nNotary Public, State of Ohio`;
      case "travel_consent":
        return `TRAVEL CONSENT FORM\n\nI, ${d.full_name || "___"}, parent/legal guardian of ${d.child_name || "___"} (DOB: ${d.child_dob || "___"}), hereby authorize ${d.companion_name || "___"} to travel with my child to ${d.destination || "___"} during ${d.travel_dates || "___"}.\n\nI grant permission for emergency medical treatment if I cannot be reached.\n\nEmergency Contact: ${d.phone || "___"}\n\n_________________________\nSignature: ${d.full_name || "___"}\nDate: ___________\n\nNOTARY ACKNOWLEDGMENT\nState of Ohio, County of ___________\nOn this ___ day of _________, 20___.\n\n_________________________\nNotary Public, State of Ohio`;
      case "bill_of_sale":
        return `BILL OF SALE\n\nI, ${d.seller_name || "___"} ("Seller"), for $${d.sale_price || "___"}, do hereby sell and transfer to ${d.buyer_name || "___"} ("Buyer") the following:\n\n${d.item_description || "[Item Description]"}\n\nDate of Sale: ${d.sale_date || "___"}\n\n_________________________          _________________________\nSeller: ${d.seller_name || "___"}    Buyer: ${d.buyer_name || "___"}\n\nNOTARY ACKNOWLEDGMENT\n_________________________\nNotary Public, State of Ohio`;
      case "identity_statement":
        return `IDENTITY VERIFICATION STATEMENT\n\nState of Ohio\n\nI, ${d.full_name || "___"}, hereby declare under oath:\n\n1. My full legal name is ${d.full_name || "___"}.\n2. Also known as: ${d.also_known_as || "N/A"}\n3. Date of Birth: ${d.dob || "___"}\n4. Address: ${d.address || "___"}\n5. ID Presented: ${d.id_type || "___"}, Number: ${d.id_number || "___"}\n\n_________________________\nSignature\nDate: ___________\n\nJURAT\nSubscribed and sworn to before me.\n_________________________\nNotary Public, State of Ohio`;
      case "general_agreement":
        return `GENERAL AGREEMENT\n\nEffective: ${d.effective_date || "___"}\n\nBetween:\nParty A: ${d.party_a || "___"}\nParty B: ${d.party_b || "___"}\n\nTERMS:\n${d.terms || "[Terms]"}\n\n_________________________          _________________________\n${d.party_a || "___"}               ${d.party_b || "___"}\n\nNOTARY ACKNOWLEDGMENT\n_________________________\nNotary Public, State of Ohio`;
      case "power_of_attorney":
        return `POWER OF ATTORNEY\n\nState of Ohio\n\nI, ${d.principal_name || "___"}, residing at ${d.principal_address || "___"}, ${d.principal_city || "___"}, ${d.principal_state || "OH"}, (the "Principal"), do hereby appoint:\n\n${d.agent_name || "___"}\nAddress: ${d.agent_address || "___"}\nPhone: ${d.agent_phone || "___"}\n\nas my true and lawful Attorney-in-Fact ("Agent").\n\nTYPE: ${d.poa_type || "General"} Power of Attorney\nEffective Date: ${d.effective_date || "___"}\n\nPOWERS GRANTED:\n${d.powers || "[Describe powers]"}\n\nThis Power of Attorney ${d.poa_type === "Durable" ? "SHALL remain in effect even if I become incapacitated or disabled" : "shall terminate upon my incapacity"}.\n\nI hereby revoke all prior powers of attorney.\n\n_________________________\nPrincipal: ${d.principal_name || "___"}\nDate: ___________\n\nNOTARY ACKNOWLEDGMENT\nState of Ohio, County of ___________\nOn this ___ day of _________, 20___.\n\n_________________________\nNotary Public, State of Ohio`;
      case "healthcare_directive":
        return `HEALTHCARE DIRECTIVE / LIVING WILL\n\nPursuant to Ohio Revised Code §1337.17\n\nI, ${d.declarant_name || "___"}, born ${d.declarant_dob || "___"}, residing at ${d.declarant_address || "___"}, being of sound mind, declare as follows:\n\nSECTION 1 — HEALTHCARE POWER OF ATTORNEY\n\nI appoint ${d.agent_name || "___"} (Phone: ${d.agent_phone || "___"}) as my Healthcare Agent to make healthcare decisions on my behalf when I am unable to do so.\n\n${d.alt_agent_name ? `Alternate Agent: ${d.alt_agent_name}` : ""}\n\nSECTION 2 — LIVING WILL DECLARATION\n\nLife-Sustaining Treatment: ${d.life_sustaining || "[Not specified]"}\n\nSECTION 3 — ADDITIONAL INSTRUCTIONS\n\n${d.additional_instructions || "[None]"}\n\n_________________________\nDeclarant: ${d.declarant_name || "___"}\nDate: ___________\n\nWITNESSES:\n_________________________     _________________________\nWitness 1                    Witness 2\n\nNOTARY ACKNOWLEDGMENT\nState of Ohio, County of ___________\n\n_________________________\nNotary Public, State of Ohio`;
      case "promissory_note":
        return `PROMISSORY NOTE\n\nPrincipal Amount: $${d.principal_amount || "___"}\nDate: ${d.loan_date || "___"}\n\nFOR VALUE RECEIVED, ${d.borrower_name || "___"} ("Borrower"), residing at ${d.borrower_address || "___"}, promises to pay to the order of ${d.lender_name || "___"} ("Lender"), residing at ${d.lender_address || "___"}, the principal sum of $${d.principal_amount || "___"} with interest at the rate of ${d.interest_rate || "___"}% per annum.\n\nMATURITY DATE: ${d.maturity_date || "___"}\n\nPAYMENT TERMS:\n${d.payment_terms || "[Payment terms]"}\n\nDEFAULT: If the Borrower fails to make any payment when due, the entire unpaid balance shall become immediately due and payable.\n\nGOVERNING LAW: This Note shall be governed by the laws of the State of Ohio.\n\n_________________________\nBorrower: ${d.borrower_name || "___"}\nDate: ___________\n\nNOTARY ACKNOWLEDGMENT\n_________________________\nNotary Public, State of Ohio`;
    }
  };

  return (
    <PageShell>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Breadcrumbs />
        <div className="mb-6 text-center">
          <h1 className="font-sans text-3xl font-bold mb-2">Guided Document Builder</h1>
          <p className="text-muted-foreground">Fill in the blanks step-by-step — we'll build the document for you</p>
          <div className="mt-2 mx-auto max-w-md rounded-lg bg-amber-50 border border-amber-200 p-2">
            <p className="flex items-center justify-center gap-1 text-xs text-amber-800"><AlertTriangle className="h-3 w-3" /> Generic templates only — not legal advice</p>
          </div>
        </div>

        {!docType ? (
          <div className="space-y-3">
            <h2 className="font-sans text-lg font-semibold text-center mb-4">What document do you need?</h2>
            {(Object.keys(docTypeLabels) as DocType[]).map((dt) => (
              <Card key={dt} className="cursor-pointer border-border/50 transition-shadow hover:shadow-md" onClick={() => { setDocType(dt); setCurrentStep(0); setFormData({}); setShowPreview(false); }}>
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{docTypeLabels[dt]}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : showPreview ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h2 className="font-sans text-xl font-semibold mb-4">Preview: {docTypeLabels[docType]}</h2>
                <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed border rounded-lg p-6 bg-card text-foreground mb-4">{buildDocument()}</div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setShowPreview(false)}><ChevronLeft className="mr-1 h-4 w-4" /> Edit</Button>
                  <Button onClick={handlePrint} className=""><Printer className="mr-1 h-4 w-4" /> Print / Save PDF</Button>
                  {user && (
                    <Button variant="outline" disabled={saving} onClick={async () => {
                      if (!user || !docType) return;
                      setSaving(true);
                      try {
                        const content = buildDocument();
                        const blob = new Blob([content], { type: "text/plain" });
                        const fileName = `${docTypeLabels[docType].replace(/\s+/g, "_")}_${Date.now()}.txt`;
                        const filePath = `${user.id}/${fileName}`;
                        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, blob);
                        if (uploadError) throw uploadError;
                        const { error: insertError } = await supabase.from("documents").insert({
                          uploaded_by: user.id, file_name: fileName, file_path: filePath, status: "uploaded" as any,
                        });
                        if (insertError) throw insertError;
                        toast({ title: "Saved to My Documents", description: "You can find it in your Client Portal." });
                      } catch (e: any) {
                        toast({ title: "Save failed", description: e.message, variant: "destructive" });
                      }
                      setSaving(false);
                    }}>
                      {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Save to Portal
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => { setDocType(null); setShowPreview(false); }}>Start Over</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Progress value={progress} className="mb-6 h-2" />
            <Card className="border-border/50">
              <CardContent className="p-6">
                <p className="text-xs text-muted-foreground mb-1">Step {currentStep + 1} of {steps.length}</p>
                <h2 className="font-sans text-xl font-semibold mb-4">{steps[currentStep].title}</h2>
                <div className="space-y-4">
                  {steps[currentStep].fields.map((field) => (
                    <div key={field.name}>
                      <Label>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea value={formData[field.name] || ""} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} placeholder={field.placeholder} rows={4} />
                      ) : (
                        <Input type={field.type === "date" ? "date" : "text"} value={formData[field.name] || ""} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} placeholder={field.placeholder} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setDocType(null)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> {currentStep === 0 ? "Back" : "Previous"}
                  </Button>
                  {currentStep < steps.length - 1 ? (
                    <Button onClick={() => setCurrentStep(currentStep + 1)} className="">
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => setShowPreview(true)} className="">
                      Preview Document <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}
