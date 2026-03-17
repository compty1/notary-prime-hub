import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, CheckCircle, AlertTriangle, FileText, Globe, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PreQualifierProps {
  category: string;
  serviceName: string;
  onComplete: (params: Record<string, string>) => void;
  onCancel: () => void;
}

const HAGUE_MEMBERS = ["Albania","Andorra","Antigua","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Barbados","Belarus","Belgium","Belize","Bolivia","Bosnia","Botswana","Brazil","Brunei","Bulgaria","Burundi","Cabo Verde","Chile","China","Colombia","Cook Islands","Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Dominica","Dominican Republic","Ecuador","El Salvador","Estonia","Eswatini","Fiji","Finland","France","Georgia","Germany","Greece","Grenada","Guatemala","Guyana","Honduras","Hungary","Iceland","India","Indonesia","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Korea","Kosovo","Kuwait","Kyrgyzstan","Latvia","Lesotho","Liberia","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malta","Marshall Islands","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Namibia","Netherlands","New Zealand","Nicaragua","Niue","North Macedonia","Norway","Oman","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Romania","Russia","Rwanda","Saint Kitts","Saint Lucia","Saint Vincent","Samoa","San Marino","Sao Tome","Saudi Arabia","Senegal","Serbia","Seychelles","Singapore","Slovakia","Slovenia","South Africa","Spain","Suriname","Sweden","Switzerland","Tajikistan","Tanzania","Tonga","Trinidad","Tunisia","Turkey","Ukraine","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela"];

const apostilleSteps = [
  {
    title: "Is your document already notarized?",
    field: "is_notarized",
    type: "radio" as const,
    options: [
      { value: "yes", label: "Yes, it's already notarized" },
      { value: "no", label: "No, I need notarization first" },
    ],
    helpText: "Ohio apostilles require the document to bear a notarial act (acknowledgment, jurat, etc.) before submission to the Secretary of State.",
  },
  {
    title: "Which country needs this document?",
    field: "destination_country",
    type: "input" as const,
    placeholder: "e.g., Germany, Japan, Brazil",
    helpText: "We'll check if this country is a Hague Convention member (apostille) or requires embassy legalization instead.",
  },
  {
    title: "How urgently do you need it?",
    field: "urgency",
    type: "radio" as const,
    options: [
      { value: "standard", label: "Standard (5-10 business days)" },
      { value: "rush", label: "Rush (2-3 business days, additional fee)" },
    ],
  },
];

const immigrationSteps = [
  {
    title: "What type of immigration case?",
    field: "case_type",
    type: "radio" as const,
    options: [
      { value: "family", label: "Family-Based (I-130, I-485)" },
      { value: "employment", label: "Employment-Based" },
      { value: "naturalization", label: "Naturalization (N-400)" },
      { value: "other", label: "Other / Not Sure" },
    ],
  },
  {
    title: "Which USCIS form do you need notarized?",
    field: "uscis_form",
    type: "select" as const,
    options: [
      { value: "I-130", label: "I-130 — Petition for Alien Relative" },
      { value: "I-485", label: "I-485 — Adjustment of Status" },
      { value: "I-765", label: "I-765 — Employment Authorization" },
      { value: "N-400", label: "N-400 — Naturalization" },
      { value: "I-864", label: "I-864 — Affidavit of Support" },
      { value: "I-90", label: "I-90 — Renew Green Card" },
      { value: "I-131", label: "I-131 — Travel Document" },
      { value: "other", label: "Other Form" },
    ],
  },
  {
    title: "How many documents need notarization?",
    field: "doc_count",
    type: "input" as const,
    placeholder: "e.g., 3",
    helpText: "Include all forms and supporting affidavits that require a notarial act.",
  },
];

const i9Steps = [
  {
    title: "Is this for a new hire or re-verification?",
    field: "i9_type",
    type: "radio" as const,
    options: [
      { value: "new_hire", label: "New Hire (Section 2)" },
      { value: "reverification", label: "Re-verification (Section 3)" },
    ],
  },
  {
    title: "When is the employee's start date?",
    field: "start_date",
    type: "input" as const,
    placeholder: "MM/DD/YYYY",
    helpText: "Section 2 must be completed within 3 business days of the employee's first day of work.",
  },
];

export default function ServicePreQualifier({ category, serviceName, onComplete, onCancel }: PreQualifierProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const steps = category === "authentication" ? apostilleSteps
    : category === "consulting" ? immigrationSteps
    : category === "verification" ? i9Steps
    : [];

  if (steps.length === 0) {
    onComplete({});
    return null;
  }

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const canProceed = !!answers[currentStep.field]?.trim();

  const isHague = currentStep.field === "destination_country" && answers.destination_country
    ? HAGUE_MEMBERS.some(m => answers.destination_country.toLowerCase().includes(m.toLowerCase()))
    : null;

  return (
    <Card className="border-accent/30 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{serviceName} — Quick Questions</CardTitle>
          <Badge variant="outline" className="text-xs">{step + 1} of {steps.length}</Badge>
        </div>
        <div className="flex gap-1 mt-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-muted"}`} />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Label className="text-base font-medium">{currentStep.title}</Label>
            {"helpText" in currentStep && currentStep.helpText && (
              <p className="text-xs text-muted-foreground mt-1 mb-3">{currentStep.helpText}</p>
            )}

            {currentStep.type === "radio" && (
              <RadioGroup value={answers[currentStep.field] || ""} onValueChange={(v) => setAnswers({ ...answers, [currentStep.field]: v })} className="mt-3 space-y-2">
                {currentStep.options?.map(opt => (
                  <div key={opt.value} className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value={opt.value} id={opt.value} />
                    <Label htmlFor={opt.value} className="cursor-pointer flex-1">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentStep.type === "input" && (
              <Input
                className="mt-3"
                value={answers[currentStep.field] || ""}
                onChange={(e) => setAnswers({ ...answers, [currentStep.field]: e.target.value })}
                placeholder={currentStep.placeholder}
              />
            )}

            {currentStep.type === "select" && (
              <Select value={answers[currentStep.field] || ""} onValueChange={(v) => setAnswers({ ...answers, [currentStep.field]: v })}>
                <SelectTrigger className="mt-3"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {currentStep.options?.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Hague Convention indicator */}
            {currentStep.field === "destination_country" && answers.destination_country && (
              <div className={`mt-3 flex items-center gap-2 rounded-lg p-3 text-sm ${isHague ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                {isHague ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {isHague
                  ? "This country is a Hague Convention member — an apostille will be accepted."
                  : "This country may not be a Hague member. Embassy legalization may be required instead of an apostille."}
              </div>
            )}

            {/* I-9 timing warning */}
            {currentStep.field === "i9_type" && answers.i9_type === "new_hire" && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                <Clock className="h-4 w-4" />
                Remember: Section 2 must be completed within 3 business days of the hire date.
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={step > 0 ? () => setStep(s => s - 1) : onCancel} size="sm">
            <ChevronLeft className="mr-1 h-3 w-3" /> {step > 0 ? "Back" : "Skip"}
          </Button>
          <Button onClick={() => isLastStep ? onComplete(answers) : setStep(s => s + 1)} disabled={!canProceed} size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">
            {isLastStep ? "Continue to Booking" : "Next"} <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
