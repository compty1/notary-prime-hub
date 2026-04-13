/**
 * Sprint 9: Immigration Tools Panel
 * USCIS form reference, document checklist by visa type, timeline estimator
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Globe, FileText, Clock, CheckSquare } from "lucide-react";

interface VisaCategory {
  id: string;
  label: string;
  forms: string[];
  documents: string[];
  estimatedMonths: [number, number];
  notes: string;
}

const VISA_CATEGORIES: VisaCategory[] = [
  {
    id: "family-ir",
    label: "Immediate Relative (IR-1, CR-1)",
    forms: ["I-130", "I-485 (if adjusting)", "I-864", "I-131", "I-765"],
    documents: [
      "Marriage certificate (certified translation if needed)",
      "Birth certificates for petitioner and beneficiary",
      "Passport copies",
      "Evidence of bona fide marriage (photos, joint accounts, lease)",
      "Tax returns (3 years)",
      "Employment verification letter",
      "Police clearance certificates",
      "Medical examination (I-693)",
    ],
    estimatedMonths: [12, 18],
    notes: "No visa number wait for immediate relatives. Processing times vary by service center.",
  },
  {
    id: "family-f1",
    label: "Family Preference (F1-F4)",
    forms: ["I-130", "DS-260 or I-485", "I-864"],
    documents: [
      "Proof of qualifying relationship",
      "Petitioner's citizenship/LPR evidence",
      "Birth certificates",
      "Financial documentation",
      "Police clearance",
    ],
    estimatedMonths: [24, 120],
    notes: "Wait times depend on category and country of birth. Check Visa Bulletin monthly.",
  },
  {
    id: "k1-fiance",
    label: "Fiancé(e) Visa (K-1)",
    forms: ["I-129F", "DS-160", "I-485 (after entry)", "I-765", "I-131"],
    documents: [
      "Evidence of meeting in person within 2 years",
      "Proof of relationship (photos, communication logs)",
      "Birth certificates",
      "Divorce decrees (if applicable)",
      "Police clearance",
      "Medical examination",
      "Financial support (I-134)",
    ],
    estimatedMonths: [8, 14],
    notes: "Must marry within 90 days of entry. Then file I-485 for adjustment.",
  },
  {
    id: "naturalization",
    label: "Naturalization (N-400)",
    forms: ["N-400"],
    documents: [
      "Green Card (front and back copy)",
      "Passport-style photos",
      "Tax returns (5 years or 3 if married to USC)",
      "Travel history documentation",
      "Selective Service registration (males 18-31)",
      "Court records (if any arrests/citations)",
    ],
    estimatedMonths: [6, 12],
    notes: "Must have 5 years continuous residence (3 if married to USC). Civics test required.",
  },
  {
    id: "h1b",
    label: "H-1B (Specialty Occupation)",
    forms: ["I-129", "I-94", "LCA (ETA-9035)"],
    documents: [
      "Bachelor's degree or equivalent",
      "Job offer letter",
      "Resume/CV",
      "Credential evaluation (foreign degrees)",
      "Employer's tax returns",
      "Prevailing wage determination",
    ],
    estimatedMonths: [3, 8],
    notes: "Annual cap with lottery. Cap-exempt employers (universities, research) available year-round.",
  },
  {
    id: "asylum",
    label: "Asylum (I-589)",
    forms: ["I-589", "I-765 (after 150 days)"],
    documents: [
      "Personal declaration/statement",
      "Country conditions evidence",
      "Medical/psychological reports",
      "Identity documents",
      "Evidence of persecution or fear",
      "Expert witness declarations",
    ],
    estimatedMonths: [6, 48],
    notes: "Must file within 1 year of arrival. Expedited removal possible if missed.",
  },
];

export function ImmigrationTools() {
  const [selectedVisa, setSelectedVisa] = useState(VISA_CATEGORIES[0].id);
  const visa = VISA_CATEGORIES.find(v => v.id === selectedVisa)!;

  return (
    <div className="space-y-4">
      {/* Visa Category Selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" /> Visa Category Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedVisa} onValueChange={setSelectedVisa}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISA_CATEGORIES.map(v => (
                <SelectItem key={v.id} value={v.id} className="text-xs">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* USCIS Forms */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Required USCIS Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {visa.forms.map(form => (
              <Badge key={form} variant="outline" className="text-xs font-mono">{form}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4" /> Document Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[200px]">
            <ul className="space-y-1">
              {visa.documents.map((doc, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5">☐</span>
                  {doc}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Timeline Estimator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> Processing Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Estimated Processing:</span>
            <Badge variant="secondary">
              {visa.estimatedMonths[0]}–{visa.estimatedMonths[1]} months
            </Badge>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">{visa.notes}</p>
        </CardContent>
      </Card>
    </div>
  );
}
