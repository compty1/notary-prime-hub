import { useState } from "react";
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
import { ChevronLeft, ChevronRight, FileText, Printer, AlertTriangle } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";

type DocType = "affidavit" | "travel_consent" | "bill_of_sale" | "identity_statement" | "general_agreement";

const docTypeLabels: Record<DocType, string> = {
  affidavit: "General Affidavit",
  travel_consent: "Travel Consent Form",
  bill_of_sale: "Bill of Sale",
  identity_statement: "Identity Verification Statement",
  general_agreement: "General Agreement",
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
  }
};

export default function DocumentBuilder() {
  const [docType, setDocType] = useState<DocType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"><span className="font-display text-lg font-bold text-primary-foreground">SG</span></div>
            <span className="font-display text-lg font-bold text-foreground">Document Builder</span>
          </Link>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <Link to="/templates"><Button variant="outline" size="sm">Templates</Button></Link>
            <Link to="/"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Home</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold mb-2">Guided Document Builder</h1>
          <p className="text-muted-foreground">Fill in the blanks step-by-step — we'll build the document for you</p>
          <div className="mt-2 mx-auto max-w-md rounded-lg bg-amber-50 border border-amber-200 p-2">
            <p className="flex items-center justify-center gap-1 text-xs text-amber-800"><AlertTriangle className="h-3 w-3" /> Generic templates only — not legal advice</p>
          </div>
        </div>

        {!docType ? (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-center mb-4">What document do you need?</h2>
            {(Object.keys(docTypeLabels) as DocType[]).map((dt) => (
              <Card key={dt} className="cursor-pointer border-border/50 transition-shadow hover:shadow-md" onClick={() => { setDocType(dt); setCurrentStep(0); setFormData({}); setShowPreview(false); }}>
                <CardContent className="flex items-center gap-3 p-4">
                  <FileText className="h-5 w-5 text-accent" />
                  <span className="font-medium">{docTypeLabels[dt]}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : showPreview ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-semibold mb-4">Preview: {docTypeLabels[docType]}</h2>
                <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed border rounded-lg p-6 bg-white text-gray-900 mb-4">{buildDocument()}</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPreview(false)}><ChevronLeft className="mr-1 h-4 w-4" /> Edit</Button>
                  <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-gold-dark"><Printer className="mr-1 h-4 w-4" /> Print / Save PDF</Button>
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
                <h2 className="font-display text-xl font-semibold mb-4">{steps[currentStep].title}</h2>
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
                    <Button onClick={() => setCurrentStep(currentStep + 1)} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => setShowPreview(true)} className="bg-accent text-accent-foreground hover:bg-gold-dark">
                      Preview Document <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
